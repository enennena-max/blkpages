/**
 * Booking Event System
 * Handles booking events and triggers appropriate actions
 */

const BookingCompletionHandler = require('./booking-completion-handler');

class BookingEventSystem {
    constructor() {
        this.completionHandler = new BookingCompletionHandler();
        this.eventListeners = new Map();
    }

    /**
     * Initialize event system
     */
    initialize() {
        // Register event listeners
        this.registerEventListeners();
        console.log('Booking event system initialized');
    }

    /**
     * Register event listeners
     */
    registerEventListeners() {
        // Listen for booking status changes
        this.addEventListener('booking.status.changed', this.handleBookingStatusChange.bind(this));
        this.addEventListener('booking.completed', this.handleBookingCompleted.bind(this));
        this.addEventListener('booking.cancelled', this.handleBookingCancelled.bind(this));
    }

    /**
     * Add event listener
     */
    addEventListener(eventType, handler) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(handler);
    }

    /**
     * Emit event
     */
    emit(eventType, data) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${eventType}:`, error);
                }
            });
        }
    }

    /**
     * Handle booking status change
     */
    async handleBookingStatusChange(bookingData) {
        try {
            console.log('Booking status changed:', bookingData.status);
            
            switch (bookingData.status) {
                case 'completed':
                    await this.handleBookingCompleted(bookingData);
                    break;
                case 'cancelled':
                    await this.handleBookingCancelled(bookingData);
                    break;
                default:
                    console.log('No specific handler for status:', bookingData.status);
            }
        } catch (error) {
            console.error('Failed to handle booking status change:', error);
        }
    }

    /**
     * Handle booking completed event
     */
    async handleBookingCompleted(bookingData) {
        try {
            console.log('Processing booking.completed event');
            
            // Trigger loyalty program increment
            await this.completionHandler.handleBookingCompleted(bookingData);
            
            // Emit additional events
            this.emit('loyalty.incremented', {
                customerId: bookingData.customerId,
                businessId: bookingData.businessId,
                bookingId: bookingData.bookingId
            });
            
        } catch (error) {
            console.error('Failed to handle booking completed:', error);
        }
    }

    /**
     * Handle booking cancelled event
     */
    async handleBookingCancelled(bookingData) {
        try {
            console.log('Processing booking.cancelled event');
            // Implementation for cancellation handling
        } catch (error) {
            console.error('Failed to handle booking cancelled:', error);
        }
    }

    /**
     * Simulate booking completion (for testing)
     */
    simulateBookingCompletion(bookingData) {
        console.log('Simulating booking completion event');
        this.emit('booking.completed', bookingData);
    }
}

module.exports = BookingEventSystem;
