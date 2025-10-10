// BLKPAGES Analytics Backend API Simulation
// This simulates the backend API endpoints for analytics tracking
// In a real implementation, this would be server-side code

class AnalyticsBackendAPI {
    constructor() {
        this.baseURL = '/api'; // In real implementation, this would be your backend URL
        this.isSimulated = true; // Flag to indicate this is a simulation
    }
    
    // Simulate POST /api/profile-view endpoint
    async recordProfileView(businessId, timestamp, timeSpent = 0) {
        try {
            if (this.isSimulated) {
                // Store in localStorage for simulation
                const viewData = {
                    businessId,
                    timestamp: new Date(timestamp),
                    timeSpentSeconds: timeSpent,
                    id: Date.now().toString()
                };
                
                // Get existing views
                let views = JSON.parse(localStorage.getItem('profile_views') || '[]');
                views.push(viewData);
                
                // Keep only last 1000 views to prevent localStorage bloat
                if (views.length > 1000) {
                    views = views.slice(-1000);
                }
                
                localStorage.setItem('profile_views', JSON.stringify(views));
                
                console.log('Profile view recorded:', viewData);
                return { success: true, data: viewData };
            } else {
                // Real API call
                const response = await fetch(`${this.baseURL}/profile-view`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        businessId,
                        timestamp,
                        timeSpent
                    })
                });
                
                return await response.json();
            }
        } catch (error) {
            console.error('Error recording profile view:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Simulate GET /api/profile-stats endpoint
    async getProfileStats(businessId) {
        try {
            if (this.isSimulated) {
                // Get views from localStorage
                const views = JSON.parse(localStorage.getItem('profile_views') || '[]');
                const businessViews = views.filter(view => view.businessId === businessId);
                
                const now = new Date();
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                
                // Calculate stats
                const totalViews = businessViews.length;
                
                const todaysViews = businessViews.filter(view => 
                    new Date(view.timestamp) >= startOfToday
                ).length;
                
                const thisMonthViews = businessViews.filter(view => 
                    new Date(view.timestamp) >= startOfMonth
                ).length;
                
                const lastMonthViews = businessViews.filter(view => {
                    const viewDate = new Date(view.timestamp);
                    return viewDate >= startOfLastMonth && viewDate <= endOfLastMonth;
                }).length;
                
                // Calculate average time spent
                const totalTimeSpent = businessViews.reduce((sum, view) => sum + (view.timeSpentSeconds || 0), 0);
                const averageTime = totalTimeSpent > 0 ? totalTimeSpent / businessViews.length : 0;
                
                // Calculate growth rate
                const growthRate = lastMonthViews > 0 ? 
                    ((thisMonthViews - lastMonthViews) / lastMonthViews) * 100 : 0;
                
                const stats = {
                    totalViews,
                    todaysViews,
                    growthRate: Math.round(growthRate * 10) / 10, // Round to 1 decimal
                    averageTime: Math.round(averageTime)
                };
                
                console.log('Profile stats retrieved:', stats);
                return { success: true, data: stats };
            } else {
                // Real API call
                const response = await fetch(`${this.baseURL}/profile-stats?businessId=${businessId}`);
                return await response.json();
            }
        } catch (error) {
            console.error('Error getting profile stats:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Simulate real-time updates
    async subscribeToUpdates(businessId, callback) {
        if (this.isSimulated) {
            // Simulate real-time updates by polling localStorage
            const pollInterval = setInterval(async () => {
                const stats = await this.getProfileStats(businessId);
                if (stats.success) {
                    callback(stats.data);
                }
            }, 5000); // Poll every 5 seconds
            
            return () => clearInterval(pollInterval);
        } else {
            // Real WebSocket or Server-Sent Events implementation
            // This would connect to your real backend
            console.log('Real-time updates not implemented for simulation');
            return () => {};
        }
    }
    
    // Clear all analytics data (for testing)
    clearAllData() {
        if (this.isSimulated) {
            localStorage.removeItem('profile_views');
            console.log('All analytics data cleared');
            return true;
        }
        return false;
    }
    
    // Get all views for debugging
    getAllViews() {
        if (this.isSimulated) {
            return JSON.parse(localStorage.getItem('profile_views') || '[]');
        }
        return [];
    }
}

// Create global instance
window.analyticsBackendAPI = new AnalyticsBackendAPI();
