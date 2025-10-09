/**
 * Development Environment Configuration
 * Provides default values for development when environment variables are missing
 */

class DevelopmentConfig {
    constructor() {
        this.isDevelopment = this.checkDevelopmentMode();
        this.defaultValues = this.getDefaultValues();
    }

    checkDevelopmentMode() {
        if (typeof window === 'undefined') return false;
        
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('localhost') ||
               window.location.hostname.includes('127.0.0.1') ||
               window.location.hostname.includes('dev') ||
               window.location.hostname.includes('test');
    }

    getDefaultValues() {
        return {
            DB_HOST: 'localhost',
            DB_PASSWORD: 'dev_password_123',
            STRIPE_SECRET_KEY: 'sk_test_development_key',
            SMTP_PASSWORD: 'dev_smtp_password',
            NODE_ENV: 'development',
            API_BASE_URL: 'http://localhost:3000',
            GOOGLE_MAPS_API_KEY: 'AIzaSyBvOkBw3cLxE2D2Q2R2S2T2U2V2W2X2Y2Z2'
        };
    }

    initialize() {
        if (!this.isDevelopment) return;

        console.log('🔧 Development Environment Configuration');
        console.log('Setting up development defaults...');

        // Set default environment variables if not already set
        if (typeof process !== 'undefined' && process.env) {
            Object.entries(this.defaultValues).forEach(([key, value]) => {
                if (!process.env[key]) {
                    process.env[key] = value;
                    console.log(`Set ${key} = ${value}`);
                }
            });
        }

        // Set global development flags
        if (typeof window !== 'undefined') {
            window.DEVELOPMENT_MODE = true;
            window.DEBUG_ENABLED = true;
        }

        console.log('✅ Development environment configured');
    }

    getConfig() {
        return {
            isDevelopment: this.isDevelopment,
            defaults: this.defaultValues,
            features: {
                debugLogging: true,
                hotReload: true,
                mockData: true,
                relaxedValidation: true
            }
        };
    }
}

// Create global instance
const developmentConfig = new DevelopmentConfig();

// Auto-initialize in development
if (typeof window !== 'undefined') {
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('localhost') ||
                         window.location.hostname.includes('127.0.0.1');
    
    if (isDevelopment) {
        developmentConfig.initialize();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DevelopmentConfig, developmentConfig };
} else {
    window.DevelopmentConfig = DevelopmentConfig;
    window.developmentConfig = developmentConfig;
}
