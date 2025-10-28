-- 02_dynamic_referral_codes.sql
-- Dynamic Referral Code System Migration
-- Creates referral_codes table for single-use, auto-regenerating codes

-- Create referral_codes table for dynamic code management
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  created_at timestamptz DEFAULT NOW(),
  used_at timestamptz
);

-- Update referrals table to link with referral_codes
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referral_code text REFERENCES referral_codes(code);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_active 
ON referral_codes(user_id, status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_referral_codes_code 
ON referral_codes(code);

CREATE INDEX IF NOT EXISTS idx_referral_codes_used 
ON referral_codes(used_at) 
WHERE status = 'used';

-- Add comments to document the new system
COMMENT ON TABLE referral_codes IS 'Dynamic referral codes that auto-regenerate after use';
COMMENT ON COLUMN referral_codes.code IS 'Unique referral code (e.g., BLK-3KXP7J2Z)';
COMMENT ON COLUMN referral_codes.status IS 'active: can be used, used: already used, expired: manually expired';
COMMENT ON COLUMN referral_codes.used_at IS 'Timestamp when code was used for referral';
COMMENT ON COLUMN referrals.referral_code IS 'Links to the specific code that was used';

-- Sample data for testing (optional)
-- Uncomment to create test referral codes:
-- INSERT INTO referral_codes (user_id, code) VALUES 
-- ((SELECT id FROM users LIMIT 1), 'BLK-TEST123')
-- ON CONFLICT (code) DO NOTHING;
