/**
 * Payout Flow System
 * Handles business payouts, history tracking, and notifications
 */

class PayoutFlow {
    constructor() {
        this.payoutStatuses = {
            PENDING: 'pending',
            PAID: 'paid',
            FAILED: 'failed',
            PROCESSING: 'processing'
        };
        
        this.payoutFrequencies = {
            DAILY: 'daily',
            WEEKLY: 'weekly',
            MONTHLY: 'monthly'
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createPayoutUI();
        this.loadPayoutHistory();
    }

    setupEventListeners() {
        // Listen for payout events
        document.addEventListener('payoutProcessed', (e) => {
            this.handlePayoutProcessed(e.detail);
        });

        document.addEventListener('payoutCompleted', (e) => {
            this.handlePayoutCompleted(e.detail);
        });

        document.addEventListener('payoutFailed', (e) => {
            this.handlePayoutFailed(e.detail);
        });

        // Listen for payout requests
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-payout-trigger]')) {
                e.preventDefault();
                this.processPayout(e.target.dataset.businessId);
            }
        });
    }

    createPayoutUI() {
        // Create payout modal
        const payoutModalHTML = `
            <div id="payoutModal" class="payout-modal" style="display: none;">
                <div class="payout-modal-content">
                    <div class="payout-modal-header">
                        <h3 id="payoutModalTitle">Payout Details</h3>
                        <button class="payout-modal-close" onclick="document.getElementById('payoutModal').style.display='none'">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="payout-modal-body">
                        <div id="payoutContent"></div>
                    </div>
                </div>
            </div>
        `;

        // Create payout status messages
        const payoutStatusHTML = `
            <div id="payoutSuccess" class="payout-status success" style="display: none;">
                <div class="payout-status-content">
                    <i class="fas fa-check-circle"></i>
                    <div class="payout-status-text">
                        <h4>Payout Processed</h4>
                        <p id="payoutSuccessMessage"></p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', payoutModalHTML + payoutStatusHTML);
    }

    loadPayoutHistory() {
        // Load payout history from API or localStorage
        const payoutHistory = this.getPayoutHistory();
        this.displayPayoutHistory(payoutHistory);
    }

    getPayoutHistory() {
        // Mock payout data - in real implementation, fetch from API
        return [
            {
                id: 'payout_1',
                date: '2024-01-15',
                amount: 1250.00,
                currency: 'GBP',
                bookingCount: 28,
                status: 'paid',
                method: 'bank_transfer',
                reference: 'PAYOUT-2024-001',
                processedAt: '2024-01-15T10:30:00Z',
                businessId: 'biz_123'
            },
            {
                id: 'payout_2',
                date: '2024-01-08',
                amount: 980.50,
                currency: 'GBP',
                bookingCount: 22,
                status: 'paid',
                method: 'bank_transfer',
                reference: 'PAYOUT-2024-002',
                processedAt: '2024-01-08T14:15:00Z',
                businessId: 'biz_123'
            },
            {
                id: 'payout_3',
                date: '2024-01-01',
                amount: 750.25,
                currency: 'GBP',
                bookingCount: 17,
                status: 'paid',
                method: 'bank_transfer',
                reference: 'PAYOUT-2024-003',
                processedAt: '2024-01-01T09:45:00Z',
                businessId: 'biz_123'
            },
            {
                id: 'payout_4',
                date: '2024-01-22',
                amount: 2100.75,
                currency: 'GBP',
                bookingCount: 45,
                status: 'pending',
                method: 'bank_transfer',
                reference: 'PAYOUT-2024-004',
                processedAt: null,
                businessId: 'biz_123'
            }
        ];
    }

    displayPayoutHistory(payoutHistory) {
        const historyContainer = document.getElementById('payoutHistory');
        if (!historyContainer) return;

        historyContainer.innerHTML = '';

        payoutHistory.forEach(payout => {
            const payoutCard = this.createPayoutCard(payout);
            historyContainer.appendChild(payoutCard);
        });
    }

    createPayoutCard(payout) {
        const card = document.createElement('div');
        card.className = 'payout-card';
        card.innerHTML = `
            <div class="payout-card-header">
                <div class="payout-card-title">
                    <h4>Payout ${payout.reference}</h4>
                    <span class="payout-date">${new Date(payout.date).toLocaleDateString()}</span>
                </div>
                <div class="payout-card-amount">
                    <span class="amount">£${payout.amount.toFixed(2)}</span>
                    <span class="status ${payout.status}">${payout.status.toUpperCase()}</span>
                </div>
            </div>
            
            <div class="payout-card-details">
                <div class="detail-row">
                    <span>Bookings:</span>
                    <span>${payout.bookingCount} bookings</span>
                </div>
                <div class="detail-row">
                    <span>Method:</span>
                    <span>${this.formatPaymentMethod(payout.method)}</span>
                </div>
                <div class="detail-row">
                    <span>Reference:</span>
                    <span>${payout.reference}</span>
                </div>
                ${payout.processedAt ? `
                <div class="detail-row">
                    <span>Processed:</span>
                    <span>${new Date(payout.processedAt).toLocaleString()}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="payout-card-actions">
                <button class="btn-view-payout" onclick="payoutFlow.viewPayoutDetails('${payout.id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
                ${payout.status === 'paid' ? `
                <button class="btn-download-receipt" onclick="payoutFlow.downloadPayoutReceipt('${payout.id}')">
                    <i class="fas fa-download"></i> Download Receipt
                </button>
                ` : ''}
            </div>
        `;
        
        return card;
    }

    formatPaymentMethod(method) {
        const methods = {
            'bank_transfer': 'Bank Transfer',
            'stripe_connect': 'Stripe Connect',
            'paypal': 'PayPal',
            'manual': 'Manual Transfer'
        };
        return methods[method] || method;
    }

    viewPayoutDetails(payoutId) {
        const payout = this.getPayoutById(payoutId);
        if (!payout) return;

        const modal = document.getElementById('payoutModal');
        const content = document.getElementById('payoutContent');
        
        content.innerHTML = this.generatePayoutDetailsHTML(payout);
        modal.style.display = 'block';
    }

    generatePayoutDetailsHTML(payout) {
        return `
            <div class="payout-details">
                <div class="payout-summary">
                    <h4>Payout Summary</h4>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="label">Amount:</span>
                            <span class="value">£${payout.amount.toFixed(2)}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Bookings:</span>
                            <span class="value">${payout.bookingCount}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Status:</span>
                            <span class="value status ${payout.status}">${payout.status.toUpperCase()}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Reference:</span>
                            <span class="value">${payout.reference}</span>
                        </div>
                    </div>
                </div>
                
                <div class="payout-timeline">
                    <h4>Payout Timeline</h4>
                    <div class="timeline">
                        <div class="timeline-item completed">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h5>Payout Initiated</h5>
                                <p>${new Date(payout.date).toLocaleString()}</p>
                            </div>
                        </div>
                        ${payout.status === 'paid' ? `
                        <div class="timeline-item completed">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h5>Payout Processed</h5>
                                <p>${new Date(payout.processedAt).toLocaleString()}</p>
                            </div>
                        </div>
                        <div class="timeline-item completed">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h5>Funds Transferred</h5>
                                <p>Funds typically arrive in 2-3 business days</p>
                            </div>
                        </div>
                        ` : `
                        <div class="timeline-item pending">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h5>Processing</h5>
                                <p>Payout is being processed</p>
                            </div>
                        </div>
                        `}
                    </div>
                </div>
                
                <div class="payout-actions">
                    <button class="btn-close-modal" onclick="document.getElementById('payoutModal').style.display='none'">
                        Close
                    </button>
                    ${payout.status === 'paid' ? `
                    <button class="btn-download-receipt" onclick="payoutFlow.downloadPayoutReceipt('${payout.id}')">
                        <i class="fas fa-download"></i> Download Receipt
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getPayoutById(payoutId) {
        const payouts = this.getPayoutHistory();
        return payouts.find(p => p.id === payoutId);
    }

    downloadPayoutReceipt(payoutId) {
        const payout = this.getPayoutById(payoutId);
        if (!payout) return;

        // Generate receipt HTML
        const receiptHTML = this.generateReceiptHTML(payout);
        
        // Create downloadable file
        const blob = new Blob([receiptHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payout-receipt-${payout.reference}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }

    generateReceiptHTML(payout) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payout Receipt - ${payout.reference}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .receipt-container { max-width: 600px; margin: 0 auto; }
                    .receipt-header { text-align: center; margin-bottom: 30px; }
                    .receipt-details { background: #f9fafb; padding: 20px; border-radius: 8px; }
                    .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    .amount { font-size: 1.5rem; font-weight: bold; color: #059669; }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="receipt-header">
                        <h1>Payout Receipt</h1>
                        <p>Reference: ${payout.reference}</p>
                    </div>
                    <div class="receipt-details">
                        <div class="detail-row">
                            <span>Amount:</span>
                            <span class="amount">£${payout.amount.toFixed(2)}</span>
                        </div>
                        <div class="detail-row">
                            <span>Bookings:</span>
                            <span>${payout.bookingCount}</span>
                        </div>
                        <div class="detail-row">
                            <span>Date:</span>
                            <span>${new Date(payout.date).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-row">
                            <span>Status:</span>
                            <span>${payout.status.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    async processPayout(businessId) {
        try {
            // Simulate payout processing
            const payoutData = await this.createPayoutData(businessId);
            const payoutId = await this.savePayout(payoutData);
            
            // Send notification
            await this.sendPayoutNotification(payoutData);
            
            // Update dashboard
            this.updatePayoutDashboard(payoutData);
            
            return payoutId;
        } catch (error) {
            console.error('Error processing payout:', error);
            this.showPayoutError(error.message);
        }
    }

    async createPayoutData(businessId) {
        // Mock payout data creation
        return {
            id: 'payout_' + Date.now(),
            businessId: businessId,
            amount: Math.random() * 2000 + 500, // Random amount between 500-2500
            currency: 'GBP',
            bookingCount: Math.floor(Math.random() * 50) + 10, // Random booking count
            status: this.payoutStatuses.PENDING,
            method: 'bank_transfer',
            reference: 'PAYOUT-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6),
            date: new Date().toISOString().split('T')[0],
            processedAt: null
        };
    }

    async savePayout(payoutData) {
        // Mock API call - in real implementation, save to database
        return new Promise((resolve) => {
            setTimeout(() => {
                // Store in localStorage for demo
                const payouts = JSON.parse(localStorage.getItem('payouts') || '[]');
                payouts.unshift(payoutData);
                localStorage.setItem('payouts', JSON.stringify(payouts));
                resolve(payoutData.id);
            }, 1000);
        });
    }

    async sendPayoutNotification(payoutData) {
        const emailData = {
            to: payoutData.businessEmail || 'business@example.com',
            subject: `Payout Notification - ${payoutData.reference}`,
            template: 'payout_notification',
            data: payoutData
        };

        // Mock email sending
        console.log('Sending payout notification:', emailData);
        
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Payout notification sent successfully');
                resolve(true);
            }, 1000);
        });
    }

    updatePayoutDashboard(payoutData) {
        // Update dashboard with new payout
        const dashboardEvent = new CustomEvent('payoutAdded', {
            detail: payoutData
        });
        document.dispatchEvent(dashboardEvent);
    }

    handlePayoutProcessed(payoutData) {
        this.showPayoutSuccess(payoutData);
        this.updatePayoutStatus(payoutData.id, this.payoutStatuses.PROCESSING);
    }

    handlePayoutCompleted(payoutData) {
        this.showPayoutSuccess(payoutData);
        this.updatePayoutStatus(payoutData.id, this.payoutStatuses.PAID);
        this.sendPayoutCompletedNotification(payoutData);
    }

    handlePayoutFailed(payoutData) {
        this.showPayoutError('Payout failed. Please contact support.');
        this.updatePayoutStatus(payoutData.id, this.payoutStatuses.FAILED);
    }

    updatePayoutStatus(payoutId, status) {
        const payouts = JSON.parse(localStorage.getItem('payouts') || '[]');
        const payout = payouts.find(p => p.id === payoutId);
        if (payout) {
            payout.status = status;
            if (status === this.payoutStatuses.PAID) {
                payout.processedAt = new Date().toISOString();
            }
            localStorage.setItem('payouts', JSON.stringify(payouts));
            this.loadPayoutHistory();
        }
    }

    showPayoutSuccess(payoutData) {
        const successMessage = document.getElementById('payoutSuccessMessage');
        successMessage.textContent = `💰 A payout of £${payoutData.amount.toFixed(2)} has been sent to your account for ${payoutData.bookingCount} bookings. Funds typically arrive in 2–3 business days.`;
        
        document.getElementById('payoutSuccess').style.display = 'block';
        
        setTimeout(() => {
            document.getElementById('payoutSuccess').style.display = 'none';
        }, 5000);
    }

    showPayoutError(errorMessage) {
        alert('Payout Error: ' + errorMessage);
    }

    async sendPayoutCompletedNotification(payoutData) {
        const emailData = {
            to: payoutData.businessEmail || 'business@example.com',
            subject: `Payout Completed - ${payoutData.reference}`,
            template: 'payout_completed',
            data: payoutData
        };

        // Mock email sending
        console.log('Sending payout completed notification:', emailData);
        
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Payout completed notification sent successfully');
                resolve(true);
            }, 1000);
        });
    }

    // Public method to trigger test scenarios
    testPayoutProcessing() {
        const payoutData = {
            id: 'test_payout_' + Date.now(),
            businessId: 'biz_123',
            amount: 1500.00,
            currency: 'GBP',
            bookingCount: 25,
            status: this.payoutStatuses.PENDING,
            method: 'bank_transfer',
            reference: 'TEST-PAYOUT-' + Date.now(),
            date: new Date().toISOString().split('T')[0],
            businessEmail: 'business@example.com'
        };
        
        this.handlePayoutProcessed(payoutData);
    }

    testPayoutCompleted() {
        const payoutData = {
            id: 'test_payout_' + Date.now(),
            businessId: 'biz_123',
            amount: 1500.00,
            currency: 'GBP',
            bookingCount: 25,
            status: this.payoutStatuses.PAID,
            method: 'bank_transfer',
            reference: 'TEST-PAYOUT-' + Date.now(),
            date: new Date().toISOString().split('T')[0],
            businessEmail: 'business@example.com'
        };
        
        this.handlePayoutCompleted(payoutData);
    }
}

// Initialize payout flow
document.addEventListener('DOMContentLoaded', function() {
    window.payoutFlow = new PayoutFlow();
});

// Export for manual initialization
window.PayoutFlow = PayoutFlow;
