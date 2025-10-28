# BlkPages Automatic Booking Completion & BlkPoints Release System

## Overview

This implementation provides a fully automatic, two-stage booking completion and rewards system for BlkPages. The system automatically handles booking completion and BlkPoints release without manual intervention, while maintaining a 24-hour dispute window for businesses.

## Features

### ✅ Two-Stage Automation System
- **Stage 1**: Automatically marks bookings as completed when their scheduled end time has passed
- **Stage 2**: Releases BlkPoints 24 hours after completion (if no dispute/refund raised)

### ✅ Real-time Notifications
- Socket.IO integration for live updates
- Customer notifications for booking completion
- BlkPoints earned notifications
- Referral bonus notifications
- Business loyalty reward unlock notifications

### ✅ Comprehensive Reward System
- BlkPoints: 1 point per £1 spent
- Referral bonus: +100 points for first completed booking
- Business loyalty: Punch card system with stamps
- Automatic reward unlocking

### ✅ Dispute Protection
- 24-hour window for businesses to raise disputes
- Points only released after dispute window expires
- Automatic flagging of disputed bookings

## Database Schema Updates

The `bookings` table has been enhanced with the following fields:

```sql
-- New fields added to bookings table
total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
start_time TIMESTAMP,
end_time TIMESTAMP,
customer_email VARCHAR(255),
completed_at TIMESTAMP,
points_released BOOLEAN DEFAULT false,
cancelled_at TIMESTAMP,
refunded_at TIMESTAMP,
disputed BOOLEAN DEFAULT false,
```

## File Structure

```
backend/
├── db.js                 # Database connection module
├── rewards.js            # Rewards and loyalty functions
├── cronJobs.js           # Automated cron job system
├── server.js             # Main server with Socket.IO integration
├── schema.sql            # Updated database schema
└── package.json          # Updated with node-cron dependency
```

## Cron Job Schedule

| Job | Schedule | Description |
|-----|----------|-------------|
| Auto-complete | Every hour at :00 | Marks confirmed bookings as completed when end_time has passed |
| Points Release | Every hour at :15 | Releases BlkPoints 24 hours after completion |
| Cleanup | Daily at 2:00 AM | Removes old notifications (30+ days) |
| Health Check | Every 6 hours | Monitors system health and flags stuck bookings |

## API Integration

### Updated Booking Creation

The booking creation API now accepts additional fields:

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

### Socket.IO Events

#### Client → Server
- `register` - Register customer for updates: `{ customerId: "123" }`

#### Server → Client
- `booking_status_changed` - Booking status updated
- `loyalty_points_updated` - BlkPoints earned/updated
- `business_loyalty_reward_unlocked` - Business loyalty reward unlocked
- `new_notification` - New notification received

## Reward Functions

### `addPoints(customerId, points, reason)`
Adds BlkPoints to customer account with transaction logging.

### `deductPoints(customerId, points, reason)`
Deducts BlkPoints from customer account (with balance validation).

### `checkReferralCompletion(customerEmail)`
Checks if customer qualifies for referral bonus (+100 points).

### `updateBusinessLoyalty(customerId, businessId)`
Updates business-specific punch card progress.

## Installation & Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Update Database Schema**
   ```bash
   # Run the updated schema.sql to add new fields
   psql -d your_database -f schema.sql
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
3. Sends real-time notification to customer
4. Creates notification record in database

### Stage 2: Points Release (Hourly +15min)
1. System checks for completed bookings where:
   - `completed_at < NOW() - INTERVAL '24 hours'`
   - `points_released = false`
   - `refunded_at IS NULL`
   - `disputed = false`
2. Awards BlkPoints (1 per £1 spent)
3. Checks for referral bonus eligibility
4. Updates business loyalty progress
5. Flags booking as `points_released = true`
6. Sends real-time notifications for all rewards

### Dispute Protection
- Businesses have 24 hours after completion to raise disputes
- Points are only released after the dispute window expires
- Disputed bookings are excluded from automatic points release

## Monitoring & Health Checks

The system includes comprehensive monitoring:

- **Health Check**: Runs every 6 hours to verify database connectivity
- **Stuck Booking Detection**: Flags bookings that should have had points released after 48 hours
- **Error Logging**: Comprehensive error handling with notification creation
- **Transaction Safety**: All database operations use transactions for consistency

## Testing

To test the system:

1. Create a booking with `end_time` in the past
2. Wait for the next hourly cron job to auto-complete it
3. Wait 24+ hours for points to be released
4. Check customer's BlkPoints balance and notifications

## Security Features

- Database transactions ensure data consistency
- Comprehensive error handling prevents data corruption
- Dispute window protects business interests
- Real-time notifications keep customers informed
- Health monitoring ensures system reliability

## Future Enhancements

- Email notifications for reward unlocks
- SMS notifications for critical events
- Admin dashboard for monitoring cron job performance
- Configurable dispute window duration
- Advanced fraud detection for points abuse

---

**Note**: This system is designed to be fully automatic and fair, providing customers with immediate feedback while protecting business interests through the dispute window.
