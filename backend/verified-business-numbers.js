/**
 * Verified Business Contact Number System
 * Handles business phone number verification with SMS codes
 */

class VerifiedBusinessNumbers {
    constructor() {
        this.verificationCodes = new Map();
        this.verifiedNumbers = new Map();
        this.auditLogs = [];
    }

    /**
     * Initiate business phone number verification
     */
    async initiateVerification(businessId, phoneNumber) {
        try {
            // Validate phone number format
            if (!this.isValidPhoneNumber(phoneNumber)) {
                throw new Error('Invalid phone number format');
            }

            // Generate verification code
            const verificationCode = this.generateVerificationCode();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Store verification attempt
            this.verificationCodes.set(businessId, {
                phone_number: phoneNumber,
                code: verificationCode,
                expires_at: expiresAt,
                attempts: 0,
                created_at: new Date()
            });

            // Send SMS with verification code
            await this.sendVerificationSMS(phoneNumber, verificationCode);

            this.logAuditEvent('verification_initiated', businessId, {
                phone_number: this.maskPhoneNumber(phoneNumber),
                expires_at: expiresAt
            });

            return {
                success: true,
                message: 'Verification code sent to your business phone number',
                expires_in: 10 // minutes
            };

        } catch (error) {
            this.logAuditEvent('verification_failed', businessId, {
                error: error.message,
                phone_number: this.maskPhoneNumber(phoneNumber)
            });

            throw error;
        }
    }

    /**
     * Verify business phone number with code
     */
    async verifyCode(businessId, code) {
        try {
            const verification = this.verificationCodes.get(businessId);
            
            if (!verification) {
                throw new Error('No verification code found. Please request a new code.');
            }

            // Check if code has expired
            if (new Date() > verification.expires_at) {
                this.verificationCodes.delete(businessId);
                throw new Error('Verification code has expired. Please request a new code.');
            }

            // Check attempt limit
            if (verification.attempts >= 3) {
                this.verificationCodes.delete(businessId);
                throw new Error('Too many failed attempts. Please request a new code.');
            }

            // Verify code
            if (verification.code !== code) {
                verification.attempts++;
                this.verificationCodes.set(businessId, verification);
                
                this.logAuditEvent('verification_code_incorrect', businessId, {
                    attempts: verification.attempts,
                    phone_number: this.maskPhoneNumber(verification.phone_number)
                });

                throw new Error(`Incorrect code. ${3 - verification.attempts} attempts remaining.`);
            }

            // Code is correct - mark as verified
            this.verifiedNumbers.set(businessId, {
                phone_number: verification.phone_number,
                verified_at: new Date(),
                verified: true
            });

            // Clean up verification code
            this.verificationCodes.delete(businessId);

            this.logAuditEvent('verification_successful', businessId, {
                phone_number: this.maskPhoneNumber(verification.phone_number),
                verified_at: new Date()
            });

            return {
                success: true,
                message: 'Phone number verified successfully',
                verified_number: this.maskPhoneNumber(verification.phone_number)
            };

        } catch (error) {
            this.logAuditEvent('verification_error', businessId, {
                error: error.message
            });

            throw error;
        }
    }

    /**
     * Check if business phone number is verified
     */
    isVerified(businessId) {
        const verified = this.verifiedNumbers.get(businessId);
        return verified && verified.verified;
    }

    /**
     * Get verified business phone number (masked)
     */
    getVerifiedNumber(businessId) {
        const verified = this.verifiedNumbers.get(businessId);
        if (!verified || !verified.verified) {
            return null;
        }
        return this.maskPhoneNumber(verified.phone_number);
    }

    /**
     * Update business phone number (requires re-verification)
     */
    async updatePhoneNumber(businessId, newPhoneNumber) {
        // Remove existing verification
        this.verifiedNumbers.delete(businessId);
        this.verificationCodes.delete(businessId);

        this.logAuditEvent('phone_number_updated', businessId, {
            new_phone_number: this.maskPhoneNumber(newPhoneNumber),
            requires_verification: true
        });

        // Initiate new verification
        return await this.initiateVerification(businessId, newPhoneNumber);
    }

    /**
     * Send verification SMS
     */
    async sendVerificationSMS(phoneNumber, code) {
        const message = `BlkPages verification code: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`;
        
        // In a real implementation, this would integrate with SMS provider (Twilio, etc.)
        console.log(`SMS sent to ${this.maskPhoneNumber(phoneNumber)}: ${message}`);
        
        // Simulate SMS sending delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            success: true,
            message_id: this.generateMessageId(),
            sent_at: new Date()
        };
    }

    /**
     * Generate 6-digit verification code
     */
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Generate message ID
     */
    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Validate phone number format
     */
    isValidPhoneNumber(phoneNumber) {
        // UK phone number validation
        const ukPhoneRegex = /^(\+44|0)[1-9]\d{8,9}$/;
        return ukPhoneRegex.test(phoneNumber.replace(/\s/g, ''));
    }

    /**
     * Mask phone number for display
     */
    maskPhoneNumber(phoneNumber) {
        if (!phoneNumber) return '••••••••••';
        
        const cleaned = phoneNumber.replace(/\s/g, '');
        if (cleaned.length < 4) return '••••••••••';
        
        const lastFour = cleaned.slice(-4);
        const masked = '•'.repeat(cleaned.length - 4) + lastFour;
        
        return masked;
    }

    /**
     * Get verification status for business
     */
    getVerificationStatus(businessId) {
        const verified = this.verifiedNumbers.get(businessId);
        const pending = this.verificationCodes.get(businessId);

        return {
            is_verified: verified && verified.verified,
            verified_number: verified ? this.maskPhoneNumber(verified.phone_number) : null,
            verified_at: verified ? verified.verified_at : null,
            has_pending_verification: !!pending,
            expires_at: pending ? pending.expires_at : null,
            attempts_remaining: pending ? (3 - pending.attempts) : 0
        };
    }

    /**
     * Resend verification code
     */
    async resendVerificationCode(businessId) {
        const pending = this.verificationCodes.get(businessId);
        
        if (!pending) {
            throw new Error('No pending verification found');
        }

        // Check if we can resend (max 3 resends per hour)
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        if (pending.created_at > oneHourAgo && pending.resends >= 3) {
            throw new Error('Too many resend attempts. Please wait before requesting another code.');
        }

        // Generate new code
        const newCode = this.generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Update verification
        pending.code = newCode;
        pending.expires_at = expiresAt;
        pending.resends = (pending.resends || 0) + 1;
        pending.last_resend = new Date();

        this.verificationCodes.set(businessId, pending);

        // Send new SMS
        await this.sendVerificationSMS(pending.phone_number, newCode);

        this.logAuditEvent('verification_code_resent', businessId, {
            phone_number: this.maskPhoneNumber(pending.phone_number),
            resend_count: pending.resends
        });

        return {
            success: true,
            message: 'New verification code sent',
            expires_in: 10
        };
    }

    /**
     * Log audit event
     */
    logAuditEvent(eventType, businessId, data = {}) {
        const auditEntry = {
            id: this.generateId(),
            event_type: eventType,
            business_id: businessId,
            timestamp: new Date().toISOString(),
            ip_address: this.getClientIP(),
            user_agent: navigator.userAgent,
            data: data
        };

        this.auditLogs.push(auditEntry);
        console.log('Business Number Verification Audit Log:', auditEntry);
    }

    /**
     * Get audit logs for business
     */
    getAuditLogs(businessId, limit = 50) {
        return this.auditLogs
            .filter(log => log.business_id === businessId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'bvn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get client IP (mock for demo)
     */
    getClientIP() {
        return '192.168.1.100'; // Mock IP for demo
    }
}

// Initialize global verified business numbers system
window.verifiedBusinessNumbers = new VerifiedBusinessNumbers();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VerifiedBusinessNumbers;
}
