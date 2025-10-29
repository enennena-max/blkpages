/**
 * BlkPages Loyalty Engine - Unified Background Job System
 * 
 * Combines all loyalty operations into a single, efficient background job:
 * ✅ Confirms/releases earned points (after 24h)
 * ✅ Confirms/releases referral bonuses (after 24h) 
 * ✅ Confirms/releases redemptions (after 24h)
 * ✅ Sends smart notifications only when relevant
 * ✅ Maintains data consistency across all loyalty operations
 */

const cron = require('node-cron');

// =====================================================
// 🕒 BlkPages Loyalty Engine – Combined 24-Hour Job
// =====================================================

/**
 * runLoyaltyEngine()
 * Master function that processes all pending loyalty transactions
 * Run this every hour or nightly to keep the system in sync
 */
async function runLoyaltyEngine(db, notifyUser) {
  const now = new Date();
  const cutoff = new Date(now - 24 * 60 * 60 * 1000); // 24 hours ago

  console.log("🕒 Running BlkPages Loyalty Engine...");
  console.log(`📅 Processing transactions older than: ${cutoff.toISOString()}`);

  let processedCount = 0;
  let errorCount = 0;

  try {
    // ---------------------------------------------------
    // 1️⃣ Confirm or release earned points
    // ---------------------------------------------------
    console.log("💰 Processing earned points...");
    const pendingEarns = await db.blkpoints_ledger.findMany({
      where: { 
        type: 'earn', 
        status: 'pending', 
        created_at: { lte: cutoff } 
      }
    });

    for (const tx of pendingEarns) {
      try {
        const booking = await db.bookings.findUnique({ 
          where: { id: tx.booking_id } 
        });
        
        if (!booking) {
          console.warn(`⚠️ Booking ${tx.booking_id} not found for transaction ${tx.id}`);
          continue;
        }

        if (booking.status === 'completed') {
          await confirmPoints(tx, db, notifyUser);
          processedCount++;
        } else if (['cancelled', 'refunded'].includes(booking.status)) {
          await releasePoints(tx, db, notifyUser);
          processedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing earned points transaction ${tx.id}:`, error);
        errorCount++;
      }
    }

    // ---------------------------------------------------
    // 2️⃣ Confirm or release referral bonuses
    // ---------------------------------------------------
    console.log("🎁 Processing referral bonuses...");
    const pendingReferrals = await db.blkpoints_ledger.findMany({
      where: { 
        type: 'referral', 
        status: 'pending', 
        created_at: { lte: cutoff } 
      }
    });

    for (const tx of pendingReferrals) {
      try {
        const booking = await db.bookings.findUnique({ 
          where: { id: tx.booking_id } 
        });
        
        if (!booking) {
          console.warn(`⚠️ Booking ${tx.booking_id} not found for referral ${tx.id}`);
          continue;
        }

        if (booking.status === 'completed') {
          await confirmReferral(tx, db, notifyUser);
          processedCount++;
        } else if (['cancelled', 'refunded'].includes(booking.status)) {
          await releaseReferral(tx, db, notifyUser);
          processedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing referral transaction ${tx.id}:`, error);
        errorCount++;
      }
    }

    // ---------------------------------------------------
    // 3️⃣ Confirm or release redemptions (deduct BlkPoints)
    // ---------------------------------------------------
    console.log("💸 Processing redemptions...");
    const pendingRedemptions = await db.blkpoints_ledger.findMany({
      where: { 
        type: 'redeem', 
        status: 'pending', 
        created_at: { lte: cutoff } 
      }
    });

    for (const tx of pendingRedemptions) {
      try {
        const booking = await db.bookings.findUnique({ 
          where: { id: tx.booking_id } 
        });
        
        if (!booking) {
          console.warn(`⚠️ Booking ${tx.booking_id} not found for redemption ${tx.id}`);
          continue;
        }

        if (booking.status === 'completed') {
          await confirmRedemption(tx, db, notifyUser);
          processedCount++;
        } else if (['cancelled', 'refunded'].includes(booking.status)) {
          await releaseRedemption(tx, db, notifyUser);
          processedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing redemption transaction ${tx.id}:`, error);
        errorCount++;
      }
    }

    // ---------------------------------------------------
    // 4️⃣ Clean up expired OTP codes
    // ---------------------------------------------------
    console.log("🧹 Cleaning up expired OTP codes...");
    const deletedOTPs = await db.otpCodes.deleteMany({
      where: { expires_at: { lt: new Date() } }
    });
    
    if (deletedOTPs.count > 0) {
      console.log(`🗑️ Deleted ${deletedOTPs.count} expired OTP codes`);
    }

    // ---------------------------------------------------
    // 5️⃣ Update redemption cap tracking
    // ---------------------------------------------------
    console.log("📊 Updating redemption cap analytics...");
    await updateRedemptionCapAnalytics(db);

    console.log("✅ Loyalty Engine run complete.");
    console.log(`📈 Processed: ${processedCount} transactions`);
    console.log(`❌ Errors: ${errorCount} transactions`);
    
    return {
      success: true,
      processed: processedCount,
      errors: errorCount,
      timestamp: now
    };

  } catch (error) {
    console.error("💥 Critical error in Loyalty Engine:", error);
    return {
      success: false,
      error: error.message,
      timestamp: now
    };
  }
}

// =====================================================
// 🧮 Helper Functions
// =====================================================

/**
 * confirmPoints()
 * Confirms earned points and adds them to user balance
 */
async function confirmPoints(tx, db, notifyUser) {
  // Update user balance
  await db.users.update({
    where: { id: tx.user_id },
    data: { blkpoints_balance: { increment: tx.points_change } }
  });

  // Update transaction status
  await db.blkpoints_ledger.update({
    where: { id: tx.id },
    data: { 
      status: 'confirmed', 
      notes: 'Points confirmed after 24 h',
      confirmed_at: new Date()
    }
  });

  // Send notification
  const pointsValue = (tx.points_change * 0.01).toFixed(2);
  await notifyUser(tx.user_id, {
    type: 'points_confirmed',
    title: '🎉 BlkPoints Added!',
    message: `${tx.points_change} BlkPoints (£${pointsValue}) have been added to your account!`,
    data: {
      points: tx.points_change,
      value: pointsValue,
      booking_id: tx.booking_id
    }
  });

  console.log(`✅ Confirmed ${tx.points_change} points for user ${tx.user_id}`);
}

/**
 * releasePoints()
 * Releases (cancels) earned points due to booking cancellation
 */
async function releasePoints(tx, db, notifyUser) {
  // Update transaction status
  await db.blkpoints_ledger.update({
    where: { id: tx.id },
    data: { 
      status: 'released', 
      notes: 'Booking cancelled or refunded',
      confirmed_at: new Date()
    }
  });

  // Send notification
  await notifyUser(tx.user_id, {
    type: 'points_released',
    title: '❌ BlkPoints Cancelled',
    message: `Your BlkPoints from booking #${tx.booking_id} were cancelled and returned to your balance.`,
    data: {
      points: tx.points_change,
      booking_id: tx.booking_id
    }
  });

  console.log(`🔄 Released ${tx.points_change} points for user ${tx.user_id}`);
}

/**
 * confirmReferral()
 * Confirms referral bonus and adds to referrer's balance
 */
async function confirmReferral(tx, db, notifyUser, io = null) {
  // Update user balance (mock database)
  const user = db.users.get(tx.user_id);
  if (user) {
    user.blkpoints_balance = (user.blkpoints_balance || 0) + tx.points_change;
    db.users.set(tx.user_id, user);
  }

  // Update transaction status (mock database)
  const ledgerEntry = db.blkpoints_ledger.find(l => l.id === tx.id);
  if (ledgerEntry) {
    ledgerEntry.status = 'confirmed';
    ledgerEntry.notes = 'Referral confirmed after 24 h';
    ledgerEntry.confirmed_at = new Date();
  }

  // Send real-time notification
  if (io) {
    io.to(`user-${tx.user_id}`).emit('referral_notification', {
      type: 'confirmed',
      message: '🎉 Your 100 BlkPoints have been added to your balance!',
      points: tx.points_change,
      status: 'confirmed'
    });
  }

  // Send notification
  const pointsValue = (tx.points_change * 0.01).toFixed(2);
  await notifyUser(tx.user_id, {
    type: 'referral_confirmed',
    title: '🎁 Referral Bonus!',
    message: `Your friend's booking is complete! You've just received ${tx.points_change} BlkPoints (£${pointsValue}).`,
    data: {
      points: tx.points_change,
      value: pointsValue,
      booking_id: tx.booking_id
    }
  });

  console.log(`✅ Confirmed referral bonus ${tx.points_change} points for user ${tx.user_id}`);
}

/**
 * releaseReferral()
 * Releases referral bonus due to booking cancellation
 */
async function releaseReferral(tx, db, notifyUser) {
  // Update transaction status
  await db.blkpoints_ledger.update({
    where: { id: tx.id },
    data: { 
      status: 'released', 
      notes: 'Referral booking cancelled/refunded',
      confirmed_at: new Date()
    }
  });

  // Send notification
  await notifyUser(tx.user_id, {
    type: 'referral_released',
    title: 'ℹ️ Referral Update',
    message: `Your friend's booking was cancelled. The referral reward wasn't applied.`,
    data: {
      points: tx.points_change,
      booking_id: tx.booking_id
    }
  });

  console.log(`🔄 Released referral bonus ${tx.points_change} points for user ${tx.user_id}`);
}

/**
 * confirmRedemption()
 * Confirms redemption and deducts points from user balance
 */
async function confirmRedemption(tx, db, notifyUser) {
  // Update user balance (deduct points)
  await db.users.update({
    where: { id: tx.user_id },
    data: { blkpoints_balance: { decrement: Math.abs(tx.points_change) } }
  });

  // Update transaction status
  await db.blkpoints_ledger.update({
    where: { id: tx.id },
    data: { 
      status: 'confirmed', 
      notes: 'Redemption finalised after 24 h',
      confirmed_at: new Date()
    }
  });

  // Optional notification (can be disabled if too noisy)
  const pointsValue = (Math.abs(tx.points_change) * 0.01).toFixed(2);
  await notifyUser(tx.user_id, {
    type: 'redemption_confirmed',
    title: '✅ Redemption Complete',
    message: `Your BlkPoints redemption of £${pointsValue} has been finalised.`,
    data: {
      points: Math.abs(tx.points_change),
      value: pointsValue,
      booking_id: tx.booking_id
    }
  });

  console.log(`✅ Confirmed redemption ${Math.abs(tx.points_change)} points for user ${tx.user_id}`);
}

/**
 * releaseRedemption()
 * Releases redemption and returns points to user balance
 */
async function releaseRedemption(tx, db, notifyUser) {
  // Update transaction status
  await db.blkpoints_ledger.update({
    where: { id: tx.id },
    data: { 
      status: 'released', 
      notes: 'Redemption cancelled - booking refunded',
      confirmed_at: new Date()
    }
  });

  // Send notification
  const pointsValue = (Math.abs(tx.points_change) * 0.01).toFixed(2);
  await notifyUser(tx.user_id, {
    type: 'redemption_released',
    title: '🔄 Redemption Cancelled',
    message: `Your booking was cancelled. Your £${pointsValue} BlkPoints redemption has been returned to your balance.`,
    data: {
      points: Math.abs(tx.points_change),
      value: pointsValue,
      booking_id: tx.booking_id
    }
  });

  console.log(`🔄 Released redemption ${Math.abs(tx.points_change)} points for user ${tx.user_id}`);
}

// =====================================================
// 💬 Notification System
// =====================================================

/**
 * notifyUser()
 * Centralized notification system - sends messages via multiple channels
 * Only sends when there's an actual status change
 */
async function notifyUser(userId, notification) {
  try {
    const user = await db.users.findUnique({ 
      where: { id: userId },
      select: {
        id: true,
        email: true,
        mobile_number: true,
        notification_preferences: true
      }
    });
    
    if (!user) {
      console.warn(`⚠️ User ${userId} not found for notification`);
      return;
    }

    // Check user notification preferences
    const preferences = user.notification_preferences || {
      email: true,
      sms: true,
      push: true
    };

    // Send email notification
    if (preferences.email && user.email) {
      await sendEmailNotification(user.email, notification);
    }

    // Send SMS notification
    if (preferences.sms && user.mobile_number) {
      await sendSMSNotification(user.mobile_number, notification);
    }

    // Send push notification
    if (preferences.push) {
      await sendPushNotification(userId, notification);
    }

    // Log notification
    console.log(`📲 Notified user ${userId} (${user.email || user.mobile_number}): ${notification.title}`);

  } catch (error) {
    console.error(`❌ Error sending notification to user ${userId}:`, error);
  }
}

/**
 * sendEmailNotification()
 * Send email via your preferred email service
 */
async function sendEmailNotification(email, notification) {
  // Example with SendGrid, Nodemailer, etc.
  console.log(`📧 Email to ${email}: ${notification.title} - ${notification.message}`);
  
  // Uncomment and configure your email service:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  await sgMail.send({
    to: email,
    from: 'noreply@blkpages.com',
    subject: notification.title,
    html: `
      <h2>${notification.title}</h2>
      <p>${notification.message}</p>
      <p>Best regards,<br>The BlkPages Team</p>
    `
  });
  */
}

/**
 * sendSMSNotification()
 * Send SMS via Twilio, AWS SNS, etc.
 */
async function sendSMSNotification(mobileNumber, notification) {
  console.log(`📱 SMS to ${mobileNumber}: ${notification.message}`);
  
  // Uncomment and configure your SMS service:
  /*
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  await client.messages.create({
    body: `${notification.title}: ${notification.message}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: mobileNumber
  });
  */
}

/**
 * sendPushNotification()
 * Send push notification via Firebase, OneSignal, etc.
 */
async function sendPushNotification(userId, notification) {
  console.log(`🔔 Push to user ${userId}: ${notification.title}`);
  
  // Uncomment and configure your push service:
  /*
  const admin = require('firebase-admin');
  
  const message = {
    notification: {
      title: notification.title,
      body: notification.message
    },
    data: notification.data,
    topic: `user_${userId}`
  };
  
  await admin.messaging().send(message);
  */
}

// =====================================================
// 📊 Analytics & Monitoring
// =====================================================

/**
 * updateRedemptionCapAnalytics()
 * Update analytics for redemption cap monitoring
 */
async function updateRedemptionCapAnalytics(db) {
  try {
    // Get users approaching redemption limit
    const nearLimitUsers = await db.$queryRaw`
      SELECT 
        u.id,
        u.email,
        u.mobile_number,
        COALESCE(SUM(ABS(bl.points_change)), 0) as used_amount,
        ROUND((COALESCE(SUM(ABS(bl.points_change)), 0) / 5000) * 100, 2) as usage_percentage
      FROM users u
      LEFT JOIN blkpoints_ledger bl ON u.id = bl.user_id 
        AND bl.type = 'redeem' 
        AND bl.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      WHERE u.is_verified = TRUE
      GROUP BY u.id, u.email, u.mobile_number
      HAVING usage_percentage >= 80
      ORDER BY usage_percentage DESC
    `;

    if (nearLimitUsers.length > 0) {
      console.log(`⚠️ ${nearLimitUsers.length} users approaching redemption limit`);
      
      // Optional: Send admin alerts for users at 90%+ usage
      const criticalUsers = nearLimitUsers.filter(user => user.usage_percentage >= 90);
      if (criticalUsers.length > 0) {
        console.log(`🚨 ${criticalUsers.length} users at critical redemption limit`);
        // await sendAdminAlert(criticalUsers);
      }
    }

  } catch (error) {
    console.error('❌ Error updating redemption cap analytics:', error);
  }
}

// =====================================================
// ⚙️ Scheduling & Setup
// =====================================================

/**
 * setupLoyaltyEngine()
 * Initialize the loyalty engine with cron jobs
 */
function setupLoyaltyEngine(db) {
  console.log("🚀 Setting up BlkPages Loyalty Engine...");

  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log("⏰ Hourly loyalty engine run starting...");
    await runLoyaltyEngine(db, notifyUser);
  });

  // Run every 6 hours for more frequent processing
  cron.schedule('0 */6 * * *', async () => {
    console.log("⏰ 6-hourly loyalty engine run starting...");
    await runLoyaltyEngine(db, notifyUser);
  });

  // Daily cleanup at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log("🧹 Daily cleanup starting...");
    
    // Clean up old OTP codes
    await db.otpCodes.deleteMany({
      where: { 
        expires_at: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      }
    });

    // Clean up old ledger entries (optional - keep for audit)
    // await db.blkpointsLedger.deleteMany({
    //   where: { 
    //     created_at: { lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } 
    //   }
    // });
  });

  console.log("✅ Loyalty Engine scheduled successfully");
}

// =====================================================
// 🧪 Testing & Manual Triggers
// =====================================================

/**
 * runLoyaltyEngineManually()
 * For testing or manual execution
 */
async function runLoyaltyEngineManually(db) {
  console.log("🔧 Running Loyalty Engine manually...");
  const result = await runLoyaltyEngine(db, notifyUser);
  console.log("📊 Manual run result:", result);
  return result;
}

/**
 * testNotificationSystem()
 * Test the notification system
 */
async function testNotificationSystem(db, userId) {
  await notifyUser(userId, {
    type: 'test',
    title: '🧪 Test Notification',
    message: 'This is a test notification from the BlkPages Loyalty Engine.',
    data: { test: true }
  });
}

module.exports = {
  runLoyaltyEngine,
  runLoyaltyEngineManually,
  setupLoyaltyEngine,
  testNotificationSystem,
  notifyUser,
  confirmPoints,
  releasePoints,
  confirmReferral,
  releaseReferral,
  confirmRedemption,
  releaseRedemption
};
