-- backend/migrations/03_redemptions_system.sql
-- Redemptions and enhanced points tracking

-- Create redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    booking_id INTEGER NOT NULL REFERENCES bookings(id),
    points INTEGER NOT NULL,
    value DECIMAL(10,2) NOT NULL, -- £ amount
    status VARCHAR(50) DEFAULT 'pending', -- pending, deducted, cancelled, released
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_booking_id ON redemptions(booking_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);

-- Enhance points_activity table
ALTER TABLE points_activity ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'earned'; -- earned, redeemed, cancelled
ALTER TABLE points_activity ADD COLUMN IF NOT EXISTS booking_id INTEGER REFERENCES bookings(id);
ALTER TABLE points_activity ADD COLUMN IF NOT EXISTS redemption_id INTEGER REFERENCES redemptions(id);

-- Add indexes for activity queries
CREATE INDEX IF NOT EXISTS idx_points_activity_user_id ON points_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_points_activity_type ON points_activity(type);
CREATE INDEX IF NOT EXISTS idx_points_activity_booking_id ON points_activity(booking_id);

-- Update bookings table to track redemption status
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS redemption_applied BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS redemption_amount DECIMAL(10,2) DEFAULT 0;

-- Sample data for testing
INSERT INTO redemptions (user_id, booking_id, points, value, status) VALUES
(1, 1, 500, 5.00, 'pending'),
(1, 2, 1000, 10.00, 'deducted')
ON CONFLICT DO NOTHING;

-- Update sample points activity
INSERT INTO points_activity (user_id, points, source, type, description) VALUES
(1, -500, 'Redemption', 'redeemed', 'Redeemed 500 pts on booking #1'),
(1, -1000, 'Redemption', 'redeemed', 'Redeemed 1000 pts on booking #2')
ON CONFLICT DO NOTHING;
