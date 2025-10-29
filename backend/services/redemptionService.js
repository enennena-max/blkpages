// backend/services/redemptionService.js
import db from "../db.js";

// ──────────────────────────────
//  REDEMPTION PROCESSING SERVICE
// ──────────────────────────────

export async function processBookingCompletion(bookingId) {
  try {
    console.log(`🔄 Processing booking completion for booking #${bookingId}`);

    // Get booking details
    const bookingResult = await db.query(
      "SELECT id, customer_id, status FROM bookings WHERE id = $1",
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== "completed") {
      console.log(`⏭️ Booking ${bookingId} not completed yet, skipping`);
      return;
    }

    // Find pending redemptions for this booking
    const redemptionResult = await db.query(
      `SELECT r.*, u.points_balance 
       FROM redemptions r
       JOIN users u ON u.id = r.user_id
       WHERE r.booking_id = $1 AND r.status = 'pending'`,
      [bookingId]
    );

    if (redemptionResult.rows.length === 0) {
      console.log(`ℹ️ No pending redemptions for booking ${bookingId}`);
      return;
    }

    const redemption = redemptionResult.rows[0];

    // Deduct points from user balance
    await db.query(
      "UPDATE users SET points_balance = points_balance - $1 WHERE id = $2",
      [redemption.points, redemption.user_id]
    );

    // Mark redemption as deducted
    await db.query(
      "UPDATE redemptions SET status = 'deducted', updated_at = NOW() WHERE id = $1",
      [redemption.id]
    );

    // Log activity
    await db.query(
      `INSERT INTO points_activity (user_id, points, source, type, description, booking_id, redemption_id)
       VALUES ($1, $2, 'Redemption', 'redeemed', $3, $4, $5)`,
      [
        redemption.user_id,
        -redemption.points,
        `Redeemed ${redemption.points} pts on booking #${bookingId}`,
        bookingId,
        redemption.id
      ]
    );

    console.log(`✅ Processed redemption: ${redemption.points} pts deducted for booking #${bookingId}`);

    return {
      success: true,
      redemption_id: redemption.id,
      points_deducted: redemption.points,
      user_id: redemption.user_id
    };

  } catch (error) {
    console.error(`❌ Error processing booking completion for ${bookingId}:`, error);
    throw error;
  }
}

export async function processBookingCancellation(bookingId) {
  try {
    console.log(`🔄 Processing booking cancellation for booking #${bookingId}`);

    // Find pending redemptions for this booking
    const redemptionResult = await db.query(
      "SELECT * FROM redemptions WHERE booking_id = $1 AND status = 'pending'",
      [bookingId]
    );

    if (redemptionResult.rows.length === 0) {
      console.log(`ℹ️ No pending redemptions to release for booking ${bookingId}`);
      return;
    }

    const redemption = redemptionResult.rows[0];

    // Mark redemption as released (points remain in user balance)
    await db.query(
      "UPDATE redemptions SET status = 'released', updated_at = NOW() WHERE id = $1",
      [redemption.id]
    );

    // Log activity
    await db.query(
      `INSERT INTO points_activity (user_id, points, source, type, description, booking_id, redemption_id)
       VALUES ($1, $2, 'Redemption Cancellation', 'cancelled', $3, $4, $5)`,
      [
        redemption.user_id,
        0, // No points change, just status update
        `Redemption cancelled for booking #${bookingId}`,
        bookingId,
        redemption.id
      ]
    );

    console.log(`✅ Released redemption for booking #${bookingId}`);

    return {
      success: true,
      redemption_id: redemption.id,
      user_id: redemption.user_id
    };

  } catch (error) {
    console.error(`❌ Error processing booking cancellation for ${bookingId}:`, error);
    throw error;
  }
}

export async function getUserRedemptionSummary(userId) {
  try {
    // Get current balance
    const balanceResult = await db.query(
      "SELECT points_balance FROM users WHERE id = $1",
      [userId]
    );

    if (balanceResult.rows.length === 0) {
      throw new Error("User not found");
    }

    const currentBalance = balanceResult.rows[0].points_balance;

    // Get pending redemptions
    const pendingResult = await db.query(
      `SELECT r.*, b.id as booking_id, b.total_amount, b.status as booking_status,
              bus.name as business_name
       FROM redemptions r
       LEFT JOIN bookings b ON b.id = r.booking_id
       LEFT JOIN businesses bus ON bus.id = b.business_id
       WHERE r.user_id = $1 AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [userId]
    );

    const pendingRedemptions = pendingResult.rows;
    const pendingPoints = pendingRedemptions.reduce((sum, r) => sum + r.points, 0);
    const availableBalance = currentBalance - pendingPoints;

    return {
      current_balance: currentBalance,
      pending_points: pendingPoints,
      available_balance: availableBalance,
      pending_redemptions: pendingRedemptions
    };

  } catch (error) {
    console.error(`❌ Error getting redemption summary for user ${userId}:`, error);
    throw error;
  }
}

export async function validateRedemption(userId, bookingId, redemptionValue, points) {
  try {
    // Get booking details
    const bookingResult = await db.query(
      "SELECT total_amount, status FROM bookings WHERE id = $1 AND customer_id = $2",
      [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
      return { valid: false, error: "Booking not found" };
    }

    const booking = bookingResult.rows[0];

    // Check booking status
    if (booking.status !== "pending") {
      return { valid: false, error: "Booking is not in pending status" };
    }

    // Check 2× rule
    if (booking.total_amount < redemptionValue * 2) {
      return { 
        valid: false, 
        error: "Booking must be at least twice your redemption amount" 
      };
    }

    // Check 50% rule
    if (redemptionValue > booking.total_amount / 2) {
      return { 
        valid: false, 
        error: "You can only redeem up to 50% of booking total" 
      };
    }

    // Check user balance
    const userResult = await db.query(
      "SELECT points_balance FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return { valid: false, error: "User not found" };
    }

    const userBalance = userResult.rows[0].points_balance;

    if (userBalance < points) {
      return { valid: false, error: "Insufficient BlkPoints" };
    }

    return { valid: true };

  } catch (error) {
    console.error("Redemption validation error:", error);
    return { valid: false, error: "Validation error" };
  }
}
