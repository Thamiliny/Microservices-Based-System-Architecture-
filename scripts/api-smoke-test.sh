#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# End-to-end API smoke test for the Food Delivery System.
# Exercises the complete customer + restaurant-owner journey against the
# running containers. Run with:  ./scripts/api-smoke-test.sh
# ---------------------------------------------------------------------------
set -euo pipefail

BASE="${BASE_URL:-http://localhost:4000/api}"
BODY="$(mktemp)"
trap 'rm -f "$BODY"' EXIT
PASS=0; FAIL=0

step()  { printf '\n\033[1;36m== %s\033[0m\n' "$1"; }
check() { if [ "$2" = "$3" ]; then printf '  \033[32mPASS\033[0m %-46s (%s)\n' "$1" "$2"; PASS=$((PASS+1));
          else printf '  \033[31mFAIL\033[0m %-46s expected %s, got %s\n' "$1" "$3" "$2"; FAIL=$((FAIL+1)); fi; }

# Issues a request, saves the response body and prints only the status code.
code()  { curl -s --noproxy '*' -o "$BODY" -w '%{http_code}' "$@"; }

# Reads a value out of the last response body (python expression over `d`).
jqv()   {
  if command -v python3 >/dev/null 2>&1 && python3 -c "exit(0)" 2>/dev/null; then
    python3 -c "import json,sys;d=json.load(open(sys.argv[2]));print(eval(sys.argv[1]))" "$1" "$BODY"
  else
    node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));let expr=process.argv[1].replace(/len\(([^)]+)\)/g, '\$1.length');const fn=new Function('d', 'return ' + expr);const res=fn(d);console.log(res !== undefined ? res : '');" "$1" "$BODY"
  fi
}

EMAIL="smoke.$(date +%s)@example.com"

step "1. Health checks"
check "GET /health"    "$(code "$BASE/health")"    200
check "GET /health/db" "$(code "$BASE/health/db")" 200
printf '  database: %s\n' "$(jqv "d['data']['database']")"

step "2. Registration and authentication"
check "POST /auth/register (new customer)" \
  "$(code -X POST "$BASE/auth/register" -H 'Content-Type: application/json' \
     -d "{\"fullName\":\"Smoke Test User\",\"email\":\"$EMAIL\",\"password\":\"SmokePass@123\",\"address\":\"5 Test Lane, Colombo\"}")" 201
TOKEN=$(jqv "d['data']['token']")
printf '  JWT issued: %s...\n' "${TOKEN:0:32}"

check "POST /auth/register (duplicate email)" \
  "$(code -X POST "$BASE/auth/register" -H 'Content-Type: application/json' \
     -d "{\"fullName\":\"Smoke Test User\",\"email\":\"$EMAIL\",\"password\":\"SmokePass@123\"}")" 409

check "POST /auth/login (wrong password)" \
  "$(code -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
     -d "{\"email\":\"$EMAIL\",\"password\":\"WrongPass1\"}")" 401

check "GET /auth/me (no token)" "$(code "$BASE/auth/me")" 401
check "GET /auth/me (valid token)" "$(code "$BASE/auth/me" -H "Authorization: Bearer $TOKEN")" 200

check "POST /auth/login (restaurant owner)" \
  "$(code -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
     -d '{"email":"owner.spice@example.com","password":"Owner@123"}')" 200
OWNER_TOKEN=$(jqv "d['data']['token']")

step "3. Restaurant catalogue"
check "GET /restaurants" "$(code "$BASE/restaurants")" 200
printf '  restaurants available: %s\n' "$(jqv "d['data']['total']")"
check "GET /restaurants?cuisine=Italian" "$(code "$BASE/restaurants?cuisine=Italian")" 200
check "GET /restaurants/1"       "$(code "$BASE/restaurants/1")" 200
check "GET /restaurants/999999"  "$(code "$BASE/restaurants/999999")" 404
check "GET /restaurants/1/menu"  "$(code "$BASE/restaurants/1/menu")" 200
printf '  menu items on restaurant 1: %s\n' "$(jqv "len(d['data'])")"

step "4. Authorisation rules"
check "POST /restaurants as customer (403)" \
  "$(code -X POST "$BASE/restaurants" -H "Authorization: Bearer $TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{"name":"Not Allowed","cuisine":"Test","address":"1 Nowhere Street"}')" 403

step "5. Placing an order"
check "POST /orders" \
  "$(code -X POST "$BASE/orders" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
     -d '{"restaurantId":1,"items":[{"menuItemId":1,"quantity":2},{"menuItemId":4,"quantity":1}],
          "deliveryAddress":"5 Test Lane, Colombo","contactPhone":"+94 77 555 1234",
          "paymentMethod":"CASH_ON_DELIVERY","notes":"Smoke test order"}')" 201
ORDER_ID=$(jqv "d['data']['id']")
printf '  order #%s  subtotal=%s  delivery=%s  total=%s  status=%s\n' \
  "$ORDER_ID" "$(jqv "d['data']['subtotal']")" "$(jqv "d['data']['delivery_fee']")" \
  "$(jqv "d['data']['total_amount']")" "$(jqv "d['data']['status']")"

check "POST /orders (item from another restaurant)" \
  "$(code -X POST "$BASE/orders" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
     -d '{"restaurantId":1,"items":[{"menuItemId":6,"quantity":1}],"deliveryAddress":"5 Test Lane"}')" 400
check "POST /orders (empty basket)" \
  "$(code -X POST "$BASE/orders" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
     -d '{"restaurantId":1,"items":[],"deliveryAddress":"5 Test Lane"}')" 400
check "GET /orders (customer history)" "$(code "$BASE/orders" -H "Authorization: Bearer $TOKEN")" 200

step "6. Order lifecycle (restaurant owner)"
check "PATCH status PENDING -> DELIVERED (illegal)" \
  "$(code -X PATCH "$BASE/orders/$ORDER_ID/status" -H "Authorization: Bearer $OWNER_TOKEN" \
     -H 'Content-Type: application/json' -d '{"status":"DELIVERED"}')" 400
for S in CONFIRMED PREPARING OUT_FOR_DELIVERY DELIVERED; do
  check "PATCH status -> $S" \
    "$(code -X PATCH "$BASE/orders/$ORDER_ID/status" -H "Authorization: Bearer $OWNER_TOKEN" \
       -H 'Content-Type: application/json' -d "{\"status\":\"$S\"}")" 200
done
check "PATCH status as customer (403)" \
  "$(code -X PATCH "$BASE/orders/$ORDER_ID/status" -H "Authorization: Bearer $TOKEN" \
     -H 'Content-Type: application/json' -d '{"status":"CANCELLED"}')" 403

step "7. Error handling"
check "GET /api/does-not-exist" "$(code "$BASE/does-not-exist")" 404

printf '\n\033[1m----------------------------------------------\033[0m\n'
printf '\033[1m Result: \033[32m%d passed\033[0m, \033[31m%d failed\033[0m\n' "$PASS" "$FAIL"
printf '\033[1m----------------------------------------------\033[0m\n'
[ "$FAIL" -eq 0 ]
