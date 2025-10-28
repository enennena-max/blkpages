// backend/routes/admin.js
import express from "express";
import db from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// ── Overview counts for dashboard cards
router.get("/overview", requireAdmin, async (_req, res) => {
  try {
    const [{ rows: r1 }, { rows: r2 }, { rows: r3 }] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS pending_reviews FROM reviews WHERE verified=false"),
      db.query("SELECT COUNT(*)::int AS pending_businesses FROM businesses WHERE approved=false"),
      db.query("SELECT COUNT(*)::int AS disputes FROM bookings WHERE disputed=true"),
    ]);
    
    res.json({
      pending_reviews: r1[0].pending_reviews,
      pending_businesses: r2[0].pending_businesses,
      disputes: r3[0].disputes,
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ error: 'Failed to fetch overview data' });
  }
});

// ── Reviews: list unverified; verify one
router.get("/reviews", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT rv.id, rv.booking_id, rv.user_id, rv.rating, rv.text, rv.verified, rv.verified_at,
             u.email AS user_email, b.business_id, bus.name AS business_name
      FROM reviews rv
      LEFT JOIN users u ON u.id = rv.user_id
      LEFT JOIN bookings b ON b.id = rv.booking_id
      LEFT JOIN businesses bus ON bus.id = b.business_id
      WHERE rv.verified = false
      ORDER BY rv.id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post("/reviews/:id/verify", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      "UPDATE reviews SET verified=true, verified_at=NOW() WHERE id=$1",
      [id]
    );
    // The +25 BlkPoints release is handled by your cron after 24h; no points issued here.
    res.json({ ok: true, message: "Review verified (points will release after 24h)" });
  } catch (error) {
    console.error('Error verifying review:', error);
    res.status(500).json({ error: 'Failed to verify review' });
  }
});

// ── Businesses: list pending; approve one
router.get("/businesses", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT id, name, owner_user_id, approved, approved_at, created_at
      FROM businesses
      WHERE approved = false
      ORDER BY created_at ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching pending businesses:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

router.post("/businesses/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      "UPDATE businesses SET approved=true, approved_at=NOW() WHERE id=$1",
      [id]
    );
    res.json({ ok: true, message: "Business approved" });
  } catch (error) {
    console.error('Error approving business:', error);
    res.status(500).json({ error: 'Failed to approve business' });
  }
});

// ── Referrals
router.get("/referrals", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT r.id, u.email AS referrer_email, r.referee_email, r.status, r.created_at
      FROM referrals r
      LEFT JOIN users u ON u.id = r.referrer_id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

router.post("/referrals/:id/complete", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`
      UPDATE referrals SET status='completed' WHERE id=$1
    `, [id]);
    res.json({ ok: true, message: "Referral marked completed" });
  } catch (error) {
    console.error('Error completing referral:', error);
    res.status(500).json({ error: 'Failed to complete referral' });
  }
});

// ── Disputes
router.get("/disputes", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT b.id, b.customer_id, u.email AS customer_email, bus.name AS business_name,
             b.total_amount, b.status, b.disputed
      FROM bookings b
      LEFT JOIN users u ON u.id=b.customer_id
      LEFT JOIN businesses bus ON bus.id=b.business_id
      WHERE b.disputed=true
      ORDER BY b.id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching disputes:', error);
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

router.post("/disputes/:id/resolve", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("UPDATE bookings SET disputed=false WHERE id=$1", [id]);
    res.json({ ok: true, message: "Dispute resolved" });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

router.post("/disputes/:id/refund", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`
      UPDATE bookings SET status='refunded', disputed=false, refunded_at=NOW()
      WHERE id=$1
    `, [id]);
    res.json({ ok: true, message: "Booking refunded" });
  } catch (error) {
    console.error('Error refunding booking:', error);
    res.status(500).json({ error: 'Failed to refund booking' });
  }
});

// ── Points adjustments
router.post("/points/adjust", requireAdmin, async (req, res) => {
  try {
    const { user_id, amount, reason } = req.body;
    const pts = Number(amount);
    if (!user_id || !pts) return res.status(400).json({ error: "Missing user_id or amount" });
    
    await db.query(`
      INSERT INTO points_activity (user_id, points, source)
      VALUES ($1,$2,$3)
    `, [user_id, pts, reason || "Admin adjustment"]);
    
    await db.query("UPDATE users SET points_balance = points_balance + $1 WHERE id=$2", [pts, user_id]);
    
    res.json({ ok: true, message: "Points adjusted" });
  } catch (error) {
    console.error('Error adjusting points:', error);
    res.status(500).json({ error: 'Failed to adjust points' });
  }
});

export default router;
