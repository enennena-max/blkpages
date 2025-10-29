# BlkPages BlkPoints API Integration Guide

## 🎯 Complete Implementation Guide

This guide shows how to integrate the complete BlkPoints system with mobile verification and 30-day redemption caps into your existing BlkPages application.

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `blkpoints-integration.js` | Complete Node.js integration logic |
| `blkpoints-database-setup.sql` | Database schema and setup |
| `loyalty-page.html` | Updated frontend with verification UI |
| `loyalty-api.js` | Express.js API endpoints |

## 🚀 Quick Start

### 1. Database Setup

```bash
# Run the database setup
mysql -u username -p database_name < blkpoints-database-setup.sql
```

### 2. Install Dependencies

```bash
npm install express-rate-limit node-cron
```

### 3. Add to Your Express App

```javascript
const express = require('express');
const { 
  validateBlkPointsRedemption,
  earnBlkPoints,
  processPendingPoints,
  getUserBlkPointsStatus 
} = require('./blkpoints-integration');

const app = express();

// Your existing routes...
```

## 🔌 API Endpoints

### Mobile Verification

```javascript
// GET /api/user/verification-status
app.get('/api/user/verification-status', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const user = await db.users.findUnique({ where: { id: userId } });
  
  res.json({
    isVerified: user.is_verified || false,
    mobileNumber: user.mobile_number || null,
    verifiedAt: user.verified_at || null
  });
});

// POST /api/user/send-otp
app.post('/api/user/send-otp', rateLimit({ windowMs: 15 * 60 * 1000, max: 3 }), async (req, res) => {
  const { mobile_number } = req.body;
  const userId = req.user.id;
  
  // Generate and send OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP in database
  await db.otpCodes.create({
    data: {
      user_id: userId,
      mobile_number,
      code: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    }
  });
  
  // Send SMS (Twilio, AWS SNS, etc.)
  // await sendSMS(mobile_number, `Your BlkPages code: ${otp}`);
  
  res.json({ message: 'OTP sent successfully' });
});

// POST /api/user/verify-otp
app.post('/api/user/verify-otp', async (req, res) => {
  const { otp, mobile_number } = req.body;
  const userId = req.user.id;
  
  // Verify OTP logic here...
  
  // Update user verification status
  await db.users.update({
    where: { id: userId },
    data: { 
      is_verified: true,
      mobile_number,
      verified_at: new Date()
    }
  });
  
  res.json({ message: 'Mobile number verified successfully' });
});
```

### BlkPoints Redemption

```javascript
// POST /api/loyalty/redeem
app.post('/api/loyalty/redeem', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { selectedPoints } = req.body;
  
  // Validate redemption
  const validation = await validateBlkPointsRedemption(userId, selectedPoints, db);
  
  if (!validation.success) {
    return res.status(400).json(validation);
  }
  
  // Process redemption
  await db.blkpoints_ledger.create({
    data: {
      user_id: userId,
      points_change: -selectedPoints,
      type: 'redeem',
      status: 'pending',
      notes: 'BlkPoints redemption applied at checkout'
    }
  });
  
  res.json({
    success: true,
    message: `£${(selectedPoints * 0.01).toFixed(2)} BlkPoints discount applied.`
  });
});
```

### Booking Completion

```javascript
// POST /api/bookings/complete
app.post('/api/bookings/complete', authenticateToken, async (req, res) => {
  const { bookingId, netAmount } = req.body;
  const userId = req.user.id;
  
  // Mark booking as completed
  await db.bookings.update({
    where: { id: bookingId },
    data: { status: 'completed' }
  });
  
  // Award BlkPoints (pending for 24 hours)
  await earnBlkPoints(userId, bookingId, netAmount, db);
  
  res.json({ 
    success: true, 
    message: 'Booking completed and BlkPoints awarded' 
  });
});
```

### User Status

```javascript
// GET /api/loyalty/status
app.get('/api/loyalty/status', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const status = await getUserBlkPointsStatus(userId, db);
  res.json(status);
});
```

## ⚙️ Background Jobs

### Set Up Cron Jobs

```javascript
const cron = require('node-cron');

// Process pending points every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Processing pending BlkPoints...');
  await processPendingPoints(db);
  await processPendingReferrals(db);
});

// Clean up expired OTPs every hour
cron.schedule('0 * * * *', async () => {
  await db.otpCodes.deleteMany({
    where: { expires_at: { lt: new Date() } }
  });
});
```

## 🎨 Frontend Integration

### Update Your Loyalty Page

Replace your existing loyalty page with the updated `loyalty-page.html` that includes:

- ✅ Mobile verification status display
- ✅ Redemption cap progress bar
- ✅ OTP verification modal
- ✅ Real-time validation feedback

### JavaScript Integration

```javascript
// Load user status on page load
async function loadUserStatus() {
  try {
    const response = await fetch('/api/loyalty/status', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    
    const status = await response.json();
    
    // Update UI with status
    updateVerificationUI(status);
    updateRedemptionCapUI(status);
  } catch (error) {
    console.error('Error loading user status:', error);
  }
}

// Call on page load
document.addEventListener('DOMContentLoaded', loadUserStatus);
```

## 🔒 Security Features

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// OTP rate limiting
const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per window
  message: 'Too many OTP requests. Please wait 15 minutes.'
});

// Apply to OTP endpoints
app.post('/api/user/send-otp', otpRateLimit, sendOTP);
app.post('/api/user/verify-otp', otpRateLimit, verifyOTP);
```

### Validation

```javascript
// Mobile number validation
function validateMobileNumber(mobile) {
  const mobileRegex = /^(\+44|0)[0-9]{10}$/;
  return mobileRegex.test(mobile.replace(/\s/g, ''));
}

// OTP validation
function validateOTP(otp) {
  return /^[0-9]{6}$/.test(otp);
}
```

## 📊 Monitoring & Analytics

### Admin Dashboard Queries

```sql
-- Users approaching redemption limit
SELECT * FROM redemption_cap_monitoring 
WHERE usage_percentage >= 80 
ORDER BY usage_percentage DESC;

-- High verification attempt rates
SELECT id, email, mobile_number, verification_attempts 
FROM users 
WHERE verification_attempts >= 3 
ORDER BY verification_attempts DESC;

-- Pending transactions older than 24 hours
SELECT * FROM blkpoints_ledger 
WHERE status = 'pending' 
AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

### Error Monitoring

```javascript
// Log all BlkPoints transactions
function logTransaction(userId, type, points, notes) {
  console.log(`BlkPoints ${type}: ${points} points for user ${userId} - ${notes}`);
}

// Monitor failed verifications
function logFailedVerification(userId, reason) {
  console.warn(`Verification failed for user ${userId}: ${reason}`);
}
```

## 🧪 Testing

### Unit Tests

```javascript
// Test redemption validation
describe('BlkPoints Redemption', () => {
  test('should block unverified users', async () => {
    const result = await validateBlkPointsRedemption('unverified-user', 1000, mockDb);
    expect(result.success).toBe(false);
    expect(result.code).toBe('MOBILE_NOT_VERIFIED');
  });
  
  test('should enforce redemption cap', async () => {
    const result = await validateBlkPointsRedemption('verified-user', 6000, mockDb);
    expect(result.success).toBe(false);
    expect(result.code).toBe('REDEMPTION_CAP_REACHED');
  });
});
```

### Integration Tests

```javascript
// Test complete redemption flow
describe('Redemption Flow', () => {
  test('should process valid redemption', async () => {
    // 1. Verify user
    await verifyUser('test-user');
    
    // 2. Attempt redemption
    const response = await request(app)
      .post('/api/loyalty/redeem')
      .send({ selectedPoints: 1000 })
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

## 🚀 Deployment Checklist

- [ ] Database schema applied
- [ ] Environment variables configured
- [ ] SMS provider configured (Twilio/AWS SNS)
- [ ] Rate limiting configured
- [ ] Cron jobs scheduled
- [ ] Frontend updated with new UI
- [ ] Error monitoring set up
- [ ] Admin dashboard queries ready
- [ ] Tests passing

## 📞 Support

### Common Issues

1. **OTP not sending**: Check SMS provider configuration
2. **Redemption blocked**: Verify mobile number and check cap status
3. **Points not confirming**: Check cron job is running
4. **Database errors**: Verify schema is correctly applied

### Debugging

```javascript
// Enable debug logging
process.env.DEBUG = 'blkpoints:*';

// Check user status
const status = await getUserBlkPointsStatus(userId, db);
console.log('User status:', status);
```

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: January 2025
