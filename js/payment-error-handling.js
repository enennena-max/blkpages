/**
 * Payment Error Handling System
 * Handles payment failures, abandoned payments, and disputes/chargebacks
 */

class PaymentErrorHandling {
    constructor() {
        this.errorTypes = {
            PAYMENT_FAILED: 'payment_failed',
            PAYMENT_ABANDONED: 'payment_abandoned',
            DISPUTE_RAISED: 'dispute_raised',
            CHARGEBACK_RAISED: 'chargeback_raised',
            CARD_DECLINED: 'card_declined',
            INSUFFICIENT_FUNDS: 'insufficient_funds',
            EXPIRED_CARD: 'expired_card',
            NETWORK_ERROR: 'network_error'
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createErrorUI();
        this.setupPaymentMonitoring();
    }

    setupEventListeners() {
        // Listen for payment events
        document.addEventListener('paymentFailed', (e) => {
            this.handlePaymentFailure(e.detail);
        });

        document.addEventListener('paymentAbandoned', (e) => {
            this.handlePaymentAbandonment(e.detail);
        });

        document.addEventListener('disputeRaised', (e) => {
            this.handleDispute(e.detail);
        });

        document.addEventListener('chargebackRaised', (e) => {
            this.handleChargeback(e.detail);
        });

        // Listen for retry attempts
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-retry-payment]')) {
                e.preventDefault();
                this.retryPayment(e.target.dataset.bookingId);
            }
        });
    }

    createErrorUI() {
        // Create error modal
        const errorModalHTML = `
            <div id="paymentErrorModal" class="payment-error-modal" style="display: none;">
                <div class="payment-error-content">
                    <div class="payment-error-header">
                        <div class="error-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3 id="errorModalTitle">Payment Error</h3>
                        <button class="error-modal-close" onclick="document.getElementById('paymentErrorModal').style.display='none'">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="payment-error-body">
                        <div id="errorContent"></div>
                    </div>
                </div>
            </div>
        `;

        // Create error status messages
        const errorStatusHTML = `
            <div id="paymentErrorNotification" class="payment-error-notification" style="display: none;">
                <div class="error-notification-content">
                    <i class="fas fa-exclamation-circle"></i>
                    <div class="error-notification-text">
                        <h4>Payment Error</h4>
                        <p id="errorNotificationMessage"></p>
                    </div>
                </div>
            </div>
        `;

        // Create dispute notification
        const disputeNotificationHTML = `
            <div id="disputeNotification" class="dispute-notification" style="display: none;">
                <div class="dispute-notification-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="dispute-notification-text">
                        <h4>Payment Dispute</h4>
                        <p id="disputeNotificationMessage"></p>
                    </div>
                    <div class="dispute-actions">
                        <button class="btn-view-dispute" onclick="paymentErrorHandling.viewDispute()">
                            View Details
                        </button>
                        <button class="btn-dismiss-dispute" onclick="paymentErrorHandling.dismissDispute()">
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', errorModalHTML + errorStatusHTML + disputeNotificationHTML);
    }

    setupPaymentMonitoring() {
        // Monitor payment timeouts
        this.paymentTimeouts = new Map();
        
        // Monitor for abandoned payments
        this.setupAbandonmentDetection();
    }

    setupAbandonmentDetection() {
        let lastActivity = Date.now();
        const abandonmentThreshold = 10 * 60 * 1000; // 10 minutes
        
        // Track user activity
        const activities = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        
        activities.forEach(activity => {
            document.addEventListener(activity, () => {
                lastActivity = Date.now();
            }, true);
        });
        
        // Check for abandonment every minute
        setInterval(() => {
            const timeSinceActivity = Date.now() - lastActivity;
            if (timeSinceActivity > abandonmentThreshold) {
                this.checkForAbandonedPayments();
            }
        }, 60000);
    }

    checkForAbandonedPayments() {
        // Check for pending payments that haven't been completed
        const pendingPayments = this.getPendingPayments();
        
        pendingPayments.forEach(payment => {
            const timeSinceStart = Date.now() - payment.startTime;
            if (timeSinceStart > 10 * 60 * 1000) { // 10 minutes
                this.handlePaymentAbandonment(payment);
            }
        });
    }

    getPendingPayments() {
        // Mock function - in real implementation, check database
        return JSON.parse(localStorage.getItem('pendingPayments') || '[]');
    }

    handlePaymentFailure(errorData) {
        const errorType = errorData.type || this.errorTypes.PAYMENT_FAILED;
        const errorMessage = this.getErrorMessage(errorType, errorData);
        
        this.showPaymentError(errorType, errorMessage, errorData);
        this.logPaymentError(errorData);
    }

    handlePaymentAbandonment(abandonmentData) {
        // Do not confirm booking or capture funds
        this.cancelPendingPayment(abandonmentData.bookingId);
        this.showAbandonmentMessage(abandonmentData);
        this.logAbandonment(abandonmentData);
    }

    handleDispute(disputeData) {
        this.notifyBusinessOfDispute(disputeData);
        this.showDisputeNotification(disputeData);
        this.logDispute(disputeData);
    }

    handleChargeback(chargebackData) {
        this.notifyBusinessOfChargeback(chargebackData);
        this.showChargebackNotification(chargebackData);
        this.logChargeback(chargebackData);
    }

    getErrorMessage(errorType, errorData) {
        const errorMessages = {
            [this.errorTypes.PAYMENT_FAILED]: '❌ Payment could not be completed. Please try again or use another card.',
            [this.errorTypes.CARD_DECLINED]: '❌ Your card was declined. Please try a different payment method.',
            [this.errorTypes.INSUFFICIENT_FUNDS]: '❌ Insufficient funds. Please check your account balance or use a different card.',
            [this.errorTypes.EXPIRED_CARD]: '❌ Your card has expired. Please use a different payment method.',
            [this.errorTypes.NETWORK_ERROR]: '❌ Network error occurred. Please check your connection and try again.',
            [this.errorTypes.PAYMENT_ABANDONED]: '⏰ Payment session expired. Please start a new booking.'
        };
        
        return errorMessages[errorType] || errorMessages[this.errorTypes.PAYMENT_FAILED];
    }

    showPaymentError(errorType, errorMessage, errorData) {
        const modal = document.getElementById('paymentErrorModal');
        const content = document.getElementById('errorContent');
        
        content.innerHTML = `
            <div class="payment-error-details">
                <div class="error-message">
                    <p>${errorMessage}</p>
                </div>
                
                <div class="error-details">
                    <h4>Error Details</h4>
                    <div class="detail-row">
                        <span>Error Code:</span>
                        <span>${errorData.errorCode || 'UNKNOWN'}</span>
                    </div>
                    <div class="detail-row">
                        <span>Time:</span>
                        <span>${new Date().toLocaleString()}</span>
                    </div>
                    ${errorData.bookingId ? `
                    <div class="detail-row">
                        <span>Booking ID:</span>
                        <span>${errorData.bookingId}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="error-actions">
                    <button class="btn-retry-payment" data-retry-payment data-booking-id="${errorData.bookingId || ''}">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                    <button class="btn-change-payment" onclick="paymentErrorHandling.changePaymentMethod()">
                        <i class="fas fa-credit-card"></i> Change Payment Method
                    </button>
                    <button class="btn-contact-support" onclick="paymentErrorHandling.contactSupport()">
                        <i class="fas fa-headset"></i> Contact Support
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    showAbandonmentMessage(abandonmentData) {
        const notification = document.getElementById('paymentErrorNotification');
        const message = document.getElementById('errorNotificationMessage');
        
        message.textContent = '⏰ Payment session expired. Please start a new booking.';
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }

    showDisputeNotification(disputeData) {
        const notification = document.getElementById('disputeNotification');
        const message = document.getElementById('disputeNotificationMessage');
        
        message.textContent = `⚠️ A payment dispute has been raised for booking #${disputeData.bookingId}. Please provide supporting evidence.`;
        notification.style.display = 'block';
    }

    showChargebackNotification(chargebackData) {
        const notification = document.getElementById('disputeNotification');
        const message = document.getElementById('disputeNotificationMessage');
        
        message.textContent = `⚠️ A chargeback has been raised for booking #${chargebackData.bookingId}. Please provide supporting evidence.`;
        notification.style.display = 'block';
    }

    notifyBusinessOfDispute(disputeData) {
        const emailData = {
            to: disputeData.businessEmail,
            subject: `Payment Dispute Alert - Booking #${disputeData.bookingId}`,
            template: 'dispute_notification',
            data: disputeData
        };

        // Send email notification
        this.sendBusinessNotification(emailData);
        
        // Update business dashboard
        this.updateBusinessDashboard('dispute', disputeData);
    }

    notifyBusinessOfChargeback(chargebackData) {
        const emailData = {
            to: chargebackData.businessEmail,
            subject: `Chargeback Alert - Booking #${chargebackData.bookingId}`,
            template: 'chargeback_notification',
            data: chargebackData
        };

        // Send email notification
        this.sendBusinessNotification(emailData);
        
        // Update business dashboard
        this.updateBusinessDashboard('chargeback', chargebackData);
    }

    sendBusinessNotification(emailData) {
        // Mock email sending - in real implementation, call your email service
        console.log('Sending business notification:', emailData);
        
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Business notification sent successfully');
                resolve(true);
            }, 1000);
        });
    }

    updateBusinessDashboard(type, data) {
        // Update business dashboard with dispute/chargeback information
        const dashboardEvent = new CustomEvent('businessNotification', {
            detail: { type, data }
        });
        document.dispatchEvent(dashboardEvent);
    }

    retryPayment(bookingId) {
        // Retry payment logic
        console.log('Retrying payment for booking:', bookingId);
        
        // Close error modal
        document.getElementById('paymentErrorModal').style.display = 'none';
        
        // Trigger payment retry
        const retryEvent = new CustomEvent('paymentRetry', {
            detail: { bookingId }
        });
        document.dispatchEvent(retryEvent);
    }

    changePaymentMethod() {
        // Change payment method logic
        console.log('Changing payment method');
        
        // Close error modal
        document.getElementById('paymentErrorModal').style.display = 'none';
        
        // Trigger payment method change
        const changeEvent = new CustomEvent('paymentMethodChange');
        document.dispatchEvent(changeEvent);
    }

    contactSupport() {
        // Contact support logic
        console.log('Contacting support');
        
        // Open support contact form or redirect to support page
        alert('Redirecting to support contact form...');
    }

    cancelPendingPayment(bookingId) {
        // Cancel pending payment and release any held funds
        console.log('Cancelling pending payment for booking:', bookingId);
        
        // Remove from pending payments
        const pendingPayments = this.getPendingPayments();
        const updatedPayments = pendingPayments.filter(p => p.bookingId !== bookingId);
        localStorage.setItem('pendingPayments', JSON.stringify(updatedPayments));
    }

    viewDispute() {
        // View dispute details
        console.log('Viewing dispute details');
        alert('Opening dispute details page...');
    }

    dismissDispute() {
        // Dismiss dispute notification
        document.getElementById('disputeNotification').style.display = 'none';
    }

    logPaymentError(errorData) {
        // Log payment error for analytics
        console.log('Payment error logged:', errorData);
    }

    logAbandonment(abandonmentData) {
        // Log payment abandonment for analytics
        console.log('Payment abandonment logged:', abandonmentData);
    }

    logDispute(disputeData) {
        // Log dispute for analytics
        console.log('Dispute logged:', disputeData);
    }

    logChargeback(chargebackData) {
        // Log chargeback for analytics
        console.log('Chargeback logged:', chargebackData);
    }

    // Public method to trigger test scenarios
    testPaymentFailure() {
        const errorData = {
            type: this.errorTypes.PAYMENT_FAILED,
            errorCode: 'CARD_DECLINED',
            bookingId: 'BOOK_' + Math.random().toString(36).substr(2, 9),
            amount: 45.00,
            currency: 'GBP'
        };
        
        this.handlePaymentFailure(errorData);
    }

    testPaymentAbandonment() {
        const abandonmentData = {
            bookingId: 'BOOK_' + Math.random().toString(36).substr(2, 9),
            startTime: Date.now() - 11 * 60 * 1000, // 11 minutes ago
            amount: 45.00,
            currency: 'GBP'
        };
        
        this.handlePaymentAbandonment(abandonmentData);
    }

    testDispute() {
        const disputeData = {
            bookingId: 'BOOK_' + Math.random().toString(36).substr(2, 9),
            businessEmail: 'business@example.com',
            amount: 45.00,
            currency: 'GBP',
            disputeReason: 'fraudulent',
            disputeDate: new Date().toISOString()
        };
        
        this.handleDispute(disputeData);
    }

    testChargeback() {
        const chargebackData = {
            bookingId: 'BOOK_' + Math.random().toString(36).substr(2, 9),
            businessEmail: 'business@example.com',
            amount: 45.00,
            currency: 'GBP',
            chargebackReason: 'fraudulent',
            chargebackDate: new Date().toISOString()
        };
        
        this.handleChargeback(chargebackData);
    }
}

// Initialize error handling
document.addEventListener('DOMContentLoaded', function() {
    window.paymentErrorHandling = new PaymentErrorHandling();
});

// Export for manual initialization
window.PaymentErrorHandling = PaymentErrorHandling;
