/**
 * BlkPages Daily Cron Job System
 * Handles automated daily tasks including expired reward voucher processing
 * 
 * Daily Tasks:
 * - Process expired reward vouchers
 * - Send expiration notifications
 * - Update voucher statuses
 */

const CommunicationSystem = require('./communication-system');

class DailyCronSystem {
    constructor() {
        this.communicationSystem = new CommunicationSystem();
        this.isRunning = false;
    }

    // ========================================
    // DAILY CRON JOB EXECUTION
    // ========================================

    /**
     * Main daily cron job execution
     * Runs every 24 hours to process expired vouchers
     */
    async executeDailyCron() {
        if (this.isRunning) {
            console.log('Daily cron job already running, skipping...');
            return;
        }

        this.isRunning = true;
        console.log('Starting daily cron job execution...');

        try {
            // Process expired reward vouchers
            await this.processExpiredRewardVouchers();
            
            // Add other daily tasks here as needed
            // await this.processOtherDailyTasks();
            
            console.log('Daily cron job execution completed successfully');
        } catch (error) {
            console.error('Daily cron job execution failed:', error);
        } finally {
            this.isRunning = false;
        }
    }

    // ========================================
    // EXPIRED REWARD VOUCHER PROCESSING
    // ========================================

    /**
     * Process expired reward vouchers
     * Daily task to find and process vouchers that have expired
     */
    async processExpiredRewardVouchers() {
        console.log('Processing expired reward vouchers...');

        try {
            // Query expired vouchers from database
            const expiredVouchers = await this.getExpiredVouchers();
            
            if (expiredVouchers.length === 0) {
                console.log('No expired vouchers found');
                return;
            }

            console.log(`Found ${expiredVouchers.length} expired vouchers to process`);

            // Process each expired voucher
            for (const voucher of expiredVouchers) {
                await this.processExpiredVoucher(voucher);
            }

            console.log(`Successfully processed ${expiredVouchers.length} expired vouchers`);

        } catch (error) {
            console.error('Failed to process expired reward vouchers:', error);
            throw error;
        }
    }

    /**
     * Get expired vouchers from database
     * SQL: SELECT * FROM RewardVouchers WHERE expiry_date < now() AND redeemed=false
     */
    async getExpiredVouchers() {
        try {
            // In a real implementation, this would be a database query
            // For demo purposes, we'll simulate with localStorage
            const rewardVouchers = JSON.parse(localStorage.getItem('rewardVouchers') || '[]');
            const now = new Date();
            
            const expiredVouchers = rewardVouchers.filter(voucher => {
                const expiryDate = new Date(voucher.expires_at);
                return expiryDate < now && !voucher.used && !voucher.expired;
            });

            return expiredVouchers;
        } catch (error) {
            console.error('Failed to get expired vouchers:', error);
            return [];
        }
    }

    /**
     * Process a single expired voucher
     */
    async processExpiredVoucher(voucher) {
        try {
            console.log(`Processing expired voucher: ${voucher.id}`);

            // 1. Mark voucher as expired in database
            await this.markVoucherAsExpired(voucher.id);

            // 2. Send expiration notification to customer
            await this.sendVoucherExpirationNotification(voucher);

            // 3. Update loyalty progress if needed
            await this.updateLoyaltyProgressForExpiredVoucher(voucher);

            console.log(`Successfully processed expired voucher: ${voucher.id}`);

        } catch (error) {
            console.error(`Failed to process expired voucher ${voucher.id}:`, error);
            // Continue processing other vouchers even if one fails
        }
    }

    /**
     * Mark voucher as expired in database
     */
    async markVoucherAsExpired(voucherId) {
        try {
            // Update voucher status in database
            const rewardVouchers = JSON.parse(localStorage.getItem('rewardVouchers') || '[]');
            const voucherIndex = rewardVouchers.findIndex(v => v.id === voucherId);
            
            if (voucherIndex !== -1) {
                rewardVouchers[voucherIndex].expired = true;
                rewardVouchers[voucherIndex].expired_at = new Date().toISOString();
                rewardVouchers[voucherIndex].updated_at = new Date().toISOString();
                
                localStorage.setItem('rewardVouchers', JSON.stringify(rewardVouchers));
                console.log(`Marked voucher ${voucherId} as expired`);
            }

        } catch (error) {
            console.error(`Failed to mark voucher ${voucherId} as expired:`, error);
            throw error;
        }
    }

    /**
     * Send voucher expiration notification to customer
     */
    async sendVoucherExpirationNotification(voucher) {
        try {
            // Get customer information
            const customerId = voucher.customer_id;
            const customer = await this.getCustomerById(customerId);
            
            if (!customer) {
                console.log(`Customer not found for voucher ${voucher.id}`);
                return;
            }

            // Send expiration email
            await this.communicationSystem.sendEmail({
                to: customer.email,
                subject: 'Your Reward Has Expired',
                template: 'reward_expired',
                data: {
                    customerName: customer.name,
                    voucherCode: voucher.id.substring(0, 8).toUpperCase(),
                    rewardType: voucher.reward_type,
                    rewardValue: voucher.reward_value,
                    expiryDate: voucher.expires_at,
                    businessName: await this.getBusinessName(voucher.business_id)
                }
            });

            console.log(`Sent expiration notification for voucher ${voucher.id} to ${customer.email}`);

        } catch (error) {
            console.error(`Failed to send expiration notification for voucher ${voucher.id}:`, error);
            // Don't throw error - continue processing other vouchers
        }
    }

    /**
     * Update loyalty progress for expired voucher
     */
    async updateLoyaltyProgressForExpiredVoucher(voucher) {
        try {
            // Get loyalty progress record
            const loyaltyProgress = JSON.parse(localStorage.getItem('loyaltyProgress') || '[]');
            const progressIndex = loyaltyProgress.findIndex(p => p.reward_voucher_id === voucher.id);
            
            if (progressIndex !== -1) {
                // Reset reward status since voucher expired
                loyaltyProgress[progressIndex].reward_unlocked = false;
                loyaltyProgress[progressIndex].reward_redeemed = false;
                loyaltyProgress[progressIndex].reward_voucher_id = null;
                loyaltyProgress[progressIndex].updated_at = new Date().toISOString();
                
                localStorage.setItem('loyaltyProgress', JSON.stringify(loyaltyProgress));
                console.log(`Updated loyalty progress for expired voucher ${voucher.id}`);
            }

        } catch (error) {
            console.error(`Failed to update loyalty progress for expired voucher ${voucher.id}:`, error);
            // Don't throw error - continue processing other vouchers
        }
    }

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    /**
     * Get customer by ID
     */
    async getCustomerById(customerId) {
        try {
            // In a real implementation, this would be a database query
            const customers = JSON.parse(localStorage.getItem('customers') || '[]');
            return customers.find(c => c.id === customerId);
        } catch (error) {
            console.error('Failed to get customer by ID:', error);
            return null;
        }
    }

    /**
     * Get business name by ID
     */
    async getBusinessName(businessId) {
        try {
            // In a real implementation, this would be a database query
            const businesses = JSON.parse(localStorage.getItem('businesses') || '[]');
            const business = businesses.find(b => b.id === businessId);
            return business ? business.name : 'Business';
        } catch (error) {
            console.error('Failed to get business name:', error);
            return 'Business';
        }
    }

    // ========================================
    // CRON JOB SCHEDULING
    // ========================================

    /**
     * Start daily cron job
     * In a real implementation, this would be scheduled with a cron service
     */
    startDailyCron() {
        console.log('Starting daily cron job scheduler...');
        
        // Run immediately for testing
        this.executeDailyCron();
        
        // Schedule to run every 24 hours
        setInterval(() => {
            this.executeDailyCron();
        }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
        
        console.log('Daily cron job scheduler started');
    }

    /**
     * Stop daily cron job
     */
    stopDailyCron() {
        console.log('Stopping daily cron job scheduler...');
        // In a real implementation, this would stop the cron service
        console.log('Daily cron job scheduler stopped');
    }
}

module.exports = DailyCronSystem;
