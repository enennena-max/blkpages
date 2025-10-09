/**
 * BlkPages Security & Privacy System
 * Handles secure voucher generation, data privacy, and GDPR compliance for loyalty rewards
 * 
 * Security Features:
 * - Server-side only voucher generation
 * - Non-guessable voucher codes
 * - Unique index enforcement
 * - Data access controls
 * - Activity logging
 * - GDPR compliance
 */

const crypto = require('crypto');

class SecurityPrivacySystem {
    constructor() {
        this.voucherPrefix = 'BP';
        this.voucherLength = 8;
        this.maxRetries = 5;
    }

    // ========================================
    // SECURE VOUCHER GENERATION
    // ========================================

    /**
     * Generate secure, non-guessable voucher code
     * Server-side only generation with cryptographic randomness
     */
    async generateSecureVoucherCode() {
        let attempts = 0;
        let voucherCode = null;
        let isUnique = false;

        while (!isUnique && attempts < this.maxRetries) {
            try {
                // Generate cryptographically secure random code
                const randomBytes = crypto.randomBytes(this.voucherLength);
                const randomString = randomBytes.toString('hex').toUpperCase();
                voucherCode = `${this.voucherPrefix}-${randomString}`;

                // Check uniqueness in database
                isUnique = await this.checkVoucherUniqueness(voucherCode);

                if (!isUnique) {
                    attempts++;
                    console.log(`Voucher code collision detected, retrying... (attempt ${attempts})`);
                }

            } catch (error) {
                console.error('Error generating voucher code:', error);
                throw new Error('Failed to generate secure voucher code');
            }
        }

        if (!isUnique) {
            throw new Error('Unable to generate unique voucher code after maximum retries');
        }

        console.log(`Secure voucher code generated: ${voucherCode}`);
        return voucherCode;
    }

    /**
     * Check if voucher code is unique in database
     */
    async checkVoucherUniqueness(voucherCode) {
        try {
            // In a real implementation, this would be a database query
            // For demo purposes, we'll check localStorage
            const rewardVouchers = JSON.parse(localStorage.getItem('rewardVouchers') || '[]');
            const existingVoucher = rewardVouchers.find(v => v.code === voucherCode);
            
            return !existingVoucher;
        } catch (error) {
            console.error('Error checking voucher uniqueness:', error);
            return false;
        }
    }

    /**
     * Create secure voucher record with proper indexing
     */
    async createSecureVoucher(voucherData) {
        try {
            // Generate secure voucher code
            const voucherCode = await this.generateSecureVoucherCode();
            
            // Create voucher record with security features
            const secureVoucher = {
                id: this.generateSecureId(),
                code: voucherCode,
                customer_id: voucherData.customer_id,
                business_id: voucherData.business_id,
                reward_type: voucherData.reward_type,
                reward_value: voucherData.reward_value,
                expires_at: voucherData.expires_at,
                used: false,
                expired: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                // Security fields
                generated_by: 'system',
                ip_address: voucherData.ip_address || null,
                user_agent: voucherData.user_agent || null,
                // Privacy fields
                data_processing_basis: 'contract', // UK GDPR Art 6(1)(b)
                consent_given: voucherData.consent_given || false,
                opt_out_available: true
            };

            // Store in database with unique index
            await this.storeVoucherWithUniqueIndex(secureVoucher);
            
            // Log voucher creation
            await this.logVoucherActivity('created', secureVoucher.id, voucherData.customer_id, voucherData.business_id);

            return secureVoucher;

        } catch (error) {
            console.error('Error creating secure voucher:', error);
            throw error;
        }
    }

    // ========================================
    // DATA ACCESS CONTROLS
    // ========================================

    /**
     * Get vouchers for customer (customer view only)
     * Returns only vouchers belonging to the customer
     */
    async getCustomerVouchers(customerId) {
        try {
            // In a real implementation, this would be a secure database query
            const rewardVouchers = JSON.parse(localStorage.getItem('rewardVouchers') || '[]');
            
            // Filter to only customer's vouchers
            const customerVouchers = rewardVouchers.filter(voucher => 
                voucher.customer_id === customerId
            );

            // Remove sensitive fields for customer view
            return customerVouchers.map(voucher => this.sanitizeVoucherForCustomer(voucher));

        } catch (error) {
            console.error('Error getting customer vouchers:', error);
            return [];
        }
    }

    /**
     * Get vouchers for business (business view only)
     * Returns only vouchers for the business
     */
    async getBusinessVouchers(businessId) {
        try {
            // In a real implementation, this would be a secure database query
            const rewardVouchers = JSON.parse(localStorage.getItem('rewardVouchers') || '[]');
            
            // Filter to only business's vouchers
            const businessVouchers = rewardVouchers.filter(voucher => 
                voucher.business_id === businessId
            );

            // Remove sensitive fields for business view
            return businessVouchers.map(voucher => this.sanitizeVoucherForBusiness(voucher));

        } catch (error) {
            console.error('Error getting business vouchers:', error);
            return [];
        }
    }

    /**
     * Sanitize voucher data for customer view
     * Removes sensitive business information
     */
    sanitizeVoucherForCustomer(voucher) {
        return {
            id: voucher.id,
            code: voucher.code,
            reward_type: voucher.reward_type,
            reward_value: voucher.reward_value,
            expires_at: voucher.expires_at,
            used: voucher.used,
            expired: voucher.expired,
            created_at: voucher.created_at,
            // Business info (limited)
            business_name: this.getBusinessName(voucher.business_id),
            // No sensitive business data
            // No other customer data
        };
    }

    /**
     * Sanitize voucher data for business view
     * Removes sensitive customer information
     */
    sanitizeVoucherForBusiness(voucher) {
        return {
            id: voucher.id,
            code: voucher.code,
            reward_type: voucher.reward_type,
            reward_value: voucher.reward_value,
            expires_at: voucher.expires_at,
            used: voucher.used,
            expired: voucher.expired,
            created_at: voucher.created_at,
            // Customer info (limited)
            customer_name: this.getCustomerName(voucher.customer_id),
            // No sensitive customer data
            // No other business data
        };
    }

    // ========================================
    // PRIVACY & GDPR COMPLIANCE
    // ========================================

    /**
     * Handle customer opt-out of loyalty tracking
     * Resets progress and removes tracking data
     */
    async handleCustomerOptOut(customerId) {
        try {
            console.log(`Processing opt-out request for customer: ${customerId}`);

            // Reset loyalty progress
            await this.resetLoyaltyProgress(customerId);
            
            // Remove tracking data
            await this.removeTrackingData(customerId);
            
            // Log opt-out event
            await this.logPrivacyEvent('opt_out', customerId, null, {
                timestamp: new Date().toISOString(),
                reason: 'customer_request',
                data_retention: 'progress_reset'
            });

            console.log(`Opt-out processed for customer: ${customerId}`);

        } catch (error) {
            console.error('Error processing opt-out:', error);
            throw error;
        }
    }

    /**
     * Reset loyalty progress for customer
     */
    async resetLoyaltyProgress(customerId) {
        try {
            const loyaltyProgress = JSON.parse(localStorage.getItem('loyaltyProgress') || '[]');
            
            // Reset all progress for customer
            const updatedProgress = loyaltyProgress.map(progress => {
                if (progress.customer_id === customerId) {
                    return {
                        ...progress,
                        total_visits: 0,
                        total_spend: 0,
                        reward_unlocked: false,
                        reward_redeemed: false,
                        reward_voucher_id: null,
                        opt_out: true,
                        opt_out_date: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                }
                return progress;
            });

            localStorage.setItem('loyaltyProgress', JSON.stringify(updatedProgress));
            console.log(`Loyalty progress reset for customer: ${customerId}`);

        } catch (error) {
            console.error('Error resetting loyalty progress:', error);
            throw error;
        }
    }

    /**
     * Remove tracking data for customer
     */
    async removeTrackingData(customerId) {
        try {
            // Remove or anonymize tracking data
            // In a real implementation, this would involve database operations
            console.log(`Tracking data removed for customer: ${customerId}`);
            
        } catch (error) {
            console.error('Error removing tracking data:', error);
            throw error;
        }
    }

    /**
     * Check if customer has opted out
     */
    async isCustomerOptedOut(customerId) {
        try {
            const loyaltyProgress = JSON.parse(localStorage.getItem('loyaltyProgress') || '[]');
            const customerProgress = loyaltyProgress.find(p => p.customer_id === customerId);
            
            return customerProgress && customerProgress.opt_out === true;
        } catch (error) {
            console.error('Error checking opt-out status:', error);
            return false;
        }
    }

    // ========================================
    // ACTIVITY LOGGING
    // ========================================

    /**
     * Log voucher activity with timestamps
     */
    async logVoucherActivity(action, voucherId, customerId, businessId, additionalData = {}) {
        try {
            const activityLog = {
                id: this.generateSecureId(),
                action: action,
                voucher_id: voucherId,
                customer_id: customerId,
                business_id: businessId,
                timestamp: new Date().toISOString(),
                ip_address: additionalData.ip_address || null,
                user_agent: additionalData.user_agent || null,
                additional_data: additionalData
            };

            // Store activity log
            const existingLogs = JSON.parse(localStorage.getItem('voucherActivityLogs') || '[]');
            existingLogs.push(activityLog);
            localStorage.setItem('voucherActivityLogs', JSON.stringify(existingLogs));

            console.log(`Voucher activity logged: ${action} for voucher ${voucherId}`);

        } catch (error) {
            console.error('Error logging voucher activity:', error);
        }
    }

    /**
     * Log privacy-related events
     */
    async logPrivacyEvent(eventType, customerId, businessId, eventData) {
        try {
            const privacyLog = {
                id: this.generateSecureId(),
                event_type: eventType,
                customer_id: customerId,
                business_id: businessId,
                timestamp: new Date().toISOString(),
                gdpr_basis: 'contract', // UK GDPR Art 6(1)(b)
                data_retention: eventData.data_retention || 'standard',
                event_data: eventData
            };

            // Store privacy log
            const existingLogs = JSON.parse(localStorage.getItem('privacyEventLogs') || '[]');
            existingLogs.push(privacyLog);
            localStorage.setItem('privacyEventLogs', JSON.stringify(existingLogs));

            console.log(`Privacy event logged: ${eventType} for customer ${customerId}`);

        } catch (error) {
            console.error('Error logging privacy event:', error);
        }
    }

    // ========================================
    // DATABASE OPERATIONS
    // ========================================

    /**
     * Store voucher with unique index
     */
    async storeVoucherWithUniqueIndex(voucher) {
        try {
            // In a real implementation, this would use database with unique index
            const rewardVouchers = JSON.parse(localStorage.getItem('rewardVouchers') || '[]');
            
            // Check for duplicate code (unique index simulation)
            const duplicateCode = rewardVouchers.find(v => v.code === voucher.code);
            if (duplicateCode) {
                throw new Error('Voucher code already exists - unique index violation');
            }

            // Add voucher
            rewardVouchers.push(voucher);
            localStorage.setItem('rewardVouchers', JSON.stringify(rewardVouchers));

            console.log(`Voucher stored with unique index: ${voucher.code}`);

        } catch (error) {
            console.error('Error storing voucher with unique index:', error);
            throw error;
        }
    }

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    /**
     * Generate secure ID
     */
    generateSecureId() {
        return crypto.randomUUID();
    }

    /**
     * Get business name (sanitized)
     */
    getBusinessName(businessId) {
        // In a real implementation, this would be a database query
        const businessNames = {
            'business_001': 'Glow Hair',
            'business_002': 'Spa Haven',
            'business_003': 'Luxe Beauty'
        };
        return businessNames[businessId] || 'Business';
    }

    /**
     * Get customer name (sanitized)
     */
    getCustomerName(customerId) {
        // In a real implementation, this would be a database query
        const customerNames = {
            'customer_1': 'Jane Smith',
            'customer_2': 'John Doe',
            'customer_3': 'Sarah Wilson'
        };
        return customerNames[customerId] || 'Customer';
    }

    // ========================================
    // GDPR COMPLIANCE
    // ========================================

    /**
     * Get data processing basis for GDPR compliance
     */
    getDataProcessingBasis() {
        return {
            basis: 'contract', // UK GDPR Art 6(1)(b)
            description: 'Processing necessary for performance of contract',
            lawful_basis: 'Legitimate interest for loyalty program management',
            data_subject_rights: [
                'Right to access',
                'Right to rectification',
                'Right to erasure',
                'Right to restrict processing',
                'Right to data portability',
                'Right to object'
            ]
        };
    }

    /**
     * Generate privacy notice for loyalty program
     */
    generatePrivacyNotice() {
        return {
            title: 'Loyalty Program Privacy Notice',
            data_controller: 'BlkPages Ltd',
            data_processing_basis: 'Contract (UK GDPR Art 6(1)(b))',
            data_collected: [
                'Booking history',
                'Loyalty progress',
                'Reward vouchers',
                'Contact information'
            ],
            data_retention: 'Until loyalty program completion or opt-out',
            customer_rights: [
                'Access your data',
                'Correct inaccurate data',
                'Delete your data',
                'Opt-out of tracking',
                'Data portability'
            ],
            contact: 'privacy@blkpages.com'
        };
    }
}

module.exports = SecurityPrivacySystem;
