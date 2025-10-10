/**
 * Business Sync System
 * Handles synchronization between Business Dashboard and public-facing pages
 * Ensures single source of truth for business data
 */

class BusinessSyncSystem {
    constructor() {
        this.storageKey = 'blkpages_businesses';
        this.syncKey = 'blkpages_business_sync';
        this.lastSyncTime = null;
        this.syncInterval = 30000; // 30 seconds
        this.init();
    }

    init() {
        // Load last sync time
        this.lastSyncTime = localStorage.getItem(this.syncKey + '_last_sync');
        
        // Set up periodic sync
        this.startPeriodicSync();
        
        // Listen for storage changes (cross-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.handleStorageChange();
            }
        });
    }

    /**
     * Get business data with sync awareness
     */
    getBusiness(businessId) {
        const businesses = this.getBusinesses();
        return businesses.find(b => 
            b.id === businessId || 
            b.name.toLowerCase().replace(/\s+/g, '-') === businessId
        );
    }

    /**
     * Get all businesses
     */
    getBusinesses() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading businesses:', error);
            return [];
        }
    }

    /**
     * Update business data (called from dashboard)
     */
    updateBusiness(businessId, updates) {
        const businesses = this.getBusinesses();
        const businessIndex = businesses.findIndex(b => b.id === businessId);
        
        if (businessIndex !== -1) {
            // Update business data
            businesses[businessIndex] = {
                ...businesses[businessIndex],
                ...updates,
                lastUpdated: new Date().toISOString()
            };
            
            // Save to storage
            this.saveBusinesses(businesses);
            
            // Trigger sync event
            this.triggerSyncEvent(businessId, updates);
            
            return businesses[businessIndex];
        }
        
        return null;
    }

    /**
     * Save businesses to storage
     */
    saveBusinesses(businesses) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(businesses));
            localStorage.setItem(this.syncKey + '_last_sync', new Date().toISOString());
            this.lastSyncTime = new Date().toISOString();
        } catch (error) {
            console.error('Error saving businesses:', error);
        }
    }

    /**
     * Trigger sync event for other components
     */
    triggerSyncEvent(businessId, updates) {
        const event = new CustomEvent('businessUpdated', {
            detail: {
                businessId,
                updates,
                timestamp: new Date().toISOString()
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * Handle storage changes from other tabs
     */
    handleStorageChange() {
        const event = new CustomEvent('businessDataChanged', {
            detail: {
                timestamp: new Date().toISOString()
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * Start periodic sync
     */
    startPeriodicSync() {
        setInterval(() => {
            this.performSync();
        }, this.syncInterval);
    }

    /**
     * Perform sync check
     */
    performSync() {
        const currentSyncTime = localStorage.getItem(this.syncKey + '_last_sync');
        
        if (currentSyncTime && currentSyncTime !== this.lastSyncTime) {
            this.lastSyncTime = currentSyncTime;
            this.handleStorageChange();
        }
    }

    /**
     * Get sync status
     */
    getSyncStatus() {
        return {
            lastSync: this.lastSyncTime,
            isOnline: navigator.onLine,
            syncInterval: this.syncInterval
        };
    }

    /**
     * Force sync
     */
    forceSync() {
        this.performSync();
        return this.getSyncStatus();
    }
}

/**
 * Business Card Sync Manager
 * Handles real-time updates for business cards on search/browse pages
 */
class BusinessCardSyncManager {
    constructor() {
        this.syncSystem = new BusinessSyncSystem();
        this.observers = new Map();
        this.init();
    }

    init() {
        // Listen for business updates
        window.addEventListener('businessUpdated', (e) => {
            this.handleBusinessUpdate(e.detail);
        });

        window.addEventListener('businessDataChanged', (e) => {
            this.handleDataChange(e.detail);
        });
    }

    /**
     * Register a business card for sync updates
     */
    registerCard(businessId, updateCallback) {
        this.observers.set(businessId, updateCallback);
    }

    /**
     * Unregister a business card
     */
    unregisterCard(businessId) {
        this.observers.delete(businessId);
    }

    /**
     * Handle business update
     */
    handleBusinessUpdate(detail) {
        const { businessId, updates } = detail;
        const callback = this.observers.get(businessId);
        
        if (callback) {
            callback(updates);
        }
    }

    /**
     * Handle data change
     */
    handleDataChange(detail) {
        // Refresh all registered cards
        this.observers.forEach((callback, businessId) => {
            const business = this.syncSystem.getBusiness(businessId);
            if (business) {
                callback(business);
            }
        });
    }

    /**
     * Get business data
     */
    getBusiness(businessId) {
        return this.syncSystem.getBusiness(businessId);
    }
}

/**
 * Business Profile Sync Manager
 * Handles real-time updates for business profile pages
 */
class BusinessProfileSyncManager {
    constructor() {
        this.syncSystem = new BusinessSyncSystem();
        this.currentBusinessId = null;
        this.updateCallback = null;
        this.init();
    }

    init() {
        // Listen for business updates
        window.addEventListener('businessUpdated', (e) => {
            this.handleBusinessUpdate(e.detail);
        });

        window.addEventListener('businessDataChanged', (e) => {
            this.handleDataChange(e.detail);
        });
    }

    /**
     * Set current business and update callback
     */
    setCurrentBusiness(businessId, updateCallback) {
        this.currentBusinessId = businessId;
        this.updateCallback = updateCallback;
    }

    /**
     * Handle business update
     */
    handleBusinessUpdate(detail) {
        const { businessId, updates } = detail;
        
        if (businessId === this.currentBusinessId && this.updateCallback) {
            this.updateCallback(updates);
        }
    }

    /**
     * Handle data change
     */
    handleDataChange(detail) {
        if (this.currentBusinessId && this.updateCallback) {
            const business = this.syncSystem.getBusiness(this.currentBusinessId);
            if (business) {
                this.updateCallback(business);
            }
        }
    }

    /**
     * Get business data
     */
    getBusiness(businessId) {
        return this.syncSystem.getBusiness(businessId);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BusinessSyncSystem,
        BusinessCardSyncManager,
        BusinessProfileSyncManager
    };
}

// Global instances
window.businessSyncSystem = new BusinessSyncSystem();
window.businessCardSyncManager = new BusinessCardSyncManager();
window.businessProfileSyncManager = new BusinessProfileSyncManager();
