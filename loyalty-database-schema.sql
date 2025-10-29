-- ==========================================
-- BlkPages Loyalty System Database Schema
-- Mobile Verification + Redemption Cap System
-- ==========================================

-- Users table with mobile verification fields
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(20) UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at DATETIME,
  verification_attempts INT DEFAULT 0,
  last_otp_sent DATETIME,
  referral_code VARCHAR(12) UNIQUE,
  referred_by VARCHAR(36),
  marketing_opt_in BOOLEAN DEFAULT FALSE,
  marketing_opt_in_updated DATETIME,
  marketing_opt_in_ip VARCHAR(45),
  unsubscribe_token VARCHAR(64),
  unsubscribed_at DATETIME,
  device_fingerprint VARCHAR(255), -- For enhanced fraud detection
  ip_address VARCHAR(45), -- For fraud detection
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_mobile_format CHECK (mobile_number REGEXP '^(\+44|0)[0-9]{10}$'),
  CONSTRAINT chk_verification_attempts CHECK (verification_attempts >= 0 AND verification_attempts <= 10)
);

-- OTP codes table for mobile verification
CREATE TABLE otp_codes (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  attempts INT DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_code_format CHECK (code REGEXP '^[0-9]{6}$'),
  CONSTRAINT chk_otp_attempts CHECK (attempts >= 0 AND attempts <= 5)
);

-- BlkPoints ledger for tracking all point transactions
CREATE TABLE blkpoints_ledger (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  booking_id VARCHAR(36),
  type ENUM('earn', 'redeem', 'expire', 'adjust', 'refund') NOT NULL,
  points_change INT NOT NULL,
  value DECIMAL(10,2), -- Cash value in pounds
  status ENUM('pending', 'confirmed', 'released', 'cancelled') DEFAULT 'pending',
  verification_required BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  
  -- Foreign key
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_points_change CHECK (points_change != 0),
  CONSTRAINT chk_value_positive CHECK (value IS NULL OR value >= 0)
);

-- Redemption cap tracking (for monitoring and reporting)
CREATE TABLE redemption_caps (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  period_start DATETIME NOT NULL,
  period_end DATETIME NOT NULL,
  max_amount INT NOT NULL DEFAULT 5000, -- £50 in points
  used_amount INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_cap_amounts CHECK (used_amount >= 0 AND used_amount <= max_amount),
  CONSTRAINT chk_period_valid CHECK (period_end > period_start)
);

-- Device fingerprint tracking for fraud prevention
CREATE TABLE device_fingerprints (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  fingerprint VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_trusted BOOLEAN DEFAULT FALSE,
  
  -- Foreign key
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Unique constraint
  UNIQUE KEY unique_user_fingerprint (user_id, fingerprint)
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Users table indexes
CREATE INDEX idx_users_mobile ON users(mobile_number);
CREATE INDEX idx_users_verified ON users(is_verified);
CREATE INDEX idx_users_created ON users(created_at);
CREATE INDEX idx_users_marketing_opt_in ON users(marketing_opt_in);
CREATE INDEX idx_users_unsubscribe_token ON users(unsubscribe_token);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id VARCHAR(36) PRIMARY KEY,
  referrer_id VARCHAR(36) NOT NULL,
  referee_id VARCHAR(36) NULL,
  referral_code VARCHAR(12) NOT NULL,
  status ENUM('clicked','signed_up','completed','cancelled') DEFAULT 'clicked',
  device_fingerprint VARCHAR(64) NULL,
  payment_hash VARCHAR(64) NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referee_id) REFERENCES users(id)
);

-- OTP codes indexes
CREATE INDEX idx_otp_user_expires ON otp_codes(user_id, expires_at);
CREATE INDEX idx_otp_code ON otp_codes(code);
CREATE INDEX idx_otp_created ON otp_codes(created_at);

-- BlkPoints ledger indexes
CREATE INDEX idx_ledger_user_type_date ON blkpoints_ledger(user_id, type, created_at);
CREATE INDEX idx_ledger_booking ON blkpoints_ledger(booking_id);
CREATE INDEX idx_ledger_status ON blkpoints_ledger(status);
CREATE INDEX idx_ledger_created ON blkpoints_ledger(created_at);

-- Redemption caps indexes
CREATE INDEX idx_caps_user_period ON redemption_caps(user_id, period_start, period_end);
CREATE INDEX idx_caps_period ON redemption_caps(period_start, period_end);

-- Device fingerprints indexes
CREATE INDEX idx_fingerprints_user ON device_fingerprints(user_id);
CREATE INDEX idx_fingerprints_fingerprint ON device_fingerprints(fingerprint);
CREATE INDEX idx_fingerprints_trusted ON device_fingerprints(is_trusted);

-- ==========================================
-- STORED PROCEDURES
-- ==========================================

-- Procedure to check if user can redeem points
DELIMITER //
CREATE PROCEDURE CheckRedemptionEligibility(
  IN p_user_id VARCHAR(36),
  IN p_redemption_points INT,
  OUT p_can_redeem BOOLEAN,
  OUT p_remaining_cap INT,
  OUT p_error_message VARCHAR(255)
)
BEGIN
  DECLARE v_used_amount INT DEFAULT 0;
  DECLARE v_max_amount INT DEFAULT 5000;
  DECLARE v_user_verified BOOLEAN DEFAULT FALSE;
  
  -- Check if user is verified
  SELECT is_verified INTO v_user_verified 
  FROM users 
  WHERE id = p_user_id;
  
  IF NOT v_user_verified THEN
    SET p_can_redeem = FALSE;
    SET p_error_message = 'Mobile number verification required';
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

-- Procedure to get user's redemption cap status
DELIMITER //
CREATE PROCEDURE GetRedemptionCapStatus(
  IN p_user_id VARCHAR(36),
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

-- Trigger to automatically clean up expired OTP codes
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

-- Trigger to update redemption cap when points are redeemed
DELIMITER //
CREATE TRIGGER update_redemption_cap
  AFTER INSERT ON blkpoints_ledger
  FOR EACH ROW
BEGIN
  IF NEW.type = 'redeem' AND NEW.status = 'confirmed' THEN
    INSERT INTO redemption_caps (id, user_id, period_start, period_end, used_amount)
    VALUES (
      UUID(),
      NEW.user_id,
      DATE_SUB(NOW(), INTERVAL 30 DAY),
      NOW(),
      ABS(NEW.points_change)
    )
    ON DUPLICATE KEY UPDATE
      used_amount = used_amount + ABS(NEW.points_change);
  END IF;
END //
DELIMITER ;

-- ==========================================
-- VIEWS FOR REPORTING
-- ==========================================

-- View for user verification status
CREATE VIEW user_verification_status AS
SELECT 
  u.id,
  u.email,
  u.mobile_number,
  u.is_verified,
  u.verified_at,
  u.verification_attempts,
  CASE 
    WHEN u.is_verified THEN 'Verified'
    WHEN u.verification_attempts >= 3 THEN 'Blocked'
    ELSE 'Pending'
  END as verification_status
FROM users u;

-- View for redemption cap monitoring
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

-- ==========================================
-- SAMPLE DATA FOR TESTING
-- ==========================================

-- Insert sample users
INSERT INTO users (id, email, mobile_number, is_verified, verified_at) VALUES
('user-1', 'john@example.com', '+447123456789', TRUE, NOW()),
('user-2', 'jane@example.com', '+447987654321', TRUE, NOW()),
('user-3', 'bob@example.com', '+447555123456', FALSE, NULL);

-- Insert sample BlkPoints transactions
INSERT INTO blkpoints_ledger (id, user_id, type, points_change, value, status, created_at) VALUES
('tx-1', 'user-1', 'earn', 1000, 10.00, 'confirmed', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('tx-2', 'user-1', 'redeem', -500, 5.00, 'confirmed', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('tx-3', 'user-2', 'earn', 2000, 20.00, 'confirmed', DATE_SUB(NOW(), INTERVAL 10 DAY)),
('tx-4', 'user-2', 'redeem', -1000, 10.00, 'confirmed', DATE_SUB(NOW(), INTERVAL 7 DAY));

-- ==========================================
-- MAINTENANCE QUERIES
-- ==========================================

-- Query to find users approaching redemption limit
SELECT 
  user_id,
  email,
  mobile_number,
  used_amount,
  remaining_amount,
  usage_percentage
FROM redemption_cap_monitoring
WHERE usage_percentage >= 80
ORDER BY usage_percentage DESC;

-- Query to find users with multiple device fingerprints (potential fraud)
SELECT 
  u.id,
  u.email,
  u.mobile_number,
  COUNT(df.fingerprint) as device_count
FROM users u
JOIN device_fingerprints df ON u.id = df.user_id
GROUP BY u.id, u.email, u.mobile_number
HAVING device_count > 3
ORDER BY device_count DESC;

-- Query to find users with high verification attempt rates
SELECT 
  id,
  email,
  mobile_number,
  verification_attempts,
  last_otp_sent
FROM users
WHERE verification_attempts >= 3
ORDER BY verification_attempts DESC;
