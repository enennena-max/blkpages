/**
 * Security Utilities for GDPR Compliance and Data Protection
 * Demo environment only - NOT for production use
 */

class SecurityUtils {
    constructor() {
        this.encryptionKey = this.generateEncryptionKey();
        this.auditLogs = [];
        this.rateLimitStore = new Map();
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    }
    
    /**
     * Generate encryption key for demo purposes
     * In production, this would be securely generated and stored
     */
    generateEncryptionKey() {
        return 'demo-key-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Hash password using bcrypt simulation
     * @param {string} password - Password to hash
     * @returns {string} Hashed password
     */
    async hashPassword(password) {
        // Simulate bcrypt hashing for demo
        const salt = this.generateSalt();
        const hash = await this.simpleHash(password + salt);
        return `$2b$10$${salt}$${hash}`;
    }
    
    /**
     * Verify password against hash
     * @param {string} password - Plain text password
     * @param {string} hash - Stored hash
     * @returns {boolean} Whether password matches
     */
    async verifyPassword(password, hash) {
        try {
            const parts = hash.split('$');
            if (parts.length !== 4 || parts[1] !== '2b' || parts[2] !== '10') {
                return false;
            }
            
            const salt = parts[3].substring(0, 22);
            const storedHash = parts[3].substring(22);
            const computedHash = await this.simpleHash(password + salt);
            
            return computedHash === storedHash;
        } catch (error) {
            console.error('Password verification error:', error);
            return false;
        }
    }
    
    /**
     * Generate salt for password hashing
     * @returns {string} Salt string
     */
    generateSalt() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./';
        let salt = '';
        for (let i = 0; i < 22; i++) {
            salt += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return salt;
    }
    
    /**
     * Simple hash function for demo purposes
     * @param {string} input - Input to hash
     * @returns {string} Hash string
     */
    async simpleHash(input) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    /**
     * Encrypt sensitive data using AES simulation
     * @param {string} data - Data to encrypt
     * @returns {string} Encrypted data
     */
    async encryptData(data) {
        try {
            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
                'raw',
                encoder.encode(this.encryptionKey),
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );
            
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encoder.encode(data)
            );
            
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);
            
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('Encryption error:', error);
            return data; // Fallback to plain text in demo
        }
    }
    
    /**
     * Decrypt sensitive data
     * @param {string} encryptedData - Encrypted data
     * @returns {string} Decrypted data
     */
    async decryptData(encryptedData) {
        try {
            const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);
            
            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
                'raw',
                encoder.encode(this.encryptionKey),
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );
            
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encrypted
            );
            
            return new TextDecoder().decode(decrypted);
        } catch (error) {
            console.error('Decryption error:', error);
            return encryptedData; // Fallback in demo
        }
    }
    
    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result
     */
    validatePasswordStrength(password) {
        const rules = {
            minLength: password.length >= 8,
            maxLength: password.length <= 128,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
            noCommonPatterns: !this.isCommonPassword(password)
        };
        
        const score = Object.values(rules).filter(Boolean).length;
        const strength = score >= 6 ? 'strong' : score >= 4 ? 'medium' : 'weak';
        
        return {
            valid: rules.minLength && rules.maxLength && rules.hasUppercase && 
                   rules.hasLowercase && rules.hasNumber && rules.hasSymbol,
            strength: strength,
            rules: rules,
            score: score
        };
    }
    
    /**
     * Check if password is common
     * @param {string} password - Password to check
     * @returns {boolean} Whether password is common
     */
    isCommonPassword(password) {
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey'
        ];
        return commonPasswords.includes(password.toLowerCase());
    }
    
    /**
     * Rate limiting for login/signup attempts
     * @param {string} identifier - IP or user identifier
     * @param {string} action - Action type (login, signup, etc.)
     * @returns {boolean} Whether request is allowed
     */
    checkRateLimit(identifier, action) {
        const key = `${identifier}_${action}`;
        const now = Date.now();
        const windowMs = 15 * 60 * 1000; // 15 minutes
        const maxAttempts = 5; // Max 5 attempts per window
        
        if (!this.rateLimitStore.has(key)) {
            this.rateLimitStore.set(key, []);
        }
        
        const attempts = this.rateLimitStore.get(key);
        
        // Remove old attempts outside the window
        const validAttempts = attempts.filter(time => now - time < windowMs);
        
        if (validAttempts.length >= maxAttempts) {
            this.logSecurityEvent('rate_limit_exceeded', {
                identifier: identifier,
                action: action,
                attempts: validAttempts.length
            });
            return false;
        }
        
        // Add current attempt
        validAttempts.push(now);
        this.rateLimitStore.set(key, validAttempts);
        
        return true;
    }
    
    /**
     * Generate CSRF token
     * @returns {string} CSRF token
     */
    generateCSRFToken() {
        const token = crypto.getRandomValues(new Uint8Array(32));
        const tokenString = btoa(String.fromCharCode(...token));
        
        // Store token in session storage
        sessionStorage.setItem('csrf_token', tokenString);
        sessionStorage.setItem('csrf_timestamp', Date.now().toString());
        
        return tokenString;
    }
    
    /**
     * Validate CSRF token
     * @param {string} token - Token to validate
     * @returns {boolean} Whether token is valid
     */
    validateCSRFToken(token) {
        const storedToken = sessionStorage.getItem('csrf_token');
        const timestamp = parseInt(sessionStorage.getItem('csrf_timestamp') || '0');
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // 1 hour
        
        if (!storedToken || !token) return false;
        if (now - timestamp > maxAge) return false;
        
        return storedToken === token;
    }
    
    /**
     * Sanitize user input
     * @param {string} input - Input to sanitize
     * @returns {string} Sanitized input
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/['"]/g, '') // Remove quotes
            .replace(/[;]/g, '') // Remove semicolons
            .trim()
            .substring(0, 1000); // Limit length
    }
    
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Whether email is valid
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }
    
    /**
     * Log security events
     * @param {string} event - Event type
     * @param {Object} data - Event data
     */
    logSecurityEvent(event, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            ip: this.getClientIP(),
            userAgent: navigator.userAgent,
            data: data
        };
        
        this.auditLogs.push(logEntry);
        
        // Store in localStorage for demo
        const logs = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
        logs.push(logEntry);
        
        // Keep only last 1000 entries
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        
        localStorage.setItem('security_audit_logs', JSON.stringify(logs));
        
        console.log('Security event logged:', logEntry);
    }
    
    /**
     * Get client IP (simulated for demo)
     * @returns {string} Client IP
     */
    getClientIP() {
        // In demo, simulate IP address
        return '192.168.1.' + Math.floor(Math.random() * 255);
    }
    
    /**
     * Check session timeout
     * @returns {boolean} Whether session is valid
     */
    checkSessionTimeout() {
        const lastActivity = parseInt(sessionStorage.getItem('last_activity') || '0');
        const now = Date.now();
        
        if (now - lastActivity > this.sessionTimeout) {
            this.logSecurityEvent('session_timeout', {
                last_activity: new Date(lastActivity).toISOString(),
                timeout_duration: this.sessionTimeout
            });
            return false;
        }
        
        return true;
    }
    
    /**
     * Update session activity
     */
    updateSessionActivity() {
        sessionStorage.setItem('last_activity', Date.now().toString());
    }
    
    /**
     * Clear session data
     */
    clearSession() {
        sessionStorage.removeItem('csrf_token');
        sessionStorage.removeItem('csrf_timestamp');
        sessionStorage.removeItem('last_activity');
        sessionStorage.removeItem('user_session');
    }
    
    /**
     * Get audit logs
     * @returns {Array} Audit logs
     */
    getAuditLogs() {
        return JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
    }
    
    /**
     * Clear audit logs
     */
    clearAuditLogs() {
        localStorage.removeItem('security_audit_logs');
        this.auditLogs = [];
    }
}

// Create global instance
const securityUtils = new SecurityUtils();

// Auto-update session activity
document.addEventListener('click', () => securityUtils.updateSessionActivity());
document.addEventListener('keypress', () => securityUtils.updateSessionActivity());

// Check session timeout every minute
setInterval(() => {
    if (!securityUtils.checkSessionTimeout()) {
        securityUtils.clearSession();
        window.location.href = '/login.html';
    }
}, 60000);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityUtils, securityUtils };
} else {
    window.SecurityUtils = SecurityUtils;
    window.securityUtils = securityUtils;
}
