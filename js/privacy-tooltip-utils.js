/**
 * Privacy Tooltip Utilities
 * Automatically adds privacy disclaimers to UI elements showing customer-linked data
 */

class PrivacyTooltipManager {
    constructor() {
        this.tooltips = new Map();
        this.initialized = false;
        this.privacyEnforcement = null;
    }
    
    /**
     * Initialize the privacy tooltip system
     */
    init() {
        if (this.initialized) return;
        
        // Load privacy enforcement system
        this.loadPrivacyEnforcement();
        
        // Add CSS styles
        this.addPrivacyStyles();
        
        // Scan for existing elements
        this.scanAndAddTooltips();
        
        // Set up mutation observer for dynamic content
        this.setupMutationObserver();
        
        // Add privacy enforcement status indicator
        this.addPrivacyStatusIndicator();
        
        this.initialized = true;
        console.log('Privacy Tooltip Manager initialized');
    }
    
    /**
     * Load privacy enforcement system
     */
    loadPrivacyEnforcement() {
        if (typeof privacyEnforcement !== 'undefined') {
            this.privacyEnforcement = privacyEnforcement;
        } else {
            console.warn('Privacy enforcement system not loaded');
        }
    }
    
    /**
     * Add privacy CSS styles to the page
     */
    addPrivacyStyles() {
        if (document.getElementById('privacy-tooltip-styles')) return;
        
        const link = document.createElement('link');
        link.id = 'privacy-tooltip-styles';
        link.rel = 'stylesheet';
        link.href = 'css/privacy-tooltips.css';
        document.head.appendChild(link);
    }
    
    /**
     * Scan page for elements that need privacy tooltips
     */
    scanAndAddTooltips() {
        // Scan for customer data elements
        const selectors = [
            '[data-customer-data]',
            '[data-booking-data]',
            '[data-review-data]',
            '[data-loyalty-data]',
            '[data-waitinglist-data]',
            '[data-analytics-data]',
            '.customer-name',
            '.booking-customer',
            '.review-customer',
            '.loyalty-customer',
            '.waitinglist-customer'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.addTooltipToElement(element);
            });
        });
    }
    
    /**
     * Add privacy tooltip to a specific element
     * @param {HTMLElement} element - Element to add tooltip to
     * @param {string} dataset - Dataset type for specific disclaimer
     */
    addTooltipToElement(element, dataset = null) {
        if (element.hasAttribute('data-privacy-tooltip')) return;
        
        // Get dataset from element attributes
        if (!dataset) {
            dataset = element.getAttribute('data-customer-data') ||
                     element.getAttribute('data-booking-data') ||
                     element.getAttribute('data-review-data') ||
                     element.getAttribute('data-loyalty-data') ||
                     element.getAttribute('data-waitinglist-data') ||
                     element.getAttribute('data-analytics-data') ||
                     'default';
        }
        
        // Get privacy disclaimer
        const disclaimer = this.getPrivacyDisclaimer(dataset);
        
        // Create tooltip wrapper
        const wrapper = document.createElement('span');
        wrapper.className = 'privacy-tooltip';
        wrapper.setAttribute('data-privacy-tooltip', 'true');
        wrapper.setAttribute('data-dataset', dataset);
        
        // Wrap the original element
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
        
        // Add tooltip icon
        const icon = document.createElement('span');
        icon.className = 'privacy-tooltip-icon';
        icon.innerHTML = 'P';
        icon.setAttribute('aria-label', 'Privacy information');
        icon.setAttribute('role', 'button');
        icon.setAttribute('tabindex', '0');
        wrapper.appendChild(icon);
        
        // Add tooltip content
        const content = document.createElement('div');
        content.className = 'privacy-tooltip-content';
        content.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px; color: #3b82f6;">
                <i class="fas fa-shield-alt"></i> Privacy Protected
            </div>
            <div>${disclaimer}</div>
        `;
        content.setAttribute('role', 'tooltip');
        content.setAttribute('aria-live', 'polite');
        wrapper.appendChild(content);
        
        // Store reference
        this.tooltips.set(element, {
            wrapper: wrapper,
            dataset: dataset,
            disclaimer: disclaimer
        });
        
        // Add keyboard support
        icon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTooltip(wrapper);
            }
        });
    }
    
    /**
     * Get privacy disclaimer for dataset
     * @param {string} dataset - Dataset type
     * @returns {string} Privacy disclaimer
     */
    getPrivacyDisclaimer(dataset) {
        if (this.privacyEnforcement) {
            return this.privacyEnforcement.getPrivacyDisclaimer(dataset);
        }
        
        // Fallback disclaimers
        const fallbackDisclaimers = {
            'bookings': 'Customer personal details are protected for privacy. Only essential booking information is shared with businesses.',
            'reviews': 'Reviews are anonymized. Customer contact details are never shared with businesses.',
            'loyalty': 'Loyalty progress is tracked anonymously. Personal details are protected.',
            'waitinglist': 'Only customer first name and service are shown to businesses for managing the waiting list.',
            'analytics': 'Analytics show aggregated, anonymized data only. Individual customer information is never exposed.',
            'default': 'Customer personal details are protected for privacy.'
        };
        
        return fallbackDisclaimers[dataset] || fallbackDisclaimers.default;
    }
    
    /**
     * Toggle tooltip visibility
     * @param {HTMLElement} wrapper - Tooltip wrapper element
     */
    toggleTooltip(wrapper) {
        const content = wrapper.querySelector('.privacy-tooltip-content');
        if (content) {
            const isVisible = content.style.visibility === 'visible';
            content.style.visibility = isVisible ? 'hidden' : 'visible';
            content.style.opacity = isVisible ? '0' : '1';
        }
    }
    
    /**
     * Add privacy disclaimer badge to element
     * @param {HTMLElement} element - Element to add badge to
     * @param {string} dataset - Dataset type
     */
    addPrivacyBadge(element, dataset = 'default') {
        const badge = document.createElement('span');
        badge.className = 'privacy-disclaimer-badge';
        badge.innerHTML = `
            <i class="fas fa-shield-alt"></i>
            <span>Privacy Protected</span>
        `;
        badge.setAttribute('title', this.getPrivacyDisclaimer(dataset));
        element.appendChild(badge);
    }
    
    /**
     * Add privacy notice to data table
     * @param {HTMLElement} table - Table element
     * @param {string} dataset - Dataset type
     */
    addPrivacyNoticeToTable(table, dataset = 'default') {
        const notice = document.createElement('tr');
        notice.className = 'privacy-notice-cell';
        notice.innerHTML = `
            <td colspan="100%" style="text-align: center;">
                <i class="fas fa-shield-alt"></i>
                ${this.getPrivacyDisclaimer(dataset)}
            </td>
        `;
        
        // Add to top of table body
        const tbody = table.querySelector('tbody');
        if (tbody) {
            tbody.insertBefore(notice, tbody.firstChild);
        }
    }
    
    /**
     * Set up mutation observer for dynamic content
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.scanElementForTooltips(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Scan element and its children for tooltip opportunities
     * @param {HTMLElement} element - Element to scan
     */
    scanElementForTooltips(element) {
        // Check if element itself needs tooltip
        if (this.elementNeedsTooltip(element)) {
            this.addTooltipToElement(element);
        }
        
        // Check children
        const children = element.querySelectorAll('[data-customer-data], [data-booking-data], [data-review-data], [data-loyalty-data], [data-waitinglist-data], [data-analytics-data]');
        children.forEach(child => {
            if (!child.hasAttribute('data-privacy-tooltip')) {
                this.addTooltipToElement(child);
            }
        });
    }
    
    /**
     * Check if element needs privacy tooltip
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} Whether element needs tooltip
     */
    elementNeedsTooltip(element) {
        const hasDataAttribute = element.hasAttribute('data-customer-data') ||
                                element.hasAttribute('data-booking-data') ||
                                element.hasAttribute('data-review-data') ||
                                element.hasAttribute('data-loyalty-data') ||
                                element.hasAttribute('data-waitinglist-data') ||
                                element.hasAttribute('data-analytics-data');
        
        const hasCustomerClass = element.classList.contains('customer-name') ||
                                element.classList.contains('booking-customer') ||
                                element.classList.contains('review-customer') ||
                                element.classList.contains('loyalty-customer') ||
                                element.classList.contains('waitinglist-customer');
        
        return hasDataAttribute || hasCustomerClass;
    }
    
    /**
     * Add privacy enforcement status indicator
     */
    addPrivacyStatusIndicator() {
        const status = document.createElement('div');
        status.id = 'privacy-enforcement-status';
        status.className = 'privacy-enforcement-status';
        status.innerHTML = `
            <i class="fas fa-shield-alt"></i>
            Privacy Protection Active
        `;
        document.body.appendChild(status);
        
        // Show briefly on page load
        setTimeout(() => {
            status.classList.add('show');
            setTimeout(() => {
                status.classList.remove('show');
            }, 3000);
        }, 1000);
    }
    
    /**
     * Show privacy enforcement status
     * @param {string} message - Status message
     * @param {number} duration - Display duration in ms
     */
    showPrivacyStatus(message = 'Privacy Protection Active', duration = 3000) {
        const status = document.getElementById('privacy-enforcement-status');
        if (status) {
            status.innerHTML = `
                <i class="fas fa-shield-alt"></i>
                ${message}
            `;
            status.classList.add('show');
            setTimeout(() => {
                status.classList.remove('show');
            }, duration);
        }
    }
    
    /**
     * Get privacy tooltip report
     * @returns {Object} Tooltip usage report
     */
    getTooltipReport() {
        return {
            totalTooltips: this.tooltips.size,
            tooltipsByDataset: this.getTooltipsByDataset(),
            initialized: this.initialized,
            privacyEnforcementLoaded: !!this.privacyEnforcement
        };
    }
    
    /**
     * Get tooltips grouped by dataset
     * @returns {Object} Tooltips grouped by dataset
     */
    getTooltipsByDataset() {
        const grouped = {};
        this.tooltips.forEach((tooltip, element) => {
            const dataset = tooltip.dataset;
            if (!grouped[dataset]) {
                grouped[dataset] = 0;
            }
            grouped[dataset]++;
        });
        return grouped;
    }
}

// Create global instance
const privacyTooltipManager = new PrivacyTooltipManager();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    privacyTooltipManager.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PrivacyTooltipManager, privacyTooltipManager };
} else {
    window.PrivacyTooltipManager = PrivacyTooltipManager;
    window.privacyTooltipManager = privacyTooltipManager;
}
