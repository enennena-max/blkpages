// Utility functions for BlkPages booking system

/**
 * Generate a secure cancellation token for guest users
 * @param {string} bookingId - The booking ID
 * @param {string} customerEmail - The customer's email
 * @param {number} expiryHours - Hours until token expires (default: 24)
 * @returns {string} Secure token
 */
function generateSecureToken(bookingId, customerEmail, expiryHours = 24) {
    // In a real application, this would use a secure random generator
    // and be stored server-side with proper encryption
    const timestamp = Date.now();
    const expiry = timestamp + (expiryHours * 60 * 60 * 1000);
    
    // Create a simple hash (in production, use proper crypto)
    const data = `${bookingId}-${customerEmail}-${timestamp}-${expiry}`;
    const token = btoa(data).replace(/[^a-zA-Z0-9]/g, '');
    
    return token;
}

/**
 * Validate a secure token
 * @param {string} bookingId - The booking ID
 * @param {string} token - The token to validate
 * @returns {boolean} Whether the token is valid
 */
function validateSecureToken(bookingId, token) {
    try {
        // Decode the token
        const decoded = atob(token);
        const parts = decoded.split('-');
        
        if (parts.length !== 4) return false;
        
        const [tokenBookingId, email, timestamp, expiry] = parts;
        
        // Check if booking ID matches
        if (tokenBookingId !== bookingId) return false;
        
        // Check if token has expired
        const now = Date.now();
        if (now > parseInt(expiry)) return false;
        
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Generate cancellation URL for guest users
 * @param {string} bookingId - The booking ID
 * @param {string} customerEmail - The customer's email
 * @param {string} baseUrl - The base URL of the application
 * @returns {string} Cancellation URL
 */
function generateCancellationUrl(bookingId, customerEmail, baseUrl = '') {
    const token = generateSecureToken(bookingId, customerEmail);
    return `${baseUrl}/cancel-booking.html?booking=${bookingId}&token=${token}`;
}

/**
 * Check if a booking can be cancelled based on business policy
 * @param {Object} booking - The booking object
 * @param {Object} businessPolicy - The business's cancellation policy
 * @returns {Object} Cancellation status and fee
 */
function checkCancellationEligibility(booking, businessPolicy) {
    const now = new Date();
    const bookingDate = new Date(booking.dateTime);
    const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);
    
    // Check if booking is in the past
    if (hoursUntilBooking < 0) {
        return {
            canCancel: false,
            reason: 'Booking is in the past',
            fee: 0
        };
    }
    
    // Check business policy
    if (!businessPolicy.allowCancellation) {
        return {
            canCancel: false,
            reason: 'Business does not allow cancellations',
            fee: 0
        };
    }
    
    // Check time-based policy
    if (hoursUntilBooking < businessPolicy.freeCancellationHours) {
        if (hoursUntilBooking < businessPolicy.partialRefundHours) {
            return {
                canCancel: true,
                reason: 'Within partial refund window',
                fee: businessPolicy.partialRefundFee
            };
        } else {
            return {
                canCancel: false,
                reason: 'Too close to booking time',
                fee: 0
            };
        }
    }
    
    return {
        canCancel: true,
        reason: 'Free cancellation',
        fee: 0
    };
}

/**
 * Format currency amount
 * @param {number} amount - The amount in pence
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
    }).format(amount / 100);
}

/**
 * Generate booking reference
 * @returns {string} Unique booking reference
 */
function generateBookingReference() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `BP${timestamp}${random}`.toUpperCase();
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateSecureToken,
        validateSecureToken,
        generateCancellationUrl,
        checkCancellationEligibility,
        formatCurrency,
        generateBookingReference
    };
}
