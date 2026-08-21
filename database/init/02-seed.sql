-- ===========================================================================
-- Food Delivery System - seed / demonstration data
-- All password hashes are real bcrypt hashes (cost factor 10).
--   admin@fooddelivery.lk    / Admin@123
--   owner.spice@example.com  / Owner@123
--   owner.pizza@example.com  / Owner@123
--   customer@example.com     / Customer@123
-- ===========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash, phone, address, role) VALUES
 ('System Administrator', 'admin@fooddelivery.lk',
  '$2a$10$6cvMgdqAiNBl6Lhe4sMuqe/lkXPrAKbhFgOSMkbnMY0OPNqsTXwba',
  '+94 11 200 0000', 'Head Office, Colombo 03', 'admin'),
 ('Nimal Perera', 'owner.spice@example.com',
  '$2a$10$cLMYVcHwBHuRfsEqgVY/Y.dRs9zofW1U0HkLW9gRrsron8qlAlJ92',
  '+94 77 123 4567', '18 Galle Road, Colombo 04', 'owner'),
 ('Sara Fernando', 'owner.pizza@example.com',
  '$2a$10$cLMYVcHwBHuRfsEqgVY/Y.dRs9zofW1U0HkLW9gRrsron8qlAlJ92',
  '+94 71 555 8899', '42 Duplication Road, Colombo 05', 'owner'),
 ('Kavya Rajan', 'customer@example.com',
  '$2a$10$zwJOW3NPL3BaZqALhqp7z.zxGYRrtxkBru7I8Y/QI.a3cgK8EFvaq',
  '+94 76 909 1122', '12/3 Temple Lane, Nugegoda', 'customer');

-- ---------------------------------------------------------------------------
-- Restaurants
-- ---------------------------------------------------------------------------
INSERT INTO restaurants (owner_id, name, description, cuisine, address, phone, rating, delivery_fee, is_open) VALUES
 (2, 'Spice Garden',
     'Authentic Sri Lankan rice and curry, kottu and short eats prepared fresh to order.',
     'Sri Lankan', '18 Galle Road, Colombo 04', '+94 11 250 1111', 4.6, 250.00, TRUE),
 (3, 'Bella Napoli',
     'Wood-fired Neapolitan pizza, hand-stretched dough and imported San Marzano tomatoes.',
     'Italian', '42 Duplication Road, Colombo 05', '+94 11 250 2222', 4.4, 300.00, TRUE),
 (2, 'Wok Express',
     'Fast Chinese street food - noodles, fried rice and stir fry cooked over high flame.',
     'Chinese', '7 Station Road, Dehiwala', '+94 11 250 3333', 4.1, 200.00, TRUE),
 (3, 'Green Bowl',
     'Cold-pressed juices, grain bowls and salads for a lighter delivery option.',
     'Healthy', '95 Marine Drive, Colombo 06', '+94 11 250 4444', 4.8, 350.00, FALSE);

-- ---------------------------------------------------------------------------
-- Menu items
-- ---------------------------------------------------------------------------
INSERT INTO menu_items (restaurant_id, name, description, price, category, is_available) VALUES
 -- Spice Garden
 (1, 'Chicken Kottu',        'Shredded godhamba roti stir-fried with chicken, egg and leeks.', 950.00,  'Main',    TRUE),
 (1, 'Rice & Curry (Fish)',  'Red rice with fish curry, dhal, mallum and papadam.',             1150.00, 'Main',    TRUE),
 (1, 'Egg Hoppers (3 pcs)',  'Bowl-shaped rice flour pancakes with a soft egg centre.',         550.00,  'Main',    TRUE),
 (1, 'Watalappan',           'Steamed jaggery and coconut custard with cardamom.',              450.00,  'Dessert', TRUE),
 (1, 'Faluda',               'Rose syrup, basil seeds, jelly and ice cream.',                   500.00,  'Drink',   TRUE),
 -- Bella Napoli
 (2, 'Margherita Pizza',     'San Marzano tomato, fior di latte and fresh basil.',              1800.00, 'Main',    TRUE),
 (2, 'Pepperoni Pizza',      'Double pepperoni with mozzarella on a 12 inch base.',             2200.00, 'Main',    TRUE),
 (2, 'Spaghetti Carbonara',  'Egg yolk, pecorino, black pepper and pancetta.',                  1950.00, 'Main',    TRUE),
 (2, 'Garlic Bread',         'Wood-fired flatbread with garlic butter and herbs.',              700.00,  'Starter', TRUE),
 (2, 'Tiramisu',             'Mascarpone, espresso-soaked savoiardi and cocoa.',                850.00,  'Dessert', TRUE),
 -- Wok Express
 (3, 'Chicken Fried Rice',   'Wok-fried rice with chicken, egg and spring onion.',              1050.00, 'Main',    TRUE),
 (3, 'Hakka Noodles',        'Stir-fried noodles with julienned vegetables.',                   980.00,  'Main',    TRUE),
 (3, 'Chilli Paneer',        'Crisp paneer tossed in a sweet-and-hot chilli sauce.',            1200.00, 'Starter', TRUE),
 (3, 'Hot & Sour Soup',      'Peppery broth with tofu, mushroom and bamboo shoot.',             600.00,  'Starter', TRUE),
 -- Green Bowl
 (4, 'Quinoa Power Bowl',    'Quinoa, avocado, chickpeas, kale and tahini dressing.',           1600.00, 'Main',    TRUE),
 (4, 'Grilled Chicken Salad','Chargrilled chicken, romaine, parmesan and light caesar.',        1500.00, 'Main',    TRUE),
 (4, 'Cold Pressed Detox',   'Cucumber, apple, celery, lime and ginger.',                       750.00,  'Drink',   TRUE);

-- ---------------------------------------------------------------------------
-- A historical order so the dashboard is not empty on first run
-- ---------------------------------------------------------------------------
INSERT INTO orders (customer_id, restaurant_id, status, subtotal, delivery_fee, total_amount,
                    delivery_address, contact_phone, payment_method, notes)
VALUES (4, 1, 'DELIVERED', 1900.00, 250.00, 2150.00,
        '12/3 Temple Lane, Nugegoda', '+94 76 909 1122', 'CASH_ON_DELIVERY',
        'Please make the kottu less spicy.');

INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total) VALUES
 (1, 1, 'Chicken Kottu', 950.00, 2, 1900.00);

COMMIT;
