-- ==========================================
-- BlkPages BlkPoints Database Setup
-- Complete schema for earning, redemption, and referral system
-- ==========================================

-- Add BlkPoints fields to existing users table
ALTER TABLE users
ADD COLUMN mobile_number VARCHAR(20) UNIQUE,
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN blkpoints_balance INT DEFAULT 0,
ADD COLUMN referred_by INT NULL,
ADD COLUMN referral_code VARCHAR(12) UNIQUE,
ADD COLUMN verified_at DATETIME NULL,
ADD COLUMN verification_attempts INT DEFAULT 0,
ADD COLUMN last_otp_sent DATETIME NULL;

-- Add foreign key for referrals
ALTER TABLE users
ADD CONSTRAINT fk_users_referred_by 
FOREIGN KEY (referred_by) REFERENCES users(id);

-- Referrals table for tracking lifecycle and fraud signals
CREATE TABLE IF NOT EXISTS referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrer_id INT NOT NULL,
  referee_id INT NULL,
  referral_code VARCHAR(12) NOT NULL,
  status ENUM('clicked','signed_up','completed','cancelled') DEFAULT 'clicked',
  device_fingerprint VARCHAR(64) NULL,
  payment_hash VARCHAR(64) NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referee_id) REFERENCES users(id),
  INDEX idx_referrals_referrer (referrer_id),
  INDEX idx_referrals_referee (referee_id),
  INDEX idx_referrals_code (referral_code)
);

-- Create BlkPoints ledger table
CREATE TABLE blkpoints_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  booking_id INT NULL,
  points_change INT NOT NULL,
  type ENUM('earn','redeem','refund','adjust','referral','bonus') NOT NULL,
  status ENUM('pending','confirmed','released','expired','cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME NULL,
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT chk_points_change CHECK (points_change != 0),
  INDEX idx_user_type_date (user_id, type, created_at),
  INDEX idx_booking (booking_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);

-- Create OTP codes table for mobile verification
CREATE TABLE otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  attempts INT DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_code_format CHECK (code REGEXP '^[0-9]{6}$'),
  CONSTRAINT chk_otp_attempts CHECK (attempts >= 0 AND attempts <= 5),
  
  -- Indexes
  INDEX idx_user_expires (user_id, expires_at),
  INDEX idx_code (code),
  INDEX idx_created (created_at)
);

-- Create redemption caps tracking table
CREATE TABLE redemption_caps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  period_start DATETIME NOT NULL,
  period_end DATETIME NOT NULL,
  max_amount INT NOT NULL DEFAULT 5000, -- £50 in points
  used_amount INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_cap_amounts CHECK (used_amount >= 0 AND used_amount <= max_amount),
  CONSTRAINT chk_period_valid CHECK (period_end > period_start),
  
  -- Indexes
  INDEX idx_user_period (user_id, period_start, period_end),
  INDEX idx_period (period_start, period_end)
);

-- ==========================================
-- STORED PROCEDURES
-- ==========================================

-- Procedure to check redemption eligibility
DELIMITER //
CREATE PROCEDURE CheckRedemptionEligibility(
  IN p_user_id INT,
  IN p_redemption_points INT,
  OUT p_can_redeem BOOLEAN,
  OUT p_remaining_cap INT,
  OUT p_error_message VARCHAR(255)
)
BEGIN
  DECLARE v_used_amount INT DEFAULT 0;
  DECLARE v_max_amount INT DEFAULT 5000;
  DECLARE v_user_verified BOOLEAN DEFAULT FALSE;
  DECLARE v_user_balance INT DEFAULT 0;
  
  -- Check if user is verified
  SELECT is_verified, blkpoints_balance 
  INTO v_user_verified, v_user_balance
  FROM users 
  WHERE id = p_user_id;
  
  IF NOT v_user_verified THEN
    SET p_can_redeem = FALSE;
    SET p_error_message = 'Mobile number verification required';
    SET p_remaining_cap = 0;
  ELSEIF v_user_balance < p_redemption_points THEN
    SET p_can_redeem = FALSE;
    SET p_error_message = 'Insufficient BlkPoints balance';
    SET p_remaining_cap = 0;
  ELSE
    -- Calculate used amount in last 30 days
    SELECT COALESCE(SUM(ABS(points_change)), 0) INTO v_used_amount
    FROM blkpoints_ledger
    WHERE user_id = p_user_id 
      AND type = 'redeem'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    SET p_remaining_cap = v_max_amount - v_used_amount;
    
    IF (v_used_amount + p_redemption_points) > v_max_amount THEN
      SET p_can_redeem = FALSE;
      SET p_error_message = CONCAT('Redemption limit exceeded. You can redeem up to ', 
                                  FLOOR(p_remaining_cap / 100), ' more this month.');
    ELSE
      SET p_can_redeem = TRUE;
      SET p_error_message = NULL;
    END IF;
  END IF;
END //
DELIMITER ;

-- Procedure to get redemption cap status
DELIMITER //
CREATE PROCEDURE GetRedemptionCapStatus(
  IN p_user_id INT,
  OUT p_max_amount INT,
  OUT p_used_amount INT,
  OUT p_remaining_amount INT,
  OUT p_reset_date DATETIME,
  OUT p_percentage DECIMAL(5,2)
)
BEGIN
  DECLARE v_used_amount INT DEFAULT 0;
  DECLARE v_max_amount INT DEFAULT 5000;
  DECLARE v_first_redemption DATETIME;
  
  -- Get used amount in last 30 days
  SELECT COALESCE(SUM(ABS(points_change)), 0) INTO v_used_amount
  FROM blkpoints_ledger
  WHERE user_id = p_user_id 
    AND type = 'redeem'
    AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
  
  -- Get first redemption date in current window
  SELECT MIN(created_at) INTO v_first_redemption
  FROM blkpoints_ledger
  WHERE user_id = p_user_id 
    AND type = 'redeem'
    AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
  
  SET p_max_amount = v_max_amount;
  SET p_used_amount = v_used_amount;
  SET p_remaining_amount = v_max_amount - v_used_amount;
  SET p_reset_date = IFNULL(DATE_ADD(v_first_redemption, INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY));
  SET p_percentage = (v_used_amount / v_max_amount) * 100;
END //
DELIMITER ;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger to clean up expired OTP codes
DELIMITER //
CREATE TRIGGER cleanup_expired_otp
  AFTER INSERT ON otp_codes
  FOR EACH ROW
BEGIN
  DELETE FROM otp_codes 
  WHERE expires_at < NOW() 
    AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);
END //
DELIMITER ;

-- Trigger to update user balance when points are confirmed
DELIMITER //
CREATE TRIGGER update_user_balance
  AFTER UPDATE ON blkpoints_ledger
  FOR EACH ROW
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE users 
    SET blkpoints_balance = blkpoints_balance + NEW.points_change
    WHERE id = NEW.user_id;
  END IF;
END //
DELIMITER ;

-- ==========================================
-- VIEWS FOR REPORTING
-- ==========================================

-- User verification status view
CREATE VIEW user_verification_status AS
SELECT 
  u.id,
  u.email,
  u.mobile_number,
  u.is_verified,
  u.verified_at,
  u.verification_attempts,
  u.blkpoints_balance,
  CASE 
    WHEN u.is_verified THEN 'Verified'
    WHEN u.verification_attempts >= 3 THEN 'Blocked'
    ELSE 'Pending'
  END as verification_status
FROM users u;

-- Redemption cap monitoring view
CREATE VIEW redemption_cap_monitoring AS
SELECT 
  u.id as user_id,
  u.email,
  u.mobile_number,
  COALESCE(rc.used_amount, 0) as used_amount,
  5000 as max_amount,
  5000 - COALESCE(rc.used_amount, 0) as remaining_amount,
  ROUND((COALESCE(rc.used_amount, 0) / 5000) * 100, 2) as usage_percentage,
  CASE 
    WHEN COALESCE(rc.used_amount, 0) >= 5000 THEN 'At Limit'
    WHEN COALESCE(rc.used_amount, 0) >= 4000 THEN 'Near Limit'
    ELSE 'Normal'
  END as cap_status
FROM users u
LEFT JOIN (
  SELECT 
    user_id,
    SUM(ABS(points_change)) as used_amount
  FROM blkpoints_ledger
  WHERE type = 'redeem'
    AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  GROUP BY user_id
) rc ON u.id = rc.user_id
WHERE u.is_verified = TRUE;

-- BlkPoints transaction summary view
CREATE VIEW blkpoints_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.mobile_number,
  u.blkpoints_balance,
  COALESCE(earned.total_earned, 0) as total_earned,
  COALESCE(redeemed.total_redeemed, 0) as total_redeemed,
  COALESCE(pending.pending_earned, 0) as pending_earned,
  COALESCE(pending.pending_redeemed, 0) as pending_redeemed
FROM users u
LEFT JOIN (
  SELECT user_id, SUM(points_change) as total_earned
  FROM blkpoints_ledger
  WHERE type = 'earn' AND status = 'confirmed'
  GROUP BY user_id
) earned ON u.id = earned.user_id
LEFT JOIN (
  SELECT user_id, SUM(ABS(points_change)) as total_redeemed
  FROM blkpoints_ledger
  WHERE type = 'redeem' AND status = 'confirmed'
  GROUP BY user_id
) redeemed ON u.id = redeemed.user_id
LEFT JOIN (
  SELECT 
    user_id,
    SUM(CASE WHEN points_change > 0 THEN points_change ELSE 0 END) as pending_earned,
    SUM(CASE WHEN points_change < 0 THEN ABS(points_change) ELSE 0 END) as pending_redeemed
  FROM blkpoints_ledger
  WHERE status = 'pending'
  GROUP BY user_id
) pending ON u.id = pending.user_id;

-- ==========================================
-- SAMPLE DATA FOR TESTING
-- ==========================================

-- Insert sample users with verification status
INSERT INTO users (id, email, mobile_number, is_verified, verified_at, blkpoints_balance) VALUES
(1, 'john@example.com', '+447123456789', TRUE, NOW(), 1250),
(2, 'jane@example.com', '+447987654321', TRUE, NOW(), 2000),
(3, 'bob@example.com', '+447555123456', FALSE, NULL, 500),
(4, 'alice@example.com', '+447777888999', TRUE, NOW(), 3000);

-- Set up referral relationships
UPDATE users SET referred_by = 1 WHERE id = 2; -- Jane referred by John
UPDATE users SET referred_by = 1 WHERE id = 3; -- Bob referred by John

-- Insert sample BlkPoints transactions
INSERT INTO blkpoints_ledger (user_id, booking_id, points_change, type, status, notes, created_at) VALUES
(1, 101, 1000, 'earn', 'confirmed', 'Points from booking #101', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 102, -500, 'redeem', 'confirmed', 'Redemption for booking #102', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 201, 2000, 'earn', 'confirmed', 'Points from booking #201', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2, 202, -1000, 'redeem', 'confirmed', 'Redemption for booking #202', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1, 103, 100, 'referral', 'confirmed', 'Referral bonus for user 2', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(3, 301, 500, 'earn', 'pending', 'Pending points from booking #301', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ==========================================
-- MAINTENANCE QUERIES
-- ==========================================

-- Query to find users approaching redemption limit
-- SELECT * FROM redemption_cap_monitoring WHERE usage_percentage >= 80 ORDER BY usage_percentage DESC;

-- Query to find users with high verification attempt rates
-- SELECT id, email, mobile_number, verification_attempts, last_otp_sent FROM users WHERE verification_attempts >= 3 ORDER BY verification_attempts DESC;

-- Query to find pending transactions older than 24 hours
-- SELECT * FROM blkpoints_ledger WHERE status = 'pending' AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Query to find users with multiple referrals
-- SELECT referred_by, COUNT(*) as referral_count FROM users WHERE referred_by IS NOT NULL GROUP BY referred_by ORDER BY referral_count DESC;

-- ==========================================
-- MARKETING CONSENT FIELDS (GDPR)
-- ==========================================

-- Add marketing consent with timestamp for audit
ALTER TABLE users
  ADD COLUMN marketing_opt_in BOOLEAN DEFAULT FALSE,
  ADD COLUMN marketing_opt_in_updated DATETIME NULL,
  ADD COLUMN marketing_opt_in_ip VARCHAR(45) NULL,
  ADD COLUMN unsubscribe_token VARCHAR(64) NULL,
  ADD COLUMN unsubscribed_at DATETIME NULL;
