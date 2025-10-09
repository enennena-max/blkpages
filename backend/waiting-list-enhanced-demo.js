/**
 * Enhanced Waiting List Demo System
 * Demonstrates privacy-protected waiting list with position tracking
 */

class WaitingListEnhancedDemo {
    constructor() {
        this.waitingListSystem = new WaitingListSystem();
        this.demoCustomers = [
            { id: 'customer_1', name: 'John Smith', email: 'john@example.com' },
            { id: 'customer_2', name: 'Jane Doe', email: 'jane@example.com' },
            { id: 'customer_3', name: 'Bob Johnson', email: 'bob@example.com' }
        ];
        this.demoBusiness = { id: 'business_1', name: 'Royal Hair Studio' };
        this.demoServices = [
            { name: 'Haircut & Style', price: 45.00, duration: '1h' },
            { name: 'Coloring', price: 80.00, duration: '2h' },
            { name: 'Blow Dry', price: 25.00, duration: '30m' }
        ];
    }

    /**
     * Demo: Customer joins waiting list with privacy protection
     */
    async demonstrateCustomerJoinsWaitingList() {
        try {
            console.log('=== Customer Joins Waiting List Demo ===');
            
            const customer = this.demoCustomers[0]; // John Smith
            const service = this.demoServices[0]; // Haircut & Style
            
            console.log('1. Customer John Smith wants to join waiting list for Haircut & Style');
            console.log('2. System calculates position in queue...');
            
            const waitingListEntry = await this.waitingListSystem.joinWaitingList(
                customer.id,
                this.demoBusiness.id,
                service,
                customer.name
            );
            
            console.log('3. Customer added to waiting list with position:', waitingListEntry.position);
            console.log('4. Privacy protection applied - only first name shown to business');
            console.log('5. waitinglist.join event triggered');
            
            // Show what business sees vs what customer sees
            this.demonstratePrivacyProtection(waitingListEntry);
            
            console.log('✅ Customer join waiting list completed');
            return waitingListEntry;
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Multiple customers join waiting list
     */
    async demonstrateMultipleCustomersJoin() {
        try {
            console.log('=== Multiple Customers Join Waiting List Demo ===');
            
            const service = this.demoServices[0]; // Haircut & Style
            
            console.log('1. Jane Doe joins waiting list...');
            const janeEntry = await this.waitingListSystem.joinWaitingList(
                this.demoCustomers[1].id,
                this.demoBusiness.id,
                service,
                this.demoCustomers[1].name
            );
            console.log(`   Jane is position #${janeEntry.position}`);
            
            console.log('2. Bob Johnson joins waiting list...');
            const bobEntry = await this.waitingListSystem.joinWaitingList(
                this.demoCustomers[2].id,
                this.demoBusiness.id,
                service,
                this.demoCustomers[2].name
            );
            console.log(`   Bob is position #${bobEntry.position}`);
            
            console.log('3. Business dashboard shows all customers with positions');
            console.log('4. Each customer sees their individual position');
            
            console.log('✅ Multiple customers join completed');
            return [janeEntry, bobEntry];
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Business sends offer to first customer
     */
    async demonstrateBusinessSendsOffer() {
        try {
            console.log('=== Business Sends Offer Demo ===');
            
            const businessId = this.demoBusiness.id;
            const availableSlot = {
                date: '2025-01-20',
                time: '10:00 AM',
                duration: '1h'
            };
            
            console.log('1. Business has an available slot:', availableSlot);
            console.log('2. Business sends offer to first customer in line...');
            
            // Simulate sending offer to first customer
            const businessWaitingList = JSON.parse(localStorage.getItem(`businessWaitingList_${businessId}`) || '[]');
            const firstCustomer = businessWaitingList.find(item => item.status === 'waiting' && item.position === 1);
            
            if (firstCustomer) {
                console.log(`3. Offer sent to ${firstCustomer.customerName} (position #1)`);
                console.log('4. Customer receives offer notification');
                console.log('5. Customer can accept or decline offer');
            }
            
            console.log('✅ Business sends offer completed');
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Customer accepts offer and booking is created
     */
    async demonstrateCustomerAcceptsOffer() {
        try {
            console.log('=== Customer Accepts Offer Demo ===');
            
            const customerId = this.demoCustomers[0].id; // John Smith
            const businessId = this.demoBusiness.id;
            
            console.log('1. Customer John Smith receives offer notification');
            console.log('2. Customer clicks "Accept Offer"...');
            
            // Simulate offer acceptance
            const customerWaitingList = JSON.parse(localStorage.getItem(`customerWaitingList_${customerId}`) || '[]');
            const offer = customerWaitingList.find(item => item.status === 'offered');
            
            if (offer) {
                console.log('3. Creating booking from offer...');
                
                const booking = {
                    id: `booking_${Date.now()}`,
                    customerId: customerId,
                    businessId: businessId,
                    businessName: this.demoBusiness.name,
                    services: [offer.serviceData],
                    date: offer.availableSlot.date,
                    time: offer.availableSlot.time,
                    totalAmount: offer.serviceData.price,
                    status: 'Confirmed',
                    paymentMethod: 'payNow',
                    source: 'waiting_list',
                    createdAt: new Date().toISOString()
                };
                
                // Save to both dashboards
                this.saveBookingToDashboards(booking);
                
                // Remove from waiting lists
                this.removeFromWaitingLists(offer.id, customerId, businessId);
                
                console.log('4. Booking created successfully');
                console.log('5. Customer removed from waiting list');
                console.log('6. waitinglist.offer.accept event triggered');
                console.log('7. Other customers move up in queue');
                
                console.log('✅ Customer accepts offer completed');
                return booking;
            }
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Privacy protection in action
     */
    demonstratePrivacyProtection(waitingListEntry) {
        console.log('=== Privacy Protection Demo ===');
        
        console.log('What the BUSINESS sees:');
        console.log('- Customer first name only:', waitingListEntry.customerName);
        console.log('- Service requested:', waitingListEntry.serviceData.name);
        console.log('- Position in queue:', waitingListEntry.position);
        console.log('- Privacy notice:', waitingListEntry.privacyNotice);
        console.log('- NO contact details (email, phone, address)');
        console.log('- NO full name');
        
        console.log('\nWhat the CUSTOMER sees:');
        console.log('- Full business name:', this.demoBusiness.name);
        console.log('- Their position in queue:', waitingListEntry.position);
        console.log('- Service details:', waitingListEntry.serviceData.name);
        console.log('- Join date:', waitingListEntry.joinedAt);
        console.log('- Position updates in real-time');
        
        console.log('\nSecurity measures:');
        console.log('- Contact details stored securely by BlkPages');
        console.log('- Only first name and service shown to business');
        console.log('- Full customer details never exposed');
        console.log('- Privacy notices displayed to business');
    }

    /**
     * Demo: Position tracking and updates
     */
    async demonstratePositionTracking() {
        try {
            console.log('=== Position Tracking Demo ===');
            
            const businessId = this.demoBusiness.id;
            const serviceName = this.demoServices[0].name;
            
            console.log('1. Current waiting list positions:');
            const businessWaitingList = JSON.parse(localStorage.getItem(`businessWaitingList_${businessId}`) || '[]');
            const serviceWaitingList = businessWaitingList.filter(item => 
                item.serviceData.name === serviceName && item.status === 'waiting'
            );
            
            serviceWaitingList.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.customerName} (Position #${item.position})`);
            });
            
            console.log('\n2. When first customer accepts offer:');
            console.log('   - First customer removed from list');
            console.log('   - All other customers move up one position');
            console.log('   - Real-time position updates sent to customers');
            console.log('   - Business dashboard updates automatically');
            
            console.log('\n3. Position update notifications:');
            console.log('   - "🎯 You are first in line!" (for position #1)');
            console.log('   - "You are position #2 in the waiting list" (for others)');
            console.log('   - Visual position indicators with animations');
            
            console.log('✅ Position tracking demo completed');
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }

    /**
     * Demo: Real-time event system
     */
    demonstrateRealTimeEvents() {
        console.log('=== Real-time Event System Demo ===');
        
        console.log('1. waitinglist.join events:');
        console.log('   - Triggered when customer joins waiting list');
        console.log('   - Updates both customer and business dashboards');
        console.log('   - Shows position notifications to customer');
        console.log('   - Shows new customer notification to business');
        
        console.log('\n2. waitinglist.offer.accept events:');
        console.log('   - Triggered when customer accepts offer');
        console.log('   - Creates booking automatically');
        console.log('   - Removes customer from waiting list');
        console.log('   - Updates positions for remaining customers');
        console.log('   - Sends success notifications to both parties');
        
        console.log('\n3. Event data includes:');
        console.log('   - Customer first name (privacy protected)');
        console.log('   - Service name');
        console.log('   - Position in queue');
        console.log('   - Timestamps');
        console.log('   - No sensitive contact information');
        
        console.log('✅ Real-time event system demo completed');
    }

    /**
     * Save booking to both dashboards
     */
    saveBookingToDashboards(booking) {
        // Save to customer bookings
        const customerBookings = JSON.parse(localStorage.getItem(`customerBookings_${booking.customerId}`) || '[]');
        customerBookings.push(booking);
        localStorage.setItem(`customerBookings_${booking.customerId}`, JSON.stringify(customerBookings));
        
        // Save to business bookings (privacy protected)
        const businessBooking = {
            ...booking,
            customerFirstName: booking.customerId.split('_')[1], // Simplified for demo
            customerLastName: '***', // Privacy protected
            privacyNotice: 'Customer contact details are protected for privacy'
        };
        
        const businessBookings = JSON.parse(localStorage.getItem(`businessBookings_${booking.businessId}`) || '[]');
        businessBookings.push(businessBooking);
        localStorage.setItem(`businessBookings_${booking.businessId}`, JSON.stringify(businessBookings));
    }

    /**
     * Remove from waiting lists
     */
    removeFromWaitingLists(waitingListId, customerId, businessId) {
        // Remove from customer waiting list
        const customerWaitingList = JSON.parse(localStorage.getItem(`customerWaitingList_${customerId}`) || '[]');
        const updatedCustomerList = customerWaitingList.filter(item => item.id !== waitingListId);
        localStorage.setItem(`customerWaitingList_${customerId}`, JSON.stringify(updatedCustomerList));
        
        // Remove from business waiting list
        const businessWaitingList = JSON.parse(localStorage.getItem(`businessWaitingList_${businessId}`) || '[]');
        const updatedBusinessList = businessWaitingList.filter(item => item.id !== waitingListId);
        localStorage.setItem(`businessWaitingList_${businessId}`, JSON.stringify(updatedBusinessList));
    }

    /**
     * Run complete demo
     */
    async runCompleteDemo() {
        try {
            console.log('🚀 Starting Enhanced Waiting List Demo\n');
            
            // Step 1: Customer joins waiting list
            await this.demonstrateCustomerJoinsWaitingList();
            console.log('\n');
            
            // Step 2: Multiple customers join
            await this.demonstrateMultipleCustomersJoin();
            console.log('\n');
            
            // Step 3: Business sends offer
            await this.demonstrateBusinessSendsOffer();
            console.log('\n');
            
            // Step 4: Customer accepts offer
            await this.demonstrateCustomerAcceptsOffer();
            console.log('\n');
            
            // Step 5: Position tracking
            await this.demonstratePositionTracking();
            console.log('\n');
            
            // Step 6: Real-time events
            this.demonstrateRealTimeEvents();
            console.log('\n');
            
            console.log('✅ Enhanced Waiting List Demo Complete!');
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }
}

// Export for use in other modules
module.exports = WaitingListEnhancedDemo;

// Example usage (uncomment to run)
/*
const demo = new WaitingListEnhancedDemo();
demo.runCompleteDemo();
*/
