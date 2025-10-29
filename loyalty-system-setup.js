#!/usr/bin/env node

/**
 * BlkPages Loyalty System Setup Script
 * 
 * This script sets up the complete loyalty system:
 * ✅ Database schema
 * ✅ Background jobs
 * ✅ API endpoints
 * ✅ Notification system
 * ✅ Testing framework
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Import our loyalty modules
const loyaltyEngine = require('./loyalty-engine');
const blkpointsIntegration = require('./blkpoints-integration');
const blkpointsService = require('./blkpoints-service');

// Mock database connection (replace with your actual database)
const mockDb = {
  users: new Map(),
  bookings: new Map(),
  blkpoints_ledger: [],
  otpCodes: new Map()
};

// =====================================================
// 🚀 Express App Setup
// =====================================================

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api', generalRateLimit);

// Attach database to app.locals for service access
app.locals.db = mockDb;

// =====================================================
// 🔐 Authentication Middleware (Mock)
// =====================================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // Mock JWT verification (replace with real JWT verification)
  try {
    const decoded = { id: 'user-123', email: 'test@example.com' }; // Mock user
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// =====================================================
// 🧱 Referral Code & Link Capture Endpoints
// =====================================================

/**
 * generateReferralCode() - Generates permanent referral code
 * Format: BLK-XXXXXX (8 uppercase alphanumeric)
 * Never regenerates unless explicitly reset by admin
 */
function generateReferralCode() {
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `BLK-${randomPart}`; // e.g., BLK-A1B2C3D4
}

// Get referral code (never regenerates - permanent)
app.get('/api/user/referral-code', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = mockDb.users.get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Never regenerate - code is permanent
    if (!user.referral_code) {
      // Only generate if truly missing (edge case for existing users)
      user.referral_code = generateReferralCode();
      mockDb.users.set(userId, user);
    }
    
    const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
    const referralLink = `${baseUrl}/signup?ref=${user.referral_code}`;
    
    res.json({ 
      referral_code: user.referral_code,
      referral_link: referralLink
    });
  } catch (error) {
    console.error('Error fetching referral code:', error);
    res.status(500).json({ error: 'Failed to fetch referral code' });
  }
});

// Get referral link only (for convenience)
app.get('/api/user/referral-link', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = mockDb.users.get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.referral_code) {
      user.referral_code = generateReferralCode();
      mockDb.users.set(userId, user);
    }
    
    const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
    const referralLink = `${baseUrl}/signup?ref=${user.referral_code}`;
    
    res.json({ referral_link: referralLink });
  } catch (error) {
    console.error('Error fetching referral link:', error);
    res.status(500).json({ error: 'Failed to fetch referral link' });
  }
});

// Referral link click → set cookie then redirect to signup page
app.get('/ref/:code', (req, res) => {
  const { code } = req.params;
  res.setHeader('Set-Cookie', `blk_ref_code=${encodeURIComponent(code)}; Max-Age=${7*24*60*60}; Path=/; SameSite=Lax`);
  res.redirect('/customer-register.html');
});

// =====================================================
// 📱 Mobile Verification API Endpoints
// =====================================================

// Get verification status
app.get('/api/user/verification-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = mockDb.users.get(userId) || {
      id: userId,
      is_verified: false,
      mobile_number: null,
      verified_at: null,
      marketing_opt_in: false,
      marketing_opt_in_updated: null
    };
    
    res.json({
      isVerified: user.is_verified || false,
      mobileNumber: user.mobile_number || null,
      verifiedAt: user.verified_at || null,
      verificationAttempts: user.verification_attempts || 0,
      marketing_opt_in: !!user.marketing_opt_in,
      marketing_opt_in_updated: user.marketing_opt_in_updated || null
    });
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send OTP
app.post('/api/user/send-otp', rateLimit({ windowMs: 15 * 60 * 1000, max: 3 }), authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mobile_number } = req.body;
    
    if (!mobile_number) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }
    
    // Validate mobile number format
    const mobileRegex = /^(\+44|0)[0-9]{10}$/;
    if (!mobileRegex.test(mobile_number.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid mobile number format' });
    }
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store OTP
    mockDb.otpCodes.set(userId, {
      code: otp,
      mobileNumber: mobile_number,
      expiresAt,
      attempts: 0
    });
    
    // Update user
    const user = mockDb.users.get(userId) || { id: userId };
    user.mobileNumber = mobile_number;
    user.lastOTPSent = new Date();
    mockDb.users.set(userId, user);
    
    // In production, send SMS here
    console.log(`📱 OTP for ${mobile_number}: ${otp}`);
    
    res.json({ 
      message: 'OTP sent successfully',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
app.post('/api/user/verify-otp', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp, mobile_number } = req.body;
    
    if (!otp || !mobile_number) {
      return res.status(400).json({ error: 'OTP and mobile number are required' });
    }
    
    const otpData = mockDb.otpCodes.get(userId);
    
    if (!otpData) {
      return res.status(400).json({ error: 'No OTP found. Please request a new code.' });
    }
    
    // Check if OTP has expired
    if (new Date() > otpData.expiresAt) {
      mockDb.otpCodes.delete(userId);
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }
    
    // Check mobile number match
    if (otpData.mobileNumber !== mobile_number) {
      return res.status(400).json({ error: 'Mobile number mismatch.' });
    }
    
    // Check attempts
    otpData.attempts++;
    if (otpData.attempts > 3) {
      mockDb.otpCodes.delete(userId);
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
    }
    
    // Verify OTP
    if (otpData.code !== otp) {
      mockDb.otpCodes.set(userId, otpData);
      return res.status(400).json({ 
        error: `Invalid OTP. ${3 - otpData.attempts} attempts remaining.` 
      });
    }
    
    // OTP is valid - verify user
    const user = mockDb.users.get(userId) || { id: userId };
    user.is_verified = true;
    user.mobile_number = mobile_number;
    user.verified_at = new Date();
    user.verification_attempts = 0;
    mockDb.users.set(userId, user);
    
    // Clean up OTP
    mockDb.otpCodes.delete(userId);
    
    res.json({ 
      message: 'Mobile number verified successfully',
      verifiedAt: user.verified_at
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// =====================================================
// 💰 BlkPoints API Endpoints
// =====================================================

// Get user BlkPoints status
app.get('/api/loyalty/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await blkpointsService.getBlkPointsStatus(userId, mockDb);
    const user = mockDb.users.get(userId) || {};
    res.json({
      balance: status.points,
      ...status,
      marketing_opt_in: !!user.marketing_opt_in,
      marketing_opt_in_updated: user.marketing_opt_in_updated || null
    });
  } catch (error) {
    console.error('Error getting loyalty status:', error);
    res.status(500).json({ error: 'Failed to get loyalty status' });
  }
});

// Redeem BlkPoints (using new clean service)
app.post('/api/loyalty/redeem', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { selectedPoints, bookingAmountGBP } = req.body;
    
    if (!selectedPoints || typeof selectedPoints !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Points amount required'
      });
    }
    
    // Generate idempotency key
    const idem = `redeem-${userId}-${Date.now()}`;
    
    // Use new service - includes all validation (mobile, balance, cap, minimum order value)
    const valueGBP = await blkpointsService.redeemPoints(
      { userId, points: selectedPoints, idem, bookingAmountGBP },
      mockDb
    );
    
    res.json({
      success: true,
      redeemedPoints: selectedPoints,
      valueGBP: +valueGBP.toFixed(2),
      message: `£${valueGBP.toFixed(2)} BlkPoints discount applied.`
    });
  } catch (error) {
    console.error('Error processing redemption:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to process redemption',
      code: error.code || 'REDEMPTION_FAILED'
    });
  }
});

// Complete booking (triggers BlkPoints earning)
app.post('/api/bookings/complete', authenticateToken, async (req, res) => {
  try {
    const { bookingId, netAmount } = req.body;
    const userId = req.user.id;
    
    // Mark booking as completed
    mockDb.bookings.set(bookingId, {
      id: bookingId,
      user_id: userId,
      status: 'completed',
      net_amount: netAmount,
      completed_at: new Date()
    });
    
    // Award BlkPoints using new service (immediate confirmation for demo)
    const idem = `booking-${bookingId}-${userId}`;
    await blkpointsService.earnOnCompletedBooking(
      { userId, amountGBP: netAmount, bookingId, idem },
      mockDb
    );
    
    // Trigger referral logic (pending bonus for referrer on first completed booking)
    await handleReferralOnBookingComplete(userId, bookingId, mockDb);
    
    res.json({ 
      success: true, 
      message: 'Booking completed and BlkPoints awarded' 
    });
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({ error: 'Failed to complete booking' });
  }
});

// =====================================================
// ✍️ Auth Signup (Fraud-resistant referral attach)
// =====================================================

/**
 * handleSignup() - Enhanced fraud-resistant signup
 * Performs comprehensive fraud checks before assigning referral
 */
async function handleSignup(newUserData, deviceFingerprint, paymentHash, req, db) {
  const { email, mobile_number, password, referral_code } = newUserData;
  
  // Check for duplicate email
  for (const u of db.users.values()) {
    if (u.email === email) {
      return { success: false, error: 'Email already registered' };
    }
  }

  // Resolve referrer by referral_code (from body or cookie)
  let refCode = referral_code;
  if (!refCode && req.headers.cookie) {
    const m = req.headers.cookie.match(/(?:^|;\s*)blk_ref_code=([^;]+)/);
    if (m) refCode = decodeURIComponent(m[1]);
  }

  let referrer = null;
  if (refCode) {
    referrer = Array.from(db.users.values()).find(u => u.referral_code === refCode) || null;
  }

  // ---- FRAUD CHECKS BEFORE SAVING REFERRER ----
  if (referrer) {
    // 1. Self-referral block (same email or phone)
    if ((referrer.email && referrer.email === email) || 
        (referrer.mobile_number && referrer.mobile_number === mobile_number)) {
      console.log("🚫 Self referral blocked: email/phone match");
      referrer = null;
    }

    // 2. Check if referrer phone used before for new accounts
    if (mobile_number) {
      const duplicatePhone = Array.from(db.users.values()).find(u => 
        u.mobile_number === mobile_number && u.id !== referrer.id
      );
      if (duplicatePhone) {
        console.log("🚫 Duplicate phone referral blocked: phone already registered");
        referrer = null;
      }
    }

    // 3. Check if this device fingerprint already used to sign up
    if (deviceFingerprint) {
      if (!db.referrals) db.referrals = [];
      const existingDevice = db.referrals.find(r => 
        r.device_fingerprint === deviceFingerprint
      );
      if (existingDevice) {
        console.log("🚫 Duplicate device referral blocked: device already used");
        referrer = null;
      }
    }

    // 4. Check if payment card hash already used (optional but recommended)
    if (paymentHash && referrer) {
      if (!db.referrals) db.referrals = [];
      const existingPayment = db.referrals.find(r => 
        r.payment_hash === paymentHash && r.referrer_id !== referrer.id
      );
      if (existingPayment) {
        console.log("🚫 Duplicate payment card referral blocked: card already used");
        referrer = null;
      }
    }
  }

  // ---- CREATE NEW USER ----
  const newId = `user-${Date.now()}`;
  
  // Generate permanent referral code for new user (only once, never regenerated)
  const permanentReferralCode = generateReferralCode();
  
  const newUser = {
    id: newId,
    email,
    mobile_number: mobile_number || null,
    is_verified: false,
    verified_at: null,
    blkpoints_balance: 0,
    referred_by: referrer ? referrer.id : null,
    referral_code: permanentReferralCode // Permanent code generated at signup
  };
  db.users.set(newId, newUser);

  // Ensure referrer has a code (if they don't have one, generate it)
  if (referrer && !referrer.referral_code) {
    referrer.referral_code = generateReferralCode();
    db.users.set(referrer.id, referrer);
  }

  // ---- CREATE REFERRAL RECORD IF VALID ----
  if (referrer) {
    if (!db.referrals) db.referrals = [];
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
    
    db.referrals.push({
      id: `ref-${Date.now()}`,
      referrer_id: referrer.id,
      referee_id: newId,
      referral_code: refCode,
      device_fingerprint: deviceFingerprint || null,
      payment_hash: paymentHash || null,
      ip_address: ip || null,
      status: 'signed_up',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    console.log(`✅ Referral created: ${referrer.id} → ${newId} (code: ${refCode})`);
  } else if (refCode) {
    console.log(`⚠️ Referral code ${refCode} provided but blocked by fraud checks`);
  }

  return { 
    success: true, 
    user: { 
      id: newId, 
      email, 
      referral_code: newUser.referral_code, 
      referred_by: newUser.referred_by 
    } 
  };
}

// Note: In a real app this belongs in your auth service.
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, mobile_number, payment_hash, device_fingerprint, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await handleSignup(
      { email, mobile_number, password },
      device_fingerprint,
      payment_hash,
      req,
      mockDb
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

/**
 * handleReferralOnBookingComplete() - Enhanced with safety checks
 * Creates pending referral bonus only on first completed booking
 */
const REFERRAL_BONUS_POINTS = 100;

async function handleReferralOnBookingComplete(refereeId, bookingId, db) {
  const referee = db.users instanceof Map ? db.users.get(refereeId) : await db.users.findUnique({ where: { id: refereeId } });
  if (!referee || !referee.referred_by) {
    console.log(`⚠️ No referrer found for user ${refereeId}`);
    return;
  }

  const referrerId = referee.referred_by;
  const referrer = db.users instanceof Map ? db.users.get(referrerId) : await db.users.findUnique({ where: { id: referrerId } });
  
  // 🔐 Safety: skip if referrer or referee missing
  if (!referrer) {
    console.log(`⚠️ Referrer ${referrerId} not found`);
    return;
  }

  if (referrer.id === referee.id) {
    console.log(`🚫 Self-referral detected and blocked for user ${refereeId}`);
    return;
  }

  // ✅ Only reward if this is referee's first completed booking
  const completedBookings = Array.from(db.bookings.values()).filter(
    b => b.user_id === refereeId && b.status === 'completed'
  );
  
  if (completedBookings.length > 1) {
    console.log(`ℹ️ Referral bonus not awarded: referee has ${completedBookings.length} completed bookings (only first counts)`);
    return;
  }

  // Use new service for referral bonus (with idempotency)
  const idem = `referral-${refereeId}-${bookingId}`;
  try {
    await blkpointsService.earnOnReferralCompleted(
      { userId: referrerId, referredUserId: refereeId, bookingId, idem },
      db
    );
    
    console.log(`✅ Referral bonus awarded: ${referrerId} earned from ${refereeId}'s first booking`);
    
    // Update referral record (for tracking)
    if (!db.referrals) db.referrals = [];
    
    let referralRecord = db.referrals.find(r => 
      r.referrer_id === referrerId && r.referee_id === refereeId
    );
    
    if (referralRecord) {
      referralRecord.status = 'completed';
      referralRecord.updated_at = new Date();
    } else {
      db.referrals.push({
        id: `ref-${Date.now()}`,
        referrer_id: referrerId,
        referee_id: refereeId,
        referral_code: referrer.referral_code || '',
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  } catch (error) {
    // Service handles duplicate idempotency keys silently
    if (error.message && error.message.includes('idempotency')) {
      console.log(`⚠️ Duplicate referral bonus prevented (idempotency): ${idem}`);
    } else {
      console.error(`❌ Error awarding referral bonus:`, error);
    }
  }

  // Send real-time notification to referrer
  io.to(`user-${referrer.id}`).emit('referral_notification', {
    type: 'pending',
    message: '🎁 Your friend just booked! You\'ll receive 100 BlkPoints in 24 hours.',
    points: REFERRAL_BONUS_POINTS,
    status: 'pending'
  });

  console.log(`✅ Referral bonus pending for referrer ${referrer.id} from referee ${refereeId}`);
}

// =====================================================
// 📣 Marketing Opt-in Endpoint (GDPR compliant)
// =====================================================

// POST /api/user/marketing-optin
app.post('/api/user/marketing-optin', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { marketing_opt_in } = req.body;
    
    const user = mockDb.users.get(userId) || { id: userId };
    user.marketing_opt_in = !!marketing_opt_in;
    user.marketing_opt_in_updated = new Date();
    // Capture opt-in/out IP (respecting proxies)
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
    user.marketing_opt_in_ip = ip || null;
    if (!user.unsubscribe_token) {
      user.unsubscribe_token = crypto.randomBytes(24).toString('hex');
    }
    if (!user.marketing_opt_in) {
      user.unsubscribed_at = new Date();
    }
    mockDb.users.set(userId, user);
    
    res.json({ success: true, marketing_opt_in: user.marketing_opt_in });
  } catch (error) {
    console.error('Error updating marketing opt-in:', error);
    res.status(500).json({ error: 'Failed to update marketing opt-in' });
  }
});

// Public unsubscribe endpoint via token
// GET /u/unsub?token=...
app.get('/u/unsub', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Missing unsubscribe token');
    
    // Find user by token (mock lookup)
    const user = Array.from(mockDb.users.values()).find(u => u.unsubscribe_token === token);
    if (!user) return res.status(404).send('Invalid unsubscribe token');
    
    user.marketing_opt_in = false;
    user.unsubscribed_at = new Date();
    user.marketing_opt_in_updated = new Date();
    mockDb.users.set(user.id, user);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title></head><body style="font-family:Arial;padding:40px;">You have been unsubscribed from BlkPages marketing emails. You will still receive essential booking updates.</body></html>`);
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    res.status(500).send('Failed to process unsubscribe');
  }
});

// =====================================================
// 🔧 Admin & Testing Endpoints
// =====================================================

// Manual loyalty engine run
app.post('/api/admin/run-loyalty-engine', authenticateToken, async (req, res) => {
  try {
    const result = await loyaltyEngine.runLoyaltyEngineManually(mockDb);
    res.json(result);
  } catch (error) {
    console.error('Error running loyalty engine:', error);
    res.status(500).json({ error: 'Failed to run loyalty engine' });
  }
});

// Test notification
app.post('/api/admin/test-notification', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await loyaltyEngine.testNotificationSystem(mockDb, userId);
    res.json({ message: 'Test notification sent' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Get system status
app.get('/api/admin/status', authenticateToken, async (req, res) => {
  try {
    const stats = {
      totalUsers: mockDb.users.size,
      verifiedUsers: Array.from(mockDb.users.values()).filter(u => u.is_verified).length,
      totalTransactions: mockDb.blkpoints_ledger.length,
      pendingTransactions: mockDb.blkpoints_ledger.filter(tx => tx.status === 'pending').length,
      activeOTPs: mockDb.otpCodes.size
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// Email preview endpoint
app.get('/api/admin/email-preview', authenticateToken, async (req, res) => {
  try {
    const { EmailService } = require('./email-service');
    const emailService = new EmailService();
    
    // Sample user data
    const sampleUser = {
      id: 'user-123',
      email: 'test@example.com',
      marketing_opt_in: true,
      unsubscribe_token: 'sample-token-123',
      referral_code: 'REF123'
    };
    
    const emails = [
      {
        template: 'booking-pending',
        subject: 'Booking Complete - BlkPoints Earned! 🎉',
        type: 'transactional',
        html: emailService.renderEmail(sampleUser, 'Booking Complete - BlkPoints Earned! 🎉', 'booking-pending', {
          business_name: 'Hair Studio London',
          points_earned: 100
        })
      },
      {
        template: 'points-confirmed',
        subject: 'BlkPoints Confirmed! ✅',
        type: 'transactional',
        html: emailService.renderEmail(sampleUser, 'BlkPoints Confirmed! ✅', 'points-confirmed', {
          points_earned: 100
        })
      },
      {
        template: 'referral-confirmed',
        subject: 'Referral Bonus Earned! 🎁',
        type: 'transactional',
        html: emailService.renderEmail(sampleUser, 'Referral Bonus Earned! 🎁', 'referral-confirmed', {})
      },
      {
        template: 'referral-promo',
        subject: 'Earn More BlkPoints! 💛',
        type: 'marketing',
        html: emailService.renderEmail(sampleUser, 'Earn More BlkPoints! 💛', 'referral-promo', {
          referral_code: 'REF123'
        })
      },
      {
        template: 'expiry-warning',
        subject: 'BlkPoints Expiring Soon! ⏰',
        type: 'marketing',
        html: emailService.renderEmail(sampleUser, 'BlkPoints Expiring Soon! ⏰', 'expiry-warning', {
          points_expiring: 500,
          expiry_date: '15 Feb 2025'
        })
      }
    ];
    
    res.json(emails);
  } catch (error) {
    console.error('Error generating email previews:', error);
    res.status(500).json({ error: 'Failed to generate email previews' });
  }
});

// Serve email preview page
app.get('/email-preview', (req, res) => {
  res.sendFile(path.join(__dirname, 'email-preview.html'));
});

// Serve device fingerprint script
app.get('/device-fingerprint.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'device-fingerprint.js'));
});

// Serve BlkPoints validation helper script
app.get('/blkpoints-validation.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'blkpoints-validation.js'));
});

// Serve checkout example
app.get('/checkout-example', (req, res) => {
  res.sendFile(path.join(__dirname, 'checkout-blkpoints-example.html'));
});

// Serve payment page
app.get('/payment', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment.html'));
});

// Serve booking page
app.get('/booking', (req, res) => {
  res.sendFile(path.join(__dirname, 'booking.html'));
});

// Serve admin referrals dashboard
app.get('/admin/referrals', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-referrals-dashboard.html'));
});

// =====================================================
// 🔒 Admin Monitoring Endpoints
// =====================================================

// Get all user referral codes (admin dashboard)
app.get('/api/admin/referrals', authenticateToken, async (req, res) => {
  try {
    const users = Array.from(mockDb.users.values()).map(u => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name || u.email?.split('@')[0] || 'N/A',
      referral_code: u.referral_code || 'Not generated',
      referral_link: u.referral_code 
        ? `${process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`}/signup?ref=${u.referral_code}`
        : null,
      referred_by: u.referred_by || null,
      blkpoints_balance: u.blkpoints_balance || 0,
      is_verified: u.is_verified || false
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching admin referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

// Get suspicious referrals (for admin monitoring)
app.get('/api/admin/suspicious-referrals', authenticateToken, async (req, res) => {
  try {
    if (!mockDb.referrals) {
      return res.json({ suspicious: [], summary: { total_referrers: 0, flagged: 0 } });
    }

    // Group referrals by referrer
    const referrerStats = new Map();
    
    for (const ref of mockDb.referrals) {
      const referee = mockDb.users.get(ref.referee_id);
      if (!referee) continue;
      
      if (!referrerStats.has(ref.referrer_id)) {
        referrerStats.set(ref.referrer_id, {
          referrer_id: ref.referrer_id,
          total_refs: 0,
          unique_phones: new Set(),
          unique_devices: new Set(),
          unique_ips: new Set(),
          referrals: []
        });
      }
      
      const stats = referrerStats.get(ref.referrer_id);
      stats.total_refs++;
      if (referee.mobile_number) stats.unique_phones.add(referee.mobile_number);
      if (ref.device_fingerprint) stats.unique_devices.add(ref.device_fingerprint);
      if (ref.ip_address) stats.unique_ips.add(ref.ip_address);
      stats.referrals.push(ref);
    }

    // Flag suspicious referrers
    const suspicious = [];
    for (const [referrerId, stats] of referrerStats) {
      const phoneRatio = stats.unique_phones.size / Math.max(stats.total_refs, 1);
      const deviceRatio = stats.unique_devices.size / Math.max(stats.total_refs, 1);
      
      // Flag if: more than 5 referrals AND (device ratio < 80% OR phone ratio < 80%)
      if (stats.total_refs > 5 && (deviceRatio < 0.8 || phoneRatio < 0.8)) {
        suspicious.push({
          referrer_id: referrerId,
          referrer: mockDb.users.get(referrerId) || {},
          total_refs: stats.total_refs,
          unique_phones: stats.unique_phones.size,
          unique_devices: stats.unique_devices.size,
          unique_ips: stats.unique_ips.size,
          phone_ratio: phoneRatio,
          device_ratio: deviceRatio,
          risk_score: Math.round((1 - Math.min(phoneRatio, deviceRatio)) * 100),
          referrals: stats.referrals
        });
      }
    }

    // Sort by risk score (highest first)
    suspicious.sort((a, b) => b.risk_score - a.risk_score);

    res.json({
      suspicious,
      summary: {
        total_referrers: referrerStats.size,
        flagged: suspicious.length,
        total_referrals: mockDb.referrals.length
      }
    });
  } catch (error) {
    console.error('Error fetching suspicious referrals:', error);
    res.status(500).json({ error: 'Failed to fetch suspicious referrals' });
  }
});

// =====================================================
// 🔌 WebSocket Connection Handling
// =====================================================

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  // Join user-specific room for targeted notifications
  socket.on('join_user_room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined their room`);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// =====================================================
// 🚀 Server Startup
// =====================================================

async function startServer() {
  try {
    // Initialize loyalty engine
    loyaltyEngine.setupLoyaltyEngine(mockDb);
    
    // Add some sample data
    mockDb.users.set('user-123', {
      id: 'user-123',
      email: 'test@example.com',
      mobile_number: '+447123456789',
      is_verified: true,
      verified_at: new Date(),
      blkpoints_balance: 1250,
      referral_code: generateReferralCode() // Permanent code generated
    });
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 BlkPages Loyalty System running on port ${PORT}`);
      console.log(`📱 Mobile verification: http://localhost:${PORT}/api/user/verification-status`);
      console.log(`💰 BlkPoints status: http://localhost:${PORT}/api/loyalty/status`);
      console.log(`🔧 Admin panel: http://localhost:${PORT}/api/admin/status`);
      console.log(`📧 Email preview: http://localhost:${PORT}/email-preview`);
      console.log(`🔌 WebSocket enabled for real-time notifications`);
      console.log(`⏰ Loyalty engine scheduled and running`);
    });
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down BlkPages Loyalty System...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down BlkPages Loyalty System...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = { app, server, io };
