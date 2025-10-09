/**
 * SMS Messaging System for BlkPages
 * Handles SMS sending, delivery tracking, and integration with credit system
 */

class SMSMessagingSystem {
    constructor() {
        this.messageQueue = [];
        this.deliveryStatus = new Map();
        this.auditLogs = [];
        this.smsProvider = {
            name: 'Twilio', // In production, use actual SMS provider
            apiKey: 'demo_api_key',
            fromNumber: '+441234567890' // Demo from number
        };
    }

    /**
     * Send SMS message
     */
    async sendSMS(businessId, customerId, message, smsType = 'booking') {
        try {
            // Check if business has enough credits
            if (!window.smsCreditSystem.hasEnoughCredits(businessId, 1)) {
                throw new Error('Insufficient SMS credits');
            }

            // Get customer's verified phone number
            const customerPhone = window.verifiedCustomerNumbers.getDecryptedNumber(customerId);
            if (!customerPhone) {
                throw new Error('Customer phone number not verified');
            }

            // Get business verified phone number for "from" field
            const businessPhone = window.verifiedBusinessNumbers.getVerifiedNumber(businessId);
            if (!businessPhone) {
                throw new Error('Business phone number not verified');
            }

            // Create message record
            const messageRecord = {
                id: this.generateMessageId(),
                business_id: businessId,
                customer_id: customerId,
                message: message,
                sms_type: smsType,
                to_number: customerPhone,
                from_number: businessPhone,
                status: 'pending',
                created_at: new Date(),
                sent_at: null,
                delivered_at: null,
                failed_at: null,
                error_message: null
            };

            // Add to queue
            this.messageQueue.push(messageRecord);

            // Send SMS via provider
            const result = await this.sendViaProvider(messageRecord);

            if (result.success) {
                // Update message status
                messageRecord.status = 'sent';
                messageRecord.sent_at = new Date();
                messageRecord.provider_message_id = result.message_id;

                // Deduct credits
                window.smsCreditSystem.deductCredits(businessId, 1, smsType);

                // Log successful send
                this.logAuditEvent('sms_sent', businessId, {
                    message_id: messageRecord.id,
                    customer_id: customerId,
                    sms_type: smsType,
                    provider_message_id: result.message_id
                });

                return {
                    success: true,
                    message_id: messageRecord.id,
                    sent_at: messageRecord.sent_at
                };
            } else {
                // Handle send failure
                messageRecord.status = 'failed';
                messageRecord.failed_at = new Date();
                messageRecord.error_message = result.error;

                this.logAuditEvent('sms_failed', businessId, {
                    message_id: messageRecord.id,
                    customer_id: customerId,
                    error: result.error
                });

                throw new Error(`SMS sending failed: ${result.error}`);
            }

        } catch (error) {
            this.logAuditEvent('sms_error', businessId, {
                customer_id: customerId,
                error: error.message
            });

            throw error;
        }
    }

    /**
     * Send SMS via provider (Twilio, etc.)
     */
    async sendViaProvider(messageRecord) {
        try {
            // In a real implementation, this would call the actual SMS provider API
            // For demo purposes, simulate the API call
            
            console.log(`SMS Provider Call:`, {
                to: this.maskPhoneNumber(messageRecord.to_number),
                from: this.maskPhoneNumber(messageRecord.from_number),
                message: messageRecord.message,
                provider: this.smsProvider.name
            });

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Simulate success (90% success rate for demo)
            const isSuccess = Math.random() > 0.1;

            if (isSuccess) {
                return {
                    success: true,
                    message_id: this.generateProviderMessageId(),
                    provider: this.smsProvider.name
                };
            } else {
                return {
                    success: false,
                    error: 'Provider API error - network timeout'
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send booking confirmation SMS
     */
    async sendBookingConfirmation(businessId, customerId, bookingDetails) {
        const message = `Booking confirmed! ${bookingDetails.service} on ${bookingDetails.date} at ${bookingDetails.time}. Reference: ${bookingDetails.reference}. Reply STOP to opt out.`;
        
        return await this.sendSMS(businessId, customerId, message, 'booking');
    }

    /**
     * Send booking cancellation SMS
     */
    async sendBookingCancellation(businessId, customerId, bookingDetails) {
        const message = `Booking cancelled: ${bookingDetails.service} on ${bookingDetails.date}. Refund processed. Reference: ${bookingDetails.reference}. Reply STOP to opt out.`;
        
        return await this.sendSMS(businessId, customerId, message, 'booking');
    }

    /**
     * Send booking reschedule SMS
     */
    async sendBookingReschedule(businessId, customerId, bookingDetails) {
        const message = `Booking rescheduled: ${bookingDetails.service} now on ${bookingDetails.newDate} at ${bookingDetails.newTime}. Reference: ${bookingDetails.reference}. Reply STOP to opt out.`;
        
        return await this.sendSMS(businessId, customerId, message, 'booking');
    }

    /**
     * Send promotional SMS
     */
    async sendPromotionalSMS(businessId, customerId, promotionalMessage) {
        const message = `${promotionalMessage} Reply STOP to opt out.`;
        
        return await this.sendSMS(businessId, customerId, message, 'promotional');
    }

    /**
     * Send bulk promotional SMS
     */
    async sendBulkPromotionalSMS(businessId, customerIds, promotionalMessage) {
        const results = [];
        const errors = [];

        for (const customerId of customerIds) {
            try {
                const result = await this.sendPromotionalSMS(businessId, customerId, promotionalMessage);
                results.push(result);
            } catch (error) {
                errors.push({
                    customer_id: customerId,
                    error: error.message
                });
            }
        }

        return {
            success: results.length,
            failed: errors.length,
            results: results,
            errors: errors
        };
    }

    /**
     * Get message delivery status
     */
    getDeliveryStatus(messageId) {
        return this.deliveryStatus.get(messageId) || {
            status: 'unknown',
            delivered_at: null,
            error: null
        };
    }

    /**
     * Update delivery status (called by webhook from SMS provider)
     */
    updateDeliveryStatus(messageId, status, deliveredAt = null, error = null) {
        const statusUpdate = {
            message_id: messageId,
            status: status,
            delivered_at: deliveredAt,
            error: error,
            updated_at: new Date()
        };

        this.deliveryStatus.set(messageId, statusUpdate);

        this.logAuditEvent('delivery_status_updated', null, {
            message_id: messageId,
            status: status,
            delivered_at: deliveredAt,
            error: error
        });

        return statusUpdate;
    }

    /**
     * Get SMS analytics for business
     */
    getSMSAnalytics(businessId, startDate, endDate) {
        const messages = this.messageQueue.filter(msg => 
            msg.business_id === businessId &&
            msg.created_at >= startDate &&
            msg.created_at <= endDate
        );

        const analytics = {
            total_sent: messages.length,
            booking_sms: messages.filter(msg => msg.sms_type === 'booking').length,
            promotional_sms: messages.filter(msg => msg.sms_type === 'promotional').length,
            delivered: messages.filter(msg => msg.status === 'delivered').length,
            failed: messages.filter(msg => msg.status === 'failed').length,
            pending: messages.filter(msg => msg.status === 'pending').length,
            delivery_rate: 0,
            cost_this_period: messages.length * 1, // £1 per SMS (demo)
            average_delivery_time: this.calculateAverageDeliveryTime(messages)
        };

        if (analytics.total_sent > 0) {
            analytics.delivery_rate = (analytics.delivered / analytics.total_sent) * 100;
        }

        return analytics;
    }

    /**
     * Calculate average delivery time
     */
    calculateAverageDeliveryTime(messages) {
        const deliveredMessages = messages.filter(msg => 
            msg.status === 'delivered' && msg.sent_at && msg.delivered_at
        );

        if (deliveredMessages.length === 0) return 0;

        const totalTime = deliveredMessages.reduce((sum, msg) => {
            const deliveryTime = new Date(msg.delivered_at) - new Date(msg.sent_at);
            return sum + deliveryTime;
        }, 0);

        return Math.round(totalTime / deliveredMessages.length / 1000); // seconds
    }

    /**
     * Get message history for business
     */
    getMessageHistory(businessId, limit = 50) {
        return this.messageQueue
            .filter(msg => msg.business_id === businessId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);
    }

    /**
     * Get message history for customer
     */
    getCustomerMessageHistory(customerId, limit = 50) {
        return this.messageQueue
            .filter(msg => msg.customer_id === customerId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);
    }

    /**
     * Mask phone number for display
     */
    maskPhoneNumber(phoneNumber) {
        if (!phoneNumber) return '••••••••••';
        
        const cleaned = phoneNumber.replace(/\s/g, '');
        if (cleaned.length < 4) return '••••••••••';
        
        const lastFour = cleaned.slice(-4);
        const masked = '•'.repeat(cleaned.length - 4) + lastFour;
        
        return masked;
    }

    /**
     * Generate message ID
     */
    generateMessageId() {
        return 'sms_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate provider message ID
     */
    generateProviderMessageId() {
        return 'twilio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
        console.log('SMS Messaging Audit Log:', auditEntry);
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
        return 'sms_msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get client IP (mock for demo)
     */
    getClientIP() {
        return '192.168.1.100'; // Mock IP for demo
    }
}

// Initialize global SMS messaging system
window.smsMessagingSystem = new SMSMessagingSystem();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SMSMessagingSystem;
}
