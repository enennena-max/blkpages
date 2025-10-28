// cronJobs.js
import cron from "node-cron";
import db from "./db.js";
import { addPoints, deductPoints, checkReferralCompletion, updateBusinessLoyalty, releaseVerifiedReviewPoints } from "./rewards.js";

// Socket.IO instance for real-time notifications
let io = null;

/**
 * Initialize cron jobs with Socket.IO instance
 * @param {Object} socketIO - Socket.IO instance
 */
export function initializeCronJobs(socketIO) {
  io = socketIO;
  console.log("🕐 Cron jobs initialized with Socket.IO support");
}

// ──────────────────────────────
//  STAGE 1 — AUTO COMPLETE
// ──────────────────────────────
cron.schedule("0 * * * *", async () => { // runs hourly
  console.log("🔄 Checking for bookings to auto-complete...");

  try {
    const { rows: autoComplete } = await db.query(`
      UPDATE bookings
      SET status='completed', completed_at=NOW()
      WHERE status='confirmed'
        AND end_time < NOW()
        AND cancelled_at IS NULL
        AND refunded_at IS NULL
      RETURNING id, customer_id, business_id, total_amount, customer_email;
    `);

    if (autoComplete.length) {
      console.log(`✅ Auto-completed ${autoComplete.length} bookings`);
      
      // Send real-time notifications for each completed booking
      for (const booking of autoComplete) {
        try {
          // Notify customer with frontend messaging stage
          if (io && booking.customer_id) {
            io.to(`customer_${booking.customer_id}`).emit('booking_status_changed', {
              bookingId: booking.id,
              status: 'completed',
              stage: 'service_passed',
              label: 'Completed – BlkPoints pending (24 hrs)',
              message: 'Your booking has been automatically completed! Points will be released in 24 hours.',
              timestamp: new Date().toISOString(),
              pointsPending: Math.floor(booking.total_amount)
            });
          }

          console.log(`📱 Sent completion notification for booking ${booking.id}`);
        } catch (notificationError) {
          console.error(`❌ Error sending notification for booking ${booking.id}:`, notificationError);
        }
      }
    } else {
      console.log("ℹ️ No bookings ready for auto-completion");
    }
  } catch (error) {
    console.error("❌ Error in auto-complete cron job:", error);
  }
});

// ──────────────────────────────
//  STAGE 2 — 24H POINTS RELEASE
// ──────────────────────────────
cron.schedule("15 * * * *", async () => { // runs hourly at +15min offset
  console.log("💰 Checking for bookings ready for BlkPoints release...");

  try {
    const { rows: readyBookings } = await db.query(`
      SELECT * FROM bookings
      WHERE status='completed'
        AND points_released=false
        AND completed_at < NOW() - INTERVAL '24 hours'
        AND refunded_at IS NULL
        AND disputed=false;
    `);

    if (readyBookings.length === 0) {
      console.log("ℹ️ No bookings ready for points release");
      return;
    }

    console.log(`🎁 Processing ${readyBookings.length} bookings for points release`);

    for (const booking of readyBookings) {
      const customerId = booking.customer_id;
      const amount = Math.floor(booking.total_amount);

      try {
        // Add BlkPoints (1 per £1)
        const pointsResult = await addPoints(customerId, amount, `Booking #${booking.id} completed`);
        
        // Referral reward (+100)
        const referralResult = await checkReferralCompletion(booking.customer_email);

        // Local business loyalty update
        const loyaltyResult = await updateBusinessLoyalty(customerId, booking.business_id);

        // Flag as released
        await db.query("UPDATE bookings SET points_released=true WHERE id=$1", [booking.id]);

        // Send real-time notifications with frontend messaging stages
        if (io && customerId) {
          // Notify about points earned with gold/green styling
          io.to(`customer_${customerId}`).emit('booking_status_changed', {
            bookingId: booking.id,
            status: 'completed',
            stage: 'points_released',
            label: `Completed – +${amount} pts added`,
            message: `You earned ${amount} BlkPoints from your completed booking!`,
            timestamp: new Date().toISOString(),
            pointsEarned: amount,
            styling: 'gold_green'
          });

          // Notify about loyalty points update
          io.to(`customer_${customerId}`).emit('loyalty_points_updated', {
            points: pointsResult.pointsAdded,
            added: amount,
            reason: `Booking #${booking.id} completed`,
            bookingId: booking.id,
            timestamp: new Date().toISOString()
          });

          // Notify about referral bonus if awarded
          if (referralResult.bonusAwarded) {
            io.to(`customer_${customerId}`).emit('loyalty_points_updated', {
              points: 100,
              added: 100,
              reason: 'Referral bonus - booking completed',
              bookingId: booking.id,
              timestamp: new Date().toISOString()
            });
          }

          // Notify about business loyalty progress
          if (loyaltyResult.totalStamps >= 10) {
            io.to(`customer_${customerId}`).emit('business_loyalty_reward_unlocked', {
              businessId: booking.business_id,
              stamps: loyaltyResult.totalStamps,
              goal: 10,
              bookingId: booking.id,
              timestamp: new Date().toISOString()
            });
          }
        }

        console.log(`🎁 Released BlkPoints for booking ${booking.id}: ${amount} points + ${referralResult.bonusAwarded ? '100 referral bonus' : 'no bonus'}`);

      } catch (err) {
        console.error(`❌ Error releasing points for booking ${booking.id}:`, err);
        
        // Send error notification
        if (io && customerId) {
          io.to(`customer_${customerId}`).emit('booking_status_changed', {
            bookingId: booking.id,
            status: 'error',
            stage: 'points_error',
            label: 'Points Release Error',
            message: 'There was an issue releasing your BlkPoints. Please contact support.',
            timestamp: new Date().toISOString(),
            styling: 'red'
          });
        }
      }
    }
  } catch (error) {
    console.error("❌ Error in points release cron job:", error);
  }
});

// ──────────────────────────────
//  REFUND HANDLING
// ──────────────────────────────

/**
 * Handle refund processing and points reversal
 * This should be called when a refund is issued
 */
export async function processRefund(bookingId, customerId) {
  try {
    // Get booking details
    const { rows: booking } = await db.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );

    if (!booking.length) {
      throw new Error('Booking not found');
    }

    const bookingData = booking[0];
    const refundedAmount = Math.floor(bookingData.total_amount);

    // Reverse points if they were already released
    if (bookingData.points_released) {
      await deductPoints(customerId, refundedAmount, `Refund for booking #${bookingId}`);
      
      // Reverse referral bonus if applicable
      const referralResult = await checkReferralCompletion(bookingData.customer_email);
      if (referralResult.bonusAwarded) {
        await deductPoints(customerId, 100, `Referral bonus reversal for booking #${bookingId}`);
      }
    }

    // Update booking status
    await db.query(
      'UPDATE bookings SET refunded_at = NOW() WHERE id = $1',
      [bookingId]
    );

    // Send real-time notification with red styling
    if (io && customerId) {
      io.to(`customer_${customerId}`).emit('booking_status_changed', {
        bookingId: bookingId,
        status: 'refunded',
        stage: 'refunded',
        label: 'Refunded – Points reversed',
        message: `Your booking has been refunded. ${refundedAmount} BlkPoints have been reversed.`,
        timestamp: new Date().toISOString(),
        pointsReversed: refundedAmount,
        styling: 'red'
      });

      // Notify about points deduction
      io.to(`customer_${customerId}`).emit('loyalty_points_updated', {
        points: -refundedAmount,
        added: -refundedAmount,
        reason: `Refund for booking #${bookingId}`,
        bookingId: bookingId,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`💰 Processed refund for booking ${bookingId}: ${refundedAmount} points reversed`);
    
    return {
      success: true,
      pointsReversed: refundedAmount,
      bookingId: bookingId
    };
  } catch (error) {
    console.error(`❌ Error processing refund for booking ${bookingId}:`, error);
    throw error;
  }
}

// ──────────────────────────────
//  STAGE 3 — VERIFIED REVIEW POINTS RELEASE
// ──────────────────────────────
cron.schedule("30 * * * *", async () => { // runs hourly at +30min offset
  console.log("⭐ Checking for verified reviews ready for points release...");

  try {
    const result = await releaseVerifiedReviewPoints();
    
    if (result.releasedCount > 0) {
      console.log(`⭐ Released points for ${result.releasedCount} verified reviews`);
      
      // Send real-time notifications for each review reward
      for (const review of result.reviews) {
        try {
          if (io && review.user_id) {
            // Notify about review reward
            io.to(`customer_${review.user_id}`).emit('loyalty_points_updated', {
              points: 25,
              added: 25,
              reason: 'Verified review reward',
              reviewId: review.id,
              timestamp: new Date().toISOString()
            });

            // Notify about review verification
            io.to(`customer_${review.user_id}`).emit('review_verified', {
              reviewId: review.id,
              rating: review.rating,
              pointsEarned: 25,
              message: 'Your review has been verified! You earned 25 BlkPoints.',
              timestamp: new Date().toISOString()
            });
          }
        } catch (notificationError) {
          console.error(`❌ Error sending notification for review ${review.id}:`, notificationError);
        }
      }
    } else {
      console.log("ℹ️ No verified reviews ready for points release");
    }
  } catch (error) {
    console.error("❌ Error in verified review points release cron job:", error);
  }
});

// ──────────────────────────────
//  ADDITIONAL CRON JOBS
// ──────────────────────────────

// Clean up old notifications (runs daily at 2 AM)
cron.schedule("0 2 * * *", async () => {
  console.log("🧹 Cleaning up old notifications...");
  
  try {
    const { rowCount } = await db.query(`
      DELETE FROM notifications 
      WHERE created_at < NOW() - INTERVAL '30 days'
        AND read = true
    `);
    
    if (rowCount > 0) {
      console.log(`✅ Cleaned up ${rowCount} old notifications`);
    }
  } catch (error) {
    console.error("❌ Error cleaning up notifications:", error);
  }
});

// Health check (runs every 6 hours)
cron.schedule("0 */6 * * *", async () => {
  console.log("🏥 Running health check...");
  
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    // Check for stuck bookings (completed but no points released after 48 hours)
    const { rows: stuckBookings } = await db.query(`
      SELECT id, customer_id, completed_at 
      FROM bookings 
      WHERE status='completed' 
        AND points_released=false 
        AND completed_at < NOW() - INTERVAL '48 hours'
        AND refunded_at IS NULL 
        AND disputed=false
    `);
    
    if (stuckBookings.length > 0) {
      console.warn(`⚠️ Found ${stuckBookings.length} stuck bookings that should have had points released`);
      
      // Log details for manual review
      for (const booking of stuckBookings) {
        console.warn(`⚠️ Stuck booking ${booking.id} completed at ${booking.completed_at}`);
      }
    }
    
    console.log("✅ Health check completed");
  } catch (error) {
    console.error("❌ Health check failed:", error);
  }
});

console.log("🕐 Cron jobs scheduled:");
console.log("  - Auto-complete bookings: Every hour at :00");
console.log("  - Release BlkPoints: Every hour at :15");
console.log("  - Release verified review points: Every hour at :30");
console.log("  - Cleanup notifications: Daily at 2:00 AM");
console.log("  - Health check: Every 6 hours");
console.log("📱 Frontend messaging stages:");
console.log("  - Service passed: 'Completed – BlkPoints pending (24 hrs)' (Grey)");
console.log("  - After 24 hrs: 'Completed – +X pts added' (Gold/Green)");
console.log("  - Refund issued: 'Refunded – Points reversed' (Red)");
console.log("🎁 Reward system:");
console.log("  - Booking completion: 1 pt per £1 (24h delay)");
console.log("  - Referral bonus: +100 pts to referrer (24h delay)");
console.log("  - Verified review: +25 pts to reviewer (24h delay)");
console.log("  - Local loyalty: +1 stamp per business (24h delay)");
