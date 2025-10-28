# BlkPages Complete Reward System: Referrals & Verified Reviews

## Overview

This implementation extends the BlkPages automatic booking completion system with comprehensive referral tracking and verified review rewards. The system provides a fully automated, verified, and timed reward release system for bookings, referrals, and reviews—ensuring trust and preventing misuse.

## ✅ Complete Reward System

### **Reward Triggers & Timing**

| Trigger | Condition | Delay | Points | Recipient |
|---------|-----------|-------|--------|-----------|
| Booking completion | Auto after end_time, no refund | +24h | 1 pt/£ | Customer |
| Referral reward | Referred user completes booking | +24h | +100 pts | Referrer |
| Verified review | Verified by BlkPages staff | +24h | +25 pts | Reviewer |
| Refund | Any refund after completion | Instant | −earned | Customer |
| Local loyalty | Booking completed | +24h | +1 stamp | Customer (per business) |

## 🧩 Referral System

### **Dynamic Referral Flow**

1. **Generate Referral Link**: Each user gets a unique referral code
2. **Capture Referrals**: New users sign up via referral link
3. **Track Completion**: Referrer gets +100 BlkPoints when referee completes first booking
4. **24-Hour Delay**: Points released 24 hours after booking completion

### **Database Schema**
```sql
-- Add referral_code to users table
ALTER TABLE users ADD COLUMN referral_code text UNIQUE;

-- Create referrals table
CREATE TABLE referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES users(id),
  referee_email text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT NOW(),
  completed_at timestamptz
);
```

### **API Endpoints**

#### Get Referral Code
```javascript
GET /api/referral/code?userId=123
// Returns: { referralCode, referralUrl, message }
```

#### Create Referral (During Registration)
```javascript
POST /api/referral/create
{
  "referralCode": "abc123",
  "refereeEmail": "newuser@example.com"
}
```

#### Get Referral Statistics
```javascript
GET /api/referral/stats?userId=123
// Returns: { totalReferrals, completedReferrals, pendingReferrals, totalEarnings }
```

### **Frontend Integration**

#### Referral Link Display
```html
<p>Invite friends and earn +100 BlkPoints when they complete their first booking.</p>
<code id="referralUrl">blkpages.com/referral/abc123</code>
<button onclick="copyReferral()">Copy Link</button>
```

#### Registration with Referral
```javascript
// URL: https://blkpages.com/register?ref=abc123
const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get('ref');

if (referralCode) {
  // Call API to create referral during signup
  await fetch('/api/referral/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referralCode, refereeEmail: userEmail })
  });
}
```

## ⭐ Verified Review System

### **Review Verification Flow**

1. **Submit Review**: User submits review (unverified initially)
2. **Staff Verification**: BlkPages admin marks review as verified
3. **24-Hour Delay**: Points released 24 hours after verification
4. **Reward**: Reviewer gets +25 BlkPoints

### **Database Schema**
```sql
CREATE TABLE reviews (
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
```

### **API Endpoints**

#### Submit Review
```javascript
POST /api/reviews/submit
{
  "bookingId": 123,
  "userId": 456,
  "rating": 5,
  "text": "Great service!"
}
```

#### Verify Review (Admin)
```javascript
POST /api/reviews/:id/verify
// Returns: { success: true, message: "Points will be released in 24 hours" }
```

#### Get Review Statistics
```javascript
GET /api/reviews/stats?userId=123
// Returns: { totalReviews, verifiedReviews, rewardedReviews, averageRating, totalEarnings }
```

#### Get User Reviews
```javascript
GET /api/reviews/user?userId=123
// Returns: { reviews: [{ id, rating, text, verified, points_released, service, date, time }] }
```

## 🕐 Enhanced Cron Job Schedule

| Job | Schedule | Description |
|-----|----------|-------------|
| Auto-complete | Every hour at :00 | Marks confirmed bookings as completed |
| Points Release | Every hour at :15 | Releases BlkPoints + referral bonuses |
| Review Points | Every hour at :30 | Releases verified review points |
| Cleanup | Daily at 2:00 AM | Removes old notifications |
| Health Check | Every 6 hours | Monitors system health |

## 📱 Socket.IO Events

### **New Events Added**

#### Referral Bonus Notification
```javascript
socket.on('loyalty_points_updated', (data) => {
  if (data.reason === 'Referral completed booking') {
    // Show referral bonus notification
    showNotification(`+${data.added} BlkPoints from referral!`);
  }
});
```

#### Review Verification Notification
```javascript
socket.on('review_verified', (data) => {
  // Show review verification notification
  showNotification(`Your ${data.rating}-star review was verified! +${data.pointsEarned} BlkPoints in 24 hours.`);
});
```

## 🎯 Complete Reward Functions

### **Referral Functions**
- `ensureReferralCode(userId)` - Generate/retrieve referral code
- `createReferral(referralCode, refereeEmail)` - Create referral relationship
- `checkReferralCompletion(refereeEmail)` - Award referral bonus
- `getReferralStats(userId)` - Get referral statistics

### **Review Functions**
- `submitReview(bookingId, userId, rating, text)` - Submit review
- `verifyReview(reviewId)` - Verify review (admin)
- `releaseVerifiedReviewPoints()` - Release points after 24h
- `getReviewStats(userId)` - Get review statistics

## 🚀 Installation & Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Run Database Migrations**
   ```bash
   # Run both migrations
   psql -d your_database -f migration_add_booking_fields.sql
   psql -d your_database -f migration_add_referrals_reviews.sql
   ```

3. **Environment Variables**
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/blkpages_db
   STRIPE_SECRET_KEY=sk_test_your_key_here
   FRONTEND_URL=https://blkpages.com
   PORT=3001
   ```

4. **Start Server**
   ```bash
   npm start
   ```

## 🧪 Testing the Complete System

### **Test Referral Flow**
1. User A gets referral code: `GET /api/referral/code?userId=1`
2. User B signs up with referral: `POST /api/referral/create`
3. User B completes first booking
4. Wait 24+ hours for referral bonus
5. Check User A's points increased by 100

### **Test Review Flow**
1. User submits review: `POST /api/reviews/submit`
2. Admin verifies review: `POST /api/reviews/:id/verify`
3. Wait 24+ hours for points release
4. Check user's points increased by 25

### **Test Complete Booking Flow**
1. Create booking with `endTime` in past
2. Wait for auto-completion (hourly)
3. Wait 24+ hours for points release
4. Check all rewards: booking points + referral bonus + review points

## 🔒 Security Features

- **Referral Validation**: Prevents duplicate referrals and invalid codes
- **Review Verification**: Staff verification prevents fake reviews
- **24-Hour Delays**: Prevents instant abuse and ensures quality
- **Transaction Safety**: All database operations use transactions
- **Comprehensive Logging**: Full audit trail for all reward activities

## 📊 Frontend Dashboard Integration

### **Referral Section**
```javascript
// Display referral stats
const stats = await fetch('/api/referral/stats?userId=123').then(r => r.json());
document.getElementById('referralCount').textContent = stats.completedReferrals;
document.getElementById('referralEarnings').textContent = stats.totalEarnings;
```

### **Review Section**
```javascript
// Display review stats
const stats = await fetch('/api/reviews/stats?userId=123').then(r => r.json());
document.getElementById('reviewCount').textContent = stats.totalReviews;
document.getElementById('verifiedCount').textContent = stats.verifiedReviews;
document.getElementById('reviewEarnings').textContent = stats.totalEarnings;
```

## 🎁 Complete Reward Summary

The system now provides:

✅ **Automatic Booking Completion** - No manual confirmations needed
✅ **Referral Tracking** - Dynamic referral links with 24h bonus delay
✅ **Verified Reviews** - Staff verification with 24h reward delay
✅ **Real-time Notifications** - Socket.IO updates for all events
✅ **Comprehensive Statistics** - Detailed tracking for all reward types
✅ **Dispute Protection** - 24-hour windows for all reward types
✅ **Health Monitoring** - System health checks and error handling

This creates a fully automated, trusted, and comprehensive reward system that encourages genuine engagement while preventing abuse through verification and timing delays.

---

**Note**: All existing modals, redirect logic, and reward functions are preserved. The system seamlessly integrates with your current BlkPages infrastructure while adding powerful new referral and review reward capabilities.
