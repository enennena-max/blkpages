-- 01_admin_basics.sql
-- Admin Dashboard Database Migration
-- Safe, idempotent migration for admin functionality

-- Users: add role for admin gating
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';

-- Businesses: approval gate
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Reviews: verification gate (if not already present)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Bookings: dispute flag (used by admin Disputes later)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS disputed boolean DEFAULT false;

-- Create indexes for better performance on admin queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_businesses_approved ON businesses(approved);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(verified);
CREATE INDEX IF NOT EXISTS idx_bookings_disputed ON bookings(disputed);

-- Add comments to document the new fields
COMMENT ON COLUMN users.role IS 'User role: customer, staff, admin';
COMMENT ON COLUMN businesses.approved IS 'Whether business has been approved by admin';
COMMENT ON COLUMN businesses.approved_at IS 'Timestamp when business was approved';
COMMENT ON COLUMN reviews.verified IS 'Whether review has been verified by admin';
COMMENT ON COLUMN reviews.verified_at IS 'Timestamp when review was verified';
COMMENT ON COLUMN bookings.disputed IS 'Whether booking is under dispute';

-- Create admin user (optional - for initial setup)
-- Uncomment and modify as needed:
-- INSERT INTO users (email, role) VALUES ('admin@blkpages.com', 'admin') ON CONFLICT (email) DO NOTHING;
