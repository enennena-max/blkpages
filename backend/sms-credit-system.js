/**
 * SMS Credit System for BlkPages
 * Handles SMS credits, add-ons, low-credit alerts, and usage tracking
 */

class SMSCreditSystem {
    constructor() {
        this.creditBundles = {
            monthly: 50, // Included with £29/month subscription
            addon: 50,   // £3 per 50 messages
            addonPrice: 3
        };
        
        this.usageThresholds = {
            warning: 0.8,  // 80% usage
            critical: 1.0  // 100% usage
        };
        
        this.creditHistory = [];
        this.auditLogs = [];
    }

    /**
     * Initialize SMS credits for a new business
     */
    initializeBusinessCredits(businessId, subscriptionType = 'starter') {
        const credits = {
            business_id: businessId,
            subscription_type: subscriptionType,
            monthly_allowance: this.creditBundles.monthly,
            current_credits: this.creditBundles.monthly,
            addon_credits: 0,
            total_credits: this.creditBundles.monthly,
            last_reset: new Date(),
            next_reset: this.getNextResetDate(),
            usage_this_month: 0,
            booking_sms: 0,
            promotional_sms: 0,
            created_at: new Date(),
            updated_at: new Date()
        };

        this.logAuditEvent('credits_initialized', businessId, {
            monthly_allowance: credits.monthly_allowance,
            subscription_type: subscriptionType
        });

        return credits;
    }

    /**
     * Check if business has enough credits for SMS
     */
    hasEnoughCredits(businessId, smsCount = 1) {
        const business = this.getBusinessCredits(businessId);
        return business && business.current_credits >= smsCount;
    }

    /**
     * Deduct SMS credits
     */
    deductCredits(businessId, smsCount = 1, smsType = 'booking') {
        const business = this.getBusinessCredits(businessId);
        if (!business) {
            throw new Error('Business not found');
        }

        if (business.current_credits < smsCount) {
            throw new Error('Insufficient SMS credits');
        }

        // Update credits
        business.current_credits -= smsCount;
        business.total_credits -= smsCount;
        business.usage_this_month += smsCount;
        business.updated_at = new Date();

        // Track by type
        if (smsType === 'booking') {
            business.booking_sms += smsCount;
        } else if (smsType === 'promotional') {
            business.promotional_sms += smsCount;
        }

        // Check for low credit alerts
        this.checkLowCreditAlerts(businessId);

        this.logAuditEvent('credits_deducted', businessId, {
            sms_count: smsCount,
            sms_type: smsType,
            remaining_credits: business.current_credits
        });

        return business;
    }

    /**
     * Purchase SMS add-on credits
     */
    purchaseAddOn(businessId, bundleCount = 1) {
        const business = this.getBusinessCredits(businessId);
        if (!business) {
            throw new Error('Business not found');
        }

        const addonCredits = bundleCount * this.creditBundles.addon;
        const totalCost = bundleCount * this.creditBundles.addonPrice;

        // Update credits
        business.addon_credits += addonCredits;
        business.current_credits += addonCredits;
        business.total_credits += addonCredits;
        business.updated_at = new Date();

        // Log purchase
        this.logAuditEvent('addon_purchased', businessId, {
            bundle_count: bundleCount,
            credits_added: addonCredits,
            total_cost: totalCost,
            new_total_credits: business.total_credits
        });

        // Send confirmation email
        this.sendAddOnConfirmationEmail(businessId, addonCredits, business.total_credits);

        return business;
    }

    /**
     * Check for low credit alerts
     */
    checkLowCreditAlerts(businessId) {
        const business = this.getBusinessCredits(businessId);
        if (!business) return;

        const usagePercentage = business.usage_this_month / business.monthly_allowance;
        const remainingCredits = business.current_credits;

        // 80% usage warning
        if (usagePercentage >= this.usageThresholds.warning && !business.warning_sent) {
            this.sendLowCreditWarning(businessId, remainingCredits);
            business.warning_sent = true;
            business.updated_at = new Date();
        }

        // 100% usage critical
        if (usagePercentage >= this.usageThresholds.critical && !business.critical_sent) {
            this.sendCreditsDepletedAlert(businessId);
            business.critical_sent = true;
            business.updated_at = new Date();
        }
    }

    /**
     * Reset monthly credits (called by cron job)
     */
    resetMonthlyCredits(businessId) {
        const business = this.getBusinessCredits(businessId);
        if (!business) return;

        // Reset monthly allowance
        business.current_credits = business.monthly_allowance;
        business.usage_this_month = 0;
        business.booking_sms = 0;
        business.promotional_sms = 0;
        business.warning_sent = false;
        business.critical_sent = false;
        business.last_reset = new Date();
        business.next_reset = this.getNextResetDate();
        business.updated_at = new Date();

        this.logAuditEvent('credits_reset', businessId, {
            new_allowance: business.monthly_allowance,
            next_reset: business.next_reset
        });

        return business;
    }

    /**
     * Get business credit information
     */
    getBusinessCredits(businessId) {
        // In a real implementation, this would fetch from database
        // For demo purposes, return mock data
        return {
            business_id: businessId,
            monthly_allowance: 50,
            current_credits: 32,
            addon_credits: 0,
            total_credits: 50,
            usage_this_month: 18,
            booking_sms: 15,
            promotional_sms: 3,
            last_reset: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
            next_reset: this.getNextResetDate(),
            warning_sent: false,
            critical_sent: false,
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            updated_at: new Date()
        };
    }

    /**
     * Get usage analytics
     */
    getUsageAnalytics(businessId) {
        const business = this.getBusinessCredits(businessId);
        if (!business) return null;

        const usagePercentage = (business.usage_this_month / business.monthly_allowance) * 100;
        const estimatedDaysRemaining = this.calculateDaysRemaining(business);
        const weeklyUsageRate = this.calculateWeeklyUsageRate(business);

        return {
            current_credits: business.current_credits,
            total_allowance: business.monthly_allowance,
            usage_percentage: Math.round(usagePercentage),
            usage_this_month: business.usage_this_month,
            booking_sms: business.booking_sms,
            promotional_sms: business.promotional_sms,
            estimated_days_remaining: estimatedDaysRemaining,
            weekly_usage_rate: weeklyUsageRate,
            next_reset: business.next_reset,
            warning_threshold: Math.round(business.monthly_allowance * this.usageThresholds.warning)
        };
    }

    /**
     * Calculate days remaining until credit depletion
     */
    calculateDaysRemaining(business) {
        if (business.usage_this_month === 0) return 30; // Full month if no usage
        
        const daysSinceReset = Math.floor((new Date() - business.last_reset) / (1000 * 60 * 60 * 24));
        const dailyUsageRate = business.usage_this_month / daysSinceReset;
        const remainingCredits = business.current_credits;
        
        return Math.floor(remainingCredits / dailyUsageRate);
    }

    /**
     * Calculate weekly usage rate
     */
    calculateWeeklyUsageRate(business) {
        const daysSinceReset = Math.floor((new Date() - business.last_reset) / (1000 * 60 * 60 * 24));
        const weeklyUsage = (business.usage_this_month / daysSinceReset) * 7;
        return Math.round(weeklyUsage);
    }

    /**
     * Get next reset date (30 days from now)
     */
    getNextResetDate() {
        const nextReset = new Date();
        nextReset.setDate(nextReset.getDate() + 30);
        return nextReset;
    }

    /**
     * Send low credit warning email
     */
    sendLowCreditWarning(businessId, remainingCredits) {
        const business = this.getBusinessCredits(businessId);
        const emailData = {
            to: business.email,
            subject: "80% of your SMS credits have been used — top up now to stay connected",
            template: 'low-credit-warning',
            data: {
                business_name: business.name,
                remaining_credits: remainingCredits,
                purchase_link: `${window.location.origin}/business-dashboard.html#sms-credits`
            }
        };

        this.logAuditEvent('low_credit_warning_sent', businessId, {
            remaining_credits: remainingCredits,
            email_sent: true
        });

        // In a real implementation, this would send actual email
        console.log('Low credit warning email sent:', emailData);
    }

    /**
     * Send credits depleted alert
     */
    sendCreditsDepletedAlert(businessId) {
        const business = this.getBusinessCredits(businessId);
        const emailData = {
            to: business.email,
            subject: "You've used all your SMS credits — add more to continue sending booking reminders",
            template: 'credits-depleted',
            data: {
                business_name: business.name,
                purchase_link: `${window.location.origin}/business-dashboard.html#sms-credits`
            }
        };

        this.logAuditEvent('credits_depleted_alert_sent', businessId, {
            email_sent: true
        });

        // In a real implementation, this would send actual email
        console.log('Credits depleted alert email sent:', emailData);
    }

    /**
     * Send add-on confirmation email
     */
    sendAddOnConfirmationEmail(businessId, creditsAdded, totalCredits) {
        const business = this.getBusinessCredits(businessId);
        const emailData = {
            to: business.email,
            subject: "SMS credits added successfully!",
            template: 'addon-confirmation',
            data: {
                business_name: business.name,
                credits_added: creditsAdded,
                total_credits: totalCredits
            }
        };

        this.logAuditEvent('addon_confirmation_sent', businessId, {
            credits_added: creditsAdded,
            total_credits: totalCredits,
            email_sent: true
        });

        // In a real implementation, this would send actual email
        console.log('Add-on confirmation email sent:', emailData);
    }

    /**
     * Log audit event
     */
    logAuditEvent(eventType, businessId, data = {}) {
        const auditEntry = {
            id: this.generateId(),
            event_type: eventType,
            business_id: businessId,
            timestamp: new Date().toISOString(),
            ip_address: this.getClientIP(),
            user_agent: navigator.userAgent,
            data: data
        };

        this.auditLogs.push(auditEntry);
        
        // In a real implementation, this would save to database
        console.log('SMS Audit Log:', auditEntry);
    }

    /**
     * Get audit logs for business
     */
    getAuditLogs(businessId, limit = 50) {
        return this.auditLogs
            .filter(log => log.business_id === businessId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'sms_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get client IP (mock for demo)
     */
    getClientIP() {
        return '192.168.1.100'; // Mock IP for demo
    }
}

// Initialize global SMS credit system
window.smsCreditSystem = new SMSCreditSystem();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SMSCreditSystem;
}
