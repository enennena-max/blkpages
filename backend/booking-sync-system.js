/**
 * Booking Synchronization System
 * Syncs booking data between customer and business dashboards
 */

class BookingSyncSystem {
    constructor() {
        this.privacySettings = {
            // Minimal customer details shared with business
            customerDetails: ['firstName', 'bookingDate', 'bookingTime', 'serviceName'],
            // Full details for customer dashboard
            customerFullDetails: ['firstName', 'lastName', 'email', 'phone', 'postcode', 'bookingDate', 'bookingTime', 'serviceName']
        };
    }

    // ========================================
    // BOOKING CONFIRMED EVENT HANDLER
    // ========================================

    /**
     * Handle booking.confirmed event
     * Syncs booking data to both customer and business dashboards
     */
    async handleBookingConfirmed(bookingData) {
        try {
            console.log('Processing booking.confirmed event:', bookingData.bookingId);
            
            // Validate booking data
            if (!bookingData.bookingId || !bookingData.customerId || !bookingData.businessId) {
                throw new Error('Invalid booking data provided');
            }

            // Create customer booking record (full details)
            const customerBooking = this.createCustomerBookingRecord(bookingData);
            
            // Create business booking record (privacy-protected)
            const businessBooking = this.createBusinessBookingRecord(bookingData);
            
            // Save to customer dashboard
            await this.saveToCustomerDashboard(customerBooking);
            
            // Save to business dashboard
            await this.saveToBusinessDashboard(businessBooking);
            
            // Trigger dashboard updates
            await this.triggerDashboardUpdates(bookingData);
            
            console.log('Booking confirmed and synced to both dashboards');
            return { success: true, bookingId: bookingData.bookingId };
        } catch (error) {
            console.error('Failed to handle booking confirmed:', error);
            throw error;
        }
    }

    /**
     * Create customer booking record with full details
     */
    createCustomerBookingRecord(bookingData) {
        return {
            id: bookingData.bookingId,
            customerId: bookingData.customerId,
            businessId: bookingData.businessId,
            businessName: bookingData.businessName,
            customerName: bookingData.customerName,
            customerEmail: bookingData.customerEmail,
            customerPhone: bookingData.customerPhone,
            customerPostcode: bookingData.customerPostcode,
            serviceName: bookingData.serviceName,
            servicePrice: bookingData.servicePrice,
            bookingDate: bookingData.bookingDate,
            bookingTime: bookingData.bookingTime,
            totalAmount: bookingData.totalAmount,
            paymentMethod: bookingData.paymentMethod,
            status: 'Confirmed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'booking_form'
        };
    }

    /**
     * Create business booking record with privacy protection
     */
    createBusinessBookingRecord(bookingData) {
        return {
            id: bookingData.bookingId,
            customerId: bookingData.customerId,
            businessId: bookingData.businessId,
            businessName: bookingData.businessName,
            // Privacy-protected customer details
            customerFirstName: bookingData.customerName.split(' ')[0], // Only first name
            customerLastName: bookingData.customerName.split(' ').slice(1).join(' '), // Last name
            serviceName: bookingData.serviceName,
            servicePrice: bookingData.servicePrice,
            bookingDate: bookingData.bookingDate,
            bookingTime: bookingData.bookingTime,
            totalAmount: bookingData.totalAmount,
            paymentMethod: bookingData.paymentMethod,
            status: 'Confirmed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'booking_form',
            // Privacy notice
            privacyNotice: 'Customer contact details are protected for privacy'
        };
    }

    // ========================================
    // BOOKING CANCELLED EVENT HANDLER
    // ========================================

    /**
     * Handle booking.cancelled event
     * Updates status in both dashboards
     */
    async handleBookingCancelled(bookingData) {
        try {
            console.log('Processing booking.cancelled event:', bookingData.bookingId);
            
            // Validate booking data
            if (!bookingData.bookingId || !bookingData.customerId || !bookingData.businessId) {
                throw new Error('Invalid booking data provided');
            }

            // Update customer dashboard
            await this.updateCustomerBookingStatus(bookingData);
            
            // Update business dashboard
            await this.updateBusinessBookingStatus(bookingData);
            
            // Trigger dashboard updates
            await this.triggerDashboardUpdates(bookingData);
            
            console.log('Booking cancelled and synced to both dashboards');
            return { success: true, bookingId: bookingData.bookingId };
        } catch (error) {
            console.error('Failed to handle booking cancelled:', error);
            throw error;
        }
    }

    /**
     * Update customer booking status
     */
    async updateCustomerBookingStatus(bookingData) {
        try {
            const customerId = bookingData.customerId;
            const customerBookings = JSON.parse(localStorage.getItem(`customerBookings_${customerId}`) || '[]');
            
            const bookingIndex = customerBookings.findIndex(booking => booking.id === bookingData.bookingId);
            if (bookingIndex !== -1) {
                customerBookings[bookingIndex].status = 'Cancelled';
                customerBookings[bookingIndex].cancelledAt = new Date().toISOString();
                customerBookings[bookingIndex].cancellationReason = bookingData.cancellationReason || 'Customer cancelled';
                customerBookings[bookingIndex].updatedAt = new Date().toISOString();
                
                localStorage.setItem(`customerBookings_${customerId}`, JSON.stringify(customerBookings));
            }
        } catch (error) {
            console.error('Failed to update customer booking status:', error);
        }
    }

    /**
     * Update business booking status
     */
    async updateBusinessBookingStatus(bookingData) {
        try {
            const businessId = bookingData.businessId;
            const businessBookings = JSON.parse(localStorage.getItem(`businessBookings_${businessId}`) || '[]');
            
            const bookingIndex = businessBookings.findIndex(booking => booking.id === bookingData.bookingId);
            if (bookingIndex !== -1) {
                businessBookings[bookingIndex].status = 'Cancelled';
                businessBookings[bookingIndex].cancelledAt = new Date().toISOString();
                businessBookings[bookingIndex].cancellationReason = bookingData.cancellationReason || 'Customer cancelled';
                businessBookings[bookingIndex].updatedAt = new Date().toISOString();
                
                localStorage.setItem(`businessBookings_${businessId}`, JSON.stringify(businessBookings));
            }
        } catch (error) {
            console.error('Failed to update business booking status:', error);
        }
    }

    // ========================================
    // DASHBOARD OPERATIONS
    // ========================================

    /**
     * Save to customer dashboard
     */
    async saveToCustomerDashboard(customerBooking) {
        try {
            const customerId = customerBooking.customerId;
            const customerBookings = JSON.parse(localStorage.getItem(`customerBookings_${customerId}`) || '[]');
            
            // Check if booking already exists
            const existingIndex = customerBookings.findIndex(booking => booking.id === customerBooking.id);
            if (existingIndex !== -1) {
                customerBookings[existingIndex] = customerBooking;
            } else {
                customerBookings.push(customerBooking);
            }
            
            localStorage.setItem(`customerBookings_${customerId}`, JSON.stringify(customerBookings));
            console.log('Booking saved to customer dashboard');
        } catch (error) {
            console.error('Failed to save to customer dashboard:', error);
        }
    }

    /**
     * Save to business dashboard
     */
    async saveToBusinessDashboard(businessBooking) {
        try {
            const businessId = businessBooking.businessId;
            const businessBookings = JSON.parse(localStorage.getItem(`businessBookings_${businessId}`) || '[]');
            
            // Check if booking already exists
            const existingIndex = businessBookings.findIndex(booking => booking.id === businessBooking.id);
            if (existingIndex !== -1) {
                businessBookings[existingIndex] = businessBooking;
            } else {
                businessBookings.push(businessBooking);
            }
            
            localStorage.setItem(`businessBookings_${businessId}`, JSON.stringify(businessBookings));
            console.log('Booking saved to business dashboard');
        } catch (error) {
            console.error('Failed to save to business dashboard:', error);
        }
    }

    // ========================================
    // DASHBOARD UPDATES
    // ========================================

    /**
     * Trigger dashboard updates
     */
    async triggerDashboardUpdates(bookingData) {
        try {
            // Trigger customer dashboard update
            window.dispatchEvent(new CustomEvent('bookingUpdated', {
                detail: {
                    customerId: bookingData.customerId,
                    bookingId: bookingData.bookingId,
                    status: bookingData.status || 'Confirmed'
                }
            }));
            
            // Trigger business dashboard update
            window.dispatchEvent(new CustomEvent('businessBookingUpdated', {
                detail: {
                    businessId: bookingData.businessId,
                    bookingId: bookingData.bookingId,
                    status: bookingData.status || 'Confirmed'
                }
            }));
            
            console.log('Dashboard updates triggered');
        } catch (error) {
            console.error('Failed to trigger dashboard updates:', error);
        }
    }

    // ========================================
    // PRIVACY PROTECTION
    // ========================================

    /**
     * Get privacy-protected customer details for business
     */
    getPrivacyProtectedCustomerDetails(customerData) {
        return {
            firstName: customerData.firstName,
            lastName: customerData.lastName ? customerData.lastName.charAt(0) + '***' : '',
            // No email, phone, or postcode shared
            serviceName: customerData.serviceName,
            bookingDate: customerData.bookingDate,
            bookingTime: customerData.bookingTime
        };
    }

    /**
     * Validate privacy compliance
     */
    validatePrivacyCompliance(businessBooking) {
        const allowedFields = ['id', 'customerId', 'businessId', 'businessName', 'customerFirstName', 'customerLastName', 'serviceName', 'servicePrice', 'bookingDate', 'bookingTime', 'totalAmount', 'paymentMethod', 'status', 'createdAt', 'updatedAt', 'source', 'privacyNotice'];
        
        const businessBookingFields = Object.keys(businessBooking);
        const invalidFields = businessBookingFields.filter(field => !allowedFields.includes(field));
        
        if (invalidFields.length > 0) {
            console.warn('Privacy violation detected:', invalidFields);
            return false;
        }
        
        return true;
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    /**
     * Get booking by ID from both dashboards
     */
    async getBookingById(bookingId, customerId, businessId) {
        try {
            // Get from customer dashboard
            const customerBookings = JSON.parse(localStorage.getItem(`customerBookings_${customerId}`) || '[]');
            const customerBooking = customerBookings.find(booking => booking.id === bookingId);
            
            // Get from business dashboard
            const businessBookings = JSON.parse(localStorage.getItem(`businessBookings_${businessId}`) || '[]');
            const businessBooking = businessBookings.find(booking => booking.id === bookingId);
            
            return {
                customerBooking,
                businessBooking,
                exists: !!(customerBooking && businessBooking)
            };
        } catch (error) {
            console.error('Failed to get booking by ID:', error);
            return { customerBooking: null, businessBooking: null, exists: false };
        }
    }

    /**
     * Sync existing booking between dashboards
     */
    async syncExistingBooking(bookingId, customerId, businessId) {
        try {
            const { customerBooking, businessBooking, exists } = await this.getBookingById(bookingId, customerId, businessId);
            
            if (!exists) {
                console.log('Booking not found in both dashboards');
                return false;
            }
            
            // Sync status and updates
            if (customerBooking.status !== businessBooking.status) {
                const latestStatus = customerBooking.updatedAt > businessBooking.updatedAt ? customerBooking.status : businessBooking.status;
                
                // Update both dashboards with latest status
                await this.updateCustomerBookingStatus({
                    bookingId,
                    customerId,
                    businessId,
                    status: latestStatus
                });
                
                await this.updateBusinessBookingStatus({
                    bookingId,
                    customerId,
                    businessId,
                    status: latestStatus
                });
            }
            
            return true;
        } catch (error) {
            console.error('Failed to sync existing booking:', error);
            return false;
        }
    }
}

module.exports = BookingSyncSystem;
