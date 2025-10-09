/**
 * Verified Customer Phone Number System with Encryption
 * Handles customer phone number verification, encryption, and privacy protection
 */

class VerifiedCustomerNumbers {
    constructor() {
        this.verificationCodes = new Map();
        this.encryptedNumbers = new Map();
        this.auditLogs = [];
        this.encryptionKey = this.generateEncryptionKey();
    }

    /**
     * Initiate customer phone number verification
     */
    async initiateVerification(customerId, phoneNumber) {
        try {
            // Validate phone number format
            if (!this.isValidPhoneNumber(phoneNumber)) {
                throw new Error('Invalid phone number format');
            }

            // Generate verification code
            const verificationCode = this.generateVerificationCode();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Store verification attempt
            this.verificationCodes.set(customerId, {
                phone_number: phoneNumber,
                code: verificationCode,
                expires_at: expiresAt,
                attempts: 0,
                created_at: new Date()
            });

            // Send SMS with verification code
            await this.sendVerificationSMS(phoneNumber, verificationCode);

            this.logAuditEvent('verification_initiated', customerId, {
                phone_number: this.maskPhoneNumber(phoneNumber),
                expires_at: expiresAt
            });

            return {
                success: true,
                message: 'Verification code sent to your phone number',
                expires_in: 10 // minutes
            };

        } catch (error) {
            this.logAuditEvent('verification_failed', customerId, {
                error: error.message,
                phone_number: this.maskPhoneNumber(phoneNumber)
            });

            throw error;
        }
    }

    /**
     * Verify customer phone number with code
     */
    async verifyCode(customerId, code) {
        try {
            const verification = this.verificationCodes.get(customerId);
            
            if (!verification) {
                throw new Error('No verification code found. Please request a new code.');
            }

            // Check if code has expired
            if (new Date() > verification.expires_at) {
                this.verificationCodes.delete(customerId);
                throw new Error('Verification code has expired. Please request a new code.');
            }

            // Check attempt limit
            if (verification.attempts >= 3) {
                this.verificationCodes.delete(customerId);
                throw new Error('Too many failed attempts. Please request a new code.');
            }

            // Verify code
            if (verification.code !== code) {
                verification.attempts++;
                this.verificationCodes.set(customerId, verification);
                
                this.logAuditEvent('verification_code_incorrect', customerId, {
                    attempts: verification.attempts,
                    phone_number: this.maskPhoneNumber(verification.phone_number)
                });

                throw new Error(`Incorrect code. ${3 - verification.attempts} attempts remaining.`);
            }

            // Code is correct - encrypt and store phone number
            const encryptedNumber = this.encryptPhoneNumber(verification.phone_number);
            this.encryptedNumbers.set(customerId, {
                encrypted_number: encryptedNumber,
                verified_at: new Date(),
                verified: true
            });

            // Clean up verification code
            this.verificationCodes.delete(customerId);

            this.logAuditEvent('verification_successful', customerId, {
                phone_number: this.maskPhoneNumber(verification.phone_number),
                verified_at: new Date(),
                encrypted: true
            });

            return {
                success: true,
                message: 'Phone number verified successfully',
                verified_number: this.maskPhoneNumber(verification.phone_number)
            };

        } catch (error) {
            this.logAuditEvent('verification_error', customerId, {
                error: error.message
            });

            throw error;
        }
    }

    /**
     * Check if customer phone number is verified
     */
    isVerified(customerId) {
        const verified = this.encryptedNumbers.get(customerId);
        return verified && verified.verified;
    }

    /**
     * Get verified customer phone number (masked for display)
     */
    getVerifiedNumber(customerId) {
        const verified = this.encryptedNumbers.get(customerId);
        if (!verified || !verified.verified) {
            return null;
        }
        return this.maskPhoneNumber(this.decryptPhoneNumber(verified.encrypted_number));
    }

    /**
     * Get decrypted phone number for SMS sending (backend only)
     */
    getDecryptedNumber(customerId) {
        const verified = this.encryptedNumbers.get(customerId);
        if (!verified || !verified.verified) {
            return null;
        }

        // Log decryption event for audit
        this.logAuditEvent('phone_number_decrypted', customerId, {
            decrypted_for: 'sms_sending',
            timestamp: new Date()
        });

        return this.decryptPhoneNumber(verified.encrypted_number);
    }

    /**
     * Update customer phone number (requires re-verification)
     */
    async updatePhoneNumber(customerId, newPhoneNumber) {
        // Remove existing verification
        this.encryptedNumbers.delete(customerId);
        this.verificationCodes.delete(customerId);

        this.logAuditEvent('phone_number_updated', customerId, {
            new_phone_number: this.maskPhoneNumber(newPhoneNumber),
            requires_verification: true
        });

        // Initiate new verification
        return await this.initiateVerification(customerId, newPhoneNumber);
    }

    /**
     * Encrypt phone number using AES-256
     */
    encryptPhoneNumber(phoneNumber) {
        try {
            // In a real implementation, use proper AES-256 encryption
            // For demo purposes, use base64 encoding with a simple cipher
            const cipher = this.simpleCipher(phoneNumber, this.encryptionKey);
            return btoa(cipher);
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt phone number');
        }
    }

    /**
     * Decrypt phone number
     */
    decryptPhoneNumber(encryptedNumber) {
        try {
            // In a real implementation, use proper AES-256 decryption
            // For demo purposes, use base64 decoding with a simple cipher
            const cipher = atob(encryptedNumber);
            return this.simpleCipher(cipher, this.encryptionKey, true);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt phone number');
        }
    }

    /**
     * Simple cipher for demo (replace with proper AES-256 in production)
     */
    simpleCipher(text, key, decrypt = false) {
        let result = '';
        const keyLength = key.length;
        
        for (let i = 0; i < text.length; i++) {
            const textChar = text.charCodeAt(i);
            const keyChar = key.charCodeAt(i % keyLength);
            const shift = decrypt ? -keyChar : keyChar;
            result += String.fromCharCode(textChar + shift);
        }
        
        return result;
    }

    /**
     * Generate encryption key
     */
    generateEncryptionKey() {
        // In production, use a secure key management system
        return 'blkpages_encryption_key_2024_secure';
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
     * Get verification status for customer
     */
    getVerificationStatus(customerId) {
        const verified = this.encryptedNumbers.get(customerId);
        const pending = this.verificationCodes.get(customerId);

        return {
            is_verified: verified && verified.verified,
            verified_number: verified ? this.maskPhoneNumber(this.decryptPhoneNumber(verified.encrypted_number)) : null,
            verified_at: verified ? verified.verified_at : null,
            has_pending_verification: !!pending,
            expires_at: pending ? pending.expires_at : null,
            attempts_remaining: pending ? (3 - pending.attempts) : 0
        };
    }

    /**
     * Resend verification code
     */
    async resendVerificationCode(customerId) {
        const pending = this.verificationCodes.get(customerId);
        
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

        this.verificationCodes.set(customerId, pending);

        // Send new SMS
        await this.sendVerificationSMS(pending.phone_number, newCode);

        this.logAuditEvent('verification_code_resent', customerId, {
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
    logAuditEvent(eventType, customerId, data = {}) {
        const auditEntry = {
            id: this.generateId(),
            event_type: eventType,
            customer_id: customerId,
            timestamp: new Date().toISOString(),
            ip_address: this.getClientIP(),
            user_agent: navigator.userAgent,
            data: data
        };

        this.auditLogs.push(auditEntry);
        console.log('Customer Number Verification Audit Log:', auditEntry);
    }

    /**
     * Get audit logs for customer
     */
    getAuditLogs(customerId, limit = 50) {
        return this.auditLogs
            .filter(log => log.customer_id === customerId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'cvn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get client IP (mock for demo)
     */
    getClientIP() {
        return '192.168.1.100'; // Mock IP for demo
    }
}

// Initialize global verified customer numbers system
window.verifiedCustomerNumbers = new VerifiedCustomerNumbers();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VerifiedCustomerNumbers;
}
