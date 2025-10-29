/**
 * BlkPoints Frontend Validation Helper
 * 
 * Use this on checkout/booking pages where users apply BlkPoints.
 * Provides real-time validation feedback before submitting redemption.
 * 
 * DO NOT use on dashboard/profile pages - only viewing balances there.
 */

/**
 * Get BlkPoints redemption validation error message
 * @param {Object} params
 * @param {number} params.bookingAmountGBP - Current booking total in GBP
 * @param {number} params.pointsToRedeem - Points user wants to redeem
 * @param {number} params.userPoints - User's current balance
 * @returns {string} Error message (empty string if valid)
 */
function getBlkPointsError({ bookingAmountGBP, pointsToRedeem, userPoints }) {
  const POINT_VALUE_GBP = 0.01; // 1 point = £0.01
  const MIN_REDEEM_GBP = 5; // £5 minimum
  const MIN_REDEEM_POINTS = MIN_REDEEM_GBP / POINT_VALUE_GBP; // 500 points

  const redeemValueGBP = pointsToRedeem * POINT_VALUE_GBP;

  // Rule 1: Minimum redemption
  if (pointsToRedeem > 0 && pointsToRedeem < MIN_REDEEM_POINTS) {
    return `You need at least £${MIN_REDEEM_GBP.toFixed(2)} (${MIN_REDEEM_POINTS} points) to redeem.`;
  }

  // Rule 2: Check user balance
  if (pointsToRedeem > userPoints) {
    return `You don't have enough BlkPoints. You have ${userPoints} points (£${(userPoints * POINT_VALUE_GBP).toFixed(2)}).`;
  }

  // Rule 3: Minimum order value (only if booking amount provided)
  if (bookingAmountGBP !== undefined && bookingAmountGBP !== null) {
    const minOrderRequired = redeemValueGBP * 2;
    if (bookingAmountGBP < minOrderRequired) {
      return `Your booking total must be at least £${minOrderRequired.toFixed(2)} to redeem £${redeemValueGBP.toFixed(2)}.`;
    }

    // Rule 3b: Maximum redemption (50% of booking total)
    const maxRedeemGBP = bookingAmountGBP * 0.5;
    const maxRedeemPoints = Math.floor(maxRedeemGBP / POINT_VALUE_GBP);
    if (redeemValueGBP > maxRedeemGBP) {
      return `You can only redeem up to 50% of your booking (£${maxRedeemGBP.toFixed(2)} = ${maxRedeemPoints} points).`;
    }
  }

  return ''; // ✅ No errors — redemption valid
}

/**
 * Validate BlkPoints redemption (returns validation result object)
 * @param {Object} params
 * @param {number} params.bookingAmountGBP - Current booking total in GBP
 * @param {number} params.pointsToRedeem - Points user wants to redeem
 * @param {number} params.userPoints - User's current balance
 * @returns {Object} { valid: boolean, error: string, maxRedeemable: number }
 */
function validateBlkPointsRedemption({ bookingAmountGBP, pointsToRedeem, userPoints }) {
  const POINT_VALUE_GBP = 0.01;
  const MIN_REDEEM_POINTS = 500;

  const error = getBlkPointsError({ bookingAmountGBP, pointsToRedeem, userPoints });
  const valid = !error && pointsToRedeem >= MIN_REDEEM_POINTS && pointsToRedeem <= userPoints;

  // Calculate maximum redeemable points
  let maxRedeemable = userPoints;
  if (bookingAmountGBP !== undefined && bookingAmountGBP !== null) {
    const maxRedeemGBP = bookingAmountGBP * 0.5;
    const maxRedeemPoints = Math.floor(maxRedeemGBP / POINT_VALUE_GBP);
    maxRedeemable = Math.min(userPoints, maxRedeemPoints);
  }

  return {
    valid,
    error,
    maxRedeemable
  };
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getBlkPointsError,
    validateBlkPointsRedemption
  };
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
  window.getBlkPointsError = getBlkPointsError;
  window.validateBlkPointsRedemption = validateBlkPointsRedemption;
}

