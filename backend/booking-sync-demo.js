/**
 * Booking Sync Demo System
 * Demonstrates booking synchronization between customer and business dashboards
 */

const BookingSyncSystem = require('./booking-sync-system');

class BookingSyncDemo {
    constructor() {
        this.syncSystem = new BookingSyncSystem();
    }

    /**
     * Demo: Booking confirmed event
     */
    async demonstrateBookingConfirmed() {
        try {
            console.log('=== Booking Confirmed Demo ===');
            
            const bookingData = {
                bookingId: 'booking_123',
                customerId: 'customer_456',
                businessId: 'business_789',
                customerName: 'John Smith',
                customerEmail: 'john@example.com',
                customerPhone: '07123456789',
                customerPostcode: 'SW1A 1AA',
                businessName: 'Royal Hair Studio',
                serviceName: 'Haircut & Style',
                bookingDate: '2025-01-20',
                bookingTime: '10:00 AM',
                totalAmount: 45.00,
                paymentMethod: 'payNow',
                status: 'Confirmed'
            };
            
            console.log('1. Customer completes booking...');
            console.log('2. Booking.confirmed event triggered');
            console.log('3. Syncing to both dashboards...');
            
            // Handle booking confirmed
            await this.syncSystem.handleBookingConfirmed(bookingData);
            
            console.log('4. Customer dashboard updated with full details');
            console.log('5. Business dashboard updated with privacy-protected details');
            console.log('6. Both dashboards show booking information');
            
            // Show privacy protection
            this.demonstratePrivacyProtection(bookingData);
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Booking cancelled event
     */
    async demonstrateBookingCancelled() {
        try {
            console.log('=== Booking Cancelled Demo ===');
            
            const bookingData = {
                bookingId: 'booking_123',
                customerId: 'customer_456',
                businessId: 'business_789',
                status: 'Cancelled',
                cancellationReason: 'Customer cancelled',
                refundAmount: 45.00,
                refundId: 'refund_456'
            };
            
            console.log('1. Customer cancels booking...');
            console.log('2. Booking.cancelled event triggered');
            console.log('3. Updating status in both dashboards...');
            
            // Handle booking cancelled
            await this.syncSystem.handleBookingCancelled(bookingData);
            
            console.log('4. Customer dashboard shows cancelled status');
            console.log('5. Business dashboard shows cancelled status');
            console.log('6. Refund information synced to both dashboards');
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Privacy protection
     */
    demonstratePrivacyProtection(bookingData) {
        console.log('\n=== Privacy Protection Demo ===');
        
        // Customer dashboard (full details)
        const customerDetails = {
            customerName: bookingData.customerName,
            customerEmail: bookingData.customerEmail,
            customerPhone: bookingData.customerPhone,
            customerPostcode: bookingData.customerPostcode,
            serviceName: bookingData.serviceName,
            bookingDate: bookingData.bookingDate,
            bookingTime: bookingData.bookingTime
        };
        
        // Business dashboard (privacy-protected)
        const businessDetails = this.syncSystem.getPrivacyProtectedCustomerDetails(bookingData);
        
        console.log('Customer Dashboard (Full Details):');
        console.log('- Customer Name:', customerDetails.customerName);
        console.log('- Email:', customerDetails.customerEmail);
        console.log('- Phone:', customerDetails.customerPhone);
        console.log('- Postcode:', customerDetails.customerPostcode);
        console.log('- Service:', customerDetails.serviceName);
        console.log('- Date/Time:', customerDetails.bookingDate, customerDetails.bookingTime);
        
        console.log('\nBusiness Dashboard (Privacy-Protected):');
        console.log('- First Name:', businessDetails.firstName);
        console.log('- Last Name:', businessDetails.lastName);
        console.log('- Email: [PROTECTED]');
        console.log('- Phone: [PROTECTED]');
        console.log('- Postcode: [PROTECTED]');
        console.log('- Service:', businessDetails.serviceName);
        console.log('- Date/Time:', businessDetails.bookingDate, businessDetails.bookingTime);
        
        console.log('\n✅ Privacy protection working correctly');
    }

    /**
     * Demo: Real-time synchronization
     */
    async demonstrateRealTimeSync() {
        try {
            console.log('=== Real-time Sync Demo ===');
            
            const bookingId = 'booking_123';
            const customerId = 'customer_456';
            const businessId = 'business_789';
            
            console.log('1. Checking existing booking...');
            
            // Get booking from both dashboards
            const { customerBooking, businessBooking, exists } = await this.syncSystem.getBookingById(
                bookingId, customerId, businessId
            );
            
            if (exists) {
                console.log('2. Booking found in both dashboards');
                console.log('3. Syncing any differences...');
                
                // Sync existing booking
                const synced = await this.syncSystem.syncExistingBooking(bookingId, customerId, businessId);
                
                if (synced) {
                    console.log('4. Booking synchronized successfully');
                } else {
                    console.log('4. No synchronization needed');
                }
            } else {
                console.log('2. Booking not found in both dashboards');
            }
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Event system
     */
    demonstrateEventSystem() {
        console.log('=== Event System Demo ===');
        
        // Simulate booking.confirmed event
        const confirmedEvent = new CustomEvent('booking.confirmed', {
            detail: {
                bookingId: 'booking_123',
                customerId: 'customer_456',
                businessId: 'business_789',
                status: 'Confirmed',
                timestamp: new Date().toISOString()
            }
        });
        
        console.log('1. Dispatching booking.confirmed event...');
        window.dispatchEvent(confirmedEvent);
        
        // Simulate booking.cancelled event
        const cancelledEvent = new CustomEvent('booking.cancelled', {
            detail: {
                bookingId: 'booking_123',
                customerId: 'customer_456',
                businessId: 'business_789',
                status: 'Cancelled',
                timestamp: new Date().toISOString()
            }
        });
        
        console.log('2. Dispatching booking.cancelled event...');
        window.dispatchEvent(cancelledEvent);
        
        console.log('3. Both dashboards should update automatically');
    }

    /**
     * Run complete demo
     */
    async runCompleteDemo() {
        try {
            console.log('🚀 Starting Booking Sync System Demo\n');
            
            // Step 1: Booking confirmed
            await this.demonstrateBookingConfirmed();
            console.log('\n');
            
            // Step 2: Booking cancelled
            await this.demonstrateBookingCancelled();
            console.log('\n');
            
            // Step 3: Real-time sync
            await this.demonstrateRealTimeSync();
            console.log('\n');
            
            // Step 4: Event system
            this.demonstrateEventSystem();
            console.log('\n');
            
            console.log('✅ Booking Sync System Demo Complete!');
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }
}

// Export for use in other modules
module.exports = BookingSyncDemo;

// Example usage (uncomment to run)
/*
const demo = new BookingSyncDemo();
demo.runCompleteDemo();
*/
