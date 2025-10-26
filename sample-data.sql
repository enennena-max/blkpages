-- Sample data for testing BlkPages Customer Dashboard
-- Run this after creating the tables

-- Insert sample customers
INSERT INTO customers (id, email, name) VALUES 
('customer-1', 'amina@example.com', 'Amina'),
('customer-2', 'john@example.com', 'John'),
('customer-3', 'sarah@example.com', 'Sarah');

-- Insert sample businesses
INSERT INTO businesses (id, name, category, location, address, stripe_account_id) VALUES 
('business-1', 'Glow Studio', 'Beauty', 'London', '12 Market St, London', 'acct_test123'),
('business-2', 'Fade District', 'Barbers', 'London', '221B Baker St, London', 'acct_test456'),
('business-3', 'Soul Yoga', 'Fitness', 'Shoreditch', '21 Redchurch St, London', 'acct_test789');

-- Insert sample bookings
INSERT INTO bookings (id, customer_id, business_id, service, category, date, time, status, notes, is_first_time_with_business) VALUES 
('booking-1', 'customer-1', 'business-1', 'Makeup Session', 'Beauty', '2025-11-05', '14:00', 'confirmed', 'Arrive 10 mins early', true),
('booking-2', 'customer-1', 'business-2', 'Skin Fade', 'Barbers', '2025-10-28', '10:30', 'pending', 'Bring inspo photo', false),
('booking-3', 'customer-1', 'business-3', 'Vinyasa Class', 'Fitness', '2025-09-18', '18:00', 'cancelled', 'Cancelled by customer', false);

-- Insert sample payments
INSERT INTO payments (id, customer_id, business_id, booking_id, amount_cents, currency, status, method_summary, stripe_payment_intent_id) VALUES 
('payment-1', 'customer-1', 'business-1', 'booking-1', 4800, 'gbp', 'paid', 'Visa •• 1234', 'pi_test123'),
('payment-2', 'customer-1', 'business-3', 'booking-3', 1500, 'gbp', 'refunded', 'Visa •• 1234', 'pi_test456'),
('payment-3', 'customer-1', 'business-2', NULL, 2200, 'gbp', 'paid', 'Apple Pay', 'pi_test789');

-- Insert sample reviews
INSERT INTO reviews (id, customer_id, business_id, rating, text) VALUES 
('review-1', 'customer-1', 'business-2', 5, 'Clean cut, great vibe.');

-- Insert sample loyalty data
INSERT INTO loyalty_accounts (customer_id, points, tier) VALUES 
('customer-1', 240, 'Bronze');

-- Insert sample loyalty transactions
INSERT INTO loyalty_transactions (id, customer_id, delta, reason) VALUES 
('loyalty-1', 'customer-1', 48, 'Payment received'),
('loyalty-2', 'customer-1', 22, 'Payment received'),
('loyalty-3', 'customer-1', -15, 'Refund processed');

