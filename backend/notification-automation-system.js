/**
 * Notification Automation System for BlkPages
 * Handles waiting list offers, notification triggers, bounce handling, and dunning flow
 * GDPR-compliant with comprehensive logging and retry mechanisms
 */

class NotificationAutomationSystem {
    constructor() {
        this.featureFlags = {
            waitinglist_offer: true,
            suppression: true,
            dunning: true
        };
        
        this.config = {
            wlo_hold_hours: 2, // Configurable: 30m min, 6h max
            quiet_hours_start: 21, // 21:00
            quiet_hours_end: 8,    // 08:00
            max_retries: 3,
            retry_delays: [60000, 300000, 1200000], // 1m, 5m, 20m
            timezone: 'Europe/London'
        };
        
        this.notifications = new Map();
        this.waitingListOffers = new Map();
        this.suppressionList = new Map();
        this.billingHistory = new Map();
        this.auditLogs = [];
    }

    /**
     * Create waiting list offer
     */
    async createWaitingListOffer(customerId, businessId, serviceId, slotDateTime) {
        try {
            // Check if customer is eligible
            if (!await this.isCustomerEligibleForWLO(customerId, businessId, serviceId)) {
                throw new Error('Customer not eligible for waiting list offer');
            }

            const offerToken = this.generateSecureToken();
            const startAt = new Date();
            const holdExpiresAt = new Date(startAt.getTime() + (this.config.wlo_hold_hours * 60 * 60 * 1000));

            const offer = {
                id: this.generateId(),
                customer_id: customerId,
                business_id: businessId,
                service_id: serviceId,
                start_at_utc: startAt.toISOString(),
                hold_expires_at_utc: holdExpiresAt.toISOString(),
                offer_status: 'pending',
                offer_token: offerToken,
                created_at_utc: new Date().toISOString(),
                updated_at_utc: new Date().toISOString()
            };

            this.waitingListOffers.set(offer.id, offer);

            // Send notifications
            await this.sendWaitingListOfferNotifications(offer);

            this.logAuditEvent('wlo_created', {
                offer_id: offer.id,
                customer_id: customerId,
                business_id: businessId,
                service_id: serviceId,
                expires_at: holdExpiresAt.toISOString()
            });

            return offer;

        } catch (error) {
            this.logAuditEvent('wlo_creation_failed', {
                customer_id: customerId,
                business_id: businessId,
                service_id: serviceId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Check if customer is eligible for waiting list offer
     */
    async isCustomerEligibleForWLO(customerId, businessId, serviceId) {
        // Check if customer opted into waiting list for this service
        const waitingListConsent = await this.getWaitingListConsent(customerId, businessId, serviceId);
        if (!waitingListConsent) return false;

        // Check email/SMS status
        const customer = await this.getCustomer(customerId);
        if (!customer) return false;

        // Check for valid, non-suppressed contact methods
        const hasValidEmail = customer.email_status === 'valid' && !this.isSuppressed('email', customer.email);
        const hasValidSMS = customer.sms_status === 'verified' && !this.isSuppressed('sms', customer.phone);

        return hasValidEmail || hasValidSMS;
    }

    /**
     * Send waiting list offer notifications
     */
    async sendWaitingListOfferNotifications(offer) {
        const customer = await this.getCustomer(offer.customer_id);
        const business = await this.getBusiness(offer.business_id);
        const service = await this.getService(offer.service_id);

        if (!customer || !business || !service) {
            throw new Error('Missing customer, business, or service data');
        }

        const localDateTime = this.formatLocalDateTime(offer.start_at_utc);
        const secureOfferLink = this.generateSecureOfferLink(offer.offer_token);

        // Send email notification
        if (customer.email_status === 'valid' && !this.isSuppressed('email', customer.email)) {
            await this.sendEmailNotification({
                to: customer.email,
                subject: `A slot opened at ${business.name}!`,
                template: 'waiting-list-offer',
                data: {
                    first_name: customer.first_name,
                    business_name: business.name,
                    service_name: service.name,
                    date_time: localDateTime,
                    offer_link: secureOfferLink,
                    hold_hours: this.config.wlo_hold_hours
                }
            });
        }

        // Send SMS notification
        if (customer.sms_status === 'verified' && !this.isSuppressed('sms', customer.phone)) {
            const smsMessage = `Slot opened at ${business.name} ${localDateTime}. Book within ${this.config.wlo_hold_hours}h: ${this.shortenUrl(secureOfferLink)}. No replies.`;
            
            await this.sendSMSNotification({
                to: customer.phone,
                message: smsMessage,
                type: 'waiting_list_offer'
            });
        }

        this.logAuditEvent('wlo_notifications_sent', {
            offer_id: offer.id,
            customer_id: offer.customer_id,
            email_sent: customer.email_status === 'valid',
            sms_sent: customer.sms_status === 'verified'
        });
    }

    /**
     * Process waiting list offer response
     */
    async processWLOResponse(offerToken, action) {
        const offer = this.findOfferByToken(offerToken);
        
        if (!offer) {
            throw new Error('Invalid offer token');
        }

        if (offer.offer_status !== 'pending') {
            throw new Error('Offer no longer valid');
        }

        if (new Date() > new Date(offer.hold_expires_at_utc)) {
            offer.offer_status = 'expired';
            offer.updated_at_utc = new Date().toISOString();
            this.waitingListOffers.set(offer.id, offer);
            
            // Trigger next in queue
            await this.triggerNextInWaitingList(offer.business_id, offer.service_id);
            return { status: 'expired', message: 'Offer has expired' };
        }

        if (action === 'accept') {
            offer.offer_status = 'accepted';
            offer.updated_at_utc = new Date().toISOString();
            this.waitingListOffers.set(offer.id, offer);

            // Create booking
            const booking = await this.createBookingFromOffer(offer);
            
            // Cancel other pending offers for this slot
            await this.cancelOtherPendingOffers(offer.business_id, offer.service_id, offer.id);

            this.logAuditEvent('wlo_accepted', {
                offer_id: offer.id,
                customer_id: offer.customer_id,
                booking_id: booking.id
            });

            return { status: 'accepted', booking: booking };
        }

        if (action === 'decline') {
            offer.offer_status = 'declined';
            offer.updated_at_utc = new Date().toISOString();
            this.waitingListOffers.set(offer.id, offer);

            // Trigger next in queue
            await this.triggerNextInWaitingList(offer.business_id, offer.service_id);

            this.logAuditEvent('wlo_declined', {
                offer_id: offer.id,
                customer_id: offer.customer_id
            });

            return { status: 'declined', message: 'Offer declined' };
        }

        throw new Error('Invalid action');
    }

    /**
     * Trigger notification based on event
     */
    async triggerNotification(eventType, data) {
        const idempotencyKey = this.generateIdempotencyKey(eventType, data);
        
        // Check for duplicate
        if (this.notifications.has(idempotencyKey)) {
            console.log('Duplicate notification prevented:', idempotencyKey);
            return;
        }

        const notification = {
            id: this.generateId(),
            idempotency_key: idempotencyKey,
            event_type: eventType,
            data: data,
            status: 'queued',
            attempts: 0,
            created_at_utc: new Date().toISOString(),
            queued_at_utc: new Date().toISOString()
        };

        this.notifications.set(idempotencyKey, notification);

        // Process notification
        await this.processNotification(notification);
    }

    /**
     * Process notification with retries
     */
    async processNotification(notification) {
        try {
            // Check quiet hours
            if (this.isQuietHours() && !this.isUrgentNotification(notification.event_type)) {
                await this.scheduleForMorning(notification);
                return;
            }

            // Determine recipients and channels
            const recipients = await this.getNotificationRecipients(notification);
            
            for (const recipient of recipients) {
                await this.sendToRecipient(notification, recipient);
            }

            notification.status = 'sent';
            notification.sent_at_utc = new Date().toISOString();
            this.notifications.set(notification.idempotency_key, notification);

        } catch (error) {
            await this.handleNotificationError(notification, error);
        }
    }

    /**
     * Send notification to recipient
     */
    async sendToRecipient(notification, recipient) {
        const { channel, address, type } = recipient;

        // Check suppression
        if (this.isSuppressed(channel, address)) {
            this.logAuditEvent('notification_suppressed', {
                notification_id: notification.id,
                channel: channel,
                address: this.maskAddress(address),
                reason: 'suppressed'
            });
            return;
        }

        // Check bounce status
        if (this.isBounced(channel, address)) {
            this.logAuditEvent('notification_bounced', {
                notification_id: notification.id,
                channel: channel,
                address: this.maskAddress(address),
                reason: 'bounced'
            });
            return;
        }

        try {
            if (channel === 'email') {
                await this.sendEmailNotification({
                    to: address,
                    subject: this.getEmailSubject(notification.event_type, notification.data),
                    template: this.getEmailTemplate(notification.event_type),
                    data: notification.data
                });
            } else if (channel === 'sms') {
                await this.sendSMSNotification({
                    to: address,
                    message: this.getSMSMessage(notification.event_type, notification.data),
                    type: notification.event_type
                });
            }

            this.logAuditEvent('notification_sent', {
                notification_id: notification.id,
                channel: channel,
                address: this.maskAddress(address),
                type: type
            });

        } catch (error) {
            throw new Error(`Failed to send ${channel} to ${this.maskAddress(address)}: ${error.message}`);
        }
    }

    /**
     * Handle notification errors with retries
     */
    async handleNotificationError(notification, error) {
        notification.attempts++;
        notification.last_error = error.message;
        notification.updated_at_utc = new Date().toISOString();

        if (notification.attempts >= this.config.max_retries) {
            notification.status = 'failed';
            this.logAuditEvent('notification_failed', {
                notification_id: notification.id,
                attempts: notification.attempts,
                error: error.message
            });
        } else {
            notification.status = 'retrying';
            const delay = this.config.retry_delays[notification.attempts - 1];
            
            setTimeout(async () => {
                await this.processNotification(notification);
            }, delay);
        }

        this.notifications.set(notification.idempotency_key, notification);
    }

    /**
     * Handle email bounce
     */
    async handleEmailBounce(email, bounceType, reason) {
        const customer = await this.getCustomerByEmail(email);
        if (!customer) return;

        if (bounceType === 'hard') {
            customer.email_status = 'invalid';
            await this.addToSuppression('email', email, 'hard_bounce');
        } else if (bounceType === 'soft') {
            customer.email_status = 'restricted';
            // Check for repeated soft bounces
            if (await this.hasRepeatedSoftBounces(email, 30)) {
                await this.addToSuppression('email', email, 'repeated_soft_bounce');
            }
        }

        customer.last_bounce_at_utc = new Date().toISOString();
        await this.updateCustomer(customer);

        this.logAuditEvent('email_bounce_handled', {
            email: this.maskAddress(email),
            bounce_type: bounceType,
            reason: reason,
            new_status: customer.email_status
        });
    }

    /**
     * Handle SMS delivery error
     */
    async handleSMSError(phone, errorType, reason) {
        const customer = await this.getCustomerByPhone(phone);
        if (!customer) return;

        if (errorType === 'hard') {
            customer.sms_status = 'invalid';
            await this.addToSuppression('sms', phone, 'hard_bounce');
        } else if (errorType === 'soft') {
            customer.sms_status = 'restricted';
            // Check for repeated errors
            if (await this.hasRepeatedSMSErrors(phone, 30)) {
                await this.addToSuppression('sms', phone, 'repeated_sms_error');
            }
        }

        await this.updateCustomer(customer);

        this.logAuditEvent('sms_error_handled', {
            phone: this.maskAddress(phone),
            error_type: errorType,
            reason: reason,
            new_status: customer.sms_status
        });
    }

    /**
     * Handle Stripe payment failure
     */
    async handleStripePaymentFailure(businessId, event, attemptNo, amount, currency) {
        // Log billing event
        const billingEvent = {
            id: this.generateId(),
            business_id: businessId,
            event: event,
            attempt_no: attemptNo,
            amount: amount,
            currency: currency,
            at_utc: new Date().toISOString()
        };

        this.billingHistory.set(billingEvent.id, billingEvent);

        // Notify business
        await this.triggerNotification('stripe.payment_failed', {
            business_id: businessId,
            attempt_no: attemptNo,
            amount: amount,
            currency: currency,
            event: event
        });

        // Check if this is Day 7 failure
        if (attemptNo >= 3) { // Assuming Day 7 is attempt 3
            await this.pausePremiumFeatures(businessId);
        }

        this.logAuditEvent('stripe_payment_failed', {
            business_id: businessId,
            attempt_no: attemptNo,
            amount: amount,
            event: event
        });
    }

    /**
     * Pause premium features for business
     */
    async pausePremiumFeatures(businessId) {
        const business = await this.getBusiness(businessId);
        if (!business) return;

        business.premium_features_paused = true;
        business.paused_at_utc = new Date().toISOString();
        await this.updateBusiness(business);

        // Send notification
        await this.triggerNotification('premium_features_paused', {
            business_id: businessId
        });

        this.logAuditEvent('premium_features_paused', {
            business_id: businessId
        });
    }

    /**
     * Resume premium features
     */
    async resumePremiumFeatures(businessId) {
        const business = await this.getBusiness(businessId);
        if (!business) return;

        business.premium_features_paused = false;
        business.resumed_at_utc = new Date().toISOString();
        await this.updateBusiness(business);

        // Send confirmation
        await this.triggerNotification('premium_features_resumed', {
            business_id: businessId
        });

        this.logAuditEvent('premium_features_resumed', {
            business_id: businessId
        });
    }

    /**
     * Utility methods
     */
    generateSecureToken() {
        return 'wlo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    }

    generateSecureOfferLink(token) {
        return `${window.location.origin}/waiting-list-offer/${token}`;
    }

    generateIdempotencyKey(eventType, data) {
        const key = `${eventType}_${data.business_id || 'none'}_${data.customer_id || 'none'}_${data.booking_id || 'none'}`;
        return this.hashString(key);
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    maskAddress(address) {
        if (!address) return '••••••••••';
        if (address.includes('@')) {
            const [local, domain] = address.split('@');
            return local.charAt(0) + '•••' + local.slice(-1) + '@' + domain;
        }
        return '••••••••••' + address.slice(-4);
    }

    shortenUrl(url) {
        // In production, use a URL shortener service
        return url.replace(/^https?:\/\//, '');
    }

    formatLocalDateTime(utcString) {
        const date = new Date(utcString);
        return date.toLocaleString('en-GB', {
            timeZone: this.config.timezone,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    isQuietHours() {
        const now = new Date();
        const londonTime = new Date(now.toLocaleString('en-US', { timeZone: this.config.timezone }));
        const hour = londonTime.getHours();
        return hour >= this.config.quiet_hours_start || hour < this.config.quiet_hours_end;
    }

    isUrgentNotification(eventType) {
        const urgentTypes = ['booking.create', 'booking.cancel', 'stripe.payment_failed'];
        return urgentTypes.includes(eventType);
    }

    isSuppressed(channel, address) {
        const key = `${channel}_${this.hashString(address)}`;
        return this.suppressionList.has(key);
    }

    isBounced(channel, address) {
        // Check bounce status in customer record
        return false; // Simplified for demo
    }

    async addToSuppression(channel, address, reason) {
        const key = `${channel}_${this.hashString(address)}`;
        this.suppressionList.set(key, {
            channel,
            address: this.hashString(address),
            reason,
            created_at_utc: new Date().toISOString()
        });
    }

    async scheduleForMorning(notification) {
        // Schedule for 08:00 local time
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const morning = new Date(tomorrow.setHours(this.config.quiet_hours_end, 0, 0, 0));
        
        const delay = morning.getTime() - now.getTime();
        
        setTimeout(async () => {
            await this.processNotification(notification);
        }, delay);

        this.logAuditEvent('notification_scheduled', {
            notification_id: notification.id,
            scheduled_for: morning.toISOString()
        });
    }

    /**
     * Mock data methods (replace with actual database calls)
     */
    async getCustomer(customerId) {
        return {
            id: customerId,
            first_name: 'John',
            email: 'customer@example.com',
            phone: '+447700900000',
            email_status: 'valid',
            sms_status: 'verified'
        };
    }

    async getBusiness(businessId) {
        return {
            id: businessId,
            name: 'Royal Hair Studio'
        };
    }

    async getService(serviceId) {
        return {
            id: serviceId,
            name: 'Hair Cut'
        };
    }

    async getWaitingListConsent(customerId, businessId, serviceId) {
        return true; // Simplified for demo
    }

    async getNotificationRecipients(notification) {
        // Simplified for demo
        return [
            { channel: 'email', address: 'customer@example.com', type: 'customer' },
            { channel: 'sms', address: '+447700900000', type: 'customer' }
        ];
    }

    getEmailSubject(eventType, data) {
        const subjects = {
            'booking.create': 'Booking Confirmation',
            'booking.cancel': 'Booking Cancelled',
            'waitinglist.slot.opened': 'A slot opened!',
            'stripe.payment_failed': 'Payment Issue - Action Required'
        };
        return subjects[eventType] || 'Notification';
    }

    getEmailTemplate(eventType) {
        return eventType.replace('.', '-');
    }

    getSMSMessage(eventType, data) {
        const messages = {
            'booking.create': 'Booking confirmed! Check your email for details.',
            'booking.cancel': 'Your booking has been cancelled.',
            'waitinglist.slot.opened': 'Slot available! Book now: [link]'
        };
        return messages[eventType] || 'Notification from BlkPages';
    }

    async sendEmailNotification(params) {
        console.log('Email sent:', params);
        // In production, integrate with email service
    }

    async sendSMSNotification(params) {
        console.log('SMS sent:', params);
        // In production, integrate with SMS service
    }

    async createBookingFromOffer(offer) {
        return {
            id: this.generateId(),
            customer_id: offer.customer_id,
            business_id: offer.business_id,
            service_id: offer.service_id,
            created_at_utc: new Date().toISOString()
        };
    }

    async cancelOtherPendingOffers(businessId, serviceId, currentOfferId) {
        // Cancel other pending offers for this slot
        for (const [id, offer] of this.waitingListOffers) {
            if (offer.business_id === businessId && 
                offer.service_id === serviceId && 
                offer.id !== currentOfferId && 
                offer.offer_status === 'pending') {
                offer.offer_status = 'cancelled';
                offer.updated_at_utc = new Date().toISOString();
                this.waitingListOffers.set(id, offer);
            }
        }
    }

    async triggerNextInWaitingList(businessId, serviceId) {
        // Find next customer in waiting list
        // This would query the actual waiting list
        console.log('Triggering next in waiting list for business:', businessId, 'service:', serviceId);
    }

    findOfferByToken(token) {
        for (const offer of this.waitingListOffers.values()) {
            if (offer.offer_token === token) {
                return offer;
            }
        }
        return null;
    }

    generateId() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    logAuditEvent(eventType, data) {
        const auditEntry = {
            id: this.generateId(),
            event_type: eventType,
            timestamp: new Date().toISOString(),
            data: data
        };
        this.auditLogs.push(auditEntry);
        console.log('Audit Log:', auditEntry);
    }
}

// Initialize global notification automation system
window.notificationAutomationSystem = new NotificationAutomationSystem();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationAutomationSystem;
}
