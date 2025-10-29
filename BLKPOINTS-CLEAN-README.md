# BlkPoints Clean Implementation

This directory contains a clean, production-ready BlkPoints implementation following best practices for idempotency, auditability, and consistency.

## 📁 File Structure

```
blkpoints-constants.js      # Centralized constants (1 point = £0.01, etc.)
blkpoints-service.js        # Core service functions (earn, redeem, balance)
blkpoints-validation.js      # Frontend validation helper (for checkout pages)
blkpoints-routes.js         # Express routes (optional - can use inline routes)
loyalty-system-setup.js     # Main app setup (updated to use new service)
checkout-blkpoints-example.html  # Example checkout component
```

## 🎯 Key Features

### ✅ Idempotency
- All transactions use idempotency keys to prevent duplicates
- Safe to retry failed requests
- Example: `redeem-{userId}-{timestamp}`

### ✅ Consistent Calculations
- **1 BlkPoint = £0.01** (1p)
- **Minimum redemption = 500 points (£5.00)**
- **1 point per £1 spent** on completed bookings
- **100 points** referral bonus
- **25 points** verified review bonus

### ✅ Validation
- Mobile number verification required for redemption
- Balance checks before redemption
- 30-day rolling redemption cap (£50 max)
- **Minimum order value: Booking must be ≥ 2× redemption amount** (e.g., £5 redemption requires £10 booking)
- **Maximum redemption: Up to 50% of booking total** (e.g., £20 booking allows max £10 redemption)
- Automatic fraud prevention (duplicate detection)

### ✅ Audit Trail
- Immutable ledger for all transactions
- JSONB metadata stores booking_id, review_id, etc.
- Balance table for fast reads

## 🔧 Usage

### Get Balance & Status

```javascript
const status = await blkpointsService.getBlkPointsStatus(userId, db);
// Returns:
// {
//   points: 240,
//   gbpValue: 2.40,
//   minRedeemGBP: 5.00,
//   minRedeemPoints: 500,
//   canRedeem: false,
//   isVerified: true,
//   redemptionCap: { max: 5000, redeemed: 0, remaining: 5000, percentage: 0 }
// }
```

### Earn Points (Booking Completed)

```javascript
const idem = `booking-${bookingId}-${userId}`;
const points = await blkpointsService.earnOnCompletedBooking(
  { userId, amountGBP: 48.00, bookingId, idem },
  db
);
// Returns: 48 (points earned)
```

### Redeem Points

```javascript
const idem = `redeem-${userId}-${Date.now()}`;
const bookingAmountGBP = 15.00; // Current booking total
const valueGBP = await blkpointsService.redeemPoints(
  { userId, points: 500, idem, bookingAmountGBP },
  db
);
// Returns: 5.00 (GBP value to apply as credit)
// Throws error if: insufficient balance, not verified, cap exceeded, or booking < £10
```

**Redemption Rules:**
- **Minimum order value:** To redeem £5, booking must be ≥ £10 (2× redemption)
- **Maximum redemption:** Up to 50% of booking total (e.g., £20 booking = max £10 redemption)
- If `bookingAmountGBP` is not provided, validation is skipped (optional)

### Referral Bonus

```javascript
const idem = `referral-${refereeId}-${bookingId}`;
await blkpointsService.earnOnReferralCompleted(
  { userId: referrerId, referredUserId: refereeId, bookingId, idem },
  db
);
```

## 🗄️ Database Schema (PostgreSQL)

```sql
-- Fast balance reads
CREATE TABLE IF NOT EXISTS blkpoints_balance (
  user_id UUID PRIMARY KEY,
  points INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable audit ledger
CREATE TYPE blkpoints_reason AS ENUM (
  'BOOKING_COMPLETED',
  'REVIEW_VERIFIED',
  'REFERRAL_COMPLETED',
  'REDEEM',
  'ADJUSTMENT',
  'REVERSAL'
);

CREATE TABLE IF NOT EXISTS blkpoints_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  delta_points INTEGER NOT NULL,  -- negatives allowed (redeem/reversal)
  reason blkpoints_reason NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}',  -- booking_id, idempotency_key, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate transactions
CREATE UNIQUE INDEX IF NOT EXISTS idx_blkpoints_ledger_idem
  ON blkpoints_ledger ((meta->>'idempotency_key'));
```

## 🔄 Migration from Old Code

The new service is **backward compatible** with the existing mock database structure. The main changes:

1. **Constants**: Now centralized in `blkpoints-constants.js`
2. **Service Layer**: Clean separation of business logic
3. **Idempotency**: All transactions are idempotent
4. **Error Handling**: Consistent error messages

## 📊 API Endpoints

### GET `/api/loyalty/status`
Returns user's BlkPoints balance and status.

**Response:**
```json
{
  "balance": 240,
  "points": 240,
  "gbpValue": 2.40,
  "minRedeemGBP": 5.00,
  "minRedeemPoints": 500,
  "canRedeem": false,
  "isVerified": true,
  "redemptionCap": {
    "max": 5000,
    "redeemed": 0,
    "remaining": 5000,
    "percentage": 0
  }
}
```

### POST `/api/loyalty/redeem`
Redeem points for GBP credit.

**Request:**
```json
{
  "selectedPoints": 500,
  "bookingAmountGBP": 15.00
}
```

**Validation Rules:**
1. Minimum redemption: 500 points (£5.00)
2. Sufficient balance
3. **Minimum order value: booking ≥ 2× redemption** (e.g., £10 for £5 redemption)
4. Mobile verification required
5. 30-day rolling cap: £50 max

**Response:**
```json
{
  "success": true,
  "redeemedPoints": 500,
  "valueGBP": 5.00,
  "message": "£5.00 BlkPoints discount applied."
}
```

## 🧪 Testing

The service works with both:
- **Mock DB** (Map-based, in-memory) - for development/testing
- **PostgreSQL** - production (uncomment the PostgreSQL code in service)

## 📝 Notes

- All point values are integers (no decimals)
- GBP values are calculated on-the-fly: `points * 0.01`
- Minimum redemption enforced: 500 points (£5.00)
- **Minimum order value: Booking must be at least 2× the redemption amount**
  - Example: To redeem £5, booking must be ≥ £10
  - Example: To redeem £10, booking must be ≥ £20
- Mobile verification required for redemption
- 30-day rolling redemption cap: £50 (5000 points)

## 🎨 Frontend Validation Helper

Use `blkpoints-validation.js` on **checkout/booking pages only** for real-time validation feedback.

```javascript
// Include the script
<script src="/blkpoints-validation.js"></script>

// Use in your checkout component
const error = getBlkPointsError({
  bookingAmountGBP: 20.00,
  pointsToRedeem: 500,
  userPoints: 2400
});

if (error) {
  // Show error message
  console.log(error); // "Your booking total must be at least £10.00 to redeem £5.00."
}
```

**Where to use:**
- ✅ **Checkout/Booking pages** - Real-time validation as user types
- ❌ **Dashboard/Profile pages** - Only viewing balances, no validation needed

See `checkout-blkpoints-example.html` for a complete example with live validation.

## 💡 Example Scenarios

| Points | £ Redeemed | Booking Total | Outcome |
|--------|------------|--------------|---------|
| 500 | £5.00 | £9.50 | ❌ "Booking total must be at least £10 to redeem £5" |
| 500 | £5.00 | £10.00 | ✅ Allowed |
| 1000 | £10.00 | £15.00 | ❌ "Booking total must be at least £20 to redeem £10" |
| 1000 | £10.00 | £20.00 | ✅ Allowed |
| 3000 | £30.00 | £40.00 | ❌ "You can only redeem up to 50% (£20.00 = 2000 points)" |
| 2000 | £20.00 | £40.00 | ✅ Allowed |

