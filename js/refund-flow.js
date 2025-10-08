/**
 * Refund Flow System
 * Handles refund processing according to business cancellation policies
 */

class RefundFlow {
    constructor() {
        this.refundPolicies = {
            'flexible': {
                name: 'Flexible',
                description: 'Full refund up to 24 hours before booking',
                refundable: true,
                cutoffHours: 24
            },
            'moderate': {
                name: 'Moderate',
                description: 'Full refund up to 5 days before booking',
                refundable: true,
                cutoffDays: 5
            },
            'strict': {
                name: 'Strict',
                description: 'No refunds, but can reschedule up to 24 hours before',
                refundable: false,
                reschedulable: true,
                cutoffHours: 24
            },
            'non-refundable': {
                name: 'Non-Refundable',
                description: 'No refunds or rescheduling allowed',
                refundable: false,
                reschedulable: false
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createRefundUI();
    }

    setupEventListeners() {
        // Listen for refund requests
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-refund-trigger]')) {
                e.preventDefault();
                const bookingId = e.target.dataset.bookingId;
                const bookingData = this.getBookingData(bookingId);
                this.processRefundRequest(bookingData);
            }
        });
    }

    createRefundUI() {
        // Create refund modal
        const refundModalHTML = `
            <div id="refundModal" class="refund-modal" style="display: none;">
                <div class="refund-modal-content">
                    <div class="refund-modal-header">
                        <h3 id="refundModalTitle">Process Refund</h3>
                        <button class="refund-modal-close" onclick="this.closest('.refund-modal').style.display='none'">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="refund-modal-body">
                        <div id="refundContent"></div>
                    </div>
                </div>
            </div>
        `;

        // Create refund status messages
        const refundStatusHTML = `
            <div id="refundSuccess" class="refund-status success" style="display: none;">
                <div class="refund-status-content">
                    <i class="fas fa-check-circle"></i>
                    <div class="refund-status-text">
                        <h4>Refund Processed</h4>
                        <p id="refundSuccessMessage"></p>
                    </div>
                </div>
            </div>
            
            <div id="refundError" class="refund-status error" style="display: none;">
                <div class="refund-status-content">
                    <i class="fas fa-exclamation-circle"></i>
                    <div class="refund-status-text">
                        <h4>Refund Not Available</h4>
                        <p id="refundErrorMessage"></p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', refundModalHTML + refundStatusHTML);
    }

    getBookingData(bookingId) {
        // Mock booking data - in real implementation, fetch from API
        return {
            id: bookingId,
            businessId: 'biz_123',
            businessName: 'Hair Studio Pro',
            serviceName: 'Haircut & Styling',
            amount: 45.00,
            currency: 'GBP',
            bookingDate: '2024-01-15',
            serviceDate: '2024-01-20',
            policy: 'moderate', // flexible, moderate, strict, non-refundable
            customerEmail: 'customer@example.com',
            stripePaymentIntentId: 'pi_1234567890'
        };
    }

    processRefundRequest(bookingData) {
        const policy = this.refundPolicies[bookingData.policy];
        const isRefundable = this.checkRefundEligibility(bookingData, policy);
        
        if (isRefundable) {
            this.showRefundableOptions(bookingData, policy);
        } else {
            this.showNonRefundableMessage(bookingData, policy);
        }
    }

    checkRefundEligibility(bookingData, policy) {
        if (!policy.refundable) {
            return false;
        }

        const now = new Date();
        const serviceDate = new Date(bookingData.serviceDate);
        const timeDiff = serviceDate - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (policy.cutoffHours && hoursDiff < policy.cutoffHours) {
            return false;
        }

        if (policy.cutoffDays && hoursDiff < (policy.cutoffDays * 24)) {
            return false;
        }

        return true;
    }

    showRefundableOptions(bookingData, policy) {
        const modal = document.getElementById('refundModal');
        const content = document.getElementById('refundContent');
        
        content.innerHTML = `
            <div class="refund-eligible">
                <div class="refund-info">
                    <h4>✅ Refund Available</h4>
                    <p>This booking is eligible for a refund under the business's ${policy.name} cancellation policy.</p>
                </div>
                
                <div class="booking-details">
                    <h5>Booking Details</h5>
                    <div class="detail-row">
                        <span>Service:</span>
                        <span>${bookingData.serviceName}</span>
                    </div>
                    <div class="detail-row">
                        <span>Amount:</span>
                        <span>£${bookingData.amount.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Service Date:</span>
                        <span>${new Date(bookingData.serviceDate).toLocaleDateString()}</span>
                    </div>
                </div>
                
                <div class="refund-actions">
                    <button class="btn-refund-confirm" onclick="refundFlow.confirmRefund('${bookingData.id}')">
                        Process Refund
                    </button>
                    <button class="btn-refund-cancel" onclick="document.getElementById('refundModal').style.display='none'">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    showNonRefundableMessage(bookingData, policy) {
        const modal = document.getElementById('refundModal');
        const content = document.getElementById('refundContent');
        
        content.innerHTML = `
            <div class="refund-not-eligible">
                <div class="refund-info">
                    <h4>❌ Refund Not Available</h4>
                    <p>This booking is non-refundable under the business's ${policy.name} cancellation policy.</p>
                </div>
                
                <div class="policy-details">
                    <h5>Policy Details</h5>
                    <p>${policy.description}</p>
                </div>
                
                <div class="alternative-options">
                    <h5>Alternative Options</h5>
                    <ul>
                        <li>Contact ${bookingData.businessName} directly to discuss options</li>
                        <li>Check if rescheduling is available</li>
                        <li>Review the business's full cancellation policy</li>
                    </ul>
                </div>
                
                <div class="refund-actions">
                    <button class="btn-contact-business" onclick="refundFlow.contactBusiness('${bookingData.businessId}')">
                        Contact Business
                    </button>
                    <button class="btn-refund-cancel" onclick="document.getElementById('refundModal').style.display='none'">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    async confirmRefund(bookingId) {
        const bookingData = this.getBookingData(bookingId);
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Process refund via Stripe API
            const refundResult = await this.processStripeRefund(bookingData);
            
            if (refundResult.success) {
                this.showRefundSuccess(bookingData, refundResult);
                this.sendRefundEmail(bookingData, refundResult);
            } else {
                this.showRefundError(refundResult.error);
            }
        } catch (error) {
            this.showRefundError(error.message);
        }
    }

    async processStripeRefund(bookingData) {
        // Mock Stripe API call - in real implementation, call your backend
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    refundId: 're_' + Math.random().toString(36).substr(2, 9),
                    amount: bookingData.amount,
                    currency: bookingData.currency,
                    status: 'succeeded'
                });
            }, 2000);
        });
    }

    showRefundSuccess(bookingData, refundResult) {
        const successMessage = document.getElementById('refundSuccessMessage');
        successMessage.textContent = `Your refund of £${refundResult.amount.toFixed(2)} has been processed. It may take 5–10 business days to appear in your account.`;
        
        document.getElementById('refundSuccess').style.display = 'block';
        document.getElementById('refundModal').style.display = 'none';
        
        // Hide success message after 5 seconds
        setTimeout(() => {
            document.getElementById('refundSuccess').style.display = 'none';
        }, 5000);
    }

    showRefundError(errorMessage) {
        const errorElement = document.getElementById('refundError');
        const errorText = document.getElementById('refundErrorMessage');
        errorText.textContent = errorMessage;
        
        errorElement.style.display = 'block';
        
        // Hide error message after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }

    showLoadingState() {
        const content = document.getElementById('refundContent');
        content.innerHTML = `
            <div class="refund-loading">
                <div class="loading-spinner"></div>
                <p>Processing refund...</p>
            </div>
        `;
    }

    async sendRefundEmail(bookingData, refundResult) {
        // Mock email sending - in real implementation, call your email service
        console.log('Sending refund confirmation email:', {
            to: bookingData.customerEmail,
            subject: 'Refund Confirmation',
            body: `Your refund of £${refundResult.amount.toFixed(2)} has been processed. It may take 5–10 business days to appear in your account.`
        });
    }

    contactBusiness(businessId) {
        // Mock business contact - in real implementation, open contact form or redirect
        alert('Redirecting to business contact page...');
        document.getElementById('refundModal').style.display = 'none';
    }
}

// Initialize refund flow
document.addEventListener('DOMContentLoaded', function() {
    window.refundFlow = new RefundFlow();
});

// Export for manual initialization
window.RefundFlow = RefundFlow;
