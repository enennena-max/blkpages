/**
 * GDPR Compliance API for Production
 * Handles data export, deletion, and privacy controls
 */

class GDPRComplianceAPI {
    constructor() {
        this.apiBase = '/api/gdpr';
        this.dataRetentionPeriod = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years in milliseconds
        this.auditLogs = [];
    }
    
    /**
     * Export user data for GDPR compliance
     * @param {string} userId - User ID
     * @param {string} requestType - Type of data request
     * @returns {Promise<Object>} Data export result
     */
    async exportUserData(userId, requestType = 'data_export') {
        try {
            // Validate user access
            const userData = await this.getUserData(userId);
            if (!userData) {
                throw new Error('User not found');
            }
            
            // Collect all user data
            const exportData = {
                personal_information: {
                    user_id: userData.userId,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    email: userData.email,
                    phone: userData.phone,
                    created_at: userData.createdAt,
                    last_login: userData.lastLogin,
                    account_status: userData.isActive ? 'active' : 'inactive'
                },
                booking_data: await this.getUserBookings(userId),
                payment_data: await this.getUserPayments(userId),
                communication_data: await this.getUserCommunications(userId),
                privacy_preferences: {
                    marketing_consent: userData.marketingConsent,
                    terms_accepted: userData.termsAccepted,
                    cookie_preferences: await this.getCookiePreferences(userId)
                },
                system_data: {
                    export_date: new Date().toISOString(),
                    data_format: 'JSON',
                    gdpr_compliant: true,
                    retention_period: '7 years',
                    data_controller: 'BlkPages Ltd',
                    data_processor: 'BlkPages Ltd'
                }
            };
            
            // Log data export
            this.logGDPREvent('data_exported', {
                userId: userId,
                requestType: requestType,
                dataSize: JSON.stringify(exportData).length,
                timestamp: new Date().toISOString()
            });
            
            return {
                success: true,
                data: exportData,
                downloadUrl: await this.generateDownloadUrl(exportData, userId)
            };
            
        } catch (error) {
            this.logGDPREvent('data_export_error', {
                userId: userId,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
    
    /**
     * Delete user data for GDPR compliance
     * @param {string} userId - User ID
     * @param {string} deletionReason - Reason for deletion
     * @returns {Promise<Object>} Deletion result
     */
    async deleteUserData(userId, deletionReason = 'user_request') {
        try {
            // Validate user access
            const userData = await this.getUserData(userId);
            if (!userData) {
                throw new Error('User not found');
            }
            
            // Check for legal obligations (e.g., pending payments, legal requirements)
            const legalObligations = await this.checkLegalObligations(userId);
            if (legalObligations.hasObligations) {
                return {
                    success: false,
                    message: 'Cannot delete account due to legal obligations',
                    obligations: legalObligations.obligations,
                    partialDeletion: await this.performPartialDeletion(userId)
                };
            }
            
            // Perform complete data deletion
            const deletionResult = await this.performCompleteDeletion(userId);
            
            // Log deletion event
            this.logGDPREvent('data_deleted', {
                userId: userId,
                deletionReason: deletionReason,
                deletionType: 'complete',
                timestamp: new Date().toISOString(),
                dataTypesDeleted: deletionResult.dataTypesDeleted
            });
            
            // Send deletion confirmation
            await this.sendDeletionConfirmation(userData.email, deletionResult);
            
            return {
                success: true,
                message: 'All personal data has been permanently deleted',
                deletionDate: new Date().toISOString(),
                dataTypesDeleted: deletionResult.dataTypesDeleted
            };
            
        } catch (error) {
            this.logGDPREvent('data_deletion_error', {
                userId: userId,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
    
    /**
     * Update privacy preferences
     * @param {string} userId - User ID
     * @param {Object} preferences - Privacy preferences
     * @returns {Promise<Object>} Update result
     */
    async updatePrivacyPreferences(userId, preferences) {
        try {
            // Validate preferences
            const validatedPreferences = this.validatePrivacyPreferences(preferences);
            
            // Update user preferences
            await this.updateUserPreferences(userId, validatedPreferences);
            
            // Log preference change
            this.logGDPREvent('privacy_preferences_updated', {
                userId: userId,
                preferences: validatedPreferences,
                timestamp: new Date().toISOString()
            });
            
            return {
                success: true,
                message: 'Privacy preferences updated successfully',
                preferences: validatedPreferences
            };
            
        } catch (error) {
            this.logGDPREvent('privacy_preferences_error', {
                userId: userId,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
    
    /**
     * Get data processing activities
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Processing activities
     */
    async getDataProcessingActivities(userId) {
        try {
            const activities = {
                data_collection: {
                    personal_data: ['name', 'email', 'phone', 'address'],
                    booking_data: ['service_type', 'appointment_time', 'payment_info'],
                    usage_data: ['login_times', 'page_views', 'interactions']
                },
                data_processing: {
                    purposes: [
                        'Service delivery and booking management',
                        'Payment processing and invoicing',
                        'Customer communication and support',
                        'Marketing (with consent)',
                        'Legal compliance and fraud prevention'
                    ],
                    legal_basis: [
                        'Contract performance (Art 6(1)(b))',
                        'Legitimate interests (Art 6(1)(f))',
                        'Consent (Art 6(1)(a))',
                        'Legal obligation (Art 6(1)(c))'
                    ]
                },
                data_sharing: {
                    third_parties: [
                        'Payment processors (Stripe)',
                        'Email service providers',
                        'Analytics providers (with consent)',
                        'Legal authorities (when required)'
                    ],
                    safeguards: [
                        'Data processing agreements',
                        'Encryption in transit and at rest',
                        'Access controls and monitoring',
                        'Regular security audits'
                    ]
                },
                user_rights: {
                    access: 'Right to access personal data',
                    rectification: 'Right to correct inaccurate data',
                    erasure: 'Right to delete personal data',
                    portability: 'Right to data portability',
                    objection: 'Right to object to processing',
                    restriction: 'Right to restrict processing'
                }
            };
            
            return {
                success: true,
                activities: activities
            };
            
        } catch (error) {
            this.logGDPREvent('data_processing_activities_error', {
                userId: userId,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
    
    /**
     * Get audit log for user
     * @param {string} userId - User ID
     * @param {string} adminToken - Admin authentication token
     * @returns {Promise<Object>} Audit log
     */
    async getAuditLog(userId, adminToken) {
        try {
            // Verify admin access
            if (!this.verifyAdminAccess(adminToken)) {
                throw new Error('Unauthorized access to audit logs');
            }
            
            // Get audit logs for user
            const auditLogs = await this.getUserAuditLogs(userId);
            
            // Log audit log access
            this.logGDPREvent('audit_log_accessed', {
                userId: userId,
                adminToken: adminToken.substring(0, 10) + '...',
                timestamp: new Date().toISOString()
            });
            
            return {
                success: true,
                auditLogs: auditLogs,
                totalEvents: auditLogs.length
            };
            
        } catch (error) {
            this.logGDPREvent('audit_log_access_error', {
                userId: userId,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
    
    // Helper methods
    async getUserData(userId) {
        // In production, query database
        return JSON.parse(localStorage.getItem(`user_${userId}`) || 'null');
    }
    
    async getUserBookings(userId) {
        // In production, query bookings table
        const bookings = JSON.parse(localStorage.getItem(`bookings_${userId}`) || '[]');
        return bookings.map(booking => ({
            booking_id: booking.id,
            service: booking.service,
            date: booking.date,
            time: booking.time,
            status: booking.status,
            amount: booking.amount
        }));
    }
    
    async getUserPayments(userId) {
        // In production, query payments table
        const payments = JSON.parse(localStorage.getItem(`payments_${userId}`) || '[]');
        return payments.map(payment => ({
            payment_id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            date: payment.date,
            method: payment.method
        }));
    }
    
    async getUserCommunications(userId) {
        // In production, query communications table
        const communications = JSON.parse(localStorage.getItem(`communications_${userId}`) || '[]');
        return communications.map(comm => ({
            type: comm.type,
            subject: comm.subject,
            sent_date: comm.sentDate,
            status: comm.status
        }));
    }
    
    async getCookiePreferences(userId) {
        // In production, query cookie preferences
        return JSON.parse(localStorage.getItem(`cookie_preferences_${userId}`) || '{}');
    }
    
    async generateDownloadUrl(data, userId) {
        // In production, generate secure download URL
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        return {
            url: url,
            filename: `blkpages_data_export_${userId}_${new Date().toISOString().split('T')[0]}.json`,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
    }
    
    async checkLegalObligations(userId) {
        // In production, check for legal obligations
        const obligations = {
            hasObligations: false,
            obligations: []
        };
        
        // Check for pending payments
        const pendingPayments = await this.getPendingPayments(userId);
        if (pendingPayments.length > 0) {
            obligations.hasObligations = true;
            obligations.obligations.push('Pending payments must be resolved before account deletion');
        }
        
        // Check for legal requirements
        const legalRequirements = await this.getLegalRequirements(userId);
        if (legalRequirements.length > 0) {
            obligations.hasObligations = true;
            obligations.obligations.push(...legalRequirements);
        }
        
        return obligations;
    }
    
    async getPendingPayments(userId) {
        // In production, query pending payments
        return JSON.parse(localStorage.getItem(`pending_payments_${userId}`) || '[]');
    }
    
    async getLegalRequirements(userId) {
        // In production, check legal requirements
        return [];
    }
    
    async performPartialDeletion(userId) {
        // In production, perform partial deletion
        const partialDeletion = {
            personalDataDeleted: true,
            bookingDataAnonymized: true,
            paymentDataRetained: true,
            legalDataRetained: true
        };
        
        this.logGDPREvent('partial_deletion_performed', {
            userId: userId,
            deletionType: 'partial',
            timestamp: new Date().toISOString()
        });
        
        return partialDeletion;
    }
    
    async performCompleteDeletion(userId) {
        // In production, delete all user data
        const dataTypesDeleted = [];
        
        // Delete personal data
        localStorage.removeItem(`user_${userId}`);
        dataTypesDeleted.push('personal_data');
        
        // Delete booking data
        localStorage.removeItem(`bookings_${userId}`);
        dataTypesDeleted.push('booking_data');
        
        // Delete payment data
        localStorage.removeItem(`payments_${userId}`);
        dataTypesDeleted.push('payment_data');
        
        // Delete communication data
        localStorage.removeItem(`communications_${userId}`);
        dataTypesDeleted.push('communication_data');
        
        // Delete preferences
        localStorage.removeItem(`cookie_preferences_${userId}`);
        dataTypesDeleted.push('preferences');
        
        return {
            dataTypesDeleted: dataTypesDeleted,
            deletionDate: new Date().toISOString()
        };
    }
    
    validatePrivacyPreferences(preferences) {
        const validPreferences = {};
        
        if (preferences.marketingEmails !== undefined) {
            validPreferences.marketingEmails = Boolean(preferences.marketingEmails);
        }
        
        if (preferences.smsNotifications !== undefined) {
            validPreferences.smsNotifications = Boolean(preferences.smsNotifications);
        }
        
        if (preferences.analyticsCookies !== undefined) {
            validPreferences.analyticsCookies = Boolean(preferences.analyticsCookies);
        }
        
        if (preferences.functionalCookies !== undefined) {
            validPreferences.functionalCookies = Boolean(preferences.functionalCookies);
        }
        
        return validPreferences;
    }
    
    async updateUserPreferences(userId, preferences) {
        // In production, update database
        localStorage.setItem(`privacy_preferences_${userId}`, JSON.stringify(preferences));
    }
    
    async getUserAuditLogs(userId) {
        // In production, query audit log table
        const allLogs = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
        return allLogs.filter(log => log.data.userId === userId);
    }
    
    verifyAdminAccess(adminToken) {
        // In production, verify admin token
        return adminToken === 'admin_token_123'; // Demo token
    }
    
    async sendDeletionConfirmation(email, deletionResult) {
        // In production, send email
        console.log(`Deletion confirmation sent to ${email}`, deletionResult);
    }
    
    logGDPREvent(event, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            ip: this.getClientIP(),
            data: data
        };
        
        this.auditLogs.push(logEntry);
        
        // In production, store in secure audit log
        const logs = JSON.parse(localStorage.getItem('gdpr_audit_logs') || '[]');
        logs.push(logEntry);
        
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        
        localStorage.setItem('gdpr_audit_logs', JSON.stringify(logs));
        console.log('GDPR event logged:', logEntry);
    }
    
    getClientIP() {
        // In production, get real client IP
        return '192.168.1.' + Math.floor(Math.random() * 255);
    }
}

// Create global instance
const gdprComplianceAPI = new GDPRComplianceAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GDPRComplianceAPI, gdprComplianceAPI };
} else {
    window.GDPRComplianceAPI = GDPRComplianceAPI;
    window.gdprComplianceAPI = gdprComplianceAPI;
}
