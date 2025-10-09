/**
 * BlkPages Communication System
 * Comprehensive email and SMS communication logic for all customer and business scenarios
 * 
 * Rules:
 * - Emails are always sent
 * - SMS only sent if Premium package and only for booking alerts + 24h reminders
 * - All messages trigger automatically without manual intervention
 */

const NotificationLogSystem = require('./notification-log-system');

class CommunicationSystem {
    constructor() {
        this.emailService = new EmailService();
        this.smsService = new SMSService();
        this.timezoneService = new TimezoneService();
        this.notificationLogSystem = new NotificationLogSystem();
    }

    // ========================================
    // CUSTOMER COMMUNICATION RULES
    // ========================================

    /**
     * Booking Confirmation with notification logging
     * Trigger: Immediately after customer completes a booking
     */
    async handleBookingConfirmation(bookingData) {
        const { customer, business, service, bookingTime, paymentModel, totalAmount, bookingId } = bookingData;
        
        try {
            // Always send email
            const emailSent = await this.emailService.sendBookingConfirmation({
                to: customer.email,
                customerName: customer.firstName,
                businessName: business.name,
                service: service.name,
                bookingTime: this.timezoneService.formatDateTime(bookingTime, business.timezone),
                paymentModel: paymentModel,
                totalAmount: totalAmount,
                businessProfileUrl: `${process.env.PLATFORM_URL}/business/${business.id}`,
                dashboardUrl: `${process.env.PLATFORM_URL}/customer-dashboard`
            });

            // Log email confirmation status
            await this.notificationLogSystem.logNotificationStatus(
                bookingId,
                'confirmation',
                emailSent,
                'email'
            );

            // Send SMS only if Premium business
            if (business.package === 'Premium' && customer.phoneNumber) {
                const smsSent = await this.smsService.sendBookingConfirmation({
                    to: customer.phoneNumber,
                    service: service.name,
                    businessName: business.name,
                    bookingTime: this.timezoneService.formatDateTime(bookingTime, business.timezone)
                });

                // Log SMS confirmation status
                await this.notificationLogSystem.logNotificationStatus(
                    bookingId,
                    'confirmation',
                    smsSent,
                    'sms'
                );
            }

            console.log(`Booking confirmation notifications logged for booking ${bookingId}`);
        } catch (error) {
            console.error('Failed to send booking confirmation:', error);
            // Log failed notification
            await this.notificationLogSystem.logNotificationStatus(
                bookingId,
                'confirmation',
                false,
                'email'
            );
        }
    }

    /**
     * Booking Reminder with notification logging
     * Trigger: 24 hours before booking start time
     */
    async handleBookingReminder(bookingData) {
        const { customer, business, service, bookingTime, paymentModel, totalAmount, bookingId } = bookingData;
        
        try {
            // Check if booking is still active (not cancelled)
            const booking = await this.getBookingStatus(bookingId);
            if (booking.status === 'cancelled') {
                console.log(`Skipping reminder for cancelled booking ${bookingId}`);
                return;
            }

            // Always send email reminder
            const emailSent = await this.emailService.sendBookingReminder({
                to: customer.email,
                customerName: customer.firstName,
                businessName: business.name,
                service: service.name,
                bookingTime: this.timezoneService.formatDateTime(bookingTime, business.timezone),
                paymentModel: paymentModel,
                totalAmount: totalAmount,
                businessProfileUrl: `${process.env.PLATFORM_URL}/business/${business.id}`,
                dashboardUrl: `${process.env.PLATFORM_URL}/customer-dashboard`
            });

            // Log email reminder status
            await this.notificationLogSystem.logNotificationStatus(
                bookingId,
                'reminder',
                emailSent,
                'email'
            );

            // Send SMS only if Premium business
            if (business.package === 'Premium' && customer.phoneNumber) {
                const smsSent = await this.smsService.sendBookingReminder({
                    to: customer.phoneNumber,
                    service: service.name,
                    businessName: business.name,
                    bookingTime: this.timezoneService.formatDateTime(bookingTime, business.timezone)
                });

                // Log SMS reminder status
                await this.notificationLogSystem.logNotificationStatus(
                    bookingId,
                    'reminder',
                    smsSent,
                    'sms'
                );
            }

            console.log(`Booking reminder notifications logged for booking ${bookingId}`);
        } catch (error) {
            console.error('Failed to send booking reminder:', error);
            // Log failed notification
            await this.notificationLogSystem.logNotificationStatus(
                bookingId,
                'reminder',
                false,
                'email'
            );
        }
    }

    /**
     * 3. Cancellation Confirmation (Email + SMS if Premium)
     * Trigger: Immediately after customer cancels via dashboard or cancellation link
     */
    async handleBookingCancellation(bookingData, cancellationReason) {
        const { customer, business, service, bookingTime, paymentModel, totalAmount, refundAmount } = bookingData;
        
        // Always send email cancellation confirmation
        await this.emailService.sendCancellationConfirmation({
            to: customer.email,
            customerName: customer.firstName,
            businessName: business.name,
            service: service.name,
            bookingTime: this.timezoneService.formatDateTime(bookingTime, business.timezone),
            paymentModel: paymentModel,
            totalAmount: totalAmount,
            refundAmount: refundAmount,
            cancellationReason: cancellationReason,
            businessProfileUrl: `${process.env.PLATFORM_URL}/business/${business.id}`,
            dashboardUrl: `${process.env.PLATFORM_URL}/customer-dashboard`
        });

        // Send SMS only if Premium business
        if (business.package === 'Premium' && customer.phoneNumber) {
            await this.smsService.sendCancellationConfirmation({
                to: customer.phoneNumber,
                service: service.name,
                businessName: business.name,
                bookingTime: this.timezoneService.formatDateTime(bookingTime, business.timezone)
            });
        }
    }

    /**
     * 4. Refund Notification (Email only)
     * Trigger: When Stripe processes a refund (full or partial)
     */
    async handleRefundNotification(refundData) {
        const { customer, business, service, refundAmount, originalAmount } = refundData;
        
        // Always send email (no SMS for refunds)
        await this.emailService.sendRefundNotification({
            to: customer.email,
            customerName: customer.firstName,
            businessName: business.name,
            service: service.name,
            refundAmount: refundAmount,
            originalAmount: originalAmount,
            dashboardUrl: `${process.env.PLATFORM_URL}/customer-dashboard`
        });
    }

    /**
     * 5. Account-Related Emails (Email only)
     */
    async handleCustomerAccountEvents(eventType, customerData) {
        const { email, firstName } = customerData;
        
        switch (eventType) {
            case 'welcome':
                await this.emailService.sendCustomerWelcome({
                    to: email,
                    customerName: firstName,
                    dashboardUrl: `${process.env.PLATFORM_URL}/customer-dashboard`
                });
                break;
                
            case 'password_reset':
                await this.emailService.sendPasswordReset({
                    to: email,
                    customerName: firstName,
                    resetUrl: `${process.env.PLATFORM_URL}/reset-password?token=${customerData.resetToken}`
                });
                break;
                
            case 'profile_updated':
                await this.emailService.sendProfileUpdated({
                    to: email,
                    customerName: firstName,
                    dashboardUrl: `${process.env.PLATFORM_URL}/customer-dashboard`
                });
                break;
                
            case 'new_card_added':
                await this.emailService.sendNewCardAdded({
                    to: email,
                    customerName: firstName,
                    cardLast4: customerData.cardLast4,
                    dashboardUrl: `${process.env.PLATFORM_URL}/customer-dashboard`
                });
                break;
        }
    }

    // ========================================
    // BUSINESS COMMUNICATION RULES
    // ========================================

    /**
     * 1. New Booking Alert (Email + SMS if Premium)
     * Trigger: Immediately when a customer books with the business
     */
    async handleNewBookingAlert(bookingData) {
        const { customer, business, service, bookingTime, paymentModel, totalAmount } = bookingData;
        
        // Always send email
        await this.emailService.sendBusinessBookingNotification({
            to: business.email,
            businessName: business.name,
            customerName: customer.firstName,
            service: service.name,
            bookingTime: this.timezoneService.formatDateTime(bookingTime, business.timezone),
            paymentModel: paymentModel,
            totalAmount: totalAmount,
            dashboardUrl: `${process.env.PLATFORM_URL}/business-dashboard`
        });

        // Send SMS only if Premium business
        if (business.package === 'Premium' && business.phoneNumber) {
            await this.smsService.sendBusinessBookingNotification({
                to: business.phoneNumber,
                customerName: customer.firstName,
                service: service.name,
                bookingTime: this.timezoneService.formatDateTime(bookingTime, business.timezone)
            });
        }
    }

    /**
     * 2. Cancellation Alert (Email + SMS if Premium)
     * Trigger: Immediately when a customer cancels
     */
    async handleBusinessCancellationAlert(bookingData, cancellationReason) {
        const { customer, business, service, bookingTime, paymentModel, totalAmount, refundAmount } = bookingData;
        
        // Always send email
        await this.emailService.sendBusinessCancellationNotification({
            to: business.email,
            businessName: business.name,
            customerName: customer.firstName,
            service: service.name,
            bookingTime: this.timezoneService.formatDateTime(bookingTime, business.timezone),
            paymentModel: paymentModel,
            totalAmount: totalAmount,
            refundAmount: refundAmount,
            cancellationReason: cancellationReason,
            dashboardUrl: `${process.env.PLATFORM_URL}/business-dashboard`
        });

        // Send SMS only if Premium business
        if (business.package === 'Premium' && business.phoneNumber) {
            await this.smsService.sendBusinessCancellationNotification({
                to: business.phoneNumber,
                customerName: customer.firstName,
                service: service.name,
                bookingTime: this.timezoneService.formatDateTime(bookingTime, business.timezone)
            });
        }
    }

    /**
     * 3. Reschedule Alert (Email + SMS if Premium)
     * Trigger: Immediately when a booking is rescheduled
     */
    async handleRescheduleAlert(bookingData, oldBookingTime) {
        const { customer, business, service, bookingTime, paymentModel, totalAmount } = bookingData;
        
        // Always send email
        await this.emailService.sendRescheduleNotification({
            to: business.email,
            businessName: business.name,
            customerName: customer.firstName,
            service: service.name,
            oldBookingTime: this.timezoneService.formatDateTime(oldBookingTime, business.timezone),
            newBookingTime: this.timezoneService.formatDateTime(bookingTime, business.timezone),
            paymentModel: paymentModel,
            totalAmount: totalAmount,
            dashboardUrl: `${process.env.PLATFORM_URL}/business-dashboard`
        });

        // Send SMS only if Premium business
        if (business.package === 'Premium' && business.phoneNumber) {
            await this.smsService.sendRescheduleNotification({
                to: business.phoneNumber,
                customerName: customer.firstName,
                service: service.name,
                newBookingTime: this.timezoneService.formatDateTime(bookingTime, business.timezone)
            });
        }
    }

    /**
     * 4. Payout Notification (Email only)
     * Trigger: When Stripe payout is confirmed
     */
    async handlePayoutNotification(payoutData) {
        const { business, payoutAmount, numberOfBookings, expectedClearingTime } = payoutData;
        
        // Always send email (no SMS for payouts)
        await this.emailService.sendPayoutNotification({
            to: business.email,
            businessName: business.name,
            payoutAmount: payoutAmount,
            numberOfBookings: numberOfBookings,
            expectedClearingTime: expectedClearingTime,
            dashboardUrl: `${process.env.PLATFORM_URL}/business-dashboard`
        });
    }

    /**
     * 5. Account-Related Emails (Email only)
     */
    async handleBusinessAccountEvents(eventType, businessData) {
        const { email, businessName } = businessData;
        
        switch (eventType) {
            case 'welcome':
                await this.emailService.sendBusinessWelcome({
                    to: email,
                    businessName: businessName,
                    dashboardUrl: `${process.env.PLATFORM_URL}/business-dashboard`
                });
                break;
                
            case 'profile_approved':
                await this.emailService.sendProfileApproved({
                    to: email,
                    businessName: businessName,
                    dashboardUrl: `${process.env.PLATFORM_URL}/business-dashboard`
                });
                break;
                
            case 'profile_updated':
                await this.emailService.sendProfileUpdated({
                    to: email,
                    businessName: businessName,
                    dashboardUrl: `${process.env.PLATFORM_URL}/business-dashboard`
                });
                break;
                
            case 'payment_details_updated':
                await this.emailService.sendPaymentDetailsUpdated({
                    to: email,
                    businessName: businessName,
                    dashboardUrl: `${process.env.PLATFORM_URL}/business-dashboard`
                });
                break;
                
            case 'subscription_receipt':
                await this.emailService.sendSubscriptionReceipt({
                    to: email,
                    businessName: businessName,
                    packageName: businessData.packageName,
                    renewalDate: businessData.renewalDate,
                    dashboardUrl: `${process.env.PLATFORM_URL}/business-dashboard`
                });
                break;
        }
    }

    // ========================================
    // SCHEDULING AND TRIGGER LOGIC
    // ========================================

    /**
     * Schedule 24-hour reminder for booking
     * Only schedule if booking is more than 24 hours away
     */
    async scheduleBookingReminder(bookingData) {
        const { bookingTime, business } = bookingData;
        const now = new Date();
        const bookingDateTime = new Date(bookingTime);
        const timeDiff = bookingDateTime.getTime() - now.getTime();
        const hoursUntilBooking = timeDiff / (1000 * 60 * 60);

        // Only schedule if more than 24 hours away
        if (hoursUntilBooking > 24) {
            const reminderTime = new Date(bookingDateTime.getTime() - (24 * 60 * 60 * 1000));
            
            // Schedule reminder job
            await this.scheduleJob('booking_reminder', {
                bookingId: bookingData.bookingId,
                reminderTime: reminderTime,
                timezone: business.timezone
            });
        }
    }

    /**
     * Cancel scheduled reminder if booking is cancelled
     */
    async cancelScheduledReminder(bookingId) {
        await this.cancelJob('booking_reminder', { bookingId });
    }

    /**
     * Check if business is Premium package
     */
    isPremiumBusiness(business) {
        return business.package === 'Premium';
    }

    /**
     * Check if customer has phone number
     */
    hasPhoneNumber(contact) {
        return contact.phoneNumber && contact.phoneNumber.trim() !== '';
    }

    /**
     * Get booking status to check if still active
     */
    async getBookingStatus(bookingId) {
        // Implementation would query database
        return await this.database.getBooking(bookingId);
    }

    /**
     * Schedule background job
     */
    async scheduleJob(jobType, jobData) {
        // Implementation would use job queue (e.g., Bull, Agenda)
        console.log(`Scheduling ${jobType} job:`, jobData);
    }

    /**
     * Cancel background job
     */
    async cancelJob(jobType, jobData) {
        // Implementation would cancel job in queue
        console.log(`Cancelling ${jobType} job:`, jobData);
    }
}

// ========================================
// SUPPORTING SERVICES
// ========================================

class EmailService {
    async sendBookingConfirmation(data) {
        console.log('Sending booking confirmation email:', data);
        // Implementation would use email service (e.g., SendGrid, AWS SES)
    }

    async sendBookingReminder(data) {
        console.log('Sending booking reminder email:', data);
    }

    async sendCancellationConfirmation(data) {
        console.log('Sending cancellation confirmation email:', data);
    }

    async sendRefundNotification(data) {
        console.log('Sending refund notification email:', data);
    }

    async sendCustomerWelcome(data) {
        console.log('Sending customer welcome email:', data);
    }

    async sendPasswordReset(data) {
        console.log('Sending password reset email:', data);
    }

    async sendProfileUpdated(data) {
        console.log('Sending profile updated email:', data);
    }

    async sendNewCardAdded(data) {
        console.log('Sending new card added email:', data);
    }

    async sendBusinessBookingNotification(data) {
        console.log('Sending business booking notification email:', data);
    }

    async sendBusinessCancellationNotification(data) {
        console.log('Sending business cancellation notification email:', data);
    }

    async sendRescheduleNotification(data) {
        console.log('Sending reschedule notification email:', data);
    }

    async sendPayoutNotification(data) {
        console.log('Sending payout notification email:', data);
    }

    async sendBusinessWelcome(data) {
        console.log('Sending business welcome email:', data);
    }

    async sendProfileApproved(data) {
        console.log('Sending profile approved email:', data);
    }

    async sendPaymentDetailsUpdated(data) {
        console.log('Sending payment details updated email:', data);
    }

    async sendSubscriptionReceipt(data) {
        console.log('Sending subscription receipt email:', data);
    }
}

class SMSService {
    async sendBookingConfirmation(data) {
        console.log('Sending booking confirmation SMS:', data);
        // Implementation would use SMS service (e.g., Twilio, AWS SNS)
    }

    async sendBookingReminder(data) {
        console.log('Sending booking reminder SMS:', data);
    }

    async sendCancellationConfirmation(data) {
        console.log('Sending cancellation confirmation SMS:', data);
    }

    async sendBusinessBookingNotification(data) {
        console.log('Sending business booking notification SMS:', data);
    }

    async sendBusinessCancellationNotification(data) {
        console.log('Sending business cancellation notification SMS:', data);
    }

    async sendRescheduleNotification(data) {
        console.log('Sending reschedule notification SMS:', data);
    }
}

class TimezoneService {
    formatDateTime(dateTime, timezone) {
        // Implementation would use timezone library (e.g., moment-timezone)
        return new Date(dateTime).toLocaleString('en-GB', {
            timeZone: timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

module.exports = CommunicationSystem;
