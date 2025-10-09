/**
 * Cookie Consent Management System
 * GDPR-compliant cookie consent for demo environment
 */

class CookieConsent {
    constructor() {
        this.consentGiven = false;
        this.preferences = {
            essential: true, // Always required
            analytics: false,
            marketing: false,
            functional: false
        };
        this.consentVersion = '1.0';
        this.consentExpiry = 365; // days
        this.initialized = false;
    }
    
    /**
     * Initialize cookie consent system
     */
    init() {
        if (this.initialized) return;
        
        // Check for existing consent
        this.loadConsentPreferences();
        
        // Show banner if no consent given
        if (!this.consentGiven) {
            this.showConsentBanner();
        } else {
            this.applyConsentPreferences();
        }
        
        this.initialized = true;
        console.log('Cookie Consent System initialized');
    }
    
    /**
     * Load existing consent preferences
     */
    loadConsentPreferences() {
        try {
            const stored = localStorage.getItem('cookie_consent');
            if (stored) {
                const consent = JSON.parse(stored);
                
                // Check if consent is still valid
                const consentDate = new Date(consent.timestamp);
                const expiryDate = new Date(consentDate.getTime() + (this.consentExpiry * 24 * 60 * 60 * 1000));
                
                if (new Date() < expiryDate) {
                    this.consentGiven = true;
                    this.preferences = consent.preferences;
                    this.consentVersion = consent.version;
                } else {
                    // Consent expired, reset
                    this.clearConsent();
                }
            }
        } catch (error) {
            console.error('Error loading consent preferences:', error);
            this.clearConsent();
        }
    }
    
    /**
     * Show consent banner
     */
    showConsentBanner() {
        // Remove existing banner if any
        const existingBanner = document.getElementById('cookie-consent-banner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.className = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-consent-content">
                <div class="cookie-consent-header">
                    <i class="fas fa-cookie-bite"></i>
                    <h3>Cookie Consent</h3>
                </div>
                <div class="cookie-consent-body">
                    <p>We use cookies to enhance your experience, analyze site traffic, and personalize content. By clicking "Accept All", you consent to our use of cookies.</p>
                    <div class="cookie-consent-actions">
                        <button class="btn-accept-all" onclick="cookieConsent.acceptAll()">
                            <i class="fas fa-check"></i> Accept All
                        </button>
                        <button class="btn-customize" onclick="cookieConsent.showPreferences()">
                            <i class="fas fa-cog"></i> Customize
                        </button>
                        <button class="btn-essential-only" onclick="cookieConsent.acceptEssential()">
                            <i class="fas fa-shield-alt"></i> Essential Only
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Add CSS if not already added
        this.addConsentStyles();
    }
    
    /**
     * Show detailed preferences modal
     */
    showPreferences() {
        const modal = document.createElement('div');
        modal.id = 'cookie-preferences-modal';
        modal.className = 'cookie-preferences-modal';
        modal.innerHTML = `
            <div class="cookie-preferences-content">
                <div class="cookie-preferences-header">
                    <h3><i class="fas fa-cog"></i> Cookie Preferences</h3>
                    <button class="btn-close" onclick="this.closest('.cookie-preferences-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="cookie-preferences-body">
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <h4>Essential Cookies</h4>
                            <label class="toggle-switch">
                                <input type="checkbox" checked disabled>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <p>Required for basic website functionality and security. Cannot be disabled.</p>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <h4>Analytics Cookies</h4>
                            <label class="toggle-switch">
                                <input type="checkbox" id="analytics-consent" ${this.preferences.analytics ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <p>Help us understand how you use our website to improve performance.</p>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <h4>Marketing Cookies</h4>
                            <label class="toggle-switch">
                                <input type="checkbox" id="marketing-consent" ${this.preferences.marketing ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <p>Used for targeted advertising and personalized content.</p>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <h4>Functional Cookies</h4>
                            <label class="toggle-switch">
                                <input type="checkbox" id="functional-consent" ${this.preferences.functional ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <p>Remember your preferences and settings for a better experience.</p>
                    </div>
                </div>
                <div class="cookie-preferences-footer">
                    <button class="btn-save-preferences" onclick="cookieConsent.savePreferences()">
                        <i class="fas fa-save"></i> Save Preferences
                    </button>
                    <button class="btn-accept-all-modal" onclick="cookieConsent.acceptAll()">
                        <i class="fas fa-check"></i> Accept All
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Accept all cookies
     */
    acceptAll() {
        this.preferences = {
            essential: true,
            analytics: true,
            marketing: true,
            functional: true
        };
        
        this.saveConsent();
        this.hideBanner();
        this.applyConsentPreferences();
        
        // Log consent given
        if (typeof securityUtils !== 'undefined') {
            securityUtils.logSecurityEvent('cookie_consent_given', {
                type: 'accept_all',
                preferences: this.preferences
            });
        }
    }
    
    /**
     * Accept essential cookies only
     */
    acceptEssential() {
        this.preferences = {
            essential: true,
            analytics: false,
            marketing: false,
            functional: false
        };
        
        this.saveConsent();
        this.hideBanner();
        this.applyConsentPreferences();
        
        // Log consent given
        if (typeof securityUtils !== 'undefined') {
            securityUtils.logSecurityEvent('cookie_consent_given', {
                type: 'essential_only',
                preferences: this.preferences
            });
        }
    }
    
    /**
     * Save custom preferences
     */
    savePreferences() {
        this.preferences = {
            essential: true, // Always true
            analytics: document.getElementById('analytics-consent').checked,
            marketing: document.getElementById('marketing-consent').checked,
            functional: document.getElementById('functional-consent').checked
        };
        
        this.saveConsent();
        this.hideBanner();
        this.hidePreferencesModal();
        this.applyConsentPreferences();
        
        // Log consent given
        if (typeof securityUtils !== 'undefined') {
            securityUtils.logSecurityEvent('cookie_consent_given', {
                type: 'custom_preferences',
                preferences: this.preferences
            });
        }
    }
    
    /**
     * Save consent to localStorage
     */
    saveConsent() {
        const consent = {
            preferences: this.preferences,
            timestamp: new Date().toISOString(),
            version: this.consentVersion,
            expiry: this.consentExpiry
        };
        
        localStorage.setItem('cookie_consent', JSON.stringify(consent));
        this.consentGiven = true;
        
        console.log('Cookie consent saved:', consent);
    }
    
    /**
     * Apply consent preferences
     */
    applyConsentPreferences() {
        // Load analytics scripts if consented
        if (this.preferences.analytics) {
            this.loadAnalyticsScripts();
        }
        
        // Load marketing scripts if consented
        if (this.preferences.marketing) {
            this.loadMarketingScripts();
        }
        
        // Load functional scripts if consented
        if (this.preferences.functional) {
            this.loadFunctionalScripts();
        }
        
        console.log('Cookie preferences applied:', this.preferences);
    }
    
    /**
     * Load analytics scripts
     */
    loadAnalyticsScripts() {
        // Simulate loading Google Analytics or similar
        console.log('Analytics scripts loaded');
        
        // In a real implementation, you would load actual analytics scripts here
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
    }
    
    /**
     * Load marketing scripts
     */
    loadMarketingScripts() {
        // Simulate loading marketing/advertising scripts
        console.log('Marketing scripts loaded');
        
        // In a real implementation, you would load actual marketing scripts here
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'ad_storage': 'granted'
            });
        }
    }
    
    /**
     * Load functional scripts
     */
    loadFunctionalScripts() {
        // Simulate loading functional scripts
        console.log('Functional scripts loaded');
    }
    
    /**
     * Hide consent banner
     */
    hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.opacity = '0';
            setTimeout(() => banner.remove(), 300);
        }
    }
    
    /**
     * Hide preferences modal
     */
    hidePreferencesModal() {
        const modal = document.getElementById('cookie-preferences-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    /**
     * Clear consent
     */
    clearConsent() {
        localStorage.removeItem('cookie_consent');
        this.consentGiven = false;
        this.preferences = {
            essential: true,
            analytics: false,
            marketing: false,
            functional: false
        };
    }
    
    /**
     * Add consent styles
     */
    addConsentStyles() {
        if (document.getElementById('cookie-consent-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'cookie-consent-styles';
        styles.textContent = `
            .cookie-consent-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #1A1A1A;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding: 1rem;
                z-index: 10000;
                box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .cookie-consent-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .cookie-consent-header {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #3b82f6;
                font-weight: 600;
            }
            
            .cookie-consent-body {
                flex: 1;
            }
            
            .cookie-consent-body p {
                color: #cccccc;
                margin-bottom: 1rem;
            }
            
            .cookie-consent-actions {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .cookie-consent-actions button {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .btn-accept-all {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
            }
            
            .btn-customize {
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: white;
            }
            
            .btn-essential-only {
                background: linear-gradient(135deg, #6b7280, #4b5563);
                color: white;
            }
            
            .cookie-consent-actions button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .cookie-preferences-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
            }
            
            .cookie-preferences-content {
                background: #1A1A1A;
                border-radius: 12px;
                padding: 2rem;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .cookie-preferences-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }
            
            .cookie-preferences-header h3 {
                color: #3b82f6;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .btn-close {
                background: none;
                border: none;
                color: #999;
                font-size: 1.5rem;
                cursor: pointer;
            }
            
            .cookie-category {
                margin-bottom: 1.5rem;
                padding: 1rem;
                background: #2A2A2A;
                border-radius: 8px;
            }
            
            .cookie-category-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            
            .cookie-category-header h4 {
                color: #ffffff;
            }
            
            .cookie-category p {
                color: #999;
                font-size: 0.9rem;
            }
            
            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 24px;
            }
            
            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #6b7280;
                transition: .4s;
                border-radius: 24px;
            }
            
            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            
            input:checked + .toggle-slider {
                background-color: #10b981;
            }
            
            input:checked + .toggle-slider:before {
                transform: translateX(26px);
            }
            
            input:disabled + .toggle-slider {
                background-color: #3b82f6;
                cursor: not-allowed;
            }
            
            .cookie-preferences-footer {
                display: flex;
                gap: 1rem;
                margin-top: 1.5rem;
                justify-content: flex-end;
            }
            
            .cookie-preferences-footer button {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .btn-save-preferences {
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: white;
            }
            
            .btn-accept-all-modal {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
            }
            
            .cookie-preferences-footer button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            @media (max-width: 768px) {
                .cookie-consent-content {
                    flex-direction: column;
                    text-align: center;
                }
                
                .cookie-consent-actions {
                    justify-content: center;
                }
                
                .cookie-preferences-footer {
                    flex-direction: column;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Create global instance
const cookieConsent = new CookieConsent();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    cookieConsent.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CookieConsent, cookieConsent };
} else {
    window.CookieConsent = CookieConsent;
    window.cookieConsent = cookieConsent;
}
