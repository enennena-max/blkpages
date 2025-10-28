-- BlkPages Database Schema
-- Run this SQL to create the necessary tables for the backend

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    stripe_account_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    business_id INTEGER REFERENCES businesses(id),
    service VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed',
    can_cancel BOOLEAN DEFAULT true,
    stripe_payment_intent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    booking_id INTEGER REFERENCES bookings(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    status VARCHAR(50) DEFAULT 'completed',
    stripe_payment_intent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer loyalty table
CREATE TABLE IF NOT EXISTS customer_loyalty (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) UNIQUE,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business loyalty table
CREATE TABLE IF NOT EXISTS business_loyalty (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    business_id INTEGER REFERENCES businesses(id),
    stamps INTEGER DEFAULT 0,
    goal INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, business_id)
);

-- Loyalty transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    points INTEGER NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    business_id INTEGER REFERENCES businesses(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    target VARCHAR(100),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data for testing
INSERT INTO customers (email, first_name, last_name) VALUES 
('test@example.com', 'John', 'Doe'),
('customer@blkpages.com', 'Jane', 'Smith')
ON CONFLICT (email) DO NOTHING;

INSERT INTO businesses (name, slug, email, address) VALUES 
('Fade District', 'fade-district', 'owner@fadedistrict.co.uk', '221B Baker Street, London NW1 6XE'),
('Glow Studio', 'glow-studio', 'owner@glowstudio.co.uk', '123 High Street, London SW1A 1AA')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO customer_loyalty (customer_id, points) VALUES 
(1, 240),
(2, 1500)
ON CONFLICT (customer_id) DO NOTHING;

INSERT INTO business_loyalty (customer_id, business_id, stamps, goal) VALUES 
(1, 1, 3, 10),
(2, 2, 7, 8)
ON CONFLICT (customer_id, business_id) DO NOTHING;

INSERT INTO bookings (customer_id, business_id, service, date, time, price, status, can_cancel) VALUES 
(1, 1, 'Skin Fade', '2025-10-28', '10:30:00', 25.00, 'confirmed', true),
(2, 2, 'Makeup Session', '2025-11-05', '14:00:00', 85.00, 'completed', false)
ON CONFLICT DO NOTHING;

INSERT INTO notifications (customer_id, title, message, type, target) VALUES 
(1, 'Welcome to BlkPages!', 'You have successfully joined our platform.', 'info', 'dashboard'),
(1, 'Booking Confirmed', 'Your appointment at Fade District is confirmed.', 'success', 'bookings'),
(2, 'Loyalty Reward Unlocked!', 'You have earned enough points for a free service.', 'success', 'loyalty')
ON CONFLICT DO NOTHING;
