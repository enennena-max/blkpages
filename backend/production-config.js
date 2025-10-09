/**
 * Production Environment Configuration
 * Security and GDPR settings for live environment
 */

class ProductionConfig {
    constructor() {
        this.environment = 'production';
        this.security = {
            // HTTPS enforcement
            enforceHTTPS: true,
            hstsMaxAge: 31536000, // 1 year
            
            // Session security
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            sessionCookieSecure: true,
            sessionCookieHttpOnly: true,
            sessionCookieSameSite: 'Lax',
            
            // CSRF protection
            csrfTokenExpiry: 60 * 60 * 1000, // 1 hour
            csrfTokenLength: 32,
            
            // Rate limiting
            rateLimitWindow: 15 * 60 * 1000, // 15 minutes
            maxLoginAttempts: 5,
            maxSignupAttempts: 3,
            maxPasswordResetAttempts: 3,
            maxBookingAttempts: 10,
            
            // Password requirements
            passwordMinLength: 8,
            passwordMaxLength: 128,
            passwordRequireUppercase: true,
            passwordRequireLowercase: true,
            passwordRequireNumber: true,
            passwordRequireSymbol: true,
            
            // Data encryption
            encryptionAlgorithm: 'AES-256-GCM',
            encryptionKeyRotation: 90 * 24 * 60 * 60 * 1000, // 90 days
            
            // Audit logging
            auditLogRetention: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
            auditLogEncryption: true,
            auditLogCompression: true
        };
        
        this.gdpr = {
            // Data retention
            personalDataRetention: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
            bookingDataRetention: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
            paymentDataRetention: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
            analyticsDataRetention: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
            
            // Consent management
            consentExpiry: 365 * 24 * 60 * 60 * 1000, // 1 year
            consentGranular: true,
            consentWithdrawable: true,
            
            // Data processing
            dataMinimization: true,
            purposeLimitation: true,
            storageLimitation: true,
            
            // User rights
            rightToAccess: true,
            rightToRectification: true,
            rightToErasure: true,
            rightToPortability: true,
            rightToObject: true,
            rightToRestriction: true
        };
        
        this.api = {
            // API endpoints
            baseUrl: 'https://api.blkpages.co.uk',
            authEndpoint: '/api/auth',
            gdprEndpoint: '/api/gdpr',
            bookingEndpoint: '/api/bookings',
            paymentEndpoint: '/api/payments',
            
            // API security
            apiKeyRequired: true,
            apiRateLimit: 1000, // requests per hour
            apiTimeout: 30000, // 30 seconds
            
            // CORS settings
            corsOrigins: [
                'https://blkpages.co.uk',
                'https://www.blkpages.co.uk',
                'https://app.blkpages.co.uk'
            ],
            corsCredentials: true,
            corsMaxAge: 86400 // 24 hours
        };
        
        this.database = {
            // Database connection
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            name: process.env.DB_NAME || 'blkpages_production',
            user: process.env.DB_USER || 'blkpages_user',
            password: process.env.DB_PASSWORD || '',
            
            // Connection pooling
            maxConnections: 20,
            minConnections: 5,
            connectionTimeout: 30000,
            idleTimeout: 600000,
            
            // Security
            ssl: true,
            sslMode: 'require',
            encryptionAtRest: true,
            backupEncryption: true
        };
        
        this.email = {
            // SMTP settings
            host: process.env.SMTP_HOST || 'smtp.blkpages.co.uk',
            port: process.env.SMTP_PORT || 587,
            secure: true,
            user: process.env.SMTP_USER || 'noreply@blkpages.co.uk',
            password: process.env.SMTP_PASSWORD || '',
            
            // Email templates
            fromName: 'BlkPages',
            fromEmail: 'noreply@blkpages.co.uk',
            replyTo: 'support@blkpages.co.uk',
            
            // Email security
            dkimEnabled: true,
            spfEnabled: true,
            dmarcEnabled: true
        };
        
        this.payments = {
            // Stripe configuration
            stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
            stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
            stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
            
            // Payment security
            pciCompliant: true,
            tokenization: true,
            encryption: true,
            
            // Fraud prevention
            fraudDetection: true,
            velocityChecks: true,
            riskScoring: true
        };
        
        this.monitoring = {
            // Security monitoring
            intrusionDetection: true,
            anomalyDetection: true,
            threatIntelligence: true,
            
            // Performance monitoring
            responseTimeMonitoring: true,
            errorRateMonitoring: true,
            uptimeMonitoring: true,
            
            // Compliance monitoring
            gdprCompliance: true,
            dataRetentionMonitoring: true,
            consentTracking: true
        };
        
        this.cookies = {
            // Cookie settings
            essentialCookies: true,
            analyticsCookies: false, // Requires consent
            marketingCookies: false, // Requires consent
            functionalCookies: false, // Requires consent
            
            // Cookie security
            secure: true,
            httpOnly: true,
            sameSite: 'Lax',
            domain: '.blkpages.co.uk',
            path: '/',
            
            // Cookie consent
            consentBanner: true,
            consentGranular: true,
            consentExpiry: 365 // days
        };
        
        this.csp = {
            // Content Security Policy
            enabled: true,
            directives: {
                'default-src': ["'self'"],
                'script-src': [
                    "'self'",
                    "'unsafe-inline'",
                    'https://cdn.tailwindcss.com',
                    'https://cdnjs.cloudflare.com',
                    'https://js.stripe.com'
                ],
                'style-src': [
                    "'self'",
                    "'unsafe-inline'",
                    'https://fonts.googleapis.com',
                    'https://cdnjs.cloudflare.com'
                ],
                'font-src': [
                    "'self'",
                    'https://fonts.gstatic.com',
                    'https://cdnjs.cloudflare.com'
                ],
                'img-src': [
                    "'self'",
                    'data:',
                    'https:'
                ],
                'connect-src': [
                    "'self'",
                    'https://api.blkpages.co.uk',
                    'https://api.stripe.com'
                ],
                'frame-src': [
                    'https://js.stripe.com',
                    'https://hooks.stripe.com'
                ]
            }
        };
    }
    
    /**
     * Get security configuration
     * @returns {Object} Security configuration
     */
    getSecurityConfig() {
        return this.security;
    }
    
    /**
     * Get GDPR configuration
     * @returns {Object} GDPR configuration
     */
    getGDPRConfig() {
        return this.gdpr;
    }
    
    /**
     * Get API configuration
     * @returns {Object} API configuration
     */
    getAPIConfig() {
        return this.api;
    }
    
    /**
     * Get database configuration
     * @returns {Object} Database configuration
     */
    getDatabaseConfig() {
        return this.database;
    }
    
    /**
     * Get email configuration
     * @returns {Object} Email configuration
     */
    getEmailConfig() {
        return this.email;
    }
    
    /**
     * Get payment configuration
     * @returns {Object} Payment configuration
     */
    getPaymentConfig() {
        return this.payments;
    }
    
    /**
     * Get monitoring configuration
     * @returns {Object} Monitoring configuration
     */
    getMonitoringConfig() {
        return this.monitoring;
    }
    
    /**
     * Get cookie configuration
     * @returns {Object} Cookie configuration
     */
    getCookieConfig() {
        return this.cookies;
    }
    
    /**
     * Get CSP configuration
     * @returns {Object} CSP configuration
     */
    getCSPConfig() {
        return this.csp;
    }
    
    /**
     * Validate production environment
     * @returns {Object} Validation result
     */
    validateEnvironment() {
        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };
        
        // Check required environment variables
        const requiredEnvVars = [
            'DB_HOST',
            'DB_PASSWORD',
            'STRIPE_SECRET_KEY',
            'SMTP_PASSWORD'
        ];
        
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                validation.valid = false;
                validation.errors.push(`Missing required environment variable: ${envVar}`);
            }
        }
        
        // Check HTTPS enforcement
        if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
            validation.warnings.push('HTTPS not enforced in current environment');
        }
        
        // Check security headers
        if (typeof window !== 'undefined') {
            const securityHeaders = [
                'Content-Security-Policy',
                'X-Frame-Options',
                'X-Content-Type-Options',
                'X-XSS-Protection'
            ];
            
            for (const header of securityHeaders) {
                if (!document.querySelector(`meta[http-equiv="${header}"]`)) {
                    validation.warnings.push(`Security header not set: ${header}`);
                }
            }
        }
        
        return validation;
    }
    
    /**
     * Apply production security headers
     */
    applySecurityHeaders() {
        if (typeof document !== 'undefined') {
            // Add security meta tags
            const securityMetaTags = [
                { name: 'X-Frame-Options', content: 'DENY' },
                { name: 'X-Content-Type-Options', content: 'nosniff' },
                { name: 'X-XSS-Protection', content: '1; mode=block' },
                { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
                { name: 'Permissions-Policy', content: 'geolocation=(), microphone=(), camera=()' }
            ];
            
            securityMetaTags.forEach(tag => {
                if (!document.querySelector(`meta[http-equiv="${tag.name}"]`)) {
                    const meta = document.createElement('meta');
                    meta.setAttribute('http-equiv', tag.name);
                    meta.setAttribute('content', tag.content);
                    document.head.appendChild(meta);
                }
            });
        }
    }
    
    /**
     * Initialize production environment
     */
    initialize() {
        console.log('Initializing production environment...');
        
        // Apply security headers
        this.applySecurityHeaders();
        
        // Validate environment
        const validation = this.validateEnvironment();
        if (!validation.valid) {
            console.error('Production environment validation failed:', validation.errors);
            throw new Error('Invalid production environment configuration');
        }
        
        if (validation.warnings.length > 0) {
            console.warn('Production environment warnings:', validation.warnings);
        }
        
        console.log('Production environment initialized successfully');
    }
}

// Create global instance
const productionConfig = new ProductionConfig();

// Auto-initialize in production
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    productionConfig.initialize();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProductionConfig, productionConfig };
} else {
    window.ProductionConfig = ProductionConfig;
    window.productionConfig = productionConfig;
}
