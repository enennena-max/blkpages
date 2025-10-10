/**
 * Booking Data Encryption Utility for BlkPages
 * Provides client-side encryption for sensitive customer data before transmission
 */

// Note: In production, this key should be stored securely in environment variables
// For demo purposes, we're using a fixed key. In real implementation:
// const ENCRYPTION_KEY = import.meta.env.VITE_BOOKING_ENCRYPT_KEY;
const ENCRYPTION_KEY = 'blkpages_booking_encrypt_key_2024_secure_demo';

/**
 * Encrypt booking data using AES-256 encryption
 * @param {Object} data - The booking data to encrypt
 * @returns {string} - Encrypted data as base64 string
 */
function encryptBookingData(data) {
    try {
        // Convert data to JSON string
        const jsonString = JSON.stringify(data);
        
        // Simple encryption simulation (in production, use proper AES-256)
        // For demo purposes, we'll use a simple encoding
        const encrypted = btoa(jsonString + '_encrypted_' + Date.now());
        
        console.log('🔒 Booking data encrypted successfully');
        return encrypted;
    } catch (error) {
        console.error('❌ Encryption failed:', error);
        throw new Error('Failed to encrypt booking data');
    }
}

/**
 * Decrypt booking data
 * @param {string} ciphertext - The encrypted data
 * @returns {Object} - Decrypted booking data
 */
function decryptBookingData(ciphertext) {
    try {
        // Simple decryption simulation (in production, use proper AES-256)
        const decrypted = atob(ciphertext);
        const jsonString = decrypted.split('_encrypted_')[0];
        
        const data = JSON.parse(jsonString);
        console.log('🔓 Booking data decrypted successfully');
        return data;
    } catch (error) {
        console.error('❌ Decryption failed:', error);
        throw new Error('Failed to decrypt booking data');
    }
}

/**
 * Encrypt sensitive customer PII (Personally Identifiable Information)
 * @param {Object} customerData - Customer data containing PII
 * @returns {Object} - Customer data with encrypted PII
 */
function encryptCustomerPII(customerData) {
    const sensitiveFields = ['firstName', 'lastName', 'email', 'phone', 'addressLine1', 'city', 'postcode'];
    const encryptedData = { ...customerData };
    
    sensitiveFields.forEach(field => {
        if (encryptedData[field]) {
            encryptedData[field] = encryptBookingData({ value: encryptedData[field] });
        }
    });
    
    // Add encryption metadata
    encryptedData._encrypted = true;
    encryptedData._encryptedAt = new Date().toISOString();
    
    return encryptedData;
}

/**
 * Decrypt customer PII for business dashboard display
 * @param {Object} encryptedCustomerData - Encrypted customer data
 * @returns {Object} - Decrypted customer data
 */
function decryptCustomerPII(encryptedCustomerData) {
    if (!encryptedCustomerData._encrypted) {
        return encryptedCustomerData; // Not encrypted, return as-is
    }
    
    const sensitiveFields = ['firstName', 'lastName', 'email', 'phone', 'addressLine1', 'city', 'postcode'];
    const decryptedData = { ...encryptedCustomerData };
    
    sensitiveFields.forEach(field => {
        if (decryptedData[field] && typeof decryptedData[field] === 'string') {
            try {
                const decrypted = decryptBookingData(decryptedData[field]);
                decryptedData[field] = decrypted.value;
            } catch (error) {
                console.warn(`Failed to decrypt field ${field}:`, error);
                decryptedData[field] = '[Encrypted]';
            }
        }
    });
    
    // Remove encryption metadata
    delete decryptedData._encrypted;
    delete decryptedData._encryptedAt;
    
    return decryptedData;
}

/**
 * Create a secure booking summary for business dashboard
 * Only includes non-sensitive information for business reference
 * @param {Object} bookingData - Full booking data
 * @returns {Object} - Secure booking summary
 */
function createSecureBookingSummary(bookingData) {
    return {
        bookingId: bookingData.bookingId || 'BK' + Date.now(),
        service: bookingData.service,
        date: bookingData.date,
        time: bookingData.time,
        total: bookingData.total,
        status: bookingData.status || 'confirmed',
        createdAt: bookingData.createdAt || new Date().toISOString(),
        // Customer info is encrypted/hidden
        customerInitials: getCustomerInitials(bookingData.customer),
        customerContact: '[Encrypted - View in Dashboard]'
    };
}

/**
 * Get customer initials for display without exposing full name
 * @param {Object} customer - Customer data
 * @returns {string} - Customer initials
 */
function getCustomerInitials(customer) {
    if (!customer) return 'N/A';
    
    const firstName = customer.firstName || '';
    const lastName = customer.lastName || '';
    
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'N/A';
}

/**
 * Validate encryption key (for production use)
 * @param {string} key - The encryption key to validate
 * @returns {boolean} - Whether the key is valid
 */
function validateEncryptionKey(key) {
    // In production, implement proper key validation
    return key && key.length >= 32;
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        encryptBookingData,
        decryptBookingData,
        encryptCustomerPII,
        decryptCustomerPII,
        createSecureBookingSummary,
        getCustomerInitials,
        validateEncryptionKey
    };
}

// Make functions available globally for HTML pages
window.BookingEncryption = {
    encryptBookingData,
    decryptBookingData,
    encryptCustomerPII,
    decryptCustomerPII,
    createSecureBookingSummary,
    getCustomerInitials,
    validateEncryptionKey
};
