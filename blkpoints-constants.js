/**
 * BlkPages BlkPoints Constants
 * Centralized constants for consistent calculations across backend and frontend
 */

export const POINT_VALUE_GBP = 0.01;          // 1 point = £0.01
export const MIN_REDEEM_GBP = 5;               // £5 minimum redemption
export const MIN_REDEEM_POINTS = MIN_REDEEM_GBP / POINT_VALUE_GBP; // 500 points

export const REDEMPTION_CAP_POINTS = 5000;     // £50 cap per rolling 30 days
export const REFERRAL_BONUS_POINTS = 100;
export const REVIEW_BONUS_POINTS = 25;
export const POINT_RATE = 1;                   // 1 point per £1 spent

export const CONFIRM_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Convert GBP amount to points (1 point per £1)
 */
export const poundsToPoints = (amountGBP) => Math.floor(amountGBP);

/**
 * Convert points to GBP value
 */
export const pointsToPounds = (points) => (points * POINT_VALUE_GBP);

/**
 * Check if user can redeem (has minimum required points)
 */
export const canRedeem = (points) => points >= MIN_REDEEM_POINTS;

// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    POINT_VALUE_GBP,
    MIN_REDEEM_GBP,
    MIN_REDEEM_POINTS,
    REDEMPTION_CAP_POINTS,
    REFERRAL_BONUS_POINTS,
    REVIEW_BONUS_POINTS,
    POINT_RATE,
    CONFIRM_DELAY_MS,
    THIRTY_DAYS_MS,
    poundsToPoints,
    pointsToPounds,
    canRedeem
  };
}

