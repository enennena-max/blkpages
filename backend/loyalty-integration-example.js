/**
 * Loyalty Integration Example
 * Demonstrates how booking.completed events trigger loyalty.increment
 */

const BookingEventSystem = require('./booking-event-system');
const LoyaltySystem = require('./loyalty-system');

class LoyaltyIntegrationExample {
    constructor() {
        this.eventSystem = new BookingEventSystem();
        this.loyaltySystem = new LoyaltySystem();
    }

    /**
     * Example: Complete booking and trigger loyalty increment
     */
    async demonstrateBookingCompletion() {
        try {
            console.log('=== Loyalty Integration Demo ===');
            
            // Initialize event system
            this.eventSystem.initialize();
            
            // Simulate booking completion data
            const bookingData = {
                bookingId: 'booking_123',
                customerId: 'customer_456',
                businessId: 'business_789',
                status: 'completed',
                totalAmount: 45.00,
                services: [
                    { name: 'Haircut', price: 45.00 }
                ],
                completedAt: new Date()
            };
            
            console.log('1. Booking completed:', bookingData.bookingId);
            
            // Simulate booking completion event
            this.eventSystem.simulateBookingCompletion(bookingData);
            
            // Wait a moment for async processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('2. Loyalty program integration completed');
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Example: Direct loyalty increment call
     */
    async demonstrateDirectLoyaltyIncrement() {
        try {
            console.log('=== Direct Loyalty Increment Demo ===');
            
            const customerId = 'customer_456';
            const businessId = 'business_789';
            const bookingData = {
                bookingId: 'booking_123',
                totalAmount: 45.00,
                services: [{ name: 'Haircut', price: 45.00 }],
                completedAt: new Date()
            };
            
            console.log('1. Calling loyalty.increment directly');
            
            // Direct call to loyalty system
            const result = await this.loyaltySystem.increment(customerId, businessId, bookingData);
            
            console.log('2. Loyalty increment result:', result);
            
        } catch (error) {
            console.error('Direct increment failed:', error);
        }
    }

    /**
     * Example: Check customer loyalty progress
     */
    async demonstrateLoyaltyProgress() {
        try {
            console.log('=== Loyalty Progress Demo ===');
            
            const customerId = 'customer_456';
            const businessId = 'business_789';
            
            // Get customer progress
            const progress = await this.loyaltySystem.getCustomerLoyaltyProgress(customerId, businessId);
            
            console.log('Customer loyalty progress:', progress);
            
            // Get business loyalty program
            const program = await this.loyaltySystem.getLoyaltyProgram(businessId);
            
            console.log('Business loyalty program:', program);
            
        } catch (error) {
            console.error('Progress check failed:', error);
        }
    }
}

// Export for use in other modules
module.exports = LoyaltyIntegrationExample;

// Example usage (uncomment to run)
/*
const example = new LoyaltyIntegrationExample();

// Run demonstrations
example.demonstrateBookingCompletion();
example.demonstrateDirectLoyaltyIncrement();
example.demonstrateLoyaltyProgress();
*/
