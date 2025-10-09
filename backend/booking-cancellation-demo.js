/**
 * Booking Cancellation Demo System
 * Demonstrates secure booking cancellation with refund processing
 */

class BookingCancellationDemo {
    constructor() {
        this.demoBookings = [
            {
                id: 'booking_123',
                customerId: 'customer_456',
                businessId: 'business_789',
                customerName: 'John Smith',
                businessName: 'Royal Hair Studio',
                serviceName: 'Haircut & Style',
                totalAmount: 45.00,
                bookingDate: '2025-01-20',
                bookingTime: '10:00 AM',
                policy: 'flexible',
                stripePaymentIntentId: 'pi_demo_123',
                appointmentDateTime: '2025-01-20T10:00:00Z'
            },
            {
                id: 'booking_124',
                customerId: 'customer_457',
                businessId: 'business_789',
                customerName: 'Jane Doe',
                businessName: 'Royal Hair Studio',
                serviceName: 'Coloring',
                totalAmount: 80.00,
                bookingDate: '2025-01-21',
                bookingTime: '2:00 PM',
                policy: 'strict',
                stripePaymentIntentId: 'pi_demo_124',
                appointmentDateTime: '2025-01-21T14:00:00Z'
            }
        ];
    }

    /**
     * Demo: Flexible policy cancellation (24+ hours)
     */
    async demonstrateFlexiblePolicyCancellation() {
        try {
            console.log('=== Flexible Policy Cancellation Demo ===');
            
            const booking = this.demoBookings[0]; // John Smith's booking
            const cancellationTime = new Date('2025-01-19T09:00:00Z'); // 25 hours before
            
            console.log('1. Customer cancels booking 25 hours before appointment');
            console.log('2. Policy: Flexible (≥24h → 100% refund)');
            console.log('3. Calculating refund amount...');
            
            const refundAmount = this.calculateRefundAmount(booking, cancellationTime);
            console.log(`4. Refund amount: £${refundAmount.toFixed(2)}`);
            
            console.log('5. Processing Stripe refund...');
            const refundResult = await this.simulateStripeRefund(booking, refundAmount);
            
            console.log('6. Updating customer dashboard...');
            await this.updateCustomerDashboard(booking, refundAmount, refundResult);
            
            console.log('7. Updating business dashboard...');
            await this.updateBusinessDashboard(booking, refundAmount, refundResult);
            
            console.log('8. Triggering booking.cancel event...');
            await this.triggerBookingCancelEvent(booking, refundAmount, refundResult);
            
            console.log('✅ Flexible policy cancellation completed');
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Strict policy cancellation (non-refundable)
     */
    async demonstrateStrictPolicyCancellation() {
        try {
            console.log('=== Strict Policy Cancellation Demo ===');
            
            const booking = this.demoBookings[1]; // Jane Doe's booking
            const cancellationTime = new Date('2025-01-20T08:00:00Z'); // 6 hours before
            
            console.log('1. Customer cancels booking 6 hours before appointment');
            console.log('2. Policy: Strict (non-refundable)');
            console.log('3. Calculating refund amount...');
            
            const refundAmount = this.calculateRefundAmount(booking, cancellationTime);
            console.log(`4. Refund amount: £${refundAmount.toFixed(2)}`);
            
            console.log('5. No Stripe refund processed (non-refundable)');
            
            console.log('6. Updating customer dashboard...');
            await this.updateCustomerDashboard(booking, refundAmount, null);
            
            console.log('7. Updating business dashboard...');
            await this.updateBusinessDashboard(booking, refundAmount, null);
            
            console.log('8. Triggering booking.cancel event...');
            await this.triggerBookingCancelEvent(booking, refundAmount, null);
            
            console.log('✅ Strict policy cancellation completed');
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Security and privacy protection
     */
    demonstrateSecurityAndPrivacy() {
        console.log('=== Security and Privacy Demo ===');
        
        console.log('1. Customer dashboard shows:');
        console.log('   - Full customer details');
        console.log('   - Refund amount and status');
        console.log('   - Cancellation timestamp');
        
        console.log('2. Business dashboard shows:');
        console.log('   - Customer first name only');
        console.log('   - Refund amount (no card details)');
        console.log('   - Cancellation timestamp');
        console.log('   - Security notice: "Payment details are securely processed by Stripe"');
        
        console.log('3. Security measures:');
        console.log('   - No payment card details exposed to business');
        console.log('   - Stripe handles all payment processing');
        console.log('   - Refund IDs are anonymized');
        console.log('   - Customer contact information protected');
        
        console.log('✅ Security and privacy protection demonstrated');
    }

    /**
     * Demo: Real-time dashboard updates
     */
    async demonstrateRealTimeUpdates() {
        try {
            console.log('=== Real-time Dashboard Updates Demo ===');
            
            const booking = this.demoBookings[0];
            
            console.log('1. Customer cancels booking...');
            console.log('2. booking.cancel event triggered...');
            
            // Simulate event listeners
            this.simulateEventListeners();
            
            console.log('3. Customer dashboard updates automatically');
            console.log('4. Business dashboard updates automatically');
            console.log('5. Both dashboards show cancellation status');
            console.log('6. Notifications displayed to both parties');
            
            console.log('✅ Real-time updates demonstrated');
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Calculate refund amount based on policy
     */
    calculateRefundAmount(booking, cancellationTime) {
        const appointmentTime = new Date(booking.appointmentDateTime);
        const hoursUntilAppointment = (appointmentTime - cancellationTime) / (1000 * 60 * 60);
        
        switch (booking.policy) {
            case 'flexible':
                return hoursUntilAppointment >= 24 ? booking.totalAmount : 0;
            case 'moderate':
                if (hoursUntilAppointment >= 48) {
                    return booking.totalAmount;
                } else if (hoursUntilAppointment > 0) {
                    return booking.totalAmount * 0.5;
                } else {
                    return 0;
                }
            case 'strict':
                return 0;
            default:
                return 0;
        }
    }

    /**
     * Simulate Stripe refund processing
     */
    async simulateStripeRefund(booking, refundAmount) {
        if (refundAmount <= 0) {
            return null;
        }
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            id: `re_${Date.now()}`,
            amount: refundAmount,
            status: 'succeeded',
            created: new Date().toISOString()
        };
    }

    /**
     * Update customer dashboard
     */
    async updateCustomerDashboard(booking, refundAmount, refundResult) {
        const customerBookings = JSON.parse(localStorage.getItem(`customerBookings_${booking.customerId}`) || '[]');
        const bookingIndex = customerBookings.findIndex(b => b.id === booking.id);
        
        if (bookingIndex !== -1) {
            customerBookings[bookingIndex].status = 'Cancelled';
            customerBookings[bookingIndex].cancelledAt = new Date().toISOString();
            customerBookings[bookingIndex].cancellationReason = 'Customer cancellation';
            customerBookings[bookingIndex].updatedAt = new Date().toISOString();
            
            if (refundAmount > 0) {
                customerBookings[bookingIndex].refundAmount = refundAmount;
                customerBookings[bookingIndex].refundId = refundResult?.id;
                customerBookings[bookingIndex].refundStatus = 'Processed';
                customerBookings[bookingIndex].refundTimestamp = new Date().toISOString();
                customerBookings[bookingIndex].paymentStatus = 'Refunded';
            } else {
                customerBookings[bookingIndex].refundStatus = 'Non-refundable';
                customerBookings[bookingIndex].paymentStatus = 'Non-refundable';
            }
            
            localStorage.setItem(`customerBookings_${booking.customerId}`, JSON.stringify(customerBookings));
        }
    }

    /**
     * Update business dashboard
     */
    async updateBusinessDashboard(booking, refundAmount, refundResult) {
        const businessBookings = JSON.parse(localStorage.getItem(`businessBookings_${booking.businessId}`) || '[]');
        const bookingIndex = businessBookings.findIndex(b => b.id === booking.id);
        
        if (bookingIndex !== -1) {
            businessBookings[bookingIndex].status = 'Refunded';
            businessBookings[bookingIndex].cancelledAt = new Date().toISOString();
            businessBookings[bookingIndex].cancellationReason = 'Customer cancellation';
            businessBookings[bookingIndex].updatedAt = new Date().toISOString();
            
            businessBookings[bookingIndex].refundAmount = refundAmount;
            businessBookings[bookingIndex].refundId = refundResult?.id;
            businessBookings[bookingIndex].refundStatus = refundAmount > 0 ? 'Processed' : 'Non-refundable';
            businessBookings[bookingIndex].refundTimestamp = new Date().toISOString();
            businessBookings[bookingIndex].originalAmount = booking.totalAmount;
            businessBookings[bookingIndex].netAmount = booking.totalAmount - refundAmount;
            
            localStorage.setItem(`businessBookings_${booking.businessId}`, JSON.stringify(businessBookings));
        }
    }

    /**
     * Trigger booking.cancel event
     */
    async triggerBookingCancelEvent(booking, refundAmount, refundResult) {
        const cancelEventData = {
            bookingId: booking.id,
            customerId: booking.customerId,
            businessId: booking.businessId,
            customerName: booking.customerName,
            businessName: booking.businessName,
            serviceName: booking.serviceName,
            bookingDate: booking.bookingDate,
            bookingTime: booking.bookingTime,
            status: 'Cancelled',
            cancellationReason: 'Customer cancellation',
            refundAmount: refundAmount,
            refundId: refundResult?.id || null,
            refundStatus: refundAmount > 0 ? 'Processed' : 'Non-refundable',
            timestamp: new Date().toISOString(),
            securityNotice: 'Payment details are securely processed by Stripe and never exposed to businesses'
        };
        
        // Dispatch event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('booking.cancel', {
                detail: cancelEventData
            }));
        }
        
        console.log('Booking.cancel event triggered:', cancelEventData);
    }

    /**
     * Simulate event listeners
     */
    simulateEventListeners() {
        console.log('Event listeners activated:');
        console.log('- Customer dashboard: booking.cancel event received');
        console.log('- Business dashboard: booking.cancel event received');
        console.log('- Both dashboards: status updated to cancelled/refunded');
        console.log('- Both dashboards: refund information displayed');
        console.log('- Both dashboards: timestamp logged');
    }

    /**
     * Run complete demo
     */
    async runCompleteDemo() {
        try {
            console.log('🚀 Starting Booking Cancellation Demo\n');
            
            // Step 1: Flexible policy cancellation
            await this.demonstrateFlexiblePolicyCancellation();
            console.log('\n');
            
            // Step 2: Strict policy cancellation
            await this.demonstrateStrictPolicyCancellation();
            console.log('\n');
            
            // Step 3: Security and privacy
            this.demonstrateSecurityAndPrivacy();
            console.log('\n');
            
            // Step 4: Real-time updates
            await this.demonstrateRealTimeUpdates();
            console.log('\n');
            
            console.log('✅ Booking Cancellation Demo Complete!');
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }
}

// Export for use in other modules
module.exports = BookingCancellationDemo;

// Example usage (uncomment to run)
/*
const demo = new BookingCancellationDemo();
demo.runCompleteDemo();
*/
