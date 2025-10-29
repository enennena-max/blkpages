/**
 * BlkPages Loyalty System API
 * Handles mobile verification and redemption cap logic
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for OTP requests
const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per window
  message: 'Too many OTP requests. Please wait 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for verification attempts
const verifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many verification attempts. Please wait 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Mock database (replace with actual database)
const mockDatabase = {
  users: new Map(),
  otpCodes: new Map(),
  blkpointsLedger: [],
  verificationAttempts: new Map(),
};

// ==========================================
// MOBILE VERIFICATION ENDPOINTS
// ==========================================

/**
 * GET /api/user/verification-status
 * Get user's mobile verification status
 */
router.get('/user/verification-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = mockDatabase.users.get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      isVerified: user.isVerified || false,
      mobileNumber: user.mobileNumber || null,
      verifiedAt: user.verifiedAt || null,
      verificationAttempts: user.verificationAttempts || 0
    });
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/user/send-otp
 * Send OTP to user's mobile number
 */
router.post('/user/send-otp', otpRateLimit, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mobile_number } = req.body;
    
    if (!mobile_number) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }
    
    // Validate mobile number format (UK format)
    const mobileRegex = /^(\+44|0)[0-9]{10}$/;
    if (!mobileRegex.test(mobile_number.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid mobile number format' });
    }
    
    // Check for duplicate mobile numbers
    const existingUser = Array.from(mockDatabase.users.values())
      .find(user => user.mobileNumber === mobile_number && user.id !== userId);
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'This phone number is already linked to another BlkPages account.' 
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store OTP
    mockDatabase.otpCodes.set(userId, {
      code: otp,
      mobileNumber: mobile_number,
      expiresAt,
      attempts: 0
    });
    
    // Update user's mobile number
    const user = mockDatabase.users.get(userId) || { id: userId };
    user.mobileNumber = mobile_number;
    user.lastOTPSent = new Date();
    mockDatabase.users.set(userId, user);
    
    // In production, send SMS via Twilio, AWS SNS, etc.
    console.log(`OTP for ${mobile_number}: ${otp}`);
    
    res.json({ 
      message: 'OTP sent successfully',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * POST /api/user/verify-otp
 * Verify OTP code
 */
router.post('/user/verify-otp', verifyRateLimit, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp, mobile_number } = req.body;
    
    if (!otp || !mobile_number) {
      return res.status(400).json({ error: 'OTP and mobile number are required' });
    }
    
    const otpData = mockDatabase.otpCodes.get(userId);
    
    if (!otpData) {
      return res.status(400).json({ error: 'No OTP found. Please request a new code.' });
    }
    
    // Check if OTP has expired
    if (new Date() > otpData.expiresAt) {
      mockDatabase.otpCodes.delete(userId);
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }
    
    // Check mobile number match
    if (otpData.mobileNumber !== mobile_number) {
      return res.status(400).json({ error: 'Mobile number mismatch.' });
    }
    
    // Check attempts
    otpData.attempts++;
    if (otpData.attempts > 3) {
      mockDatabase.otpCodes.delete(userId);
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
    }
    
    // Verify OTP
    if (otpData.code !== otp) {
      mockDatabase.otpCodes.set(userId, otpData);
      return res.status(400).json({ 
        error: `Invalid OTP. ${3 - otpData.attempts} attempts remaining.` 
      });
    }
    
    // OTP is valid - verify user
    const user = mockDatabase.users.get(userId) || { id: userId };
    user.isVerified = true;
    user.mobileNumber = mobile_number;
    user.verifiedAt = new Date();
    user.verificationAttempts = 0;
    mockDatabase.users.set(userId, user);
    
    // Clean up OTP
    mockDatabase.otpCodes.delete(userId);
    
    res.json({ 
      message: 'Mobile number verified successfully',
      verifiedAt: user.verifiedAt
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

/**
 * POST /api/user/resend-otp
 * Resend OTP code
 */
router.post('/user/resend-otp', otpRateLimit, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mobile_number } = req.body;
    
    if (!mobile_number) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }
    
    // Check if user is in cooldown
    const user = mockDatabase.users.get(userId);
    if (user && user.lastOTPSent) {
      const timeSinceLastOTP = Date.now() - new Date(user.lastOTPSent).getTime();
      if (timeSinceLastOTP < 60000) { // 1 minute cooldown
        return res.status(429).json({ 
          error: 'Please wait before requesting another OTP.' 
        });
      }
    }
    
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    mockDatabase.otpCodes.set(userId, {
      code: otp,
      mobileNumber: mobile_number,
      expiresAt,
      attempts: 0
    });
    
    // Update user
    if (user) {
      user.lastOTPSent = new Date();
      mockDatabase.users.set(userId, user);
    }
    
    // In production, send SMS
    console.log(`Resend OTP for ${mobile_number}: ${otp}`);
    
    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// ==========================================
// REDEMPTION CAP ENDPOINTS
// ==========================================

/**
 * GET /api/loyalty/redemption-cap
 * Get user's redemption cap status
 */
router.get('/loyalty/redemption-cap', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Calculate total redeemed in last 30 days
    const totalRedeemed = mockDatabase.blkpointsLedger
      .filter(entry => 
        entry.userId === userId && 
        entry.type === 'redeem' && 
        new Date(entry.createdAt) >= thirtyDaysAgo
      )
      .reduce((sum, entry) => sum + Math.abs(entry.pointsChange), 0);
    
    const maxAmount = 5000; // £50 in points
    const usedAmount = totalRedeemed;
    const remainingAmount = maxAmount - usedAmount;
    const isNearLimit = (usedAmount / maxAmount) > 0.8;
    
    // Calculate reset date (30 days from first redemption in window)
    const firstRedemption = mockDatabase.blkpointsLedger
      .filter(entry => 
        entry.userId === userId && 
        entry.type === 'redeem' && 
        new Date(entry.createdAt) >= thirtyDaysAgo
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    
    const resetDate = firstRedemption 
      ? new Date(new Date(firstRedemption.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    res.json({
      maxAmount,
      usedAmount,
      remainingAmount,
      isNearLimit,
      resetDate,
      percentage: (usedAmount / maxAmount) * 100
    });
  } catch (error) {
    console.error('Error getting redemption cap:', error);
    res.status(500).json({ error: 'Failed to get redemption cap' });
  }
});

/**
 * POST /api/loyalty/redeem
 * Process BlkPoints redemption
 */
router.post('/loyalty/redeem', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { booking_id, redemption_value, points, verification_required } = req.body;
    
    // Check if user is verified
    const user = mockDatabase.users.get(userId);
    if (!user || !user.isVerified) {
      return res.status(403).json({ 
        error: 'Mobile number verification required to redeem BlkPoints.' 
      });
    }
    
    // Check redemption cap
    const capResponse = await getRedemptionCap(userId);
    const totalAfterRedemption = capResponse.usedAmount + points;
    
    if (totalAfterRedemption > capResponse.maxAmount) {
      const remaining = capResponse.maxAmount - capResponse.usedAmount;
      return res.status(400).json({
        error: `You've reached your £50 BlkPoints limit for this 30-day period. You can redeem up to £${(remaining / 100).toFixed(0)} more this month.`
      });
    }
    
    // Check if user has enough points
    const userPoints = await getUserPoints(userId);
    if (userPoints < points) {
      return res.status(400).json({ 
        error: 'Insufficient BlkPoints balance.' 
      });
    }
    
    // Process redemption
    const redemptionId = crypto.randomUUID();
    const redemptionEntry = {
      id: redemptionId,
      userId,
      bookingId: booking_id,
      type: 'redeem',
      pointsChange: -points, // Negative for redemption
      value: redemption_value,
      status: 'pending',
      createdAt: new Date(),
      verificationRequired: verification_required || false
    };
    
    mockDatabase.blkpointsLedger.push(redemptionEntry);
    
    res.json({
      success: true,
      redemptionId,
      message: 'Redemption applied successfully',
      remainingPoints: userPoints - points,
      remainingCap: capResponse.maxAmount - totalAfterRedemption
    });
  } catch (error) {
    console.error('Error processing redemption:', error);
    res.status(500).json({ error: 'Failed to process redemption' });
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function getRedemptionCap(userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const totalRedeemed = mockDatabase.blkpointsLedger
    .filter(entry => 
      entry.userId === userId && 
      entry.type === 'redeem' && 
      new Date(entry.createdAt) >= thirtyDaysAgo
    )
    .reduce((sum, entry) => sum + Math.abs(entry.pointsChange), 0);
  
  return {
    maxAmount: 5000,
    usedAmount: totalRedeemed
  };
}

async function getUserPoints(userId) {
  const totalPoints = mockDatabase.blkpointsLedger
    .filter(entry => entry.userId === userId)
    .reduce((sum, entry) => sum + entry.pointsChange, 0);
  
  return Math.max(0, totalPoints); // Ensure non-negative
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // In production, verify JWT with secret
  try {
    const decoded = jwt.decode(token); // For demo, just decode without verification
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// ==========================================
// DATABASE SCHEMA EXAMPLES
// ==========================================

/*
-- Users table with verification fields
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(20) UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at DATETIME,
  verification_attempts INT DEFAULT 0,
  last_otp_sent DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- OTP codes table
CREATE TABLE otp_codes (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  attempts INT DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- BlkPoints ledger
CREATE TABLE blkpoints_ledger (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  booking_id VARCHAR(36),
  type ENUM('earn', 'redeem', 'expire', 'adjust') NOT NULL,
  points_change INT NOT NULL,
  value DECIMAL(10,2),
  status ENUM('pending', 'confirmed', 'released') DEFAULT 'pending',
  verification_required BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_ledger_user_type_date ON blkpoints_ledger(user_id, type, created_at);
CREATE INDEX idx_ledger_booking ON blkpoints_ledger(booking_id);
CREATE INDEX idx_otp_user_expires ON otp_codes(user_id, expires_at);
*/

module.exports = router;
