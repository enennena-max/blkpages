/**
 * Loyalty "Almost Unlocked" SMS Trigger Logic
 * 
 * This module handles SMS notifications for customers who are close to unlocking
 * loyalty rewards. It mirrors the email logic but sends SMS instead.
 * 
 * System Rules:
 * - SMS only sent if business has SMS add-on enabled
 * - Max 1 reminder SMS per loyalty programme per customer
 * - Send alongside email (email = default, SMS optional)
 * - No replies accepted
 * - Character limit: 160 characters
 */

class LoyaltyAlmostUnlockedSMS {
    constructor() {
        this.smsTemplates = {
            visitBased: "You're 1 visit away from your reward at {{businessName}}! Book now to unlock your {{rewardName}}. This number does not accept replies.",
            spendBased: "You've spent £{{spendSoFar}} of £{{targetSpend}} at {{businessName}}. Just a little more to unlock your £{{reward}} reward. Book now! No replies.",
            timeLimited: "Almost there! 1 more visit at {{businessName}} before {{date}} to unlock your {{rewardName}}. Don't miss it! This number does not accept replies."
        };
        
        this.characterLimit = 160;
        this.smsEnabled = false; // Will be set based on business settings
    }

    /**
     * Check if SMS should be sent for a customer
     * @param {Object} customer - Customer data
     * @param {Object} business - Business data
     * @param {Object} loyaltyProgramme - Loyalty programme data
     * @returns {boolean} - Whether SMS should be sent
     */
    shouldSendSMS(customer, business, loyaltyProgramme) {
        // Check if business has SMS add-on enabled
        if (!business.smsEnabled) {
            console.log('SMS not enabled for business:', business.name);
            return false;
        }

        // Check if customer has already received SMS for this programme
        if (this.hasReceivedSMS(customer.id, loyaltyProgramme.id)) {
            console.log('Customer already received SMS for this programme:', customer.id, loyaltyProgramme.id);
            return false;
        }

        // Check if reward is already unlocked or used
        if (loyaltyProgramme.rewardUnlocked || loyaltyProgramme.rewardUsed) {
            console.log('Reward already unlocked or used:', loyaltyProgramme.id);
            return false;
        }

        // Check if business has disabled loyalty or cancelled programme
        if (!business.loyaltyEnabled || loyaltyProgramme.cancelled) {
            console.log('Loyalty disabled or programme cancelled:', business.name, loyaltyProgramme.id);
            return false;
        }

        return true;
    }

    /**
     * Check if customer has already received SMS for this programme
     * @param {string} customerId - Customer ID
     * @param {string} programmeId - Programme ID
     * @returns {boolean} - Whether SMS was already sent
     */
    hasReceivedSMS(customerId, programmeId) {
        const smsHistory = this.getSMSHistory(customerId, programmeId);
        return smsHistory.length > 0;
    }

    /**
     * Get SMS history for customer and programme
     * @param {string} customerId - Customer ID
     * @param {string} programmeId - Programme ID
     * @returns {Array} - SMS history
     */
    getSMSHistory(customerId, programmeId) {
        // In a real implementation, this would query the database
        // For now, return empty array (no SMS sent yet)
        return [];
    }

    /**
     * Determine trigger type and send appropriate SMS
     * @param {Object} customer - Customer data
     * @param {Object} business - Business data
     * @param {Object} loyaltyProgramme - Loyalty programme data
     */
    processAlmostUnlockedSMS(customer, business, loyaltyProgramme) {
        if (!this.shouldSendSMS(customer, business, loyaltyProgramme)) {
            return;
        }

        let triggerType = null;
        let smsMessage = null;

        // Check visit-based trigger
        if (this.isVisitBasedTrigger(loyaltyProgramme)) {
            triggerType = 'visitBased';
            smsMessage = this.buildVisitBasedSMS(customer, business, loyaltyProgramme);
        }
        // Check spend-based trigger
        else if (this.isSpendBasedTrigger(loyaltyProgramme)) {
            triggerType = 'spendBased';
            smsMessage = this.buildSpendBasedSMS(customer, business, loyaltyProgramme);
        }
        // Check time-limited trigger
        else if (this.isTimeLimitedTrigger(loyaltyProgramme)) {
            triggerType = 'timeLimited';
            smsMessage = this.buildTimeLimitedSMS(customer, business, loyaltyProgramme);
        }

        if (smsMessage && this.validateSMSMessage(smsMessage)) {
            this.sendSMS(customer.phone, smsMessage, business, loyaltyProgramme);
            this.recordSMSSent(customer.id, loyaltyProgramme.id, triggerType);
        }
    }

    /**
     * Check if visit-based trigger conditions are met
     * @param {Object} loyaltyProgramme - Loyalty programme data
     * @returns {boolean} - Whether visit-based trigger is met
     */
    isVisitBasedTrigger(loyaltyProgramme) {
        return loyaltyProgramme.type === 'visit' && 
               loyaltyProgramme.currentVisits === (loyaltyProgramme.targetVisits - 1);
    }

    /**
     * Check if spend-based trigger conditions are met
     * @param {Object} loyaltyProgramme - Loyalty programme data
     * @returns {boolean} - Whether spend-based trigger is met
     */
    isSpendBasedTrigger(loyaltyProgramme) {
        const spendPercentage = (loyaltyProgramme.currentSpend / loyaltyProgramme.targetSpend) * 100;
        return loyaltyProgramme.type === 'spend' && spendPercentage >= 80;
    }

    /**
     * Check if time-limited trigger conditions are met
     * @param {Object} loyaltyProgramme - Loyalty programme data
     * @returns {boolean} - Whether time-limited trigger is met
     */
    isTimeLimitedTrigger(loyaltyProgramme) {
        const isOneVisitAway = loyaltyProgramme.currentVisits === (loyaltyProgramme.targetVisits - 1);
        const isBeforeEndDate = new Date() < new Date(loyaltyProgramme.endDate);
        return loyaltyProgramme.type === 'timeLimited' && isOneVisitAway && isBeforeEndDate;
    }

    /**
     * Build visit-based SMS message
     * @param {Object} customer - Customer data
     * @param {Object} business - Business data
     * @param {Object} loyaltyProgramme - Loyalty programme data
     * @returns {string} - SMS message
     */
    buildVisitBasedSMS(customer, business, loyaltyProgramme) {
        return this.smsTemplates.visitBased
            .replace('{{businessName}}', business.name)
            .replace('{{rewardName}}', loyaltyProgramme.rewardName);
    }

    /**
     * Build spend-based SMS message
     * @param {Object} customer - Customer data
     * @param {Object} business - Business data
     * @param {Object} loyaltyProgramme - Loyalty programme data
     * @returns {string} - SMS message
     */
    buildSpendBasedSMS(customer, business, loyaltyProgramme) {
        return this.smsTemplates.spendBased
            .replace('{{businessName}}', business.name)
            .replace('{{spendSoFar}}', loyaltyProgramme.currentSpend)
            .replace('{{targetSpend}}', loyaltyProgramme.targetSpend)
            .replace('{{reward}}', loyaltyProgramme.rewardValue);
    }

    /**
     * Build time-limited SMS message
     * @param {Object} customer - Customer data
     * @param {Object} business - Business data
     * @param {Object} loyaltyProgramme - Loyalty programme data
     * @returns {string} - SMS message
     */
    buildTimeLimitedSMS(customer, business, loyaltyProgramme) {
        const endDate = new Date(loyaltyProgramme.endDate).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short'
        });
        
        return this.smsTemplates.timeLimited
            .replace('{{businessName}}', business.name)
            .replace('{{date}}', endDate)
            .replace('{{rewardName}}', loyaltyProgramme.rewardName);
    }

    /**
     * Validate SMS message length
     * @param {string} message - SMS message
     * @returns {boolean} - Whether message is valid
     */
    validateSMSMessage(message) {
        return message.length <= this.characterLimit;
    }

    /**
     * Send SMS message
     * @param {string} phoneNumber - Customer phone number
     * @param {string} message - SMS message
     * @param {Object} business - Business data
     * @param {Object} loyaltyProgramme - Loyalty programme data
     */
    sendSMS(phoneNumber, message, business, loyaltyProgramme) {
        console.log('Sending SMS to:', phoneNumber);
        console.log('Message:', message);
        console.log('Business:', business.name);
        console.log('Programme:', loyaltyProgramme.id);
        
        // In a real implementation, this would integrate with SMS service provider
        // For now, just log the SMS details
        this.logSMSDetails(phoneNumber, message, business, loyaltyProgramme);
    }

    /**
     * Log SMS details for debugging
     * @param {string} phoneNumber - Customer phone number
     * @param {string} message - SMS message
     * @param {Object} business - Business data
     * @param {Object} loyaltyProgramme - Loyalty programme data
     */
    logSMSDetails(phoneNumber, message, business, loyaltyProgramme) {
        const smsDetails = {
            timestamp: new Date().toISOString(),
            phoneNumber: phoneNumber,
            message: message,
            businessName: business.name,
            programmeId: loyaltyProgramme.id,
            programmeType: loyaltyProgramme.type,
            characterCount: message.length,
            characterLimit: this.characterLimit
        };
        
        console.log('SMS Details:', smsDetails);
        
        // In a real implementation, this would be stored in the database
        // For now, just log to console
    }

    /**
     * Record that SMS was sent
     * @param {string} customerId - Customer ID
     * @param {string} programmeId - Programme ID
     * @param {string} triggerType - Trigger type
     */
    recordSMSSent(customerId, programmeId, triggerType) {
        const smsRecord = {
            customerId: customerId,
            programmeId: programmeId,
            triggerType: triggerType,
            sentAt: new Date().toISOString()
        };
        
        console.log('SMS Record:', smsRecord);
        
        // In a real implementation, this would be stored in the database
        // For now, just log to console
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoyaltyAlmostUnlockedSMS;
}

// Example usage with dummy data
const smsTrigger = new LoyaltyAlmostUnlockedSMS();

// Dummy data for testing
const dummyCustomer = {
    id: 'customer_123',
    name: 'Sarah Johnson',
    phone: '+44 7123 456789'
};

const dummyBusiness = {
    name: 'Glow Hair',
    smsEnabled: true,
    loyaltyEnabled: true
};

const dummyLoyaltyProgramme = {
    id: 'programme_456',
    type: 'visit',
    currentVisits: 4,
    targetVisits: 5,
    rewardName: 'Free Haircut',
    rewardValue: 45,
    rewardUnlocked: false,
    rewardUsed: false,
    cancelled: false
};

// Test the SMS trigger
console.log('Testing SMS trigger...');
smsTrigger.processAlmostUnlockedSMS(dummyCustomer, dummyBusiness, dummyLoyaltyProgramme);

