# BlkPages Automatic Booking Completion & BlkPoints Release System

## Overview

This implementation provides a fully automatic, two-stage booking completion and rewards system for BlkPages, updated to work with your existing database schema. The system automatically handles booking completion and BlkPoints release without manual intervention, while maintaining a 24-hour dispute window for businesses.

## ✅ Updated Implementation

### **Database Schema Compatibility**
- Works with existing `users` table (points stored in `points_balance` column)
- Uses `points_activity` table for transaction logging
- Integrates with `referrals` table for referral bonuses
- Uses `loyalty_cards` table for business-specific loyalty
- Adds required fields to existing `bookings` table via migration

### **Frontend Messaging Stages**
The system now includes proper frontend messaging with color-coded stages:

| Stage | Label | Display | Color |
|-------|-------|---------|-------|
| Service passed | "Completed – BlkPoints pending (24 hrs)" | Grey text | Grey |
| After 24 hrs | "Completed – +45 pts added" | Gold/green | Gold/Green |
| Refund issued | "Refunded – Points reversed" | Red | Red |

## Database Migration

Run the migration to add required fields to your existing `bookings` table:

```sql
-- Run migration_add_booking_fields.sql
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS points_released boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS disputed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
```

## File Structure

```
backend/
├── db.js                              # Database connection module
├── rewards.js                         # Updated rewards system (users schema)
├── cronJobs.js                        # Two-stage automation with frontend messaging
├── server.js                          # Updated server with refund processing
├── migration_add_booking_fields.sql    # Database migration
└── package.json                       # Updated with node-cron dependency
```

## Updated API Endpoints

### Booking Creation (Updated)
```javascript
POST /api/bookings
{
  "customerId": 123,
  "businessId": 456,
  "service": "Haircut",
  "date": "2025-01-15",
  "time": "14:00:00",
  "price": 25.00,
  "totalAmount": 25.00,
  "startTime": "2025-01-15T14:00:00Z",
  "endTime": "2025-01-15T15:00:00Z",
  "customerEmail": "customer@example.com",
  "status": "confirmed"
}
```

### Refund Processing (New)
```javascript
POST /api/bookings/:id/refund
{
  "customerId": 123
}
```

### Loyalty API (Updated)
```javascript
GET /api/loyalty?customerId=123
// Returns points from users.points_balance and loyalty_cards stamps
```

## Socket.IO Events with Frontend Messaging

### Client → Server
- `register` - Register customer for updates: `{ customerId: "123" }`

### Server → Client
- `booking_status_changed` - Booking status with frontend messaging stages
- `loyalty_points_updated` - BlkPoints earned/updated
- `business_loyalty_reward_unlocked` - Business loyalty reward unlocked

### Frontend Messaging Payload
```javascript
// Service passed stage
{
  "bookingId": 123,
  "status": "completed",
  "stage": "service_passed",
  "label": "Completed – BlkPoints pending (24 hrs)",
  "message": "Your booking has been automatically completed! Points will be released in 24 hours.",
  "timestamp": "2025-01-15T15:00:00Z",
  "pointsPending": 25
}

// Points released stage
{
  "bookingId": 123,
  "status": "completed",
  "stage": "points_released",
  "label": "Completed – +25 pts added",
  "message": "You earned 25 BlkPoints from your completed booking!",
  "timestamp": "2025-01-16T15:00:00Z",
  "pointsEarned": 25,
  "styling": "gold_green"
}

// Refunded stage
{
  "bookingId": 123,
  "status": "refunded",
  "stage": "refunded",
  "label": "Refunded – Points reversed",
  "message": "Your booking has been refunded. 25 BlkPoints have been reversed.",
  "timestamp": "2025-01-16T16:00:00Z",
  "pointsReversed": 25,
  "styling": "red"
}
```

## Updated Reward Functions

### `addPoints(userId, points, source)`
- Adds BlkPoints to `users.points_balance`
- Logs transaction in `points_activity` table
- Uses your existing schema

### `deductPoints(userId, points, source="Adjustment")`
- Deducts BlkPoints from `users.points_balance`
- Prevents negative balance with `GREATEST()` function
- Logs transaction in `points_activity` table

### `checkReferralCompletion(refereeEmail)`
- Checks `referrals` table for pending referrals
- Awards 100 points to referrer when booking completed
- Updates referral status to 'completed'

### `updateBusinessLoyalty(customerId, businessId)`
- Updates `loyalty_cards` table with new stamp
- Uses `ON CONFLICT` for upsert functionality
- Tracks business-specific loyalty progress

## Cron Job Schedule

| Job | Schedule | Description |
|-----|----------|-------------|
| Auto-complete | Every hour at :00 | Marks confirmed bookings as completed when end_time has passed |
| Points Release | Every hour at :15 | Releases BlkPoints 24 hours after completion |
| Cleanup | Daily at 2:00 AM | Removes old notifications (30+ days) |
| Health Check | Every 6 hours | Monitors system health and flags stuck bookings |

## Installation & Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Run Database Migration**
   ```bash
   # Run the migration to add new fields to bookings table
   psql -d your_database -f migration_add_booking_fields.sql
   ```

3. **Environment Variables**
   Ensure your `.env` file includes:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/blkpages_db
   STRIPE_SECRET_KEY=sk_test_your_key_here
   PORT=3001
   ```

4. **Start Server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## How It Works

### Stage 1: Auto-Complete (Hourly)
1. System checks for confirmed bookings where `end_time < NOW()`
2. Updates status to 'completed' and sets `completed_at`
3. Sends real-time notification with **grey styling**: "Completed – BlkPoints pending (24 hrs)"
4. Creates notification record in database

### Stage 2: Points Release (Hourly +15min)
1. System checks for completed bookings where:
   - `completed_at < NOW() - INTERVAL '24 hours'`
   - `points_released = false`
   - `refunded_at IS NULL`
   - `disputed = false`
2. Awards BlkPoints (1 per £1 spent) to `users.points_balance`
3. Checks for referral bonus eligibility in `referrals` table
4. Updates business loyalty progress in `loyalty_cards` table
5. Flags booking as `points_released = true`
6. Sends real-time notification with **gold/green styling**: "Completed – +X pts added"

### Refund Processing
1. Call `POST /api/bookings/:id/refund` with customerId
2. System reverses points if already released
3. Updates booking with `refunded_at` timestamp
4. Sends real-time notification with **red styling**: "Refunded – Points reversed"

## Frontend Integration

The frontend should listen for `booking_status_changed` events and update the UI based on the `stage` and `styling` properties:

```javascript
socket.on('booking_status_changed', (data) => {
  const bookingElement = document.querySelector(`[data-booking-id="${data.bookingId}"]`);
  
  if (bookingElement) {
    // Update status label
    bookingElement.querySelector('.status-label').textContent = data.label;
    
    // Apply styling based on stage
    bookingElement.className = `booking-card ${data.styling || 'default'}`;
    
    // Show appropriate message
    bookingElement.querySelector('.status-message').textContent = data.message;
  }
});
```

## Testing

To test the system:

1. Create a booking with `endTime` in the past
2. Wait for the next hourly cron job to auto-complete it
3. Check frontend shows grey "Completed – BlkPoints pending (24 hrs)"
4. Wait 24+ hours for points to be released
5. Check frontend shows gold/green "Completed – +X pts added"
6. Test refund processing to see red "Refunded – Points reversed"

## Security Features

- Database transactions ensure data consistency
- Comprehensive error handling prevents data corruption
- Dispute window protects business interests
- Real-time notifications keep customers informed
- Health monitoring ensures system reliability
- Points reversal on refunds prevents abuse

---

**Note**: This system is designed to work seamlessly with your existing database schema while providing the automatic booking completion and BlkPoints release functionality with proper frontend messaging stages.
