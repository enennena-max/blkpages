/**
 * BlkPages Loyalty Notification System
 * Handles all loyalty-related notifications including reward unlocks, expirations, redemptions, and progress updates
 * 
 * Notification Types:
 * - reward_unlocked: When customer unlocks a reward
 * - reward_expiring: When reward is about to expire
 * - reward_redeemed: When customer redeems a reward
 * - reward_progress: When customer is close to unlocking a reward
 */

const CommunicationSystem = require('./communication-system');

class LoyaltyNotificationSystem {
    constructor() {
        this.communicationSystem = new CommunicationSystem();
    }

    // ========================================
    // LOYALTY NOTIFICATION TRIGGERS
    // ========================================

    /**
     * Send reward unlocked notification
     * Trigger: When customer unlocks a reward through loyalty program
     */
    async sendRewardUnlockedNotification(customerData, businessData, voucherData) {
        try {
            console.log('Sending reward unlocked notification:', {
                customerId: customerData.id,
                businessId: businessData.id,
                voucherId: voucherData.id
            });

            // Send email notification
            await this.sendRewardUnlockedEmail(customerData, businessData, voucherData);

            // Send SMS notification (if business has Premium package)
            if (businessData.package === 'Premium' && customerData.phoneNumber) {
                await this.sendRewardUnlockedSMS(customerData, businessData, voucherData);
            }

            // Log notification
            await this.logNotification('reward_unlocked', customerData.id, businessData.id, voucherData.id);

        } catch (error) {
            console.error('Failed to send reward unlocked notification:', error);
            throw error;
        }
    }

    /**
     * Send reward expiring notification
     * Trigger: When reward is about to expire (e.g., 3 days before expiry)
     */
    async sendRewardExpiringNotification(customerData, businessData, voucherData) {
        try {
            console.log('Sending reward expiring notification:', {
                customerId: customerData.id,
                businessId: businessData.id,
                voucherId: voucherData.id
            });

            // Send email notification
            await this.sendRewardExpiringEmail(customerData, businessData, voucherData);

            // Log notification
            await this.logNotification('reward_expiring', customerData.id, businessData.id, voucherData.id);

        } catch (error) {
            console.error('Failed to send reward expiring notification:', error);
            throw error;
        }
    }

    /**
     * Send reward redeemed notification
     * Trigger: When customer successfully redeems a reward
     */
    async sendRewardRedeemedNotification(customerData, businessData, voucherData) {
        try {
            console.log('Sending reward redeemed notification:', {
                customerId: customerData.id,
                businessId: businessData.id,
                voucherId: voucherData.id
            });

            // Send email notification
            await this.sendRewardRedeemedEmail(customerData, businessData, voucherData);

            // Log notification
            await this.logNotification('reward_redeemed', customerData.id, businessData.id, voucherData.id);

        } catch (error) {
            console.error('Failed to send reward redeemed notification:', error);
            throw error;
        }
    }

    /**
     * Send reward progress notification
     * Trigger: When customer is close to unlocking a reward (e.g., 1 booking away)
     */
    async sendRewardProgressNotification(customerData, businessData, progressData) {
        try {
            console.log('Sending reward progress notification:', {
                customerId: customerData.id,
                businessId: businessData.id,
                progress: progressData
            });

            // Send email notification
            await this.sendRewardProgressEmail(customerData, businessData, progressData);

            // Log notification
            await this.logNotification('reward_progress', customerData.id, businessData.id, null);

        } catch (error) {
            console.error('Failed to send reward progress notification:', error);
            throw error;
        }
    }

    // ========================================
    // EMAIL NOTIFICATIONS
    // ========================================

    /**
     * Send reward unlocked email
     */
    async sendRewardUnlockedEmail(customerData, businessData, voucherData) {
        const emailData = {
            to: customerData.email,
            subject: `🎉 You've unlocked a reward with ${businessData.name}!`,
            template: 'reward_unlocked',
            data: {
                customerName: customerData.name,
                businessName: businessData.name,
                voucherCode: voucherData.id.substring(0, 8).toUpperCase(),
                expiryDate: this.formatDate(voucherData.expires_at),
                rewardType: voucherData.reward_type,
                rewardValue: voucherData.reward_value,
                businessPhone: businessData.phone,
                businessAddress: businessData.address
            }
        };

        await this.communicationSystem.emailService.sendLoyaltyNotification(emailData);
    }

    /**
     * Send reward expiring email
     */
    async sendRewardExpiringEmail(customerData, businessData, voucherData) {
        const emailData = {
            to: customerData.email,
            subject: `⏰ Your reward with ${businessData.name} expires soon!`,
            template: 'reward_expiring',
            data: {
                customerName: customerData.name,
                businessName: businessData.name,
                voucherCode: voucherData.id.substring(0, 8).toUpperCase(),
                expiryDate: this.formatDate(voucherData.expires_at),
                rewardType: voucherData.reward_type,
                rewardValue: voucherData.reward_value,
                businessPhone: businessData.phone,
                businessAddress: businessData.address
            }
        };

        await this.communicationSystem.emailService.sendLoyaltyNotification(emailData);
    }

    /**
     * Send reward redeemed email
     */
    async sendRewardRedeemedEmail(customerData, businessData, voucherData) {
        const emailData = {
            to: customerData.email,
            subject: `✅ Reward redeemed successfully with ${businessData.name}`,
            template: 'reward_redeemed',
            data: {
                customerName: customerData.name,
                businessName: businessData.name,
                redemptionDate: this.formatDate(new Date().toISOString()),
                rewardType: voucherData.reward_type,
                rewardValue: voucherData.reward_value,
                businessPhone: businessData.phone,
                businessAddress: businessData.address
            }
        };

        await this.communicationSystem.emailService.sendLoyaltyNotification(emailData);
    }

    /**
     * Send reward progress email
     */
    async sendRewardProgressEmail(customerData, businessData, progressData) {
        const emailData = {
            to: customerData.email,
            subject: `🎯 You're ${progressData.remaining} away from your reward with ${businessData.name}!`,
            template: 'reward_progress',
            data: {
                customerName: customerData.name,
                businessName: businessData.name,
                currentProgress: progressData.current,
                requiredProgress: progressData.required,
                remaining: progressData.remaining,
                progressType: progressData.type,
                rewardType: progressData.rewardType,
                rewardValue: progressData.rewardValue,
                businessPhone: businessData.phone,
                businessAddress: businessData.address
            }
        };

        await this.communicationSystem.emailService.sendLoyaltyNotification(emailData);
    }

    // ========================================
    // SMS NOTIFICATIONS
    // ========================================

    /**
     * Send reward unlocked SMS
     */
    async sendRewardUnlockedSMS(customerData, businessData, voucherData) {
        const smsData = {
            to: customerData.phoneNumber,
            message: `BlkPages: Reward unlocked – use code ${voucherData.id.substring(0, 8).toUpperCase()} before ${this.formatDate(voucherData.expires_at)}.`
        };

        await this.communicationSystem.smsService.sendLoyaltyNotification(smsData);
    }

    // ========================================
    // NOTIFICATION TEMPLATES
    // ========================================

    /**
     * Get reward unlocked email template
     */
    getRewardUnlockedEmailTemplate() {
        return {
            subject: "🎉 You've unlocked a reward with [Business]!",
            body: `
                <h2>Congratulations, {{customerName}}!</h2>
                <p>You've successfully unlocked your reward with <strong>{{businessName}}</strong>!</p>
                
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Your Reward Details</h3>
                    <p><strong>Code:</strong> {{voucherCode}}</p>
                    <p><strong>Reward:</strong> {{rewardType}} - {{rewardValue}}</p>
                    <p><strong>Expires:</strong> {{expiryDate}}</p>
                </div>
                
                <p>Use your reward code when booking with {{businessName}} to redeem your reward.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://blkpages.com/business/{{businessId}}" 
                       style="background: #FF3CAC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                        Book with {{businessName}}
                    </a>
                </div>
                
                <p><strong>Contact {{businessName}}:</strong><br>
                Phone: {{businessPhone}}<br>
                Address: {{businessAddress}}</p>
            `
        };
    }

    /**
     * Get reward expiring email template
     */
    getRewardExpiringEmailTemplate() {
        return {
            subject: "⏰ Your reward with [Business] expires soon!",
            body: `
                <h2>Don't miss out, {{customerName}}!</h2>
                <p>Your reward with <strong>{{businessName}}</strong> expires soon on <strong>{{expiryDate}}</strong>.</p>
                
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Your Reward Details</h3>
                    <p><strong>Code:</strong> {{voucherCode}}</p>
                    <p><strong>Reward:</strong> {{rewardType}} - {{rewardValue}}</p>
                    <p><strong>Expires:</strong> {{expiryDate}}</p>
                </div>
                
                <p>Book now to use your reward before it expires!</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://blkpages.com/business/{{businessId}}" 
                       style="background: #FF3CAC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                        Book with {{businessName}}
                    </a>
                </div>
            `
        };
    }

    /**
     * Get reward redeemed email template
     */
    getRewardRedeemedEmailTemplate() {
        return {
            subject: "✅ Reward redeemed successfully on [date]",
            body: `
                <h2>Reward redeemed successfully!</h2>
                <p>Your reward with <strong>{{businessName}}</strong> has been redeemed on <strong>{{redemptionDate}}</strong>.</p>
                
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Redeemed Reward</h3>
                    <p><strong>Reward:</strong> {{rewardType}} - {{rewardValue}}</p>
                    <p><strong>Redeemed on:</strong> {{redemptionDate}}</p>
                </div>
                
                <p>Thank you for using your reward! Keep booking to earn more rewards.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://blkpages.com/customer-dashboard" 
                       style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                        View Your Progress
                    </a>
                </div>
            `
        };
    }

    /**
     * Get reward progress email template
     */
    getRewardProgressEmailTemplate() {
        return {
            subject: "🎯 You're 1 booking away from your reward!",
            body: `
                <h2>You're almost there, {{customerName}}!</h2>
                <p>You're just <strong>{{remaining}}</strong> away from unlocking your reward with <strong>{{businessName}}</strong>!</p>
                
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Your Progress</h3>
                    <p><strong>Current:</strong> {{currentProgress}} {{progressType}}</p>
                    <p><strong>Required:</strong> {{requiredProgress}} {{progressType}}</p>
                    <p><strong>Remaining:</strong> {{remaining}} {{progressType}}</p>
                </div>
                
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Your Reward</h3>
                    <p><strong>Reward:</strong> {{rewardType}} - {{rewardValue}}</p>
                </div>
                
                <p>Book your next service to unlock your reward!</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://blkpages.com/business/{{businessId}}" 
                       style="background: #FF3CAC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                        Book with {{businessName}}
                    </a>
                </div>
            `
        };
    }

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Log notification for tracking
     */
    async logNotification(notificationType, customerId, businessId, voucherId) {
        try {
            const notificationLog = {
                type: notificationType,
                customerId: customerId,
                businessId: businessId,
                voucherId: voucherId,
                timestamp: new Date().toISOString(),
                status: 'sent'
            };

            // In a real implementation, this would be saved to a database
            console.log('Notification logged:', notificationLog);
            
        } catch (error) {
            console.error('Failed to log notification:', error);
        }
    }
}

module.exports = LoyaltyNotificationSystem;
