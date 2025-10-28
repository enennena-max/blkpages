import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import pg from "pg";
import Stripe from "stripe";
import { createServer } from "http";
import { Server } from "socket.io";

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
      socket.join(`cust:${customerId}`);
      console.log(`Customer ${customerId} joined room: cust:${customerId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Helper function to emit updates to specific customer
function emitToCustomer(customerId, event, payload) {
  if (!customerId) return;
  io.to(`cust:${customerId}`).emit(event, payload);
  console.log(`Emitted ${event} to customer ${customerId}:`, payload);
}

// Make emitToCustomer available throughout the app
app.set('emitToCustomer', emitToCustomer);

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
    const { customerId, businessId, service, date, time, price, status = 'confirmed' } = req.body;
    const result = await pool.query(
      'INSERT INTO bookings (customer_id, business_id, service, date, time, price, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [customerId, businessId, service, date, time, price, status]
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
    
    // Get BlkPoints
    const blkPointsResult = await pool.query(
      'SELECT points FROM customer_loyalty WHERE customer_id = $1',
      [customerId]
    );
    
    // Get business-specific loyalty
    const businessLoyaltyResult = await pool.query(
      'SELECT business_id, stamps, goal FROM business_loyalty WHERE customer_id = $1',
      [customerId]
    );
    
    const response = {
      blkpoints: {
        points: blkPointsResult.rows[0]?.points || 0,
        value: (blkPointsResult.rows[0]?.points || 0) / 1000 * 5
      },
      businessRewards: businessLoyaltyResult.rows
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
    
    const result = await pool.query(
      'INSERT INTO loyalty_transactions (customer_id, points, reason) VALUES ($1, $2, $3) RETURNING *',
      [customerId, points, reason]
    );
    
    // Update total points
    await pool.query(
      'UPDATE customer_loyalty SET points = points + $1 WHERE customer_id = $2',
      [points, customerId]
    );
    
    // Get updated total
    const totalResult = await pool.query(
      'SELECT points FROM customer_loyalty WHERE customer_id = $1',
      [customerId]
    );
    
    const newTotal = totalResult.rows[0]?.points || 0;
    
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
});

export default app;
