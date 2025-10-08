/**
 * Stripe Receipts System
 * Handles automatic receipt generation, email confirmations, and dashboard display
 */

class StripeReceipts {
    constructor() {
        this.receiptTemplates = {
            customer: 'customer_receipt',
            business: 'business_receipt',
            refund: 'refund_receipt'
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createReceiptUI();
        this.initializeStripeReceipts();
    }

    setupEventListeners() {
        // Listen for payment completion
        document.addEventListener('paymentCompleted', (e) => {
            this.generateReceipt(e.detail);
        });

        // Listen for refund completion
        document.addEventListener('refundCompleted', (e) => {
            this.generateRefundReceipt(e.detail);
        });

        // Listen for receipt requests
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-receipt-trigger]')) {
                e.preventDefault();
                const receiptId = e.target.dataset.receiptId;
                this.showReceipt(receiptId);
            }
        });
    }

    createReceiptUI() {
        // Create receipt modal
        const receiptModalHTML = `
            <div id="receiptModal" class="receipt-modal" style="display: none;">
                <div class="receipt-modal-content">
                    <div class="receipt-modal-header">
                        <h3 id="receiptModalTitle">Receipt</h3>
                        <div class="receipt-actions">
                            <button class="btn-download-receipt" onclick="stripeReceipts.downloadReceipt()">
                                <i class="fas fa-download"></i> Download
                            </button>
                            <button class="btn-email-receipt" onclick="stripeReceipts.emailReceipt()">
                                <i class="fas fa-envelope"></i> Email
                            </button>
                            <button class="receipt-modal-close" onclick="document.getElementById('receiptModal').style.display='none'">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="receipt-modal-body">
                        <div id="receiptContent"></div>
                    </div>
                </div>
            </div>
        `;

        // Create receipt status messages
        const receiptStatusHTML = `
            <div id="receiptSuccess" class="receipt-status success" style="display: none;">
                <div class="receipt-status-content">
                    <i class="fas fa-check-circle"></i>
                    <div class="receipt-status-text">
                        <h4>Receipt Generated</h4>
                        <p id="receiptSuccessMessage"></p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', receiptModalHTML + receiptStatusHTML);
    }

    initializeStripeReceipts() {
        // Configure Stripe to automatically issue receipts
        if (typeof Stripe !== 'undefined') {
            // This would be configured in your Stripe dashboard
            // Settings > Billing > Receipts
            console.log('Stripe receipts configured for automatic generation');
        }
    }

    async generateReceipt(paymentData) {
        try {
            const receiptData = await this.createReceiptData(paymentData);
            const receiptId = await this.saveReceipt(receiptData);
            
            // Send email to customer
            await this.sendCustomerReceiptEmail(receiptData);
            
            // Update business dashboard
            this.updateBusinessDashboard(receiptData);
            
            // Show success message
            this.showReceiptSuccess(receiptData);
            
            return receiptId;
        } catch (error) {
            console.error('Error generating receipt:', error);
            this.showReceiptError(error.message);
        }
    }

    async generateRefundReceipt(refundData) {
        try {
            const receiptData = await this.createRefundReceiptData(refundData);
            const receiptId = await this.saveReceipt(receiptData);
            
            // Send email to customer
            await this.sendRefundReceiptEmail(receiptData);
            
            // Update business dashboard
            this.updateBusinessDashboard(receiptData);
            
            return receiptId;
        } catch (error) {
            console.error('Error generating refund receipt:', error);
            this.showReceiptError(error.message);
        }
    }

    async createReceiptData(paymentData) {
        return {
            id: 'receipt_' + Date.now(),
            type: 'payment',
            customer: {
                name: paymentData.customerName,
                email: paymentData.customerEmail,
                phone: paymentData.customerPhone
            },
            business: {
                name: paymentData.businessName,
                address: paymentData.businessAddress,
                phone: paymentData.businessPhone,
                email: paymentData.businessEmail
            },
            service: {
                name: paymentData.serviceName,
                description: paymentData.serviceDescription,
                date: paymentData.serviceDate,
                time: paymentData.serviceTime
            },
            payment: {
                amount: paymentData.amount,
                currency: paymentData.currency,
                method: paymentData.paymentMethod,
                transactionId: paymentData.stripePaymentIntentId,
                status: 'completed',
                date: new Date().toISOString()
            },
            receipt: {
                number: 'RCP-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                generatedAt: new Date().toISOString(),
                stripeReceiptUrl: paymentData.stripeReceiptUrl
            }
        };
    }

    async createRefundReceiptData(refundData) {
        return {
            id: 'refund_receipt_' + Date.now(),
            type: 'refund',
            customer: refundData.customer,
            business: refundData.business,
            service: refundData.service,
            payment: {
                originalAmount: refundData.originalAmount,
                refundAmount: refundData.refundAmount,
                currency: refundData.currency,
                refundId: refundData.stripeRefundId,
                status: 'refunded',
                date: new Date().toISOString()
            },
            receipt: {
                number: 'REF-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                generatedAt: new Date().toISOString(),
                stripeReceiptUrl: refundData.stripeReceiptUrl
            }
        };
    }

    async saveReceipt(receiptData) {
        // Mock API call - in real implementation, save to database
        return new Promise((resolve) => {
            setTimeout(() => {
                // Store in localStorage for demo
                const receipts = JSON.parse(localStorage.getItem('receipts') || '[]');
                receipts.push(receiptData);
                localStorage.setItem('receipts', JSON.stringify(receipts));
                resolve(receiptData.id);
            }, 500);
        });
    }

    async sendCustomerReceiptEmail(receiptData) {
        const emailData = {
            to: receiptData.customer.email,
            subject: `Receipt for your booking at ${receiptData.business.name}`,
            template: 'customer_receipt',
            data: receiptData
        };

        // Mock email sending - in real implementation, call your email service
        console.log('Sending customer receipt email:', emailData);
        
        // Simulate email sending
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Customer receipt email sent successfully');
                resolve(true);
            }, 1000);
        });
    }

    async sendRefundReceiptEmail(receiptData) {
        const emailData = {
            to: receiptData.customer.email,
            subject: `Refund receipt for your booking at ${receiptData.business.name}`,
            template: 'refund_receipt',
            data: receiptData
        };

        // Mock email sending
        console.log('Sending refund receipt email:', emailData);
        
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Refund receipt email sent successfully');
                resolve(true);
            }, 1000);
        });
    }

    updateBusinessDashboard(receiptData) {
        // Update business dashboard with new receipt
        const dashboardEvent = new CustomEvent('receiptAdded', {
            detail: receiptData
        });
        document.dispatchEvent(dashboardEvent);
    }

    showReceipt(receiptId) {
        const receipts = JSON.parse(localStorage.getItem('receipts') || '[]');
        const receipt = receipts.find(r => r.id === receiptId);
        
        if (!receipt) {
            this.showReceiptError('Receipt not found');
            return;
        }

        this.displayReceipt(receipt);
    }

    displayReceipt(receiptData) {
        const modal = document.getElementById('receiptModal');
        const content = document.getElementById('receiptContent');
        
        content.innerHTML = this.generateReceiptHTML(receiptData);
        modal.style.display = 'block';
    }

    generateReceiptHTML(receiptData) {
        const isRefund = receiptData.type === 'refund';
        const amount = isRefund ? receiptData.payment.refundAmount : receiptData.payment.amount;
        const amountLabel = isRefund ? 'Refund Amount' : 'Total Amount';
        
        return `
            <div class="receipt-container">
                <div class="receipt-header">
                    <div class="receipt-logo">
                        <i class="fas fa-receipt"></i>
                        <span>Receipt</span>
                    </div>
                    <div class="receipt-number">
                        ${receiptData.receipt.number}
                    </div>
                </div>
                
                <div class="receipt-details">
                    <div class="receipt-section">
                        <h4>Business Information</h4>
                        <div class="receipt-info">
                            <div class="info-row">
                                <span>Name:</span>
                                <span>${receiptData.business.name}</span>
                            </div>
                            <div class="info-row">
                                <span>Address:</span>
                                <span>${receiptData.business.address}</span>
                            </div>
                            <div class="info-row">
                                <span>Phone:</span>
                                <span>${receiptData.business.phone}</span>
                            </div>
                            <div class="info-row">
                                <span>Email:</span>
                                <span>${receiptData.business.email}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="receipt-section">
                        <h4>Customer Information</h4>
                        <div class="receipt-info">
                            <div class="info-row">
                                <span>Name:</span>
                                <span>${receiptData.customer.name}</span>
                            </div>
                            <div class="info-row">
                                <span>Email:</span>
                                <span>${receiptData.customer.email}</span>
                            </div>
                            ${receiptData.customer.phone ? `
                            <div class="info-row">
                                <span>Phone:</span>
                                <span>${receiptData.customer.phone}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="receipt-section">
                        <h4>Service Details</h4>
                        <div class="receipt-info">
                            <div class="info-row">
                                <span>Service:</span>
                                <span>${receiptData.service.name}</span>
                            </div>
                            <div class="info-row">
                                <span>Date:</span>
                                <span>${new Date(receiptData.service.date).toLocaleDateString()}</span>
                            </div>
                            <div class="info-row">
                                <span>Time:</span>
                                <span>${receiptData.service.time}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="receipt-section">
                        <h4>Payment Information</h4>
                        <div class="receipt-info">
                            <div class="info-row">
                                <span>${amountLabel}:</span>
                                <span class="amount">£${amount.toFixed(2)}</span>
                            </div>
                            <div class="info-row">
                                <span>Status:</span>
                                <span class="status ${receiptData.payment.status}">${receiptData.payment.status.toUpperCase()}</span>
                            </div>
                            <div class="info-row">
                                <span>Transaction ID:</span>
                                <span class="transaction-id">${receiptData.payment.transactionId}</span>
                            </div>
                            <div class="info-row">
                                <span>Date:</span>
                                <span>${new Date(receiptData.payment.date).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="receipt-footer">
                    <p>Thank you for your business!</p>
                    <p class="receipt-generated">Receipt generated on ${new Date(receiptData.receipt.generatedAt).toLocaleString()}</p>
                </div>
            </div>
        `;
    }

    downloadReceipt() {
        const content = document.getElementById('receiptContent');
        const receiptHTML = content.innerHTML;
        
        // Create downloadable HTML file
        const blob = new Blob([`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .receipt-container { max-width: 600px; margin: 0 auto; }
                    .receipt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                    .receipt-logo { font-size: 1.5rem; font-weight: bold; }
                    .receipt-number { font-weight: bold; }
                    .receipt-section { margin-bottom: 20px; }
                    .receipt-section h4 { margin-bottom: 10px; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .amount { font-weight: bold; color: #4ade80; }
                    .status { font-weight: bold; }
                    .status.completed { color: #4ade80; }
                    .status.refunded { color: #f87171; }
                </style>
            </head>
            <body>
                ${receiptHTML}
            </body>
            </html>
        `], { type: 'text/html' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'receipt.html';
        a.click();
        URL.revokeObjectURL(url);
    }

    emailReceipt() {
        alert('Receipt email functionality would send the receipt to the customer\'s email address');
    }

    showReceiptSuccess(receiptData) {
        const successMessage = document.getElementById('receiptSuccessMessage');
        successMessage.textContent = `Receipt generated and email sent to ${receiptData.customer.email}`;
        
        document.getElementById('receiptSuccess').style.display = 'block';
        
        setTimeout(() => {
            document.getElementById('receiptSuccess').style.display = 'none';
        }, 5000);
    }

    showReceiptError(errorMessage) {
        alert('Receipt Error: ' + errorMessage);
    }
}

// Initialize receipts system
document.addEventListener('DOMContentLoaded', function() {
    window.stripeReceipts = new StripeReceipts();
});

// Export for manual initialization
window.StripeReceipts = StripeReceipts;
