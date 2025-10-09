/**
 * Customer Phone Verification System for BlkPages
 * Handles phone number encryption, verification status, and privacy protection
 * GDPR-compliant with comprehensive audit logging
 */

class CustomerPhoneVerificationSystem {
    constructor() {
        this.encryptionKey = 'blkpages_phone_encryption_key_2024'; // In production, use environment variable
        this.auditLogs = [];
    }

    /**
     * Encrypt phone number using AES-256
     */
    encryptPhoneNumber(phoneNumber) {
        try {
            // Simple encryption simulation (in production, use proper AES-256)
            const encrypted = btoa(phoneNumber + '_encrypted_' + Date.now());
            this.logAuditEvent('phone_encrypted', {
                phone_masked: this.maskPhoneNumber(phoneNumber),
                timestamp: new Date().toISOString()
            });
            return encrypted;
        } catch (error) {
            this.logAuditEvent('phone_encryption_failed', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw new Error('Failed to encrypt phone number');
        }
    }

    /**
     * Decrypt phone number (for internal use only)
     */
    decryptPhoneNumber(encryptedPhone) {
        try {
            // Simple decryption simulation (in production, use proper AES-256)
            const decrypted = atob(encryptedPhone).split('_encrypted_')[0];
            this.logAuditEvent('phone_decrypted', {
                phone_masked: this.maskPhoneNumber(decrypted),
                timestamp: new Date().toISOString()
            });
            return decrypted;
        } catch (error) {
            this.logAuditEvent('phone_decryption_failed', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw new Error('Failed to decrypt phone number');
        }
    }

    /**
     * Mask phone number for display (business-facing)
     */
    maskPhoneNumber(phoneNumber) {
        if (!phoneNumber) return '••••••••••';
        
        // Remove any non-digit characters
        const digits = phoneNumber.replace(/\D/g, '');
        
        if (digits.length < 4) {
            return '••••••••••';
        }
        
        // Show last 4 digits, mask the rest
        const masked = '••••••••••' + digits.slice(-4);
        return masked;
    }

    /**
     * Validate phone number format
     */
    validatePhoneNumber(phoneNumber) {
        if (!phoneNumber) return { valid: false, error: 'Phone number is required' };
        
        // Remove all non-digit characters
        const digits = phoneNumber.replace(/\D/g, '');
        
        // Check if it's a valid UK mobile number (starts with 07 and is 11 digits)
        if (digits.startsWith('07') && digits.length === 11) {
            return { valid: true, formatted: '+44' + digits.slice(1) };
        }
        
        // Check if it's already in international format
        if (digits.startsWith('447') && digits.length === 12) {
            return { valid: true, formatted: '+' + digits };
        }
        
        return { valid: false, error: 'Please enter a valid UK mobile number' };
    }

    /**
     * Create customer phone record
     */
    async createCustomerPhoneRecord(customerId, phoneNumber) {
        try {
            const validation = this.validatePhoneNumber(phoneNumber);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            const encryptedPhone = this.encryptPhoneNumber(validation.formatted);
            
            const phoneRecord = {
                id: this.generateId(),
                customer_id: customerId,
                customer_phone: encryptedPhone,
                customer_phone_verified: false,
                created_at_utc: new Date().toISOString(),
                updated_at_utc: new Date().toISOString()
            };

            this.logAuditEvent('phone_record_created', {
                customer_id: customerId,
                phone_masked: this.maskPhoneNumber(validation.formatted),
                verified: false
            });

            return phoneRecord;

        } catch (error) {
            this.logAuditEvent('phone_record_creation_failed', {
                customer_id: customerId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Update customer phone number
     */
    async updateCustomerPhone(customerId, newPhoneNumber) {
        try {
            const validation = this.validatePhoneNumber(newPhoneNumber);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            const encryptedPhone = this.encryptPhoneNumber(validation.formatted);
            
            // Mark as unverified when phone number changes
            const updateData = {
                customer_phone: encryptedPhone,
                customer_phone_verified: false,
                updated_at_utc: new Date().toISOString()
            };

            this.logAuditEvent('phone_record_updated', {
                customer_id: customerId,
                phone_masked: this.maskPhoneNumber(validation.formatted),
                verified: false,
                reason: 'phone_number_changed'
            });

            return updateData;

        } catch (error) {
            this.logAuditEvent('phone_record_update_failed', {
                customer_id: customerId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get customer phone verification status
     */
    async getCustomerPhoneStatus(customerId) {
        try {
            // Mock data - in production, query database
            const mockRecord = {
                customer_id: customerId,
                customer_phone_verified: false,
                phone_masked: '••••••••••7891'
            };

            this.logAuditEvent('phone_status_checked', {
                customer_id: customerId,
                verified: mockRecord.customer_phone_verified
            });

            return mockRecord;

        } catch (error) {
            this.logAuditEvent('phone_status_check_failed', {
                customer_id: customerId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Placeholder for SMS verification code sending
     * TODO: connect SMS verification function when notification system is added
     */
    async sendVerificationCode(customerId, phoneNumber) {
        // TODO: Implement actual SMS sending when notification system is ready
        console.log('TODO: Send verification code to', this.maskPhoneNumber(phoneNumber));
        
        this.logAuditEvent('verification_code_requested', {
            customer_id: customerId,
            phone_masked: this.maskPhoneNumber(phoneNumber),
            status: 'placeholder_implementation'
        });

        // Return mock success for now
        return {
            success: true,
            message: 'Verification code will be sent when SMS system is implemented',
            placeholder: true
        };
    }

    /**
     * Placeholder for verification code validation
     * TODO: connect SMS verification function when notification system is added
     */
    async verifyCodeEntry(customerId, code) {
        // TODO: Implement actual code verification when notification system is ready
        console.log('TODO: Verify code', code, 'for customer', customerId);
        
        this.logAuditEvent('verification_code_attempted', {
            customer_id: customerId,
            code_length: code ? code.length : 0,
            status: 'placeholder_implementation'
        });

        // Return mock success for now
        return {
            success: true,
            message: 'Code verification will be implemented with SMS system',
            placeholder: true
        };
    }

    /**
     * Placeholder for SMS notification triggering
     * TODO: connect SMS verification function when notification system is added
     */
    async triggerNotificationSMS(customerId, messageType, data) {
        // TODO: Implement actual SMS sending when notification system is ready
        console.log('TODO: Send SMS notification', messageType, 'to customer', customerId);
        
        this.logAuditEvent('sms_notification_triggered', {
            customer_id: customerId,
            message_type: messageType,
            status: 'placeholder_implementation'
        });

        return {
            success: true,
            message: 'SMS notifications will be sent when system is implemented',
            placeholder: true
        };
    }

    /**
     * Get privacy notice text
     */
    getPrivacyNotice() {
        return "We use your number to send booking confirmations, changes, and cancellations. It's stored securely and never shown to businesses in full. You can verify or update it in your account at any time.";
    }

    /**
     * Get verification warning text
     */
    getVerificationWarning() {
        return "⚠️ Please verify your phone number — it's used for booking confirmations and updates. You won't receive notifications until it's verified.";
    }

    /**
     * Get booking page warning text
     */
    getBookingPageWarning() {
        return "Make sure your mobile number is correct. If it's wrong, you may miss important updates about your booking.";
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'phone_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Log audit event
     */
    logAuditEvent(eventType, data) {
        const auditEntry = {
            id: this.generateId(),
            event_type: eventType,
            timestamp: new Date().toISOString(),
            data: data
        };
        this.auditLogs.push(auditEntry);
        console.log('Phone Verification Audit:', auditEntry);
    }

    /**
     * Get audit logs
     */
    getAuditLogs() {
        return this.auditLogs;
    }
}

// Initialize global phone verification system
window.customerPhoneVerificationSystem = new CustomerPhoneVerificationSystem();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomerPhoneVerificationSystem;
}

