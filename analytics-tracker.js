// BLKPAGES Analytics Tracking System
class AnalyticsTracker {
    constructor() {
        this.businessId = 'royalHairStudio';
        this.storageKey = 'businessAnalytics';
    }
    
    // Initialize analytics data structure
    initializeAnalyticsData(businessId = this.businessId) {
        let analyticsData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        
        if (!analyticsData[businessId]) {
            analyticsData[businessId] = {
                totalViews: 0,
                dailyViews: {},
                lastView: null,
                viewHistory: [],
                searchImpressions: 0,
                dailySearchImpressions: {},
                contactClicks: 0,
                dailyContactClicks: {},
                enquiries: 0,
                dailyEnquiries: {}
            };
        }
        
        // Ensure all required objects exist
        if (!analyticsData[businessId].dailyViews) {
            analyticsData[businessId].dailyViews = {};
        }
        if (!analyticsData[businessId].dailySearchImpressions) {
            analyticsData[businessId].dailySearchImpressions = {};
        }
        if (!analyticsData[businessId].dailyContactClicks) {
            analyticsData[businessId].dailyContactClicks = {};
        }
        if (!analyticsData[businessId].dailyEnquiries) {
            analyticsData[businessId].dailyEnquiries = {};
        }
        if (!analyticsData[businessId].viewHistory) {
            analyticsData[businessId].viewHistory = [];
        }
        
        // Save initialized data
        localStorage.setItem(this.storageKey, JSON.stringify(analyticsData));
        
        return analyticsData;
    }
    
    // Track profile views
    trackProfileView(businessId = this.businessId) {
        try {
            const currentDate = new Date().toISOString().split('T')[0];
            const currentTime = new Date().toISOString();
            
            let analyticsData = this.initializeAnalyticsData(businessId);
            
            // Update view counts
            analyticsData[businessId].totalViews += 1;
            analyticsData[businessId].lastView = currentTime;
            
            // Update daily views
            if (!analyticsData[businessId].dailyViews[currentDate]) {
                analyticsData[businessId].dailyViews[currentDate] = 0;
            }
            analyticsData[businessId].dailyViews[currentDate] += 1;
            
            // Add to view history (keep last 100 views)
            analyticsData[businessId].viewHistory.push({
                timestamp: currentTime,
                date: currentDate,
                userAgent: navigator.userAgent,
                referrer: document.referrer || 'Direct'
            });
            
            // Keep only last 100 views
            if (analyticsData[businessId].viewHistory.length > 100) {
                analyticsData[businessId].viewHistory = analyticsData[businessId].viewHistory.slice(-100);
            }
            
            // Save updated analytics
            localStorage.setItem(this.storageKey, JSON.stringify(analyticsData));
            
            // Trigger analytics update event
            window.dispatchEvent(new CustomEvent('analyticsUpdated', {
                detail: { 
                    businessId: businessId,
                    totalViews: analyticsData[businessId].totalViews,
                    dailyViews: analyticsData[businessId].dailyViews[currentDate]
                }
            }));
            
            console.log('Profile view tracked:', {
                businessId: businessId,
                totalViews: analyticsData[businessId].totalViews,
                todayViews: analyticsData[businessId].dailyViews[currentDate]
            });
            
            return true;
        } catch (error) {
            console.error('Error tracking profile view:', error);
            return false;
        }
    }
    
    // Track search impressions
    trackSearchImpressions(businesses, businessId = this.businessId) {
        try {
            const currentDate = new Date().toISOString().split('T')[0];
            const currentTime = new Date().toISOString();
            
            console.log('Tracking search impressions for', businesses.length, 'businesses');
            
            businesses.forEach(business => {
                const targetBusinessId = business.id || businessId;
                let analyticsData = this.initializeAnalyticsData(targetBusinessId);
                
                // Update search impressions
                analyticsData[targetBusinessId].searchImpressions += 1;
                
                // Update daily search impressions
                if (!analyticsData[targetBusinessId].dailySearchImpressions[currentDate]) {
                    analyticsData[targetBusinessId].dailySearchImpressions[currentDate] = 0;
                }
                analyticsData[targetBusinessId].dailySearchImpressions[currentDate] += 1;
                
                // Save updated analytics
                localStorage.setItem(this.storageKey, JSON.stringify(analyticsData));
                
                console.log(`Search impression tracked for ${business.name}:`, {
                    businessId: targetBusinessId,
                    totalImpressions: analyticsData[targetBusinessId].searchImpressions,
                    todayImpressions: analyticsData[targetBusinessId].dailySearchImpressions[currentDate]
                });
            });
            
            // Trigger analytics update event
            window.dispatchEvent(new CustomEvent('analyticsUpdated', {
                detail: { 
                    type: 'searchImpressions',
                    count: businesses.length
                }
            }));
            
            console.log('Search impressions tracking completed for', businesses.length, 'businesses');
            return true;
        } catch (error) {
            console.error('Error tracking search impressions:', error);
            return false;
        }
    }
    
    // Track contact clicks
    trackContactClick(action, businessId = this.businessId) {
        try {
            const currentDate = new Date().toISOString().split('T')[0];
            const currentTime = new Date().toISOString();
            
            let analyticsData = this.initializeAnalyticsData(businessId);
            
            // Update contact clicks
            analyticsData[businessId].contactClicks += 1;
            
            // Update daily contact clicks
            if (!analyticsData[businessId].dailyContactClicks[currentDate]) {
                analyticsData[businessId].dailyContactClicks[currentDate] = 0;
            }
            analyticsData[businessId].dailyContactClicks[currentDate] += 1;
            
            // Save updated analytics
            localStorage.setItem(this.storageKey, JSON.stringify(analyticsData));
            
            // Trigger analytics update event
            window.dispatchEvent(new CustomEvent('analyticsUpdated', {
                detail: { 
                    businessId: businessId,
                    type: 'contactClick',
                    action: action,
                    totalClicks: analyticsData[businessId].contactClicks,
                    todayClicks: analyticsData[businessId].dailyContactClicks[currentDate]
                }
            }));
            
            console.log(`Contact click tracked (${action}):`, {
                businessId: businessId,
                totalClicks: analyticsData[businessId].contactClicks,
                todayClicks: analyticsData[businessId].dailyContactClicks[currentDate]
            });
            
            return true;
        } catch (error) {
            console.error('Error tracking contact click:', error);
            return false;
        }
    }
    
    // Track enquiries
    trackEnquiry(type, businessId = this.businessId) {
        try {
            const currentDate = new Date().toISOString().split('T')[0];
            const currentTime = new Date().toISOString();
            
            let analyticsData = this.initializeAnalyticsData(businessId);
            
            // Update enquiries
            analyticsData[businessId].enquiries += 1;
            
            // Update daily enquiries
            if (!analyticsData[businessId].dailyEnquiries[currentDate]) {
                analyticsData[businessId].dailyEnquiries[currentDate] = 0;
            }
            analyticsData[businessId].dailyEnquiries[currentDate] += 1;
            
            // Save updated analytics
            localStorage.setItem(this.storageKey, JSON.stringify(analyticsData));
            
            // Trigger analytics update event
            window.dispatchEvent(new CustomEvent('analyticsUpdated', {
                detail: { 
                    businessId: businessId,
                    type: 'enquiry',
                    enquiryType: type,
                    totalEnquiries: analyticsData[businessId].enquiries,
                    todayEnquiries: analyticsData[businessId].dailyEnquiries[currentDate]
                }
            }));
            
            console.log(`Enquiry tracked (${type}):`, {
                businessId: businessId,
                totalEnquiries: analyticsData[businessId].enquiries,
                todayEnquiries: analyticsData[businessId].dailyEnquiries[currentDate]
            });
            
            return true;
        } catch (error) {
            console.error('Error tracking enquiry:', error);
            return false;
        }
    }
    
    // Get analytics data
    getAnalyticsData(businessId = this.businessId) {
        try {
            const analyticsData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            return analyticsData[businessId] || null;
        } catch (error) {
            console.error('Error getting analytics data:', error);
            return null;
        }
    }
    
    // Clear analytics data
    clearAnalyticsData(businessId = this.businessId) {
        try {
            let analyticsData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            delete analyticsData[businessId];
            localStorage.setItem(this.storageKey, JSON.stringify(analyticsData));
            console.log('Analytics data cleared for business:', businessId);
            return true;
        } catch (error) {
            console.error('Error clearing analytics data:', error);
            return false;
        }
    }
}

// Create global instance
window.analyticsTracker = new AnalyticsTracker();

// Global functions for backward compatibility
window.trackProfileView = function() {
    return window.analyticsTracker.trackProfileView();
};

window.trackSearchImpressions = function(businesses) {
    return window.analyticsTracker.trackSearchImpressions(businesses);
};

window.trackContactClick = function(action) {
    return window.analyticsTracker.trackContactClick(action);
};

window.trackEnquiry = function(type) {
    return window.analyticsTracker.trackEnquiry(type);
};
