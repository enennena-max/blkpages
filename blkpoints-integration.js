/**
 * BlkPages BlkPoints Integration
 * Complete earning, redemption, and referral logic with mobile verification + 30-day cap
 * 
 * Combines:
 * ✅ Mobile number verification check
 * ✅ £50 redemption cap per rolling 30 days
 * ✅ 24-hour pending period for all earnings
 * ✅ Referral bonus system
 * ✅ Clear error + UI feedback logic
 */

const REDEMPTION_CAP_POINTS = 5000; // £50
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const POINT_RATE = 1; // 1 point per £1 spent
const POINT_VALUE = 0.01; // 1 point = £0.01
const MIN_REDEEM_VALUE = 5; // £5 minimum redemption
const MIN_REDEEM_POINTS = MIN_REDEEM_VALUE / POINT_VALUE; // 500 points
const CONFIRM_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours
const REFERRAL_BONUS_POINTS = 100;

// ===============================================
// 🔒 BlkPoints Redemption Validation Logic
// ===============================================

/**
 * validateBlkPointsRedemption()
 * Checks:
 *  - user has verified mobile number
 *  - within 30-day redemption cap (£50)
 *  - enough balance for redemption
 */
async function validateBlkPointsRedemption(userId, selectedPoints, db) {
  // Fetch user profile
  const user = await db.users.findUnique({ where: { id: userId } });

  // 1️⃣ MOBILE VERIFICATION CHECK
  if (!user.mobile_number || !user.is_verified) {
    return {
      success: false,
      message: "Please verify your mobile number before redeeming BlkPoints.",
      code: "MOBILE_NOT_VERIFIED"
    };
  }

  // 2️⃣ CHECK AVAILABLE BALANCE
  if (user.blkpoints_balance < selectedPoints) {
    return {
      success: false,
      message: "You do not have enough BlkPoints to redeem this amount.",
      code: "INSUFFICIENT_BALANCE"
    };
  }

  // 3️⃣ CHECK 30-DAY REDEMPTION CAP
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

  const redemptionResult = await db.$queryRaw`
    SELECT COALESCE(ABS(SUM(points_change)), 0) AS total
    FROM blkpoints_ledger
    WHERE user_id = ${userId}
      AND type = 'redeem'
      AND created_at >= ${thirtyDaysAgo};
  `;

  const alreadyRedeemed = redemptionResult[0]?.total || 0;
  const newTotal = alreadyRedeemed + selectedPoints;

  if (newTotal > REDEMPTION_CAP_POINTS) {
    const remaining = REDEMPTION_CAP_POINTS - alreadyRedeemed;
    const remainingValue = (remaining * POINT_VALUE).toFixed(2);

    return {
      success: false,
      message: `You've reached your £50 BlkPoints limit for this 30-day period. You can redeem up to £${remainingValue} more this month.`,
      code: "REDEMPTION_CAP_REACHED"
    };
  }

  // ✅ Passed all checks
  return {
    success: true,
    message: "BlkPoints redemption validated successfully.",
    code: "OK"
  };
}

// ===============================================
// 💰 BlkPoints Earning Logic
// ===============================================

/**
 * earnBlkPoints()
 * Called when a booking is marked as COMPLETED.
 * Creates pending BlkPoints based on net booking amount (after discounts).
 */
async function earnBlkPoints(userId, bookingId, netAmountGBP, db) {
  // 1️⃣ Calculate earned points
  const earnedPoints = Math.floor(netAmountGBP * POINT_RATE);

  // 2️⃣ Check if already awarded for this booking
  const existing = await db.blkpoints_ledger.findFirst({
    where: { booking_id: bookingId, type: 'earn' }
  });
  if (existing) return; // Already awarded

  // 3️⃣ Create pending ledger entry
  await db.blkpoints_ledger.create({
    data: {
      user_id: userId,
      booking_id: bookingId,
      points_change: earnedPoints,
      type: 'earn',
      status: 'pending',
      notes: `Pending points from completed booking #${bookingId}`,
      created_at: new Date()
    }
  });

  console.log(`✅ Added ${earnedPoints} pending BlkPoints for user ${userId}`);

  // 4️⃣ Handle referral bonus if applicable
  await handleReferralPoints(userId, bookingId, db);
}

// ===============================================
// 🎁 Referral Bonus Logic
// ===============================================

/**
 * handleReferralPoints()
 * Called when a referred user's booking is marked completed.
 * Creates pending referral bonus for the referrer.
 */
async function handleReferralPoints(refereeId, bookingId, db) {
  const referee = await db.users.findUnique({ where: { id: refereeId } });

  if (!referee.referred_by) return; // no referrer

  // Check if referrer already earned from this referee
  const alreadyGiven = await db.blkpoints_ledger.findFirst({
    where: {
      user_id: referee.referred_by,
      type: 'referral',
      notes: { contains: `referee:${refereeId}` }
    }
  });
  if (alreadyGiven) return; // prevent duplicates

  // Create pending ledger entry for referrer
  await db.blkpoints_ledger.create({
    data: {
      user_id: referee.referred_by,
      booking_id: bookingId,
      points_change: REFERRAL_BONUS_POINTS,
      type: 'referral',
      status: 'pending',
      notes: `Referral bonus pending — referee:${refereeId} booking:${bookingId}`,
      created_at: new Date()
    }
  });
  console.log(`Pending referral bonus created for referrer ${referee.referred_by}`);
}

// ===============================================
// ⚙️ Background Job: Confirm or Release Points
// ===============================================

/**
 * processPendingPoints()
 * Run once or twice daily to confirm pending earnings and handle cancellations.
 */
async function processPendingPoints(db) {
  const now = new Date();
  const cutoff = new Date(now - CONFIRM_DELAY_MS);

  // Fetch all pending earn transactions older than 24h
  const pendingEarnings = await db.blkpoints_ledger.findMany({
    where: {
      type: 'earn',
      status: 'pending',
      created_at: { lte: cutoff }
    }
  });

  for (const tx of pendingEarnings) {
    const booking = await db.bookings.findUnique({ where: { id: tx.booking_id } });

    if (booking && booking.status === 'completed') {
      // ✅ Confirm points
      await db.users.update({
        where: { id: tx.user_id },
        data: { blkpoints_balance: { increment: tx.points_change } }
      });

      await db.blkpoints_ledger.update({
        where: { id: tx.id },
        data: { status: 'confirmed', notes: 'Points confirmed after 24 h' }
      });

      console.log(`Confirmed ${tx.points_change} pts for booking ${tx.booking_id}`);
    } else if (booking && ['cancelled', 'refunded'].includes(booking.status)) {
      // ❌ Release (cancel) points
      await db.blkpoints_ledger.update({
        where: { id: tx.id },
        data: { status: 'released', notes: 'Booking cancelled/refunded' }
      });

      console.log(`Released ${tx.points_change} pts for cancelled booking ${tx.booking_id}`);
    }
  }
}

/**
 * processPendingReferrals()
 * Nightly job: confirm pending referral bonuses after 24 h
 */
async function processPendingReferrals(db) {
  const cutoff = new Date(Date.now() - CONFIRM_DELAY_MS);
  const pendingReferrals = await db.blkpoints_ledger.findMany({
    where: { type: 'referral', status: 'pending', created_at: { lte: cutoff } }
  });

  for (const tx of pendingReferrals) {
    const booking = await db.bookings.findUnique({ where: { id: tx.booking_id } });
    if (booking && booking.status === 'completed') {
      // Confirm referral bonus
      await db.users.update({
        where: { id: tx.user_id },
        data: { blkpoints_balance: { increment: tx.points_change } }
      });
      await db.blkpoints_ledger.update({
        where: { id: tx.id },
        data: { status: 'confirmed', notes: 'Referral confirmed after 24 h' }
      });
      console.log(`Confirmed referral for referrer ${tx.user_id}`);
    } else {
      // Release (no award)
      await db.blkpoints_ledger.update({
        where: { id: tx.id },
        data: { status: 'released', notes: 'Referral cancelled/refunded' }
      });
      console.log(`Referral bonus released for booking ${tx.booking_id}`);
    }
  }
}

// ===============================================
// 🎯 Bonus Points Logic
// ===============================================

/**
 * addBonusPoints()
 * For reviews, social shares, etc. - immediate confirmation
 */
async function addBonusPoints(userId, points, reason, db) {
  await db.blkpoints_ledger.create({
    data: {
      user_id: userId,
      points_change: points,
      type: 'bonus',
      status: 'confirmed',
      notes: reason,
      created_at: new Date()
    }
  });

  await db.users.update({
    where: { id: userId },
    data: { blkpoints_balance: { increment: points } }
  });

  console.log(`Added ${points} bonus points for user ${userId}: ${reason}`);
}

// ===============================================
// 🔄 Express.js API Integration
// ===============================================

/**
 * Example Express routes using the above functions
 */

// Redemption endpoint
async function redeemBlkPoints(req, res) {
  const userId = req.user.id;
  const { selectedPoints } = req.body;

  const validation = await validateBlkPointsRedemption(userId, selectedPoints, db);

  if (!validation.success) {
    return res.status(400).json(validation);
  }

  // Continue with redemption flow
  await db.blkpoints_ledger.create({
    data: {
      user_id: userId,
      points_change: -selectedPoints,
      type: 'redeem',
      status: 'pending',
      created_at: new Date(),
      notes: 'BlkPoints redemption applied at checkout'
    }
  });

  res.json({
    success: true,
    message: `£${(selectedPoints * POINT_VALUE).toFixed(2)} BlkPoints discount applied.`,
  });
}

// Booking completion endpoint
async function completeBooking(req, res) {
  const { bookingId, netAmount } = req.body;
  const userId = req.user.id;

  // Mark booking as completed
  await db.bookings.update({
    where: { id: bookingId },
    data: { status: 'completed' }
  });

  // Award pending BlkPoints
  await earnBlkPoints(userId, bookingId, netAmount, db);

  res.json({ success: true, message: 'Booking completed and BlkPoints awarded' });
}

// ===============================================
// 📊 Utility Functions
// ===============================================

/**
 * getUserBlkPointsStatus()
 * Get comprehensive BlkPoints status for UI display
 */
async function getUserBlkPointsStatus(userId, db) {
  const user = await db.users.findUnique({ where: { id: userId } });
  
  // Get redemption cap status
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);
  const redemptionResult = await db.$queryRaw`
    SELECT COALESCE(ABS(SUM(points_change)), 0) AS total
    FROM blkpoints_ledger
    WHERE user_id = ${userId}
      AND type = 'redeem'
      AND created_at >= ${thirtyDaysAgo};
  `;

  const usedAmount = redemptionResult[0]?.total || 0;
  const remainingAmount = REDEMPTION_CAP_POINTS - usedAmount;

  return {
    balance: user.blkpoints_balance || 0,
    isVerified: user.is_verified || false,
    mobileNumber: user.mobile_number,
    redemptionCap: {
      max: REDEMPTION_CAP_POINTS,
      used: usedAmount,
      remaining: remainingAmount,
      percentage: (usedAmount / REDEMPTION_CAP_POINTS) * 100
    }
  };
}

// ===============================================
// 📧 Email Sending Logic (Transactional vs Marketing)
// ===============================================

/**
 * sendLoyaltyEmail()
 * Only sends marketing emails to opted-in users; transactional always sent
 * Now uses Handlebars templates for consistent rendering
 */
async function sendLoyaltyEmail(userId, subject, bodyTemplateName, data = {}, type = 'transactional', emailService, db) {
  const user = await db.users.findUnique({ where: { id: userId } });
  if (!user || !user.email) return;

  if (type === 'marketing' && !user.marketing_opt_in) {
    console.log(`❌  ${user.email} opted out of marketing – email skipped`);
    return;
  }

  // Use the new email service with Handlebars templates
  const { sendLoyaltyEmail: sendTemplateEmail } = require('./email-service');
  await sendTemplateEmail(user, subject, bodyTemplateName, data, emailService);
}

// ===============================================
// 🚀 Cron Job Setup
// ===============================================

/**
 * Set up cron jobs for processing pending points
 * Run every 6 hours to ensure timely processing
 */

// Using node-cron
const cron = require('node-cron');

// Process pending points every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Processing pending BlkPoints...');
  await processPendingPoints(db);
  await processPendingReferrals(db);
});

module.exports = {
  validateBlkPointsRedemption,
  earnBlkPoints,
  handleReferralPoints,
  processPendingPoints,
  processPendingReferrals,
  addBonusPoints,
  redeemBlkPoints,
  completeBooking,
  getUserBlkPointsStatus,
  sendLoyaltyEmail,
  // Constants for frontend use
  POINT_VALUE,
  POINT_RATE,
  MIN_REDEEM_POINTS,
  MIN_REDEEM_VALUE,
  REDEMPTION_CAP_POINTS,
  REFERRAL_BONUS_POINTS
};
