/**
 * SMS Templates for BlkPages
 * All SMS messages under 160 characters for Premium businesses only
 */

class SMSTemplates {
    constructor() {
        this.templates = {
            // Customer SMS Templates
            customer: {
                bookingConfirmation: (data) => {
                    const message = `Booking confirmed: ${data.service} at ${data.businessName}, ${data.bookingTime}. Pay details in email. Keep this SMS as your quick reminder. No reply.`;
                    return {
                        message,
                        characterCount: message.length,
                        underLimit: message.length <= 160
                    };
                },
                
                bookingReminder: (data) => {
                    const message = `Reminder: ${data.service} at ${data.businessName}, ${data.bookingTime} tomorrow. Details in your email. No reply — contact the business directly.`;
                    return {
                        message,
                        characterCount: message.length,
                        underLimit: message.length <= 160
                    };
                },
                
                cancellationConfirmation: (data) => {
                    const message = `Your booking for ${data.service} at ${data.businessName} on ${data.bookingTime} is cancelled. Refund/policy in email. No reply – contact business direct.`;
                    return {
                        message,
                        characterCount: message.length,
                        underLimit: message.length <= 160
                    };
                }
            },
            
            // Business SMS Templates
            business: {
                bookingNotification: (data) => {
                    const message = `New booking: ${data.customerName} booked ${data.service}, ${data.bookingTime}. Check dashboard for payment/refunds. No reply.`;
                    return {
                        message,
                        characterCount: message.length,
                        underLimit: message.length <= 160
                    };
                },
                
                cancellationNotification: (data) => {
                    const message = `${data.customerName} cancelled ${data.service}, ${data.bookingTime}. See dashboard for refund/payment status. No reply.`;
                    return {
                        message,
                        characterCount: message.length,
                        underLimit: message.length <= 160
                    };
                },
                
                rescheduleNotification: (data) => {
                    const message = `${data.customerName} rescheduled ${data.service} to ${data.newBookingTime}. Check dashboard for details. No reply.`;
                    return {
                        message,
                        characterCount: message.length,
                        underLimit: message.length <= 160
                    };
                }
            }
        };
    }

    /**
     * Get customer SMS template
     */
    getCustomerTemplate(templateType, data) {
        if (!this.templates.customer[templateType]) {
            throw new Error(`Customer SMS template '${templateType}' not found`);
        }
        
        return this.templates.customer[templateType](data);
    }

    /**
     * Get business SMS template
     */
    getBusinessTemplate(templateType, data) {
        if (!this.templates.business[templateType]) {
            throw new Error(`Business SMS template '${templateType}' not found`);
        }
        
        return this.templates.business[templateType](data);
    }

    /**
     * Validate SMS message length
     */
    validateMessage(message) {
        return {
            message,
            characterCount: message.length,
            underLimit: message.length <= 160,
            segments: Math.ceil(message.length / 160)
        };
    }

    /**
     * Get all available templates
     */
    getAllTemplates() {
        return {
            customer: Object.keys(this.templates.customer),
            business: Object.keys(this.templates.business)
        };
    }

    /**
     * Test all templates with sample data
     */
    testAllTemplates() {
        const sampleData = {
            service: 'Haircut',
            businessName: 'Glow Salon',
            customerName: 'Jane Smith',
            bookingTime: 'Monday Jan 15 2025 at 2:00 PM',
            newBookingTime: 'Tuesday Jan 16 2025 at 2:00 PM'
        };

        const results = {};

        // Test customer templates
        results.customer = {};
        Object.keys(this.templates.customer).forEach(templateType => {
            try {
                results.customer[templateType] = this.getCustomerTemplate(templateType, sampleData);
            } catch (error) {
                results.customer[templateType] = { error: error.message };
            }
        });

        // Test business templates
        results.business = {};
        Object.keys(this.templates.business).forEach(templateType => {
            try {
                results.business[templateType] = this.getBusinessTemplate(templateType, sampleData);
            } catch (error) {
                results.business[templateType] = { error: error.message };
            }
        });

        return results;
    }
}

// ========================================
// SMS SERVICE IMPLEMENTATION
// ========================================

class SMSService {
    constructor() {
        this.templates = new SMSTemplates();
        this.isEnabled = process.env.SMS_ENABLED === 'true';
        this.provider = process.env.SMS_PROVIDER || 'twilio';
    }

    /**
     * Send customer booking confirmation SMS
     */
    async sendBookingConfirmation(data) {
        if (!this.isEnabled) {
            console.log('SMS disabled, skipping booking confirmation');
            return;
        }

        const template = this.templates.getCustomerTemplate('bookingConfirmation', data);
        
        if (!template.underLimit) {
            console.warn(`SMS message too long (${template.characterCount} chars):`, template.message);
            return;
        }

        await this.sendSMS({
            to: data.to,
            message: template.message,
            type: 'booking_confirmation'
        });
    }

    /**
     * Send customer booking reminder SMS
     */
    async sendBookingReminder(data) {
        if (!this.isEnabled) {
            console.log('SMS disabled, skipping booking reminder');
            return;
        }

        const template = this.templates.getCustomerTemplate('bookingReminder', data);
        
        if (!template.underLimit) {
            console.warn(`SMS message too long (${template.characterCount} chars):`, template.message);
            return;
        }

        await this.sendSMS({
            to: data.to,
            message: template.message,
            type: 'booking_reminder'
        });
    }

    /**
     * Send customer cancellation confirmation SMS
     */
    async sendCancellationConfirmation(data) {
        if (!this.isEnabled) {
            console.log('SMS disabled, skipping cancellation confirmation');
            return;
        }

        const template = this.templates.getCustomerTemplate('cancellationConfirmation', data);
        
        if (!template.underLimit) {
            console.warn(`SMS message too long (${template.characterCount} chars):`, template.message);
            return;
        }

        await this.sendSMS({
            to: data.to,
            message: template.message,
            type: 'cancellation_confirmation'
        });
    }

    /**
     * Send business booking notification SMS
     */
    async sendBusinessBookingNotification(data) {
        if (!this.isEnabled) {
            console.log('SMS disabled, skipping business booking notification');
            return;
        }

        const template = this.templates.getBusinessTemplate('bookingNotification', data);
        
        if (!template.underLimit) {
            console.warn(`SMS message too long (${template.characterCount} chars):`, template.message);
            return;
        }

        await this.sendSMS({
            to: data.to,
            message: template.message,
            type: 'business_booking_notification'
        });
    }

    /**
     * Send business cancellation notification SMS
     */
    async sendBusinessCancellationNotification(data) {
        if (!this.isEnabled) {
            console.log('SMS disabled, skipping business cancellation notification');
            return;
        }

        const template = this.templates.getBusinessTemplate('cancellationNotification', data);
        
        if (!template.underLimit) {
            console.warn(`SMS message too long (${template.characterCount} chars):`, template.message);
            return;
        }

        await this.sendSMS({
            to: data.to,
            message: template.message,
            type: 'business_cancellation_notification'
        });
    }

    /**
     * Send business reschedule notification SMS
     */
    async sendRescheduleNotification(data) {
        if (!this.isEnabled) {
            console.log('SMS disabled, skipping reschedule notification');
            return;
        }

        const template = this.templates.getBusinessTemplate('rescheduleNotification', data);
        
        if (!template.underLimit) {
            console.warn(`SMS message too long (${template.characterCount} chars):`, template.message);
            return;
        }

        await this.sendSMS({
            to: data.to,
            message: template.message,
            type: 'reschedule_notification'
        });
    }

    /**
     * Send SMS via provider
     */
    async sendSMS({ to, message, type }) {
        try {
            console.log(`Sending SMS to ${to}:`, message);
            
            // Implementation would use SMS provider (Twilio, AWS SNS, etc.)
            const result = await this.provider.sendSMS({
                to,
                message,
                type
            });
            
            // Log successful send
            await this.logSMS({
                to,
                message,
                type,
                status: 'sent',
                providerId: result.id,
                timestamp: new Date()
            });
            
            return result;
        } catch (error) {
            console.error('SMS send failed:', error);
            
            // Log failed send
            await this.logSMS({
                to,
                message,
                type,
                status: 'failed',
                error: error.message,
                timestamp: new Date()
            });
            
            throw error;
        }
    }

    /**
     * Log SMS activity
     */
    async logSMS(data) {
        // Implementation would log to database
        console.log('SMS Log:', data);
    }
}

module.exports = { SMSTemplates, SMSService };
