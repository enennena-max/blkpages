/**
 * Payment Session Timeout System
 * Handles secure session timeout for payment screens
 */

class PaymentSessionTimeout {
    constructor() {
        this.timeoutDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
        this.warningDuration = 2 * 60 * 1000; // 2 minutes warning
        this.warningShown = false;
        this.sessionExpired = false;
        this.activityTimer = null;
        this.warningTimer = null;
        this.expiryTimer = null;
        this.countdownInterval = null;
        
        this.init();
    }

    init() {
        this.startActivityTimer();
        this.setupActivityListeners();
        this.createTimeoutUI();
    }

    startActivityTimer() {
        // Clear any existing timers
        this.clearTimers();
        
        // Set warning timer (8 minutes)
        this.warningTimer = setTimeout(() => {
            this.showWarning();
        }, this.timeoutDuration - this.warningDuration);
        
        // Set expiry timer (10 minutes)
        this.expiryTimer = setTimeout(() => {
            this.expireSession();
        }, this.timeoutDuration);
    }

    clearTimers() {
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
            this.warningTimer = null;
        }
        if (this.expiryTimer) {
            clearTimeout(this.expiryTimer);
            this.expiryTimer = null;
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    setupActivityListeners() {
        // Listen for various user activities
        const activities = [
            'keydown', 'keyup', 'keypress', // Typing
            'click', 'mousedown', 'mouseup', // Mouse interactions
            'scroll', 'wheel', // Scrolling
            'touchstart', 'touchend', 'touchmove', // Touch interactions
            'focus', 'blur', // Form field interactions
            'change', 'input' // Form changes
        ];

        activities.forEach(activity => {
            document.addEventListener(activity, () => {
                this.resetActivityTimer();
            }, true);
        });
    }

    resetActivityTimer() {
        if (this.sessionExpired) return;
        
        // Reset warning state
        this.warningShown = false;
        this.hideWarning();
        
        // Restart timers
        this.startActivityTimer();
    }

    showWarning() {
        if (this.warningShown || this.sessionExpired) return;
        
        this.warningShown = true;
        const warningElement = document.getElementById('session-warning');
        if (warningElement) {
            warningElement.style.display = 'block';
            this.startCountdown();
        }
    }
    
    startCountdown() {
        let timeLeft = 120; // 2 minutes in seconds
        const countdownElement = document.getElementById('countdownTimer');
        
        if (!countdownElement) return;
        
        const countdownInterval = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            countdownElement.textContent = timeString;
            timeLeft--;
            
            if (timeLeft < 0 || this.sessionExpired) {
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        // Store interval ID for cleanup
        this.countdownInterval = countdownInterval;
    }

    hideWarning() {
        const warningElement = document.getElementById('session-warning');
        if (warningElement) {
            warningElement.style.display = 'none';
        }
    }

    expireSession() {
        this.sessionExpired = true;
        this.clearTimers();
        this.hideWarning();
        this.showExpiryMessage();
        this.disablePaymentForm();
    }

    showExpiryMessage() {
        const expiryElement = document.getElementById('session-expired');
        if (expiryElement) {
            expiryElement.style.display = 'block';
        }
    }

    disablePaymentForm() {
        // Disable all form inputs
        const form = document.getElementById('paymentForm');
        if (form) {
            const inputs = form.querySelectorAll('input, select, button');
            inputs.forEach(input => {
                input.disabled = true;
                input.style.opacity = '0.5';
                input.style.cursor = 'not-allowed';
            });
        }
    }

    createTimeoutUI() {
        // Create warning message with countdown
        const warningHTML = `
            <div id="session-warning" class="session-timeout-warning" style="display: none;">
                <div class="warning-content">
                    <div class="warning-text">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>⚠️ For your security, this payment session will expire in 2 minutes. Please complete your booking.</span>
                    </div>
                    <div class="countdown-timer" id="countdownTimer">2:00</div>
                </div>
            </div>
        `;

        // Create expiry message
        const expiryHTML = `
            <div id="session-expired" class="session-timeout-expired" style="display: none;">
                <div class="expired-content">
                    <i class="fas fa-clock"></i>
                    <span>⏱️ Your session has expired for security reasons. Please restart your booking to complete payment.</span>
                </div>
            </div>
        `;

        // Add to page
        document.body.insertAdjacentHTML('beforeend', warningHTML + expiryHTML);
    }

    // Public method to manually reset session (if needed)
    resetSession() {
        this.sessionExpired = false;
        this.warningShown = false;
        this.hideWarning();
        this.hideExpiryMessage();
        this.enablePaymentForm();
        this.startActivityTimer();
    }

    hideExpiryMessage() {
        const expiryElement = document.getElementById('session-expired');
        if (expiryElement) {
            expiryElement.style.display = 'none';
        }
    }

    enablePaymentForm() {
        const form = document.getElementById('paymentForm');
        if (form) {
            const inputs = form.querySelectorAll('input, select, button');
            inputs.forEach(input => {
                input.disabled = false;
                input.style.opacity = '1';
                input.style.cursor = 'auto';
            });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on payment pages
    if (document.getElementById('paymentForm')) {
        window.paymentSessionTimeout = new PaymentSessionTimeout();
    }
});

// Export for manual initialization if needed
window.PaymentSessionTimeout = PaymentSessionTimeout;
