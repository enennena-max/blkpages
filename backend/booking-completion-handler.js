/**
 * Booking Completion Event Handler
 * Handles booking.completed events and triggers loyalty program integration
 */

const LoyaltySystem = require('./loyalty-system');

class BookingCompletionHandler {
    constructor() {
        this.loyaltySystem = new LoyaltySystem();
    }

    /**
     * Handle booking completion event
     * This is triggered when a booking status changes to 'completed'
     */
    async handleBookingCompleted(bookingData) {
        try {
            console.log('Processing booking completion event:', bookingData.bookingId);
            
            // Validate booking data
            if (!bookingData.bookingId || !bookingData.customerId || !bookingData.businessId) {
                throw new Error('Invalid booking data provided');
            }

            // Check if booking is actually completed
            if (bookingData.status !== 'completed') {
                console.log('Booking not completed, skipping loyalty processing');
                return;
            }

            // Trigger loyalty program increment
            await this.triggerLoyaltyIncrement(bookingData);

            // Process other completion events (reviews, analytics, etc.)
            await this.processCompletionEvents(bookingData);

            console.log('Booking completion event processed successfully');
        } catch (error) {
            console.error('Failed to handle booking completion event:', error);
            throw error;
        }
    }

    /**
     * Trigger loyalty program increment
     */
    async triggerLoyaltyIncrement(bookingData) {
        try {
            const { customerId, businessId, bookingId, totalAmount, services } = bookingData;
            
            // Call loyalty system increment
            const loyaltyResult = await this.loyaltySystem.increment(customerId, businessId, {
                bookingId: bookingId,
                totalAmount: totalAmount,
                services: services,
                completedAt: new Date()
            });

            if (loyaltyResult) {
                console.log('Loyalty program incremented successfully:', loyaltyResult);
            }
        } catch (error) {
            console.error('Failed to trigger loyalty increment:', error);
            // Don't throw error to avoid breaking booking completion
        }
    }

    /**
     * Process other completion events
     */
    async processCompletionEvents(bookingData) {
        try {
            // Trigger review request (if applicable)
            await this.triggerReviewRequest(bookingData);
            
            // Update business analytics
            await this.updateBusinessAnalytics(bookingData);
            
            // Send completion notifications
            await this.sendCompletionNotifications(bookingData);
        } catch (error) {
            console.error('Failed to process completion events:', error);
        }
    }

    /**
     * Trigger review request for completed booking
     */
    async triggerReviewRequest(bookingData) {
        try {
            // Implementation would trigger review request email
            console.log('Review request triggered for booking:', bookingData.bookingId);
        } catch (error) {
            console.error('Failed to trigger review request:', error);
        }
    }

    /**
     * Update business analytics
     */
    async updateBusinessAnalytics(bookingData) {
        try {
            // Implementation would update business analytics
            console.log('Business analytics updated for booking:', bookingData.bookingId);
        } catch (error) {
            console.error('Failed to update business analytics:', error);
        }
    }

    /**
     * Send completion notifications
     */
    async sendCompletionNotifications(bookingData) {
        try {
            // Implementation would send completion notifications
            console.log('Completion notifications sent for booking:', bookingData.bookingId);
        } catch (error) {
            console.error('Failed to send completion notifications:', error);
        }
    }
}

module.exports = BookingCompletionHandler;
