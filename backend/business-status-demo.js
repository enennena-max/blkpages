/**
 * Business Status Demo System
 * Demonstrates business status changes and booking restrictions
 */

const BusinessStatusSystem = require('./business-status-system');

class BusinessStatusDemo {
    constructor() {
        this.statusSystem = new BusinessStatusSystem();
    }

    /**
     * Demo: Business gets suspended
     */
    async demonstrateBusinessSuspension() {
        try {
            console.log('=== Business Suspension Demo ===');
            
            const businessId = 'business_456';
            const reason = 'Payment issues - temporary suspension';
            
            console.log('1. Business is being suspended...');
            
            // Update business status
            await this.statusSystem.updateBusinessStatus(businessId, 'suspended', reason);
            
            console.log('2. Business status updated to suspended');
            console.log('3. New bookings disabled');
            console.log('4. Existing bookings remain visible to customers');
            console.log('5. Customers notified of suspension');
            
            // Simulate customer trying to book
            console.log('6. Customer tries to book...');
            const canBook = await this.statusSystem.canBusinessAcceptBookings(businessId);
            console.log('7. Can accept bookings:', canBook);
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Business gets deactivated
     */
    async demonstrateBusinessDeactivation() {
        try {
            console.log('=== Business Deactivation Demo ===');
            
            const businessId = 'business_789';
            const reason = 'Business closure - permanent deactivation';
            
            console.log('1. Business is being deactivated...');
            
            // Update business status
            await this.statusSystem.updateBusinessStatus(businessId, 'deactivated', reason);
            
            console.log('2. Business status updated to deactivated');
            console.log('3. New bookings disabled');
            console.log('4. Future bookings cancelled');
            console.log('5. Existing bookings remain visible to customers');
            console.log('6. Customers notified of deactivation');
            
            // Simulate customer trying to book
            console.log('7. Customer tries to book...');
            const canBook = await this.statusSystem.canBusinessAcceptBookings(businessId);
            console.log('8. Can accept bookings:', canBook);
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Business gets reactivated
     */
    async demonstrateBusinessReactivation() {
        try {
            console.log('=== Business Reactivation Demo ===');
            
            const businessId = 'business_456';
            const reason = 'Issues resolved - business reactivated';
            
            console.log('1. Business is being reactivated...');
            
            // Update business status
            await this.statusSystem.updateBusinessStatus(businessId, 'active', reason);
            
            console.log('2. Business status updated to active');
            console.log('3. New bookings enabled');
            console.log('4. Business profile visible again');
            console.log('5. Customers notified of reactivation');
            
            // Simulate customer trying to book
            console.log('6. Customer tries to book...');
            const canBook = await this.statusSystem.canBusinessAcceptBookings(businessId);
            console.log('7. Can accept bookings:', canBook);
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Customer dashboard with business status changes
     */
    async demonstrateCustomerDashboardWithStatusChanges() {
        try {
            console.log('=== Customer Dashboard Status Demo ===');
            
            const customerId = 'customer_123';
            const businessId = 'business_456';
            
            console.log('1. Customer has existing bookings...');
            
            // Get customer bookings
            const customerBookings = await this.statusSystem.getCustomerBookingsForBusiness(customerId, businessId);
            console.log('2. Customer bookings found:', customerBookings.length);
            
            // Check business status for each booking
            for (const booking of customerBookings) {
                const businessStatus = await this.getBusinessStatus(booking.businessId);
                console.log(`3. Booking ${booking.id} - Business status: ${businessStatus}`);
                
                if (businessStatus !== 'active') {
                    console.log(`4. Booking ${booking.id} shows business status warning`);
                }
            }
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Booking form validation with business status
     */
    async demonstrateBookingFormValidation() {
        try {
            console.log('=== Booking Form Validation Demo ===');
            
            const businessId = 'business_456';
            
            console.log('1. Customer tries to book...');
            
            // Check if business can accept bookings
            const canBook = await this.statusSystem.canBusinessAcceptBookings(businessId);
            
            if (canBook) {
                console.log('2. Business is active - booking allowed');
                console.log('3. Booking form proceeds normally');
            } else {
                console.log('2. Business is not active - booking blocked');
                console.log('3. Customer sees status message');
                console.log('4. Alternative businesses suggested');
            }
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Run complete demo
     */
    async runCompleteDemo() {
        try {
            console.log('🚀 Starting Business Status System Demo\n');
            
            // Step 1: Business suspension
            await this.demonstrateBusinessSuspension();
            console.log('\n');
            
            // Step 2: Business deactivation
            await this.demonstrateBusinessDeactivation();
            console.log('\n');
            
            // Step 3: Business reactivation
            await this.demonstrateBusinessReactivation();
            console.log('\n');
            
            // Step 4: Customer dashboard with status changes
            await this.demonstrateCustomerDashboardWithStatusChanges();
            console.log('\n');
            
            // Step 5: Booking form validation
            await this.demonstrateBookingFormValidation();
            console.log('\n');
            
            console.log('✅ Business Status System Demo Complete!');
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Get business status (helper method)
     */
    async getBusinessStatus(businessId) {
        try {
            const business = await this.statusSystem.getBusiness(businessId);
            return business ? business.status : 'unknown';
        } catch (error) {
            console.error('Failed to get business status:', error);
            return 'unknown';
        }
    }
}

// Export for use in other modules
module.exports = BusinessStatusDemo;

// Example usage (uncomment to run)
/*
const demo = new BusinessStatusDemo();
demo.runCompleteDemo();
*/
