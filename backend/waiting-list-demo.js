/**
 * Waiting List Demo System
 * Demonstrates the waiting list functionality
 */

const WaitingListSystem = require('./waiting-list-system');

class WaitingListDemo {
    constructor() {
        this.waitingListSystem = new WaitingListSystem();
    }

    /**
     * Demo: Customer joins waiting list
     */
    async demonstrateCustomerJoinsWaitingList() {
        try {
            console.log('=== Customer Joins Waiting List Demo ===');
            
            const customerId = 'customer_123';
            const businessId = 'business_456';
            const serviceData = {
                name: 'Haircut & Style',
                price: 45.00,
                duration: '1h 30m'
            };

            console.log('1. Customer joining waiting list...');
            
            const waitingListEntry = await this.waitingListSystem.joinWaitingList(
                customerId, 
                businessId, 
                serviceData
            );

            console.log('2. Waiting list entry created:', waitingListEntry.id);
            console.log('3. Customer added to business waiting list');
            console.log('4. Customer added to their own waiting list');
            console.log('5. Confirmation email sent to customer');
            
            return waitingListEntry;
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Business sends offer to customer
     */
    async demonstrateBusinessSendsOffer() {
        try {
            console.log('=== Business Sends Offer Demo ===');
            
            const businessId = 'business_456';
            const availableSlot = {
                date: '2025-01-20',
                time: '10:00 AM',
                duration: '1h 30m'
            };

            console.log('1. Business has a cancellation, slot available...');
            console.log('2. Sending offer to next customer in waiting list...');
            
            const offer = await this.waitingListSystem.sendOfferToNextCustomer(
                businessId, 
                availableSlot
            );

            if (offer) {
                console.log('3. Offer sent to customer:', offer.customerId);
                console.log('4. Customer status updated to "offered"');
                console.log('5. Offer notification email sent');
            } else {
                console.log('3. No customers in waiting list');
            }
            
            return offer;
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Customer accepts offer
     */
    async demonstrateCustomerAcceptsOffer() {
        try {
            console.log('=== Customer Accepts Offer Demo ===');
            
            const offerId = 'offer_123';
            const customerId = 'customer_123';

            console.log('1. Customer receives offer notification...');
            console.log('2. Customer clicks "Accept Offer"...');
            
            const booking = await this.waitingListSystem.acceptOffer(offerId, customerId);

            console.log('3. Booking created from offer:', booking.id);
            console.log('4. Customer removed from waiting list');
            console.log('5. Booking added to both dashboards');
            console.log('6. Confirmation sent to customer and business');
            
            return booking;
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Customer rejects offer
     */
    async demonstrateCustomerRejectsOffer() {
        try {
            console.log('=== Customer Rejects Offer Demo ===');
            
            const offerId = 'offer_124';
            const customerId = 'customer_456';

            console.log('1. Customer receives offer notification...');
            console.log('2. Customer clicks "Decline Offer"...');
            
            await this.waitingListSystem.rejectOffer(offerId, customerId);

            console.log('3. Customer status updated back to "waiting"');
            console.log('4. Next customer in line gets the offer');
            console.log('5. Customer remains on waiting list');
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Customer leaves waiting list
     */
    async demonstrateCustomerLeavesWaitingList() {
        try {
            console.log('=== Customer Leaves Waiting List Demo ===');
            
            const waitingListId = 'waiting_789';
            const customerId = 'customer_789';
            const businessId = 'business_456';

            console.log('1. Customer decides to leave waiting list...');
            
            await this.waitingListSystem.leaveWaitingList(waitingListId, customerId, businessId);

            console.log('2. Customer removed from waiting list');
            console.log('3. Customer removed from business waiting list');
            console.log('4. Position available for next customer');
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Run complete demo
     */
    async runCompleteDemo() {
        try {
            console.log('🚀 Starting Waiting List System Demo\n');
            
            // Step 1: Customer joins waiting list
            await this.demonstrateCustomerJoinsWaitingList();
            console.log('\n');
            
            // Step 2: Business sends offer
            await this.demonstrateBusinessSendsOffer();
            console.log('\n');
            
            // Step 3: Customer accepts offer
            await this.demonstrateCustomerAcceptsOffer();
            console.log('\n');
            
            // Step 4: Another customer rejects offer
            await this.demonstrateCustomerRejectsOffer();
            console.log('\n');
            
            // Step 5: Customer leaves waiting list
            await this.demonstrateCustomerLeavesWaitingList();
            console.log('\n');
            
            console.log('✅ Waiting List System Demo Complete!');
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }
}

// Export for use in other modules
module.exports = WaitingListDemo;

// Example usage (uncomment to run)
/*
const demo = new WaitingListDemo();
demo.runCompleteDemo();
*/
