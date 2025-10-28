import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import pg from "pg";
import Stripe from "stripe";
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeCronJobs, processRefund } from "./cronJobs.js";
import { 
  ensureReferralCode, 
  getReferralCode, 
  createReferral, 
  getReferralStats,
  submitReview,
  verifyReview,
  getReviewStats,
  getOrCreateReferralCode,
  getCurrentReferralCode,
  getReferralCodeStats,
  useReferralCode
} from "./rewards.js";
import { attachUserFromAuth } from "./middleware/auth.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Database connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(attachUserFromAuth); // <- ensure req.user populated if Authorization present

// ===== SOCKET.IO SETUP =====
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// When a user connects
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('register', ({ customerId }) => {
    if (customerId) {
      socket.join(`customer_${customerId}`);
      console.log(`Customer ${customerId} joined room: customer_${customerId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Helper function to emit updates to specific customer
function emitToCustomer(customerId, event, payload) {
  if (!customerId) return;
  io.to(`customer_${customerId}`).emit(event, payload);
  console.log(`Emitted ${event} to customer ${customerId}:`, payload);
}

// Make emitToCustomer available throughout the app
app.set('emitToCustomer', emitToCustomer);

// Initialize cron jobs with Socket.IO instance
initializeCronJobs(io);

// ===== API ROUTES =====

// Bookings API
app.get('/api/bookings', async (req, res) => {
  try {
    const { customerId } = req.query;
    const result = await pool.query(
      'SELECT * FROM bookings WHERE customer_id = $1 ORDER BY date DESC',
      [customerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { 
      customerId, 
      businessId, 
      service, 
      date, 
      time, 
      price, 
      totalAmount, 
      startTime, 
      endTime, 
      customerEmail, 
      status = 'confirmed' 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO bookings (
        customer_id, business_id, service, date, time, price, total_amount, 
        start_time, end_time, customer_email, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [customerId, businessId, service, date, time, price, totalAmount || price, startTime, endTime, customerEmail, status]
    );
    
    // Emit real-time update
    emitToCustomer(customerId, 'booking_status_changed', { 
      bookingId: result.rows[0].id, 
      status: result.rows[0].status 
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, customerId } = req.body;
    
    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length > 0) {
      // Emit real-time update
      emitToCustomer(customerId, 'booking_status_changed', { 
        bookingId: id, 
        status: status 
      });
      
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Booking not found' });
    }
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Payments API
app.get('/api/payments', async (req, res) => {
  try {
    const { customerId } = req.query;
    const result = await pool.query(
      'SELECT * FROM payments WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const { customerId, amount, currency = 'GBP', status = 'completed', bookingId } = req.body;
    const result = await pool.query(
      'INSERT INTO payments (customer_id, amount, currency, status, booking_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [customerId, amount, currency, status, bookingId]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Loyalty API
app.get('/api/loyalty', async (req, res) => {
  try {
    const { customerId } = req.query;
    
    // Get BlkPoints from users table
    const blkPointsResult = await pool.query(
      'SELECT points_balance FROM users WHERE id = $1',
      [customerId]
    );
    
    // Get business-specific loyalty from loyalty_cards table
    const businessLoyaltyResult = await pool.query(
      'SELECT business_id, stamps FROM loyalty_cards WHERE customer_id = $1',
      [customerId]
    );
    
    const response = {
      blkpoints: {
        points: blkPointsResult.rows[0]?.points_balance || 0,
        value: (blkPointsResult.rows[0]?.points_balance || 0) / 1000 * 5
      },
      businessRewards: businessLoyaltyResult.rows.map(row => ({
        business_id: row.business_id,
        stamps: row.stamps,
        goal: 10 // Assuming 10 stamps for reward
      }))
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error fetching loyalty data:', err);
    res.status(500).json({ error: 'Failed to fetch loyalty data' });
  }
});

app.post('/api/loyalty/add-points', async (req, res) => {
  try {
    const { customerId, points, reason } = req.body;
    
    // Insert points activity record
    const result = await pool.query(
      'INSERT INTO points_activity (user_id, points, source) VALUES ($1, $2, $3) RETURNING *',
      [customerId, points, reason]
    );
    
    // Update user's points balance
    await pool.query(
      'UPDATE users SET points_balance = points_balance + $1 WHERE id = $2',
      [points, customerId]
    );
    
    // Get updated total
    const totalResult = await pool.query(
      'SELECT points_balance FROM users WHERE id = $1',
      [customerId]
    );
    
    const newTotal = totalResult.rows[0]?.points_balance || 0;
    
    // Emit real-time update
    emitToCustomer(customerId, 'loyalty_points_updated', { 
      points: newTotal,
      added: points,
      reason: reason
    });
    
    res.json({ success: true, newTotal });
  } catch (err) {
    console.error('Error adding loyalty points:', err);
    res.status(500).json({ error: 'Failed to add loyalty points' });
  }
});

// Reviews API
app.get('/api/reviews', async (req, res) => {
  try {
    const { customerId } = req.query;
    const result = await pool.query(
      'SELECT * FROM reviews WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { customerId, businessId, rating, comment } = req.body;
    const result = await pool.query(
      'INSERT INTO reviews (customer_id, business_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [customerId, businessId, rating, comment]
    );
    
    // Award points for review
    const emitToCustomer = app.get('emitToCustomer');
    emitToCustomer(customerId, 'loyalty_points_updated', { 
      points: 20, // Award 20 points for review
      reason: 'Review submitted'
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Notifications API
app.get('/api/notifications', async (req, res) => {
  try {
    const { customerId } = req.query;
    const result = await pool.query(
      'SELECT * FROM notifications WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 10',
      [customerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const { customerId, title, message, type = 'info', target } = req.body;
    const result = await pool.query(
      'INSERT INTO notifications (customer_id, title, message, type, target) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [customerId, title, message, type, target]
    );
    
    // Emit real-time notification
    emitToCustomer(customerId, 'new_notification', { 
      title,
      message,
      type,
      target,
      id: result.rows[0].id
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Stripe webhook for payment confirmations
app.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log('Payment succeeded:', paymentIntent.id);
    
    // Here you would update your database and emit real-time updates
    // emitToCustomer(customerId, 'payment_confirmed', { paymentIntentId: paymentIntent.id });
  }

  res.json({received: true});
});

// Refund processing endpoint
app.post('/api/bookings/:id/refund', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId } = req.body;
    
    // Process refund and reverse points
    const result = await processRefund(parseInt(id), customerId);
    
    res.json({ 
      success: true, 
      message: 'Refund processed successfully',
      pointsReversed: result.pointsReversed,
      bookingId: result.bookingId
    });
  } catch (err) {
    console.error('Error processing refund:', err);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// ──────────────────────────────
//  REFERRAL SYSTEM ENDPOINTS
// ──────────────────────────────

// Get or generate referral code for user
app.get('/api/referral/code', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const referralCode = await ensureReferralCode(parseInt(userId));
    const referralUrl = `${process.env.FRONTEND_URL || 'https://blkpages.com'}/register?ref=${referralCode}`;
    
    res.json({
      success: true,
      referralCode,
      referralUrl,
      message: 'Invite friends and earn +100 BlkPoints when they complete their first booking!'
    });
  } catch (err) {
    console.error('Error getting referral code:', err);
    res.status(500).json({ error: 'Failed to get referral code' });
  }
});

// Create referral during user registration
app.post('/api/referral/create', async (req, res) => {
  try {
    const { referralCode, refereeEmail } = req.body;
    
    if (!referralCode || !refereeEmail) {
      return res.status(400).json({ error: 'Referral code and email are required' });
    }
    
    const result = await createReferral(referralCode, refereeEmail);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Referral created successfully',
        referrerId: result.referrerId
      });
    } else {
      res.status(400).json({
        success: false,
        reason: result.reason
      });
    }
  } catch (err) {
    console.error('Error creating referral:', err);
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

// Get referral statistics for user
app.get('/api/referral/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const stats = await getReferralStats(parseInt(userId));
    
    res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error('Error getting referral stats:', err);
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
});

// ──────────────────────────────
//  DYNAMIC REFERRAL CODE ENDPOINTS
// ──────────────────────────────

// Get or create dynamic referral code for dashboard
app.get('/api/referral-code', async (req, res) => {
  try {
    const { customerId } = req.query;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    const code = await getOrCreateReferralCode(parseInt(customerId));
    const referralUrl = `${process.env.FRONTEND_URL || 'https://blkpages.com'}/referral/${code}`;
    
    res.json({
      success: true,
      code,
      referralUrl,
      message: 'Invite friends and earn +100 BlkPoints when they complete their first booking!'
    });
  } catch (err) {
    console.error('Error getting referral code:', err);
    res.status(500).json({ error: 'Failed to get referral code' });
  }
});

// Get current active referral code
app.get('/api/referral-code/current', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const code = await getCurrentReferralCode(parseInt(userId));
    
    res.json({
      success: true,
      code,
      hasActiveCode: !!code
    });
  } catch (err) {
    console.error('Error getting current referral code:', err);
    res.status(500).json({ error: 'Failed to get current referral code' });
  }
});

// Get referral code statistics
app.get('/api/referral-code/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const stats = await getReferralCodeStats(parseInt(userId));
    
    res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error('Error getting referral code stats:', err);
    res.status(500).json({ error: 'Failed to get referral code stats' });
  }
});

// Use referral code during registration (updated)
app.post('/api/referral/use', async (req, res) => {
  try {
    const { referralCode, refereeEmail } = req.body;
    
    if (!referralCode || !refereeEmail) {
      return res.status(400).json({ error: 'Referral code and email are required' });
    }
    
    const result = await useReferralCode(referralCode, refereeEmail);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Referral code used successfully',
        referrerId: result.referrerId,
        newCode: result.newCode
      });
    } else {
      res.status(400).json({
        success: false,
        reason: result.reason
      });
    }
  } catch (err) {
    console.error('Error using referral code:', err);
    res.status(500).json({ error: 'Failed to use referral code' });
  }
});

// ──────────────────────────────
//  VERIFIED REVIEW ENDPOINTS
// ──────────────────────────────

// Submit a review
app.post('/api/reviews/submit', async (req, res) => {
  try {
    const { bookingId, userId, rating, text } = req.body;
    
    if (!bookingId || !userId || !rating || !text) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const result = await submitReview(parseInt(bookingId), parseInt(userId), rating, text);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Review submitted successfully. It will be verified by our team.',
        review: result.review
      });
    } else {
      res.status(400).json({
        success: false,
        reason: result.reason
      });
    }
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Verify a review (admin endpoint)
app.post('/api/reviews/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await verifyReview(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Review verified successfully. Points will be released in 24 hours.',
        review: result.review
      });
    } else {
      res.status(400).json({
        success: false,
        reason: result.reason
      });
    }
  } catch (err) {
    console.error('Error verifying review:', err);
    res.status(500).json({ error: 'Failed to verify review' });
  }
});

// Get review statistics for user
app.get('/api/reviews/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const stats = await getReviewStats(parseInt(userId));
    
    res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error('Error getting review stats:', err);
    res.status(500).json({ error: 'Failed to get review stats' });
  }
});

// Get user's reviews
app.get('/api/reviews/user', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const { rows: reviews } = await pool.query(`
      SELECT r.*, b.service, b.date, b.time
      FROM reviews r
      JOIN bookings b ON r.booking_id = b.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      reviews
    });
  } catch (err) {
    console.error('Error getting user reviews:', err);
    res.status(500).json({ error: 'Failed to get user reviews' });
  }
});

// Mount admin routes (secure admin APIs)
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 API + Socket.IO on :${PORT}`);
  console.log(`📊 Database connected: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
  console.log(`💳 Stripe configured: ${process.env.STRIPE_SECRET_KEY ? 'Yes' : 'No'}`);
  console.log(`🕐 Cron jobs initialized: Auto-complete & Points release`);
});

export default app;
