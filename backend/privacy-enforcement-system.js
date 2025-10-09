/**
 * Global Privacy Enforcement System
 * Automatically strips restricted fields and enforces privacy across all shared datasets
 */

// Privacy schemas for all shared datasets
const PRIVACY_SCHEMAS = {
    bookings: {
        allowed_fields: [
            'id', 'business_id', 'business_name', 'customer_id',
            'customerFirstName', 'customerLastName', 'serviceName', 'servicePrice',
            'bookingDate', 'bookingTime', 'totalAmount', 'paymentMethod',
            'status', 'createdAt', 'updatedAt', 'source', 'privacyNotice'
        ],
        restricted_fields: [
            'customerEmail', 'customerPhone', 'customerPostcode', 'customerAddress',
            'customerFullName', 'customerDetails', 'paymentDetails', 'cardInfo',
            'billingAddress', 'personalNotes', 'internalNotes'
        ],
        disclaimer: "Customer personal details are protected for privacy. Only essential booking information is shared with businesses."
    },
    
    reviews: {
        allowed_fields: [
            'id', 'business_id', 'customer_id', 'rating', 'comment',
            'bookingReference', 'createdAt', 'status', 'businessReply',
            'replyDate', 'moderated', 'privacyNotice'
        ],
        restricted_fields: [
            'customerEmail', 'customerPhone', 'customerName', 'customerDetails',
            'customerAddress', 'internalNotes', 'moderationNotes'
        ],
        disclaimer: "Reviews are anonymized. Customer contact details are never shared with businesses."
    },
    
    loyalty: {
        allowed_fields: [
            'id', 'customer_id', 'business_id', 'total_visits', 'total_spend',
            'last_visit', 'reward_unlocked', 'reward_redeemed', 'reward_voucher_id',
            'created_at', 'updated_at', 'privacyNotice'
        ],
        restricted_fields: [
            'customerEmail', 'customerPhone', 'customerName', 'customerAddress',
            'customerDetails', 'internalNotes', 'personalData'
        ],
        disclaimer: "Loyalty progress is tracked anonymously. Personal details are protected."
    },
    
    waitinglist: {
        allowed_fields: [
            'id', 'business_id', 'customer_id', 'customerName', 'serviceName',
            'requestedDate', 'position', 'status', 'createdAt', 'updatedAt',
            'privacyNotice'
        ],
        restricted_fields: [
            'customerEmail', 'customerPhone', 'customerAddress', 'customerDetails',
            'internalNotes', 'personalData'
        ],
        disclaimer: "Only customer first name and service are shown to businesses for managing the waiting list."
    },
    
    analytics: {
        allowed_fields: [
            'business_id', 'metric_type', 'metric_value', 'date_range',
            'aggregated_data', 'trends', 'insights', 'generated_at',
            'privacyNotice'
        ],
        restricted_fields: [
            'customerEmail', 'customerPhone', 'customerName', 'customerAddress',
            'individualData', 'personalIdentifiers', 'rawCustomerData'
        ],
        disclaimer: "Analytics show aggregated, anonymized data only. Individual customer information is never exposed."
    },
    
    rewardVouchers: {
        allowed_fields: [
            'id', 'code', 'business_id', 'reward_type', 'reward_value',
            'expiry_date', 'redeemed', 'expired', 'created_at', 'privacyNotice'
        ],
        restricted_fields: [
            'customerEmail', 'customerPhone', 'customerName', 'customerAddress',
            'customerDetails', 'internalNotes'
        ],
        disclaimer: "Voucher codes are generated securely. Customer personal details are not stored with vouchers."
    }
};

/**
 * Privacy Enforcement Class
 */
class PrivacyEnforcement {
    constructor() {
        this.schemas = PRIVACY_SCHEMAS;
        this.loggedActions = [];
    }
    
    /**
     * Strip restricted fields from data object
     * @param {Object} data - Data object to sanitize
     * @param {string} dataset - Dataset type (bookings, reviews, etc.)
     * @returns {Object} Sanitized data object
     */
    stripRestrictedFields(data, dataset) {
        if (!this.schemas[dataset]) {
            console.warn(`No privacy schema found for dataset: ${dataset}`);
            return data;
        }
        
        const schema = this.schemas[dataset];
        const sanitizedData = {};
        
        // Copy only allowed fields
        schema.allowed_fields.forEach(field => {
            if (data.hasOwnProperty(field)) {
                sanitizedData[field] = data[field];
            }
        });
        
        // Add privacy notice
        sanitizedData.privacyNotice = schema.disclaimer;
        
        // Log the action
        this.logPrivacyAction('field_stripping', dataset, {
            originalFields: Object.keys(data).length,
            sanitizedFields: Object.keys(sanitizedData).length,
            restrictedFields: schema.restricted_fields.filter(field => data.hasOwnProperty(field))
        });
        
        return sanitizedData;
    }
    
    /**
     * Strip restricted fields from array of data objects
     * @param {Array} dataArray - Array of data objects
     * @param {string} dataset - Dataset type
     * @returns {Array} Array of sanitized data objects
     */
    stripRestrictedFieldsArray(dataArray, dataset) {
        if (!Array.isArray(dataArray)) {
            return [];
        }
        
        return dataArray.map(item => this.stripRestrictedFields(item, dataset));
    }
    
    /**
     * Get privacy disclaimer for dataset
     * @param {string} dataset - Dataset type
     * @returns {string} Privacy disclaimer text
     */
    getPrivacyDisclaimer(dataset) {
        return this.schemas[dataset]?.disclaimer || "Customer personal details are protected for privacy.";
    }
    
    /**
     * Validate data against privacy schema
     * @param {Object} data - Data to validate
     * @param {string} dataset - Dataset type
     * @returns {Object} Validation result
     */
    validatePrivacyCompliance(data, dataset) {
        if (!this.schemas[dataset]) {
            return { valid: false, error: `No schema found for dataset: ${dataset}` };
        }
        
        const schema = this.schemas[dataset];
        const violations = [];
        
        // Check for restricted fields
        schema.restricted_fields.forEach(field => {
            if (data.hasOwnProperty(field)) {
                violations.push({
                    type: 'restricted_field',
                    field: field,
                    message: `Restricted field '${field}' found in ${dataset} data`
                });
            }
        });
        
        // Check for required privacy notice
        if (!data.privacyNotice) {
            violations.push({
                type: 'missing_privacy_notice',
                field: 'privacyNotice',
                message: `Missing privacy notice in ${dataset} data`
            });
        }
        
        return {
            valid: violations.length === 0,
            violations: violations,
            dataset: dataset
        };
    }
    
    /**
     * Log privacy enforcement actions
     * @param {string} action - Action type
     * @param {string} dataset - Dataset affected
     * @param {Object} details - Action details
     */
    logPrivacyAction(action, dataset, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            dataset: dataset,
            details: details,
            userAgent: navigator.userAgent,
            sessionId: this.getSessionId()
        };
        
        this.loggedActions.push(logEntry);
        
        // Store in localStorage for debugging
        const privacyLogs = JSON.parse(localStorage.getItem('privacyEnforcementLogs') || '[]');
        privacyLogs.push(logEntry);
        
        // Keep only last 100 entries
        if (privacyLogs.length > 100) {
            privacyLogs.splice(0, privacyLogs.length - 100);
        }
        
        localStorage.setItem('privacyEnforcementLogs', JSON.stringify(privacyLogs));
        
        console.log('Privacy enforcement action:', logEntry);
    }
    
    /**
     * Get session ID for tracking
     * @returns {string} Session ID
     */
    getSessionId() {
        let sessionId = localStorage.getItem('privacySessionId');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('privacySessionId', sessionId);
        }
        return sessionId;
    }
    
    /**
     * Get privacy enforcement report
     * @returns {Object} Privacy enforcement report
     */
    getPrivacyReport() {
        const report = {
            totalActions: this.loggedActions.length,
            actionsByDataset: {},
            actionsByType: {},
            recentActions: this.loggedActions.slice(-10),
            schemas: Object.keys(this.schemas),
            generatedAt: new Date().toISOString()
        };
        
        // Group actions by dataset
        this.loggedActions.forEach(action => {
            if (!report.actionsByDataset[action.dataset]) {
                report.actionsByDataset[action.dataset] = 0;
            }
            report.actionsByDataset[action.dataset]++;
            
            if (!report.actionsByType[action.action]) {
                report.actionsByType[action.action] = 0;
            }
            report.actionsByType[action.action]++;
        });
        
        return report;
    }
    
    /**
     * Clear privacy logs
     */
    clearPrivacyLogs() {
        this.loggedActions = [];
        localStorage.removeItem('privacyEnforcementLogs');
        console.log('Privacy enforcement logs cleared');
    }
}

// Create global instance
const privacyEnforcement = new PrivacyEnforcement();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PrivacyEnforcement, privacyEnforcement, PRIVACY_SCHEMAS };
} else {
    window.PrivacyEnforcement = PrivacyEnforcement;
    window.privacyEnforcement = privacyEnforcement;
    window.PRIVACY_SCHEMAS = PRIVACY_SCHEMAS;
}

// Auto-initialize privacy enforcement
document.addEventListener('DOMContentLoaded', function() {
    console.log('Privacy Enforcement System initialized');
    console.log('Available datasets:', Object.keys(PRIVACY_SCHEMAS));
    
    // Log initialization
    privacyEnforcement.logPrivacyAction('system_initialization', 'global', {
        schemas: Object.keys(PRIVACY_SCHEMAS),
        timestamp: new Date().toISOString()
    });
});
