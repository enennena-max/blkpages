/**
 * BlkPages BlkPoints Service
 * Core service functions for earning, redeeming, and managing BlkPoints
 * Uses PostgreSQL-compatible queries (adapt as needed for your DB)
 */

const {
  POINT_VALUE_GBP,
  MIN_REDEEM_POINTS,
  REDEMPTION_CAP_POINTS,
  REFERRAL_BONUS_POINTS,
  REVIEW_BONUS_POINTS,
  THIRTY_DAYS_MS,
  poundsToPoints,
  pointsToPounds,
  canRedeem
} = require('./blkpoints-constants');

/**
 * Get user's current BlkPoints balance
 */
async function getBalance(userId, db) {
  // For mock DB: return user's balance
  if (db.users && db.users instanceof Map) {
    const user = db.users.get(userId);
    return user?.blkpoints_balance ?? 0;
  }
  
  // For real PostgreSQL:
  // const { rows } = await db.query('select points from blkpoints_balance where user_id=$1', [userId]);
  // return rows[0]?.points ?? 0;
  
  // For Prisma/Sequelize:
  const user = await db.users.findUnique({ where: { id: userId } });
  return user?.blkpoints_balance ?? 0;
}

/**
 * Append ledger entry and update balance atomically
 * Uses idempotency key to prevent duplicate transactions
 */
async function appendLedger(userId, delta, reason, meta = {}, db) {
  const idemKey = meta.idem || meta.idempotency_key;
  
  // Check for duplicate idempotency key
  if (idemKey) {
    const existing = await findLedgerByMeta('idempotency_key', idemKey, db);
    if (existing) {
      console.log(`⚠️ Duplicate idempotency key ignored: ${idemKey}`);
      return; // Idempotent - already processed
    }
  }

  // For mock DB: simple in-memory operations
  if (db.blkpoints_ledger && Array.isArray(db.blkpoints_ledger)) {
    const ledgerEntry = {
      id: Date.now().toString(),
      user_id: userId,
      delta_points: delta,
      reason: reason,
      meta: meta,
      created_at: new Date()
    };
    db.blkpoints_ledger.push(ledgerEntry);
    
    // Update balance
    const user = db.users.get(userId);
    if (user) {
      user.blkpoints_balance = (user.blkpoints_balance || 0) + delta;
    }
    return;
  }

  // For real PostgreSQL (transaction):
  /*
  await db.query('begin');
  try {
    await db.query(
      `insert into blkpoints_ledger (user_id, delta_points, reason, meta)
       values ($1,$2,$3,$4)`,
      [userId, delta, reason, JSON.stringify(meta)]
    );
    await db.query(
      `insert into blkpoints_balance (user_id, points)
         values ($1,$2)
       on conflict (user_id)
         do update set points = blkpoints_balance.points + EXCLUDED.points,
                       updated_at = now()`,
      [userId, delta]
    );
    await db.query('commit');
  } catch (e) {
    await db.query('rollback');
    if (e.message?.includes('idx_blkpoints_ledger_idem')) return; // duplicate idem key
    throw e;
  }
  */

  // For Prisma:
  /*
  await db.$transaction(async (tx) => {
    await tx.blkpoints_ledger.create({
      data: {
        user_id: userId,
        delta_points: delta,
        reason: reason,
        meta: meta
      }
    });
    await tx.users.update({
      where: { id: userId },
      data: { blkpoints_balance: { increment: delta } }
    });
  });
  */
}

/**
 * Helper to find ledger entry by meta field
 */
async function findLedgerByMeta(key, value, db) {
  if (db.blkpoints_ledger && Array.isArray(db.blkpoints_ledger)) {
    return db.blkpoints_ledger.find(
      entry => entry.meta && entry.meta[key] === value
    );
  }
  // For PostgreSQL:
  // const { rows } = await db.query(
  //   `select * from blkpoints_ledger where meta->>$1 = $2`,
  //   [key, value]
  // );
  // return rows[0];
  return null;
}

/**
 * Earn points when booking is completed
 * @param {Object} params - { userId, amountGBP, bookingId, idem }
 */
async function earnOnCompletedBooking({ userId, amountGBP, bookingId, idem }, db) {
  const points = poundsToPoints(amountGBP); // 1 pt per £1 spent
  if (points <= 0) return 0;
  
  await appendLedger(
    userId,
    points,
    'BOOKING_COMPLETED',
    { bookingId, idem, amountGBP },
    db
  );
  
  return points;
}

/**
 * Earn points for verified review
 * @param {Object} params - { userId, reviewId, idem }
 */
async function earnOnReviewVerified({ userId, reviewId, idem }, db) {
  const points = REVIEW_BONUS_POINTS;
  await appendLedger(
    userId,
    points,
    'REVIEW_VERIFIED',
    { reviewId, idem },
    db
  );
  return points;
}

/**
 * Earn referral bonus when referee completes booking
 * @param {Object} params - { userId, referredUserId, bookingId, idem }
 */
async function earnOnReferralCompleted({ userId, referredUserId, bookingId, idem }, db) {
  const points = REFERRAL_BONUS_POINTS;
  await appendLedger(
    userId,
    points,
    'REFERRAL_COMPLETED',
    { referredUserId, bookingId, idem },
    db
  );
  return points;
}

/**
 * Redeem points for GBP credit/voucher
 * @param {Object} params - { userId, points, idem, bookingAmountGBP }
 * @returns {Promise<number>} GBP value redeemed
 */
async function redeemPoints({ userId, points, idem, bookingAmountGBP }, db) {
  const redeemValueGBP = pointsToPounds(points);

  // --- Rule 1: Minimum redemption ---
  if (points < MIN_REDEEM_POINTS) {
    throw new Error(`Minimum redemption is ${MIN_REDEEM_POINTS} points (£${MIN_REDEEM_POINTS * POINT_VALUE_GBP}).`);
  }

  // --- Rule 2: Check sufficient balance ---
  const bal = await getBalance(userId, db);
  if (points > bal) {
    throw new Error(`Insufficient points. You have ${bal} points, need ${points}.`);
  }

  // --- Rule 3: Minimum order value (2× redemption amount) ---
  if (bookingAmountGBP !== undefined && bookingAmountGBP !== null) {
    const minOrderRequired = redeemValueGBP * 2;
    if (bookingAmountGBP < minOrderRequired) {
      throw new Error(
        `Booking total must be at least £${minOrderRequired.toFixed(2)} to redeem £${redeemValueGBP.toFixed(2)}. ` +
        `Your booking is £${bookingAmountGBP.toFixed(2)}.`
      );
    }

    // --- Rule 3b: Maximum redemption (50% of booking total) ---
    const maxRedeemGBP = bookingAmountGBP * 0.5;
    const maxRedeemPoints = Math.floor(maxRedeemGBP / POINT_VALUE_GBP);
    if (redeemValueGBP > maxRedeemGBP) {
      throw new Error(
        `You can only redeem up to 50% of your booking (£${maxRedeemGBP.toFixed(2)} = ${maxRedeemPoints} points). ` +
        `Your booking is £${bookingAmountGBP.toFixed(2)}.`
      );
    }
  }

  // --- Rule 4: Check mobile verification ---
  const user = db.users instanceof Map 
    ? db.users.get(userId)
    : await db.users.findUnique({ where: { id: userId } });
  
  if (!user?.is_verified || !user?.mobile_number) {
    throw new Error('Please verify your mobile number before redeeming BlkPoints.');
  }

  // --- Rule 5: Check 30-day redemption cap ---
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);
  const redeemedInPeriod = await getRedeemedInPeriod(userId, thirtyDaysAgo, db);
  
  if (redeemedInPeriod + points > REDEMPTION_CAP_POINTS) {
    const remaining = REDEMPTION_CAP_POINTS - redeemedInPeriod;
    throw new Error(
      `Redemption cap reached. You've redeemed £${pointsToPounds(redeemedInPeriod).toFixed(2)} ` +
      `in the past 30 days. You can redeem up to £${pointsToPounds(remaining).toFixed(2)} more.`
    );
  }

  // --- If all checks pass, deduct points ---
  await appendLedger(userId, -points, 'REDEEM', { idem, bookingAmountGBP }, db);

  // Return GBP value to apply as credit
  return redeemValueGBP;
}

/**
 * Get total points redeemed in a time period
 */
async function getRedeemedInPeriod(userId, sinceDate, db) {
  if (db.blkpoints_ledger && Array.isArray(db.blkpoints_ledger)) {
    const redeemed = db.blkpoints_ledger
      .filter(entry => 
        entry.user_id === userId &&
        entry.reason === 'REDEEM' &&
        new Date(entry.created_at) >= sinceDate
      )
      .reduce((sum, entry) => sum + Math.abs(entry.delta_points), 0);
    return redeemed;
  }

  // For PostgreSQL:
  // const { rows } = await db.query(
  //   `select coalesce(sum(abs(delta_points)), 0) as total
  //    from blkpoints_ledger
  //    where user_id=$1 and reason='REDEEM' and created_at >= $2`,
  //   [userId, sinceDate]
  // );
  // return parseInt(rows[0]?.total || 0);
  
  return 0;
}

/**
 * Get comprehensive BlkPoints status for UI
 */
async function getBlkPointsStatus(userId, db) {
  const points = await getBalance(userId, db);
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);
  const redeemedInPeriod = await getRedeemedInPeriod(userId, thirtyDaysAgo, db);
  
  const user = db.users instanceof Map
    ? db.users.get(userId)
    : await db.users.findUnique({ where: { id: userId } });

  return {
    points,
    gbpValue: +pointsToPounds(points).toFixed(2),
    minRedeemGBP: MIN_REDEEM_POINTS * POINT_VALUE_GBP,
    minRedeemPoints: MIN_REDEEM_POINTS,
    canRedeem: canRedeem(points),
    isVerified: user?.is_verified || false,
    redemptionCap: {
      max: REDEMPTION_CAP_POINTS,
      redeemed: redeemedInPeriod,
      remaining: REDEMPTION_CAP_POINTS - redeemedInPeriod,
      percentage: (redeemedInPeriod / REDEMPTION_CAP_POINTS) * 100
    }
  };
}

module.exports = {
  getBalance,
  appendLedger,
  earnOnCompletedBooking,
  earnOnReviewVerified,
  earnOnReferralCompleted,
  redeemPoints,
  getRedeemedInPeriod,
  getBlkPointsStatus,
  // Helpers
  poundsToPoints,
  pointsToPounds,
  canRedeem
};

