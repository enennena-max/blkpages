/**
 * Waiting List System
 * Handles customer waiting lists and business cancellation offers
 */

class WaitingListSystem {
    constructor() {
        this.emailService = new EmailService();
    }

    // ========================================
    // WAITING LIST MANAGEMENT
    // ========================================

    /**
     * Add customer to waiting list
     */
    async joinWaitingList(customerId, businessId, serviceData) {
        try {
            const waitingListEntry = {
                id: `waiting_${Date.now()}`,
                customerId,
                businessId,
                serviceData,
                joinedAt: new Date().toISOString(),
                status: 'waiting',
                priority: await this.calculatePriority(customerId, businessId)
            };

            // Add to business waiting list
            await this.addToBusinessWaitingList(businessId, waitingListEntry);
            
            // Add to customer waiting list
            await this.addToCustomerWaitingList(customerId, waitingListEntry);

            // Send confirmation to customer
            await this.sendWaitingListConfirmation(customerId, businessId, serviceData);

            console.log('Customer added to waiting list:', waitingListEntry.id);
            return waitingListEntry;
        } catch (error) {
            console.error('Failed to join waiting list:', error);
            throw error;
        }
    }

    /**
     * Remove customer from waiting list
     */
    async leaveWaitingList(waitingListId, customerId, businessId) {
        try {
            // Remove from business waiting list
            await this.removeFromBusinessWaitingList(businessId, waitingListId);
            
            // Remove from customer waiting list
            await this.removeFromCustomerWaitingList(customerId, waitingListId);

            console.log('Customer removed from waiting list:', waitingListId);
        } catch (error) {
            console.error('Failed to leave waiting list:', error);
            throw error;
        }
    }

    /**
     * Send offer to next customer in waiting list
     */
    async sendOfferToNextCustomer(businessId, availableSlot) {
        try {
            // Get business waiting list
            const waitingList = await this.getBusinessWaitingList(businessId);
            
            if (waitingList.length === 0) {
                console.log('No customers in waiting list for business:', businessId);
                return null;
            }

            // Get next customer (highest priority)
            const nextCustomer = waitingList[0];
            
            // Create offer
            const offer = {
                id: `offer_${Date.now()}`,
                waitingListId: nextCustomer.id,
                customerId: nextCustomer.customerId,
                businessId: businessId,
                availableSlot: availableSlot,
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
                status: 'pending'
            };

            // Send offer to customer
            await this.sendOfferNotification(nextCustomer.customerId, businessId, offer);
            
            // Update waiting list entry
            await this.updateWaitingListEntry(nextCustomer.id, { status: 'offered', offerId: offer.id });

            console.log('Offer sent to customer:', nextCustomer.customerId);
            return offer;
        } catch (error) {
            console.error('Failed to send offer:', error);
            throw error;
        }
    }

    /**
     * Handle offer acceptance
     */
    async acceptOffer(offerId, customerId) {
        try {
            const offer = await this.getOffer(offerId);
            if (!offer || offer.customerId !== customerId) {
                throw new Error('Invalid offer');
            }

            if (offer.status !== 'pending') {
                throw new Error('Offer no longer available');
            }

            if (new Date() > offer.expiresAt) {
                throw new Error('Offer has expired');
            }

            // Create booking from offer
            const booking = await this.createBookingFromOffer(offer);
            
            // Remove from waiting lists
            await this.removeFromBusinessWaitingList(offer.businessId, offer.waitingListId);
            await this.removeFromCustomerWaitingList(customerId, offer.waitingListId);

            // Update offer status
            await this.updateOfferStatus(offerId, 'accepted');

            console.log('Offer accepted, booking created:', booking.id);
            return booking;
        } catch (error) {
            console.error('Failed to accept offer:', error);
            throw error;
        }
    }

    /**
     * Handle offer rejection or expiration
     */
    async rejectOffer(offerId, customerId) {
        try {
            const offer = await this.getOffer(offerId);
            if (!offer || offer.customerId !== customerId) {
                throw new Error('Invalid offer');
            }

            // Update offer status
            await this.updateOfferStatus(offerId, 'rejected');

            // Move customer back to waiting list
            await this.updateWaitingListEntry(offer.waitingListId, { status: 'waiting', offerId: null });

            // Try next customer
            await this.sendOfferToNextCustomer(offer.businessId, offer.availableSlot);

            console.log('Offer rejected, trying next customer');
        } catch (error) {
            console.error('Failed to reject offer:', error);
            throw error;
        }
    }

    // ========================================
    // DATABASE OPERATIONS
    // ========================================

    /**
     * Add to business waiting list
     */
    async addToBusinessWaitingList(businessId, waitingListEntry) {
        const businessWaitingList = JSON.parse(localStorage.getItem(`businessWaitingList_${businessId}`) || '[]');
        businessWaitingList.push(waitingListEntry);
        localStorage.setItem(`businessWaitingList_${businessId}`, JSON.stringify(businessWaitingList));
    }

    /**
     * Add to customer waiting list
     */
    async addToCustomerWaitingList(customerId, waitingListEntry) {
        const customerWaitingList = JSON.parse(localStorage.getItem(`customerWaitingList_${customerId}`) || '[]');
        customerWaitingList.push(waitingListEntry);
        localStorage.setItem(`customerWaitingList_${customerId}`, JSON.stringify(customerWaitingList));
    }

    /**
     * Get business waiting list
     */
    async getBusinessWaitingList(businessId) {
        const waitingList = JSON.parse(localStorage.getItem(`businessWaitingList_${businessId}`) || '[]');
        return waitingList.filter(entry => entry.status === 'waiting').sort((a, b) => b.priority - a.priority);
    }

    /**
     * Get customer waiting list
     */
    async getCustomerWaitingList(customerId) {
        return JSON.parse(localStorage.getItem(`customerWaitingList_${customerId}`) || '[]');
    }

    /**
     * Remove from business waiting list
     */
    async removeFromBusinessWaitingList(businessId, waitingListId) {
        const businessWaitingList = JSON.parse(localStorage.getItem(`businessWaitingList_${businessId}`) || '[]');
        const updatedList = businessWaitingList.filter(entry => entry.id !== waitingListId);
        localStorage.setItem(`businessWaitingList_${businessId}`, JSON.stringify(updatedList));
    }

    /**
     * Remove from customer waiting list
     */
    async removeFromCustomerWaitingList(customerId, waitingListId) {
        const customerWaitingList = JSON.parse(localStorage.getItem(`customerWaitingList_${customerId}`) || '[]');
        const updatedList = customerWaitingList.filter(entry => entry.id !== waitingListId);
        localStorage.setItem(`customerWaitingList_${customerId}`, JSON.stringify(updatedList));
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Calculate customer priority
     */
    async calculatePriority(customerId, businessId) {
        // Higher priority for:
        // - Loyal customers (more bookings)
        // - Recent bookings
        // - Higher spending
        const customerBookings = JSON.parse(localStorage.getItem(`customerBookings_${customerId}`) || '[]');
        const businessBookings = customerBookings.filter(booking => booking.businessId === businessId);
        
        let priority = 0;
        priority += businessBookings.length * 10; // 10 points per booking
        priority += businessBookings.reduce((sum, booking) => sum + booking.totalAmount, 0) / 10; // 1 point per £10 spent
        
        return priority;
    }

    /**
     * Create booking from offer
     */
    async createBookingFromOffer(offer) {
        const waitingListEntry = await this.getWaitingListEntry(offer.waitingListId);
        
        const booking = {
            id: `booking_${Date.now()}`,
            customerId: offer.customerId,
            businessId: offer.businessId,
            serviceData: waitingListEntry.serviceData,
            slot: offer.availableSlot,
            status: 'confirmed',
            source: 'waiting_list',
            createdAt: new Date().toISOString()
        };

        // Save to both dashboards
        await this.saveBookingToDashboards(booking);
        
        return booking;
    }

    /**
     * Save booking to both dashboards
     */
    async saveBookingToDashboards(booking) {
        // Save to customer bookings
        const customerBookings = JSON.parse(localStorage.getItem(`customerBookings_${booking.customerId}`) || '[]');
        customerBookings.push(booking);
        localStorage.setItem(`customerBookings_${booking.customerId}`, JSON.stringify(customerBookings));

        // Save to business bookings
        const businessBookings = JSON.parse(localStorage.getItem(`businessBookings_${booking.businessId}`) || '[]');
        businessBookings.push(booking);
        localStorage.setItem(`businessBookings_${booking.businessId}`, JSON.stringify(businessBookings));
    }

    // ========================================
    // NOTIFICATIONS
    // ========================================

    /**
     * Send waiting list confirmation
     */
    async sendWaitingListConfirmation(customerId, businessId, serviceData) {
        try {
            const customer = await this.getCustomer(customerId);
            const business = await this.getBusiness(businessId);
            
            await this.emailService.sendWaitingListConfirmation({
                to: customer.email,
                customerName: customer.firstName,
                businessName: business.name,
                serviceData: serviceData
            });
        } catch (error) {
            console.error('Failed to send waiting list confirmation:', error);
        }
    }

    /**
     * Send offer notification
     */
    async sendOfferNotification(customerId, businessId, offer) {
        try {
            const customer = await this.getCustomer(customerId);
            const business = await this.getBusiness(businessId);
            
            await this.emailService.sendOfferNotification({
                to: customer.email,
                customerName: customer.firstName,
                businessName: business.name,
                offer: offer
            });
        } catch (error) {
            console.error('Failed to send offer notification:', error);
        }
    }

    // ========================================
    // MOCK DATA METHODS
    // ========================================

    async getCustomer(customerId) {
        return {
            id: customerId,
            firstName: 'John',
            email: 'john@example.com'
        };
    }

    async getBusiness(businessId) {
        return {
            id: businessId,
            name: 'Royal Hair Studio',
            email: 'info@royalhairstudio.com'
        };
    }

    async getWaitingListEntry(waitingListId) {
        // Implementation would query database
        return {
            id: waitingListId,
            customerId: 'customer_123',
            businessId: 'business_456',
            serviceData: { name: 'Haircut', price: 45 }
        };
    }

    async getOffer(offerId) {
        // Implementation would query database
        return {
            id: offerId,
            customerId: 'customer_123',
            businessId: 'business_456',
            status: 'pending',
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
        };
    }

    async updateWaitingListEntry(waitingListId, updates) {
        // Implementation would update database
        console.log('Updated waiting list entry:', waitingListId, updates);
    }

    async updateOfferStatus(offerId, status) {
        // Implementation would update database
        console.log('Updated offer status:', offerId, status);
    }
}

module.exports = WaitingListSystem;
