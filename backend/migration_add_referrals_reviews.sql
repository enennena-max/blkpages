-- Database Migration: Add referrals and verified reviews system
-- Run this SQL to add the required tables for referral tracking and verified review rewards

-- Add referral_code column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES users(id),
  referee_email text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT NOW(),
  completed_at timestamptz
);

-- Create reviews table with verification system
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  user_id uuid REFERENCES users(id),
  rating int CHECK (rating >= 1 AND rating <= 5),
  text text,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  points_released boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_pending 
ON referrals(referee_email, status) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_referrals_referrer 
ON referrals(referrer_id, status);

CREATE INDEX IF NOT EXISTS idx_reviews_verification 
ON reviews(verified, verified_at, points_released) 
WHERE verified = true AND points_released = false;

CREATE INDEX IF NOT EXISTS idx_reviews_user 
ON reviews(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_reviews_booking 
ON reviews(booking_id);

-- Add comments to document the new tables
COMMENT ON TABLE referrals IS 'Tracks referral relationships and completion status';
COMMENT ON COLUMN referrals.status IS 'pending: waiting for referee to complete booking, completed: referral bonus awarded';
COMMENT ON COLUMN referrals.completed_at IS 'Timestamp when referral bonus was awarded';

COMMENT ON TABLE reviews IS 'Stores user reviews with verification system';
COMMENT ON COLUMN reviews.verified IS 'Whether review has been verified by BlkPages staff';
COMMENT ON COLUMN reviews.verified_at IS 'Timestamp when review was verified';
COMMENT ON COLUMN reviews.points_released IS 'Whether 25 BlkPoints have been released for this review';

-- Generate referral codes for existing users
UPDATE users 
SET referral_code = gen_random_uuid()::text 
WHERE referral_code IS NULL;

-- Sample data for testing (optional)
INSERT INTO referrals (referrer_id, referee_email, status) VALUES 
((SELECT id FROM users LIMIT 1), 'test@example.com', 'pending')
ON CONFLICT DO NOTHING;

INSERT INTO reviews (booking_id, user_id, rating, text, verified) VALUES 
((SELECT id FROM bookings LIMIT 1), (SELECT id FROM users LIMIT 1), 5, 'Great service!', false)
ON CONFLICT DO NOTHING;
