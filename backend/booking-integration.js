/**
 * Booking System Integration
 * Practical implementation of communication triggers in booking workflow
 */

const CommunicationSystem = require('./communication-system');
const LoyaltySystem = require('./loyalty-system');

class BookingIntegration {
    constructor() {
        this.communicationSystem = new CommunicationSystem();
        this.loyaltySystem = new LoyaltySystem();
    }

    // ========================================
    // BOOKING WORKFLOW INTEGRATION
    // ========================================

    /**
     * Complete booking process with all communication triggers
     */
    async completeBooking(bookingData) {
        try {
            // 1. Create booking in database
            const booking = await this.createBooking(bookingData);
            
            // 2. Process payment
            const paymentResult = await this.processPayment(bookingData);
            
            // 3. Send customer booking confirmation
            await this.communicationSystem.handleBookingConfirmation({
                ...bookingData,
                bookingId: booking.id,
                totalAmount: paymentResult.amount
            });
            
            // 4. Send business booking alert
            await this.communicationSystem.handleNewBookingAlert({
                ...bookingData,
                bookingId: booking.id,
                totalAmount: paymentResult.amount
            });
            
            // 5. Schedule 24-hour reminder (if applicable)
            await this.communicationSystem.scheduleBookingReminder({
                ...bookingData,
                bookingId: booking.id
            });
            
            // 6. Trigger loyalty program increment
            await this.triggerLoyaltyIncrement(booking.id, bookingData.customerId, bookingData.businessId);
            
            return booking;
        } catch (error) {
            console.error('Booking completion failed:', error);
            throw error;
        }
    }

    /**
     * Cancel booking with all communication triggers
     */
    async cancelBooking(bookingId, cancellationReason) {
        try {
            // 1. Get booking details
            const booking = await this.getBooking(bookingId);
            
            // 2. Process refund if applicable
            const refundResult = await this.processRefund(booking);
            
            // 3. Update booking status
            await this.updateBookingStatus(bookingId, 'cancelled');
            
            // 4. Cancel scheduled reminder
            await this.communicationSystem.cancelScheduledReminder(bookingId);
            
            // 5. Send customer cancellation confirmation
            await this.communicationSystem.handleBookingCancellation({
                ...booking,
                refundAmount: refundResult.amount
            }, cancellationReason);
            
            // 6. Send business cancellation alert
            await this.communicationSystem.handleBusinessCancellationAlert({
                ...booking,
                refundAmount: refundResult.amount
            }, cancellationReason);
            
            // 7. Send refund notification if refund processed
            if (refundResult.amount > 0) {
                await this.communicationSystem.handleRefundNotification({
                    ...booking,
                    refundAmount: refundResult.amount,
                    originalAmount: booking.totalAmount
                });
            }
            
            return { success: true, refundAmount: refundResult.amount };
        } catch (error) {
            console.error('Booking cancellation failed:', error);
            throw error;
        }
    }

    /**
     * Reschedule booking with communication triggers
     */
    async rescheduleBooking(bookingId, newBookingTime) {
        try {
            // 1. Get booking details
            const booking = await this.getBooking(bookingId);
            const oldBookingTime = booking.bookingTime;
            
            // 2. Update booking time
            await this.updateBookingTime(bookingId, newBookingTime);
            
            // 3. Cancel old reminder and schedule new one
            await this.communicationSystem.cancelScheduledReminder(bookingId);
            await this.communicationSystem.scheduleBookingReminder({
                ...booking,
                bookingTime: newBookingTime
            });
            
            // 4. Send reschedule notifications
            await this.communicationSystem.handleRescheduleAlert({
                ...booking,
                bookingTime: newBookingTime
            }, oldBookingTime);
            
            return { success: true };
        } catch (error) {
            console.error('Booking reschedule failed:', error);
            throw error;
        }
    }

    // ========================================
    // ACCOUNT EVENT INTEGRATION
    // ========================================

    /**
     * Handle customer account events
     */
    async handleCustomerAccountEvent(eventType, customerData) {
        try {
            await this.communicationSystem.handleCustomerAccountEvents(eventType, customerData);
        } catch (error) {
            console.error(`Customer account event ${eventType} failed:`, error);
            // Don't throw - account events are not critical
        }
    }

    /**
     * Handle business account events
     */
    async handleBusinessAccountEvent(eventType, businessData) {
        try {
            await this.communicationSystem.handleBusinessAccountEvents(eventType, businessData);
        } catch (error) {
            console.error(`Business account event ${eventType} failed:`, error);
            // Don't throw - account events are not critical
        }
    }

    // ========================================
    // PAYMENT INTEGRATION
    // ========================================

    /**
     * Handle payout processing
     */
    async processPayout(payoutData) {
        try {
            // 1. Process payout with Stripe
            const payoutResult = await this.stripeService.createPayout(payoutData);
            
            // 2. Send payout notification
            await this.communicationSystem.handlePayoutNotification({
                ...payoutData,
                payoutAmount: payoutResult.amount,
                expectedClearingTime: payoutResult.clearingTime
            });
            
            return payoutResult;
        } catch (error) {
            console.error('Payout processing failed:', error);
            throw error;
        }
    }

    // ========================================
    // REMINDER JOB PROCESSING
    // ========================================

    /**
     * Process scheduled reminder jobs
     */
    async processReminderJob(jobData) {
        try {
            const { bookingId } = jobData;
            
            // 1. Get current booking status
            const booking = await this.getBooking(bookingId);
            
            // 2. Check if booking is still active
            if (booking.status !== 'confirmed') {
                console.log(`Skipping reminder for ${booking.status} booking ${bookingId}`);
                return;
            }
            
            // 3. Send reminder
            await this.communicationSystem.handleBookingReminder(booking);
            
        } catch (error) {
            console.error('Reminder job processing failed:', error);
            throw error;
        }
    }

    // ========================================
    // DATABASE OPERATIONS
    // ========================================

    async createBooking(bookingData) {
        // Implementation would create booking in database
        return {
            id: `booking_${Date.now()}`,
            ...bookingData,
            status: 'confirmed',
            createdAt: new Date()
        };
    }

    async getBooking(bookingId) {
        // Implementation would query database
        return {
            id: bookingId,
            customer: { firstName: 'Jane', email: 'jane.smith@email.com' },
            business: { name: 'Glow Salon', email: 'glow.salon@email.com', package: 'Premium' },
            service: { name: 'Haircut' },
            bookingTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            paymentModel: 'Full Payment Online',
            totalAmount: 45,
            status: 'confirmed'
        };
    }

    async updateBookingStatus(bookingId, status) {
        // Implementation would update database
        console.log(`Updating booking ${bookingId} status to ${status}`);
    }

    async updateBookingTime(bookingId, newTime) {
        // Implementation would update database
        console.log(`Updating booking ${bookingId} time to ${newTime}`);
    }

    // ========================================
    // PAYMENT OPERATIONS
    // ========================================

    async processPayment(bookingData) {
        // Implementation would process payment with Stripe
        return {
            success: true,
            amount: bookingData.totalAmount,
            paymentIntentId: `pi_${Date.now()}`
        };
    }

    async processRefund(booking) {
        // Implementation would process refund with Stripe
        const refundAmount = booking.paymentModel === 'Full Payment Online' ? booking.totalAmount : 0;
        return {
            success: true,
            amount: refundAmount,
            refundId: `re_${Date.now()}`
        };
    }

    // ========================================
    // LOYALTY PROGRAM INTEGRATION
    // ========================================

    /**
     * Trigger loyalty program increment when booking is completed
     */
    async triggerLoyaltyIncrement(bookingId, customerId, businessId) {
        try {
            // Get booking details
            const booking = await this.getBooking(bookingId);
            if (!booking || booking.status !== 'completed') {
                return;
            }

            // Check if business has active loyalty program
            const loyaltyProgram = await this.loyaltySystem.getLoyaltyProgram(businessId);
            if (!loyaltyProgram || !loyaltyProgram.isActive) {
                console.log('No active loyalty program for business:', businessId);
                return;
            }

            // Increment loyalty progress
            await this.loyaltySystem.increment(customerId, businessId, {
                bookingId: bookingId,
                totalAmount: booking.totalAmount,
                services: booking.services,
                completedAt: new Date()
            });

            console.log('Loyalty program incremented for customer:', customerId, 'business:', businessId);
        } catch (error) {
            console.error('Failed to trigger loyalty increment:', error);
            // Don't throw error to avoid breaking booking completion
        }
    }

    /**
     * Get booking details
     */
    async getBooking(bookingId) {
        // Implementation would query database
        return {
            id: bookingId,
            customerId: 'customer_123',
            businessId: 'business_456',
            totalAmount: 45.00,
            services: [{ name: 'Haircut', price: 45.00 }],
            status: 'completed'
        };
    }
}

module.exports = BookingIntegration;
