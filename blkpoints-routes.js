/**
 * BlkPoints API Routes
 * Clean Express routes using the blkpoints-service
 */

const express = require('express');
const router = express.Router();
const blkpointsService = require('./blkpoints-service');
const {
  POINT_VALUE_GBP,
  MIN_REDEEM_GBP,
  MIN_REDEEM_POINTS
} = require('./blkpoints-constants');

/**
 * GET /api/blkpoints
 * Get user's BlkPoints balance and status
 */
router.get('/api/blkpoints', async (req, res) => {
  try {
    const userId = req.user?.id || 'user-123'; // Mock user ID
    const db = req.app.locals.db; // Assume db is attached to app.locals
    
    const status = await blkpointsService.getBlkPointsStatus(userId, db);
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Error fetching BlkPoints:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch BlkPoints balance'
    });
  }
});

/**
 * POST /api/blkpoints/redeem
 * Redeem points for GBP credit
 */
router.post('/api/blkpoints/redeem', async (req, res) => {
  try {
    const userId = req.user?.id || 'user-123';
    const { points, idem, bookingAmountGBP } = req.body;
    const db = req.app.locals.db;
    
    if (!points || typeof points !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Points amount required'
      });
    }
    
    // Generate idempotency key if not provided
    const idempotencyKey = idem || `redeem-${userId}-${Date.now()}`;
    
    const valueGBP = await blkpointsService.redeemPoints(
      { userId, points, idem: idempotencyKey, bookingAmountGBP },
      db
    );
    
    res.json({
      success: true,
      redeemedPoints: points,
      valueGBP: +valueGBP.toFixed(2),
      message: `Redeemed ${points} points (£${valueGBP.toFixed(2)})`
    });
  } catch (error) {
    console.error('Error redeeming BlkPoints:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Redemption failed'
    });
  }
});

/**
 * GET /api/blkpoints/constants
 * Expose constants for frontend use
 */
router.get('/api/blkpoints/constants', (req, res) => {
  res.json({
    POINT_VALUE_GBP,
    MIN_REDEEM_GBP,
    MIN_REDEEM_POINTS,
    POINT_RATE: 1
  });
});

module.exports = router;

