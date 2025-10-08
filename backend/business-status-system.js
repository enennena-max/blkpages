/**
 * Business Status Management System
 * Handles business status changes and booking restrictions
 */

class BusinessStatusSystem {
    constructor() {
        this.statusTypes = {
            ACTIVE: 'active',
            SUSPENDED: 'suspended',
            DEACTIVATED: 'deactivated',
            PENDING: 'pending'
        };
    }

    // ========================================
    // BUSINESS STATUS MANAGEMENT
    // ========================================

    /**
     * Update business status
     */
    async updateBusinessStatus(businessId, newStatus, reason = '') {
        try {
            // Validate status
            if (!Object.values(this.statusTypes).includes(newStatus)) {
                throw new Error('Invalid business status');
            }

            // Get current business data
            const business = await this.getBusiness(businessId);
            if (!business) {
                throw new Error('Business not found');
            }

            const oldStatus = business.status;
            
            // Update business status
            business.status = newStatus;
            business.statusUpdatedAt = new Date().toISOString();
            business.statusReason = reason;
            
            // Save updated business
            await this.saveBusiness(business);

            // Handle status-specific actions
            await this.handleStatusChange(businessId, oldStatus, newStatus, reason);

            console.log(`Business ${businessId} status changed from ${oldStatus} to ${newStatus}`);
            return business;
        } catch (error) {
            console.error('Failed to update business status:', error);
            throw error;
        }
    }

    /**
     * Handle status change actions
     */
    async handleStatusChange(businessId, oldStatus, newStatus, reason) {
        switch (newStatus) {
            case this.statusTypes.SUSPENDED:
                await this.handleBusinessSuspension(businessId, reason);
                break;
            case this.statusTypes.DEACTIVATED:
                await this.handleBusinessDeactivation(businessId, reason);
                break;
            case this.statusTypes.ACTIVE:
                await this.handleBusinessReactivation(businessId, reason);
                break;
        }
    }

    /**
     * Handle business suspension
     */
    async handleBusinessSuspension(businessId, reason) {
        try {
            // Disable new bookings
            await this.disableNewBookings(businessId);
            
            // Notify existing customers
            await this.notifyCustomersOfSuspension(businessId, reason);
            
            // Update business profile visibility
            await this.updateBusinessProfileVisibility(businessId, false);
            
            console.log('Business suspension handled:', businessId);
        } catch (error) {
            console.error('Failed to handle business suspension:', error);
        }
    }

    /**
     * Handle business deactivation
     */
    async handleBusinessDeactivation(businessId, reason) {
        try {
            // Disable new bookings
            await this.disableNewBookings(businessId);
            
            // Notify existing customers
            await this.notifyCustomersOfDeactivation(businessId, reason);
            
            // Hide business profile
            await this.updateBusinessProfileVisibility(businessId, false);
            
            // Cancel future bookings (optional)
            await this.cancelFutureBookings(businessId);
            
            console.log('Business deactivation handled:', businessId);
        } catch (error) {
            console.error('Failed to handle business deactivation:', error);
        }
    }

    /**
     * Handle business reactivation
     */
    async handleBusinessReactivation(businessId, reason) {
        try {
            // Enable new bookings
            await this.enableNewBookings(businessId);
            
            // Update business profile visibility
            await this.updateBusinessProfileVisibility(businessId, true);
            
            // Notify customers of reactivation
            await this.notifyCustomersOfReactivation(businessId);
            
            console.log('Business reactivation handled:', businessId);
        } catch (error) {
            console.error('Failed to handle business reactivation:', error);
        }
    }

    // ========================================
    // BOOKING RESTRICTIONS
    // ========================================

    /**
     * Check if business accepts new bookings
     */
    async canBusinessAcceptBookings(businessId) {
        try {
            const business = await this.getBusiness(businessId);
            if (!business) {
                return false;
            }

            // Check if business is active
            if (business.status !== this.statusTypes.ACTIVE) {
                return false;
            }

            // Check if bookings are disabled
            if (business.bookingsDisabled) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Failed to check booking eligibility:', error);
            return false;
        }
    }

    /**
     * Disable new bookings for business
     */
    async disableNewBookings(businessId) {
        try {
            const business = await this.getBusiness(businessId);
            if (business) {
                business.bookingsDisabled = true;
                business.bookingsDisabledAt = new Date().toISOString();
                await this.saveBusiness(business);
            }
        } catch (error) {
            console.error('Failed to disable bookings:', error);
        }
    }

    /**
     * Enable new bookings for business
     */
    async enableNewBookings(businessId) {
        try {
            const business = await this.getBusiness(businessId);
            if (business) {
                business.bookingsDisabled = false;
                business.bookingsEnabledAt = new Date().toISOString();
                await this.saveBusiness(business);
            }
        } catch (error) {
            console.error('Failed to enable bookings:', error);
        }
    }

    // ========================================
    // EXISTING BOOKINGS MANAGEMENT
    // ========================================

    /**
     * Get existing bookings for business
     */
    async getBusinessBookings(businessId) {
        try {
            const bookings = JSON.parse(localStorage.getItem(`businessBookings_${businessId}`) || '[]');
            return bookings;
        } catch (error) {
            console.error('Failed to get business bookings:', error);
            return [];
        }
    }

    /**
     * Get customer bookings for business
     */
    async getCustomerBookingsForBusiness(customerId, businessId) {
        try {
            const customerBookings = JSON.parse(localStorage.getItem(`customerBookings_${customerId}`) || '[]');
            return customerBookings.filter(booking => booking.businessId === businessId);
        } catch (error) {
            console.error('Failed to get customer bookings:', error);
            return [];
        }
    }

    /**
     * Cancel future bookings for business
     */
    async cancelFutureBookings(businessId) {
        try {
            const bookings = await this.getBusinessBookings(businessId);
            const now = new Date();
            
            for (const booking of bookings) {
                const bookingDate = new Date(booking.date);
                if (bookingDate > now && booking.status === 'Confirmed') {
                    // Update booking status
                    booking.status = 'Cancelled';
                    booking.cancelledAt = new Date().toISOString();
                    booking.cancellationReason = 'Business deactivated';
                    
                    // Update in business bookings
                    await this.updateBusinessBooking(booking);
                    
                    // Update in customer bookings
                    await this.updateCustomerBooking(booking);
                }
            }
        } catch (error) {
            console.error('Failed to cancel future bookings:', error);
        }
    }

    // ========================================
    // NOTIFICATIONS
    // ========================================

    /**
     * Notify customers of business suspension
     */
    async notifyCustomersOfSuspension(businessId, reason) {
        try {
            const bookings = await this.getBusinessBookings(businessId);
            const customerIds = [...new Set(bookings.map(booking => booking.customerId))];
            
            for (const customerId of customerIds) {
                await this.sendSuspensionNotification(customerId, businessId, reason);
            }
        } catch (error) {
            console.error('Failed to notify customers of suspension:', error);
        }
    }

    /**
     * Notify customers of business deactivation
     */
    async notifyCustomersOfDeactivation(businessId, reason) {
        try {
            const bookings = await this.getBusinessBookings(businessId);
            const customerIds = [...new Set(bookings.map(booking => booking.customerId))];
            
            for (const customerId of customerIds) {
                await this.sendDeactivationNotification(customerId, businessId, reason);
            }
        } catch (error) {
            console.error('Failed to notify customers of deactivation:', error);
        }
    }

    /**
     * Notify customers of business reactivation
     */
    async notifyCustomersOfReactivation(businessId) {
        try {
            const bookings = await this.getBusinessBookings(businessId);
            const customerIds = [...new Set(bookings.map(booking => booking.customerId))];
            
            for (const customerId of customerIds) {
                await this.sendReactivationNotification(customerId, businessId);
            }
        } catch (error) {
            console.error('Failed to notify customers of reactivation:', error);
        }
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Get business data
     */
    async getBusiness(businessId) {
        try {
            const businesses = JSON.parse(localStorage.getItem('blkpages_businesses') || '[]');
            return businesses.find(business => business.id === businessId);
        } catch (error) {
            console.error('Failed to get business:', error);
            return null;
        }
    }

    /**
     * Save business data
     */
    async saveBusiness(business) {
        try {
            const businesses = JSON.parse(localStorage.getItem('blkpages_businesses') || '[]');
            const index = businesses.findIndex(b => b.id === business.id);
            if (index !== -1) {
                businesses[index] = business;
                localStorage.setItem('blkpages_businesses', JSON.stringify(businesses));
            }
        } catch (error) {
            console.error('Failed to save business:', error);
        }
    }

    /**
     * Update business profile visibility
     */
    async updateBusinessProfileVisibility(businessId, isVisible) {
        try {
            const business = await this.getBusiness(businessId);
            if (business) {
                business.profileVisible = isVisible;
                business.visibilityUpdatedAt = new Date().toISOString();
                await this.saveBusiness(business);
            }
        } catch (error) {
            console.error('Failed to update profile visibility:', error);
        }
    }

    /**
     * Update business booking
     */
    async updateBusinessBooking(booking) {
        try {
            const businessBookings = JSON.parse(localStorage.getItem(`businessBookings_${booking.businessId}`) || '[]');
            const index = businessBookings.findIndex(b => b.id === booking.id);
            if (index !== -1) {
                businessBookings[index] = booking;
                localStorage.setItem(`businessBookings_${booking.businessId}`, JSON.stringify(businessBookings));
            }
        } catch (error) {
            console.error('Failed to update business booking:', error);
        }
    }

    /**
     * Update customer booking
     */
    async updateCustomerBooking(booking) {
        try {
            const customerBookings = JSON.parse(localStorage.getItem(`customerBookings_${booking.customerId}`) || '[]');
            const index = customerBookings.findIndex(b => b.id === booking.id);
            if (index !== -1) {
                customerBookings[index] = booking;
                localStorage.setItem(`customerBookings_${booking.customerId}`, JSON.stringify(customerBookings));
            }
        } catch (error) {
            console.error('Failed to update customer booking:', error);
        }
    }

    // ========================================
    // NOTIFICATION METHODS
    // ========================================

    async sendSuspensionNotification(customerId, businessId, reason) {
        console.log(`Suspension notification sent to customer ${customerId} for business ${businessId}`);
    }

    async sendDeactivationNotification(customerId, businessId, reason) {
        console.log(`Deactivation notification sent to customer ${customerId} for business ${businessId}`);
    }

    async sendReactivationNotification(customerId, businessId) {
        console.log(`Reactivation notification sent to customer ${customerId} for business ${businessId}`);
    }
}

module.exports = BusinessStatusSystem;
