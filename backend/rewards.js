// Rewards and loyalty system for BlkPages
import db from './db.js';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

/**
 * Add BlkPoints to customer account
 * @param {number} userId - User ID
 * @param {number} points - Points to add
 * @param {string} source - Source of the points
 * @returns {Promise<Object>} Result of the operation
 */
export async function addPoints(userId, points, source) {
  try {
    // Start transaction
    await db.query('BEGIN');

    // Insert points activity record
    await db.query(
      "INSERT INTO points_activity (user_id, points, source) VALUES ($1,$2,$3)",
      [userId, points, source]
    );

    // Update user's points balance
    await db.query(
      "UPDATE users SET points_balance = points_balance + $1 WHERE id=$2", 
      [points, userId]
    );

    await db.query('COMMIT');

    console.log(`✅ Added ${points} BlkPoints to user ${userId}: ${source}`);
    
    return {
      success: true,
      pointsAdded: points,
      source: source
    };
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(`❌ Error adding points to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Deduct BlkPoints from customer account
 * @param {number} userId - User ID
 * @param {number} points - Points to deduct
 * @param {string} source - Source of the deduction (default: "Adjustment")
 * @returns {Promise<Object>} Result of the operation
 */
export async function deductPoints(userId, points, source = "Adjustment") {
  try {
    // Start transaction
    await db.query('BEGIN');

    // Insert points activity record (negative points)
    await db.query(
      "INSERT INTO points_activity (user_id, points, source) VALUES ($1,$2,$3)",
      [userId, -points, source]
    );

    // Update user's points balance (prevent negative balance)
    await db.query(
      "UPDATE users SET points_balance = GREATEST(points_balance - $1, 0) WHERE id=$2", 
      [points, userId]
    );

    await db.query('COMMIT');

    console.log(`✅ Deducted ${points} BlkPoints from user ${userId}: ${source}`);
    
    return {
      success: true,
      pointsDeducted: points,
      source: source
    };
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(`❌ Error deducting points from user ${userId}:`, error);
    throw error;
  }
}

/**
 * Check if referral completion should trigger bonus
 * @param {string} refereeEmail - Referee email to check
 * @returns {Promise<Object>} Referral completion result
 */
export async function checkReferralCompletion(refereeEmail) {
  try {
    const { rows } = await db.query(
      "SELECT * FROM referrals WHERE referee_email=$1 AND status='pending'",
      [refereeEmail]
    );

    if (!rows.length) {
      console.log(`ℹ️ No pending referrals found for email: ${refereeEmail}`);
      return { success: false, reason: 'No pending referrals' };
    }

    const referral = rows[0];

    // Award referral bonus to referrer
    await addPoints(referral.referrer_id, 100, "Referral completed booking");

    // Mark referral as completed
    await db.query(
      "UPDATE referrals SET status='completed' WHERE id=$1", 
      [referral.id]
    );

    console.log(`🎉 Referral bonus awarded to user ${referral.referrer_id} for referral ${referral.id}`);
    
    return {
      success: true,
      bonusAwarded: true,
      points: 100,
      referrerId: referral.referrer_id,
      referralId: referral.id
    };
  } catch (error) {
    console.error(`❌ Error checking referral completion for ${refereeEmail}:`, error);
    throw error;
  }
}

/**
 * Update business-specific loyalty progress
 * @param {number} customerId - Customer ID
 * @param {number} businessId - Business ID
 * @returns {Promise<Object>} Loyalty update result
 */
export async function updateBusinessLoyalty(customerId, businessId) {
  try {
    // Start transaction
    await db.query('BEGIN');

    // Update or create loyalty card record
    const loyaltyResult = await db.query(`
      INSERT INTO loyalty_cards (customer_id, business_id, stamps)
      VALUES ($1, $2, 1)
      ON CONFLICT (customer_id, business_id)
      DO UPDATE SET stamps = loyalty_cards.stamps + 1
      RETURNING *
    `, [customerId, businessId]);

    await db.query('COMMIT');

    const loyalty = loyaltyResult.rows[0];
    console.log(`✅ Updated business loyalty for customer ${customerId} at business ${businessId}: ${loyalty.stamps} stamps`);
    
    return {
      success: true,
      loyalty,
      stampsEarned: 1,
      totalStamps: loyalty.stamps
    };
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(`❌ Error updating business loyalty for customer ${customerId} at business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Get user's BlkPoints balance
 * @param {number} userId - User ID
 * @returns {Promise<number>} Current points balance
 */
export async function getUserPoints(userId) {
  try {
    const result = await db.query(
      'SELECT points_balance FROM users WHERE id = $1',
      [userId]
    );

    return result.rows[0]?.points_balance || 0;
  } catch (error) {
    console.error(`❌ Error getting points for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get user's business loyalty progress
 * @param {number} customerId - Customer ID
 * @param {number} businessId - Business ID
 * @returns {Promise<Object>} Business loyalty progress
 */
export async function getBusinessLoyaltyProgress(customerId, businessId) {
  try {
    const result = await db.query(
      'SELECT * FROM loyalty_cards WHERE customer_id = $1 AND business_id = $2',
      [customerId, businessId]
    );

    if (!result.rows[0]) {
      return {
        stamps: 0,
        isRewardUnlocked: false,
        progress: 0
      };
    }

    const loyalty = result.rows[0];
    return {
      stamps: loyalty.stamps,
      isRewardUnlocked: loyalty.stamps >= 10, // Assuming 10 stamps for reward
      progress: (loyalty.stamps / 10) * 100
    };
  } catch (error) {
    console.error(`❌ Error getting business loyalty progress for customer ${customerId} at business ${businessId}:`, error);
    throw error;
  }
}

// ──────────────────────────────
//  DYNAMIC REFERRAL CODE SYSTEM
// ──────────────────────────────

/**
 * Get or create a dynamic referral code for user
 * Each user has at most one active code at a time
 * @param {number} userId - User ID
 * @returns {Promise<string>} Active referral code
 */
export async function getOrCreateReferralCode(userId) {
  try {
    // Check if there's an active code
    const { rows } = await db.query(
      "SELECT code FROM referral_codes WHERE user_id=$1 AND status='active' LIMIT 1",
      [userId]
    );

    if (rows.length) {
      console.log(`✅ Found existing active referral code for user ${userId}: ${rows[0].code}`);
      return rows[0].code;
    }

    // Generate a new one if none active
    const code = `BLK-${nanoid(8).toUpperCase()}`; // e.g., BLK-3KXP7J2Z
    await db.query(
      "INSERT INTO referral_codes (user_id, code) VALUES ($1,$2)",
      [userId, code]
    );
    
    console.log(`✅ Generated new referral code for user ${userId}: ${code}`);
    return code;
  } catch (error) {
    console.error(`❌ Error getting/creating referral code for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Mark referral code as used and generate new one
 * Called when someone uses the referral code
 * @param {string} referralCode - The code that was used
 * @param {string} refereeEmail - Email of person who used the code
 * @returns {Promise<Object>} Result with referrer info
 */
export async function useReferralCode(referralCode, refereeEmail) {
  try {
    // Find the code owner
    const { rows: codeOwner } = await db.query(
      "SELECT user_id FROM referral_codes WHERE code=$1 AND status='active'",
      [referralCode]
    );
    
    if (!codeOwner.length) {
      console.log(`ℹ️ Invalid or inactive referral code: ${referralCode}`);
      return { success: false, reason: 'Invalid or inactive referral code' };
    }
    
    const referrerId = codeOwner[0].user_id;
    
    // Check if referral already exists for this email
    const { rows: existing } = await db.query(
      "SELECT id FROM referrals WHERE referee_email=$1", 
      [refereeEmail]
    );
    
    if (existing.length) {
      console.log(`ℹ️ Referral already exists for email: ${refereeEmail}`);
      return { success: false, reason: 'Referral already exists' };
    }
    
    // Create referral record
    const { rows: referral } = await db.query(`
      INSERT INTO referrals (referrer_id, referee_email, referral_code, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `, [referrerId, refereeEmail, referralCode]);
    
    // Mark old code as used
    await db.query(`
      UPDATE referral_codes
      SET status='used', used_at=NOW()
      WHERE code=$1
    `, [referralCode]);
    
    // Generate new code for referrer
    const newCode = await getOrCreateReferralCode(referrerId);
    
    console.log(`🎉 Referral code ${referralCode} used by ${refereeEmail}, new code generated: ${newCode}`);
    
    return {
      success: true,
      referral: referral[0],
      referrerId: referrerId,
      newCode: newCode
    };
  } catch (error) {
    console.error(`❌ Error using referral code ${referralCode}:`, error);
    throw error;
  }
}

/**
 * Get user's current active referral code
 * @param {number} userId - User ID
 * @returns {Promise<string|null>} Active referral code or null
 */
export async function getCurrentReferralCode(userId) {
  try {
    const { rows } = await db.query(
      "SELECT code FROM referral_codes WHERE user_id=$1 AND status='active' LIMIT 1",
      [userId]
    );
    
    return rows[0]?.code || null;
  } catch (error) {
    console.error(`❌ Error getting current referral code for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get referral code statistics for user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Referral code stats
 */
export async function getReferralCodeStats(userId) {
  try {
    const { rows: stats } = await db.query(`
      SELECT 
        COUNT(*) as total_codes,
        COUNT(CASE WHEN status = 'used' THEN 1 END) as used_codes,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_codes
      FROM referral_codes 
      WHERE user_id = $1
    `, [userId]);
    
    const { rows: referrals } = await db.query(`
      SELECT COUNT(*) as total_referrals
      FROM referrals 
      WHERE referrer_id = $1
    `, [userId]);
    
    return {
      totalCodes: parseInt(stats[0].total_codes),
      usedCodes: parseInt(stats[0].used_codes),
      activeCodes: parseInt(stats[0].active_codes),
      totalReferrals: parseInt(referrals[0].total_referrals)
    };
  } catch (error) {
    console.error(`❌ Error getting referral code stats for user ${userId}:`, error);
    throw error;
  }
}

// ──────────────────────────────
//  LEGACY REFERRAL FUNCTIONS (for backward compatibility)
// ──────────────────────────────

/**
 * Ensure user has a referral code, generate one if needed
 * @deprecated Use getOrCreateReferralCode instead
 * @param {number} userId - User ID
 * @returns {Promise<string>} Referral code
 */
export async function ensureReferralCode(userId) {
  return await getOrCreateReferralCode(userId);
}

/**
 * Get user's referral code
 * @param {number} userId - User ID
 * @returns {Promise<string|null>} Referral code or null
 */
export async function getReferralCode(userId) {
  try {
    const { rows } = await db.query(
      "SELECT referral_code FROM users WHERE id=$1", 
      [userId]
    );
    
    return rows[0]?.referral_code || null;
  } catch (error) {
    console.error(`❌ Error getting referral code for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Create referral relationship when new user signs up
 * @param {string} referralCode - Referral code from URL
 * @param {string} refereeEmail - Email of the person being referred
 * @returns {Promise<Object>} Referral creation result
 */
export async function createReferral(referralCode, refereeEmail) {
  try {
    // Find referrer by code
    const { rows: referrer } = await db.query(
      "SELECT id FROM users WHERE referral_code=$1", 
      [referralCode]
    );
    
    if (!referrer.length) {
      console.log(`ℹ️ Invalid referral code: ${referralCode}`);
      return { success: false, reason: 'Invalid referral code' };
    }
    
    // Check if referral already exists
    const { rows: existing } = await db.query(
      "SELECT id FROM referrals WHERE referee_email=$1", 
      [refereeEmail]
    );
    
    if (existing.length) {
      console.log(`ℹ️ Referral already exists for email: ${refereeEmail}`);
      return { success: false, reason: 'Referral already exists' };
    }
    
    // Create referral record
    const { rows: referral } = await db.query(`
      INSERT INTO referrals (referrer_id, referee_email, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `, [referrer[0].id, refereeEmail]);
    
    console.log(`✅ Created referral: ${referral[0].id} for referrer ${referrer[0].id}`);
    
    return {
      success: true,
      referral: referral[0],
      referrerId: referrer[0].id
    };
  } catch (error) {
    console.error(`❌ Error creating referral for ${refereeEmail}:`, error);
    throw error;
  }
}

/**
 * Check if user is completing their first booking (for referral bonus)
 * @param {string} refereeEmail - Email of the person completing booking
 * @returns {Promise<Object>} Referral completion result
 */
export async function checkReferralCompletion(refereeEmail) {
  try {
    const { rows } = await db.query(
      "SELECT * FROM referrals WHERE referee_email=$1 AND status='pending'",
      [refereeEmail]
    );

    if (!rows.length) {
      console.log(`ℹ️ No pending referrals found for email: ${refereeEmail}`);
      return { success: false, reason: 'No pending referrals' };
    }

    const referral = rows[0];

    // Award referral bonus to referrer
    await addPoints(referral.referrer_id, 100, "Referral completed booking");

    // Mark referral as completed
    await db.query(
      "UPDATE referrals SET status='completed', completed_at=NOW() WHERE id=$1", 
      [referral.id]
    );

    console.log(`🎉 Referral bonus awarded to user ${referral.referrer_id} for referral ${referral.id}`);
    
    return {
      success: true,
      bonusAwarded: true,
      points: 100,
      referrerId: referral.referrer_id,
      referralId: referral.id
    };
  } catch (error) {
    console.error(`❌ Error checking referral completion for ${refereeEmail}:`, error);
    throw error;
  }
}

/**
 * Get referral statistics for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Referral statistics
 */
export async function getReferralStats(userId) {
  try {
    const { rows: stats } = await db.query(`
      SELECT 
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_referrals,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_referrals
      FROM referrals 
      WHERE referrer_id = $1
    `, [userId]);
    
    const { rows: earnings } = await db.query(`
      SELECT COALESCE(SUM(points), 0) as total_earnings
      FROM points_activity 
      WHERE user_id = $1 AND source = 'Referral completed booking'
    `, [userId]);
    
    return {
      totalReferrals: parseInt(stats[0].total_referrals),
      completedReferrals: parseInt(stats[0].completed_referrals),
      pendingReferrals: parseInt(stats[0].pending_referrals),
      totalEarnings: parseInt(earnings[0].total_earnings)
    };
  } catch (error) {
    console.error(`❌ Error getting referral stats for user ${userId}:`, error);
    throw error;
  }
}

// ──────────────────────────────
//  VERIFIED REVIEW FUNCTIONS
// ──────────────────────────────

/**
 * Submit a review (unverified initially)
 * @param {number} bookingId - Booking ID
 * @param {number} userId - User ID
 * @param {number} rating - Rating (1-5)
 * @param {string} text - Review text
 * @returns {Promise<Object>} Review creation result
 */
export async function submitReview(bookingId, userId, rating, text) {
  try {
    // Check if review already exists for this booking
    const { rows: existing } = await db.query(
      "SELECT id FROM reviews WHERE booking_id=$1 AND user_id=$2",
      [bookingId, userId]
    );
    
    if (existing.length) {
      return { success: false, reason: 'Review already exists for this booking' };
    }
    
    // Create review record
    const { rows: review } = await db.query(`
      INSERT INTO reviews (booking_id, user_id, rating, text, verified, points_released)
      VALUES ($1, $2, $3, $4, false, false)
      RETURNING *
    `, [bookingId, userId, rating, text]);
    
    console.log(`✅ Review submitted: ${review[0].id} for booking ${bookingId}`);
    
    return {
      success: true,
      review: review[0]
    };
  } catch (error) {
    console.error(`❌ Error submitting review for booking ${bookingId}:`, error);
    throw error;
  }
}

/**
 * Verify a review (admin function)
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object>} Verification result
 */
export async function verifyReview(reviewId) {
  try {
    const { rows: review } = await db.query(`
      UPDATE reviews 
      SET verified=true, verified_at=NOW() 
      WHERE id=$1 AND verified=false
      RETURNING *
    `, [reviewId]);
    
    if (!review.length) {
      return { success: false, reason: 'Review not found or already verified' };
    }
    
    console.log(`✅ Review verified: ${reviewId}`);
    
    return {
      success: true,
      review: review[0]
    };
  } catch (error) {
    console.error(`❌ Error verifying review ${reviewId}:`, error);
    throw error;
  }
}

/**
 * Release points for verified reviews (24 hours after verification)
 * @returns {Promise<Object>} Points release result
 */
export async function releaseVerifiedReviewPoints() {
  try {
    const { rows: verifiedReviews } = await db.query(`
      SELECT * FROM reviews
      WHERE verified=true
        AND points_released=false
        AND verified_at < NOW() - INTERVAL '24 hours'
    `);
    
    let releasedCount = 0;
    
    for (const review of verifiedReviews) {
      try {
        // Award 25 points for verified review
        await addPoints(review.user_id, 25, "Verified review reward");
        
        // Mark points as released
        await db.query(
          "UPDATE reviews SET points_released=true WHERE id=$1", 
          [review.id]
        );
        
        releasedCount++;
        console.log(`⭐ Released review points for review ${review.id}`);
      } catch (error) {
        console.error(`❌ Error releasing points for review ${review.id}:`, error);
      }
    }
    
    return {
      success: true,
      releasedCount,
      reviews: verifiedReviews
    };
  } catch (error) {
    console.error(`❌ Error releasing verified review points:`, error);
    throw error;
  }
}

/**
 * Get user's review statistics
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Review statistics
 */
export async function getReviewStats(userId) {
  try {
    const { rows: stats } = await db.query(`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified_reviews,
        COUNT(CASE WHEN points_released = true THEN 1 END) as rewarded_reviews,
        AVG(rating) as average_rating
      FROM reviews 
      WHERE user_id = $1
    `, [userId]);
    
    const { rows: earnings } = await db.query(`
      SELECT COALESCE(SUM(points), 0) as total_earnings
      FROM points_activity 
      WHERE user_id = $1 AND source = 'Verified review reward'
    `, [userId]);
    
    return {
      totalReviews: parseInt(stats[0].total_reviews),
      verifiedReviews: parseInt(stats[0].verified_reviews),
      rewardedReviews: parseInt(stats[0].rewarded_reviews),
      averageRating: parseFloat(stats[0].average_rating) || 0,
      totalEarnings: parseInt(earnings[0].total_earnings)
    };
  } catch (error) {
    console.error(`❌ Error getting review stats for user ${userId}:`, error);
    throw error;
  }
}
