-- ===========================================================================
-- Food Delivery System - relational schema (PostgreSQL 16)
-- Executed automatically by the `postgres` container on first start,
-- because the file lives in /docker-entrypoint-initdb.d.
-- ===========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Enumerated domains
-- ---------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('customer', 'owner', 'admin');

CREATE TYPE order_status AS ENUM (
    'PENDING',      -- placed by the customer, awaiting restaurant acceptance
    'CONFIRMED',    -- accepted by the restaurant
    'PREPARING',    -- kitchen is preparing the food
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED'
);

CREATE TYPE payment_method AS ENUM ('CASH_ON_DELIVERY', 'CARD');

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(120)  NOT NULL,
    email         VARCHAR(180)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    phone         VARCHAR(30),
    address       TEXT,
    role          user_role     NOT NULL DEFAULT 'customer',
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);

-- ---------------------------------------------------------------------------
-- restaurants
-- ---------------------------------------------------------------------------
CREATE TABLE restaurants (
    id          SERIAL PRIMARY KEY,
    owner_id    INTEGER      REFERENCES users (id) ON DELETE SET NULL,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    cuisine     VARCHAR(80)  NOT NULL,
    address     TEXT         NOT NULL,
    phone       VARCHAR(30),
    image_url   TEXT,
    rating      NUMERIC(2,1) NOT NULL DEFAULT 0.0
                CHECK (rating >= 0.0 AND rating <= 5.0),
    delivery_fee   NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
    is_open     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restaurants_cuisine  ON restaurants (cuisine);
CREATE INDEX idx_restaurants_owner_id ON restaurants (owner_id);

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------
CREATE TABLE menu_items (
    id            SERIAL PRIMARY KEY,
    restaurant_id INTEGER       NOT NULL REFERENCES restaurants (id) ON DELETE CASCADE,
    name          VARCHAR(150)  NOT NULL,
    description   TEXT,
    price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    category      VARCHAR(80)   NOT NULL DEFAULT 'Main',
    image_url     TEXT,
    is_available  BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_restaurant_id ON menu_items (restaurant_id);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
    id               SERIAL PRIMARY KEY,
    customer_id      INTEGER        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    restaurant_id    INTEGER        NOT NULL REFERENCES restaurants (id) ON DELETE RESTRICT,
    status           order_status   NOT NULL DEFAULT 'PENDING',
    subtotal         NUMERIC(10,2)  NOT NULL CHECK (subtotal >= 0),
    delivery_fee     NUMERIC(10,2)  NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
    total_amount     NUMERIC(10,2)  NOT NULL CHECK (total_amount >= 0),
    delivery_address TEXT           NOT NULL,
    contact_phone    VARCHAR(30),
    payment_method   payment_method NOT NULL DEFAULT 'CASH_ON_DELIVERY',
    notes            TEXT,
    placed_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id   ON orders (customer_id);
CREATE INDEX idx_orders_restaurant_id ON orders (restaurant_id);
CREATE INDEX idx_orders_status        ON orders (status);

-- ---------------------------------------------------------------------------
-- order_items  (line items of an order - price is snapshotted at order time)
-- ---------------------------------------------------------------------------
CREATE TABLE order_items (
    id           SERIAL PRIMARY KEY,
    order_id     INTEGER       NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    menu_item_id INTEGER       NOT NULL REFERENCES menu_items (id) ON DELETE RESTRICT,
    item_name    VARCHAR(150)  NOT NULL,
    unit_price   NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    quantity     INTEGER       NOT NULL CHECK (quantity > 0),
    line_total   NUMERIC(10,2) NOT NULL CHECK (line_total >= 0),
    UNIQUE (order_id, menu_item_id)
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at       BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_menu_items_updated_at  BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated_at      BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Reporting view used by the owner dashboard
-- ---------------------------------------------------------------------------
CREATE VIEW order_summary AS
SELECT o.id            AS order_id,
       o.status,
       o.total_amount,
       o.placed_at,
       u.full_name     AS customer_name,
       u.email         AS customer_email,
       r.id            AS restaurant_id,
       r.name          AS restaurant_name,
       COUNT(oi.id)    AS item_count
FROM orders o
JOIN users u        ON u.id = o.customer_id
JOIN restaurants r  ON r.id = o.restaurant_id
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, u.full_name, u.email, r.id, r.name;

COMMIT;
