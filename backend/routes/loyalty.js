// backend/routes/loyalty.js
import express from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// ──────────────────────────────
//  REDEMPTION ENDPOINTS
// ──────────────────────────────

// Apply redemption to booking
router.post("/redeem", requireAuth, async (req, res) => {
  try {
    const { booking_id, redemption_value, points } = req.body;
    const user_id = req.user.id;

    // Get booking details
    const bookingResult = await db.query(
      "SELECT total_amount, status FROM bookings WHERE id = $1 AND customer_id = $2",
      [booking_id, user_id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingResult.rows[0];

    // Validation checks
    if (booking.status !== "pending") {
      return res.status(400).json({ error: "Booking is not in pending status" });
    }

    if (booking.total_amount < redemption_value * 2) {
      return res.status(400).json({ 
        error: "Booking must be at least twice your redemption amount" 
      });
    }

    if (redemption_value > booking.total_amount / 2) {
      return res.status(400).json({ 
        error: "You can only redeem up to 50% of booking total" 
      });
    }

    // Check user balance
    const userResult = await db.query(
      "SELECT points_balance FROM users WHERE id = $1",
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userBalance = userResult.rows[0].points_balance;

    if (userBalance < points) {
      return res.status(400).json({ error: "Insufficient BlkPoints" });
    }

    // Create redemption record
    const redemptionResult = await db.query(
      `INSERT INTO redemptions (user_id, booking_id, points, value, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW())
       RETURNING id`,
      [user_id, booking_id, points, redemption_value]
    );

    res.json({
      success: true,
      message: "Redemption applied",
      redemption_id: redemptionResult.rows[0].id,
      booking_summary_updated: true
    });

  } catch (error) {
    console.error("Redemption error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's redemption history
router.get("/redemptions", requireAuth, async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await db.query(
      `SELECT r.*, b.id as booking_id, b.total_amount, b.status as booking_status,
              bus.name as business_name
       FROM redemptions r
       LEFT JOIN bookings b ON b.id = r.booking_id
       LEFT JOIN businesses bus ON bus.id = b.business_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [user_id]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Get redemptions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cancel a pending redemption
router.post("/redemptions/:id/cancel", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await db.query(
      `UPDATE redemptions 
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING *`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Redemption not found or cannot be cancelled" });
    }

    res.json({
      success: true,
      message: "Redemption cancelled"
    });

  } catch (error) {
    console.error("Cancel redemption error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────
//  POINTS BALANCE & ACTIVITY
// ──────────────────────────────

// Get user's current balance and pending redemptions
router.get("/balance", requireAuth, async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get current balance
    const balanceResult = await db.query(
      "SELECT points_balance FROM users WHERE id = $1",
      [user_id]
    );

    if (balanceResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentBalance = balanceResult.rows[0].points_balance;

    // Get pending redemptions
    const pendingResult = await db.query(
      `SELECT SUM(points) as pending_points, COUNT(*) as pending_count
       FROM redemptions 
       WHERE user_id = $1 AND status = 'pending'`,
      [user_id]
    );

    const pendingPoints = parseInt(pendingResult.rows[0].pending_points) || 0;
    const availableBalance = currentBalance - pendingPoints;

    res.json({
      current_balance: currentBalance,
      pending_points: pendingPoints,
      available_balance: availableBalance,
      pending_count: parseInt(pendingResult.rows[0].pending_count) || 0
    });

  } catch (error) {
    console.error("Get balance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get activity feed
router.get("/activity", requireAuth, async (req, res) => {
  try {
    const user_id = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const result = await db.query(
      `SELECT description, points_change, created_at, type
       FROM points_activity 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [user_id, limit]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Get activity error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
