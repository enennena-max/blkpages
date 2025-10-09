/**
 * Waiting List Offer (WLO) System
 * GDPR-compliant waiting list management with premium plan access control
 */

const WaitingListOfferSystem = {
    // Business plan access control
    BUSINESS_PLANS: {
        FREE: 'free',
        BASIC: 'basic', 
        PREMIUM: 'premium' // £29/month - WLO enabled
    },

    // WLO statuses
    OFFER_STATUS: {
        PENDING: 'pending',
        ACCEPTED: 'accepted',
        DECLINED: 'declined',
        EXPIRED: 'expired',
        CANCELLED: 'cancelled'
    },

    // Customer waiting list status
    WAITING_STATUS: {
        ACTIVE: 'active',
        NOTIFIED: 'notified',
        BOOKED: 'booked',
        REMOVED: 'removed'
    },

    // Initialize WLO system
    initialize: function() {
        console.log('WLO System: Initializing...');
        this.loadBusinessPlan();
        this.loadWaitingListSettings();
        this.checkExpiredOffers();
    },

    // Check if business has WLO access
    hasWLOAccess: function(businessId) {
        const business = this.getBusinessData(businessId);
        return business && business.plan === this.BUSINESS_PLANS.PREMIUM;
    },

    // Get business plan data
    getBusinessData: function(businessId) {
        // Simulate business data from database
        const businesses = {
            'royal-hair-studio': {
                id: 'royal-hair-studio',
                name: 'Royal Hair Studio',
                plan: this.BUSINESS_PLANS.PREMIUM, // £29/month
                wloEnabled: true,
                services: {
                    'haircut-style': {
                        id: 'haircut-style',
                        name: 'Haircut & Style',
                        wloEnabled: true,
                        waitingList: []
                    },
                    'hair-treatment': {
                        id: 'hair-treatment', 
                        name: 'Hair Treatment',
                        wloEnabled: false,
                        waitingList: []
                    }
                }
            },
            'basic-salon': {
                id: 'basic-salon',
                name: 'Basic Salon',
                plan: this.BUSINESS_PLANS.BASIC, // No WLO access
                wloEnabled: false,
                services: {}
            }
        };
        
        return businesses[businessId] || null;
    },

    // Load business plan from localStorage
    loadBusinessPlan: function() {
        const savedPlan = localStorage.getItem('business_plan');
        if (savedPlan) {
            console.log('WLO System: Business plan loaded:', savedPlan);
        }
    },

    // Load waiting list settings
    loadWaitingListSettings: function() {
        const settings = {
            holdDuration: 2, // hours
            quietHours: {
                start: '21:00',
                end: '08:00'
            },
            maxRetries: 3,
            retryDelay: 30 // minutes
        };
        
        localStorage.setItem('wlo_settings', JSON.stringify(settings));
        return settings;
    },

    // Join waiting list (customer action)
    joinWaitingList: function(customerData, serviceId, businessId) {
        console.log('WLO System: Customer joining waiting list', { customerData, serviceId, businessId });
        
        // Validate business has WLO access
        if (!this.hasWLOAccess(businessId)) {
            return {
                success: false,
                error: 'Waiting list not available for this business'
            };
        }

        // Validate service has WLO enabled
        const business = this.getBusinessData(businessId);
        const service = business.services[serviceId];
        
        if (!service || !service.wloEnabled) {
            return {
                success: false,
                error: 'Waiting list not enabled for this service'
            };
        }

        // Create waiting list entry
        const waitingEntry = {
            id: this.generateId(),
            customerId: customerData.id,
            customerName: customerData.name,
            customerEmail: customerData.email,
            customerPhone: customerData.phone,
            serviceId: serviceId,
            businessId: businessId,
            status: this.WAITING_STATUS.ACTIVE,
            joinedAt: new Date().toISOString(),
            consent: customerData.consent,
            smsConsent: customerData.smsConsent || false
        };

        // Add to service waiting list
        service.waitingList.push(waitingEntry);
        
        // Save to localStorage
        this.saveWaitingListData(businessId, serviceId, service.waitingList);

        return {
            success: true,
            message: 'Successfully joined waiting list',
            waitingListId: waitingEntry.id
        };
    },

    // Create waiting list offer
    createOffer: function(serviceId, businessId, slotData) {
        console.log('WLO System: Creating offer', { serviceId, businessId, slotData });
        
        const business = this.getBusinessData(businessId);
        const service = business.services[serviceId];
        
        if (!service.wloEnabled || service.waitingList.length === 0) {
            return { success: false, error: 'No waiting list customers available' };
        }

        // Get next customer in queue
        const nextCustomer = service.waitingList.find(customer => 
            customer.status === this.WAITING_STATUS.ACTIVE
        );

        if (!nextCustomer) {
            return { success: false, error: 'No active customers on waiting list' };
        }

        // Create offer
        const offer = {
            id: this.generateId(),
            customerId: nextCustomer.customerId,
            businessId: businessId,
            serviceId: serviceId,
            slotData: slotData,
            status: this.OFFER_STATUS.PENDING,
            token: this.generateSecureToken(),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + (2 * 60 * 60 * 1000)).toISOString(), // 2 hours
            attempts: 0,
            maxAttempts: 3
        };

        // Update customer status
        nextCustomer.status = this.WAITING_STATUS.NOTIFIED;
        nextCustomer.lastOfferId = offer.id;
        nextCustomer.lastOfferAt = offer.createdAt;

        // Save offer and update waiting list
        this.saveOffer(offer);
        this.saveWaitingListData(businessId, serviceId, service.waitingList);

        // Send notifications
        this.sendOfferNotifications(offer);

        return {
            success: true,
            offer: offer,
            customer: nextCustomer
        };
    },

    // Send offer notifications (email + SMS)
    sendOfferNotifications: function(offer) {
        console.log('WLO System: Sending offer notifications', offer);
        
        const customer = this.getCustomerData(offer.customerId);
        const business = this.getBusinessData(offer.businessId);
        const service = business.services[offer.serviceId];

        // Check quiet hours for SMS
        const shouldQueueSMS = this.isQuietHours();
        
        // Email notification
        this.sendEmailNotification(offer, customer, business, service);
        
        // SMS notification (if consent and not quiet hours)
        if (customer.smsConsent && !shouldQueueSMS) {
            this.sendSMSNotification(offer, customer, business, service);
        } else if (customer.smsConsent && shouldQueueSMS) {
            this.queueSMSNotification(offer);
        }

        // Update offer attempts
        offer.attempts += 1;
        this.saveOffer(offer);
    },

    // Send email notification
    sendEmailNotification: function(offer, customer, business, service) {
        const emailData = {
            to: customer.email,
            subject: `A slot opened at ${business.name}!`,
            template: 'waiting-list-offer',
            data: {
                customerName: customer.name,
                businessName: business.name,
                serviceName: service.name,
                slotDate: this.formatDateTime(offer.slotData.startTime),
                offerLink: `${window.location.origin}/booking/offer/${offer.token}`,
                expiresIn: '2 hours',
                preferencesLink: `${window.location.origin}/preferences`
            }
        };

        console.log('WLO System: Sending email notification', emailData);
        // Simulate email send
        return { success: true, messageId: this.generateId() };
    },

    // Send SMS notification
    sendSMSNotification: function(offer, customer, business, service) {
        const smsData = {
            to: customer.phone,
            message: `Slot opened at ${business.name} ${this.formatDateTime(offer.slotData.startTime)}. Book within 2h: ${this.generateShortLink(offer.token)}. No replies.`,
            businessId: offer.businessId
        };

        console.log('WLO System: Sending SMS notification', smsData);
        // Simulate SMS send
        return { success: true, messageId: this.generateId() };
    },

    // Queue SMS for later (quiet hours)
    queueSMSNotification: function(offer) {
        const queueData = {
            offerId: offer.id,
            scheduledFor: this.getNextAvailableTime(),
            type: 'waiting_list_offer'
        };

        console.log('WLO System: Queuing SMS for quiet hours', queueData);
        // Add to SMS queue
        return { success: true, queued: true };
    },

    // Accept offer (customer books via link)
    acceptOffer: function(offerToken) {
        console.log('WLO System: Accepting offer', offerToken);
        
        const offer = this.getOfferByToken(offerToken);
        
        if (!offer) {
            return { success: false, error: 'Invalid offer token' };
        }

        if (offer.status !== this.OFFER_STATUS.PENDING) {
            return { success: false, error: 'Offer no longer available' };
        }

        if (new Date() > new Date(offer.expiresAt)) {
            return { success: false, error: 'Offer has expired' };
        }

        // Update offer status
        offer.status = this.OFFER_STATUS.ACCEPTED;
        offer.acceptedAt = new Date().toISOString();
        this.saveOffer(offer);

        // Update customer status
        this.updateCustomerWaitingStatus(offer.customerId, offer.serviceId, offer.businessId, this.WAITING_STATUS.BOOKED);

        // Cancel other pending offers for this slot
        this.cancelOtherOffers(offer);

        return {
            success: true,
            message: 'Offer accepted successfully',
            bookingData: {
                customerId: offer.customerId,
                serviceId: offer.serviceId,
                businessId: offer.businessId,
                slotData: offer.slotData
            }
        };
    },

    // Decline or expire offer
    declineOffer: function(offerToken, reason = 'declined') {
        console.log('WLO System: Declining offer', { offerToken, reason });
        
        const offer = this.getOfferByToken(offerToken);
        
        if (!offer) {
            return { success: false, error: 'Invalid offer token' };
        }

        // Update offer status
        offer.status = reason === 'expired' ? this.OFFER_STATUS.EXPIRED : this.OFFER_STATUS.DECLINED;
        offer.processedAt = new Date().toISOString();
        this.saveOffer(offer);

        // Update customer status
        this.updateCustomerWaitingStatus(offer.customerId, offer.serviceId, offer.businessId, this.WAITING_STATUS.ACTIVE);

        // Offer to next customer
        this.offerToNextCustomer(offer.serviceId, offer.businessId, offer.slotData);

        return { success: true, message: 'Offer processed' };
    },

    // Offer to next customer in queue
    offerToNextCustomer: function(serviceId, businessId, slotData) {
        console.log('WLO System: Offering to next customer', { serviceId, businessId });
        
        const business = this.getBusinessData(businessId);
        const service = business.services[serviceId];
        
        const nextCustomer = service.waitingList.find(customer => 
            customer.status === this.WAITING_STATUS.ACTIVE
        );

        if (nextCustomer) {
            return this.createOffer(serviceId, businessId, slotData);
        }

        return { success: false, message: 'No more customers on waiting list' };
    },

    // Check for expired offers
    checkExpiredOffers: function() {
        console.log('WLO System: Checking expired offers');
        
        const offers = this.getAllOffers();
        const now = new Date();
        
        offers.forEach(offer => {
            if (offer.status === this.OFFER_STATUS.PENDING && 
                new Date(offer.expiresAt) < now) {
                this.declineOffer(offer.token, 'expired');
            }
        });
    },

    // Get offer by token
    getOfferByToken: function(token) {
        const offers = this.getAllOffers();
        return offers.find(offer => offer.token === token);
    },

    // Get all offers
    getAllOffers: function() {
        const offers = localStorage.getItem('wlo_offers');
        return offers ? JSON.parse(offers) : [];
    },

    // Save offer
    saveOffer: function(offer) {
        const offers = this.getAllOffers();
        const existingIndex = offers.findIndex(o => o.id === offer.id);
        
        if (existingIndex >= 0) {
            offers[existingIndex] = offer;
        } else {
            offers.push(offer);
        }
        
        localStorage.setItem('wlo_offers', JSON.stringify(offers));
    },

    // Save waiting list data
    saveWaitingListData: function(businessId, serviceId, waitingList) {
        const key = `wlo_waiting_list_${businessId}_${serviceId}`;
        localStorage.setItem(key, JSON.stringify(waitingList));
    },

    // Get waiting list data
    getWaitingListData: function(businessId, serviceId) {
        const key = `wlo_waiting_list_${businessId}_${serviceId}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    // Update customer waiting status
    updateCustomerWaitingStatus: function(customerId, serviceId, businessId, status) {
        const business = this.getBusinessData(businessId);
        const service = business.services[serviceId];
        
        const customer = service.waitingList.find(c => c.customerId === customerId);
        if (customer) {
            customer.status = status;
            customer.updatedAt = new Date().toISOString();
            this.saveWaitingListData(businessId, serviceId, service.waitingList);
        }
    },

    // Cancel other offers for same slot
    cancelOtherOffers: function(acceptedOffer) {
        const offers = this.getAllOffers();
        
        offers.forEach(offer => {
            if (offer.id !== acceptedOffer.id && 
                offer.serviceId === acceptedOffer.serviceId &&
                offer.slotData.startTime === acceptedOffer.slotData.startTime &&
                offer.status === this.OFFER_STATUS.PENDING) {
                
                offer.status = this.OFFER_STATUS.CANCELLED;
                offer.cancelledAt = new Date().toISOString();
                this.saveOffer(offer);
            }
        });
    },

    // Get customer data
    getCustomerData: function(customerId) {
        // Simulate customer data
        return {
            id: customerId,
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '+447700900000',
            smsConsent: true
        };
    },

    // Check if currently in quiet hours
    isQuietHours: function() {
        const now = new Date();
        const hour = now.getHours();
        return hour >= 21 || hour < 8;
    },

    // Get next available time (after quiet hours)
    getNextAvailableTime: function() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(8, 0, 0, 0);
        return tomorrow.toISOString();
    },

    // Format date/time for display
    formatDateTime: function(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/London'
        });
    },

    // Generate secure token
    generateSecureToken: function() {
        return 'wlo_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    },

    // Generate short link
    generateShortLink: function(token) {
        return `${window.location.origin}/wlo/${token}`;
    },

    // Generate unique ID
    generateId: function() {
        return 'wlo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    },

    // Toggle service waiting list
    toggleServiceWaitingList: function(businessId, serviceId, enabled) {
        console.log('WLO System: Toggling service waiting list', { businessId, serviceId, enabled });
        
        if (!this.hasWLOAccess(businessId)) {
            return { success: false, error: 'WLO not available for this plan' };
        }

        const business = this.getBusinessData(businessId);
        const service = business.services[serviceId];
        
        if (service) {
            service.wloEnabled = enabled;
            this.saveBusinessData(business);
            return { success: true, enabled: enabled };
        }

        return { success: false, error: 'Service not found' };
    },

    // Save business data
    saveBusinessData: function(business) {
        const key = `business_data_${business.id}`;
        localStorage.setItem(key, JSON.stringify(business));
    },

    // Get business waiting list summary
    getBusinessWaitingListSummary: function(businessId) {
        if (!this.hasWLOAccess(businessId)) {
            return { hasAccess: false };
        }

        const business = this.getBusinessData(businessId);
        const summary = {
            hasAccess: true,
            totalWaiting: 0,
            activeOffers: 0,
            services: {}
        };

        Object.keys(business.services).forEach(serviceId => {
            const service = business.services[serviceId];
            const waitingList = this.getWaitingListData(businessId, serviceId);
            
            summary.services[serviceId] = {
                name: service.name,
                wloEnabled: service.wloEnabled,
                waitingCount: waitingList.filter(c => c.status === this.WAITING_STATUS.ACTIVE).length,
                notifiedCount: waitingList.filter(c => c.status === this.WAITING_STATUS.NOTIFIED).length
            };
            
            summary.totalWaiting += summary.services[serviceId].waitingCount;
        });

        // Count active offers
        const offers = this.getAllOffers();
        summary.activeOffers = offers.filter(offer => 
            offer.businessId === businessId && 
            offer.status === this.OFFER_STATUS.PENDING
        ).length;

        return summary;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    WaitingListOfferSystem.initialize();
});

// Export for use in other scripts
window.WaitingListOfferSystem = WaitingListOfferSystem;
