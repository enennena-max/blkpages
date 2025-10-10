import React, { useState, useEffect } from 'react';
import './BusinessAnalyticsDashboard.css';

/**
 * Business Analytics Dashboard Component
 * 
 * Displays real-time analytics for a business including:
 * - Profile Views
 * - Search Impressions  
 * - Contact Clicks
 * - Enquiries Received
 * 
 * Each metric shows: Total, Today, Growth Rate
 * Auto-refreshes every 60 seconds
 */

const BusinessAnalyticsDashboard = ({ businessId: propBusinessId }) => {
    // Get businessId from URL or props
    const urlBusinessId = getBusinessIdFromURL();
    const businessId = propBusinessId || urlBusinessId || 'default-business';
    
    // State for analytics data
    const [stats, setStats] = useState({
        profileView: { total: 0, today: 0, growthRate: 0 },
        searchImpression: { total: 0, today: 0, growthRate: 0 },
        contactClick: { total: 0, today: 0, growthRate: 0 },
        enquiryReceived: { total: 0, today: 0, growthRate: 0 }
    });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    
    // API base URL (configurable for different deployments)
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
    
    /**
     * Fetch analytics data from the API
     */
    const fetchStats = async () => {
        try {
            setError(null);
            const response = await fetch(`${API_BASE_URL}/api/analytics?businessId=${encodeURIComponent(businessId)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            setStats(data);
            setLastUpdated(new Date());
            
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError(err.message);
            // Set fallback data on error
            setStats({
                profileView: { total: 0, today: 0, growthRate: 0 },
                searchImpression: { total: 0, today: 0, growthRate: 0 },
                contactClick: { total: 0, today: 0, growthRate: 0 },
                enquiryReceived: { total: 0, today: 0, growthRate: 0 }
            });
        } finally {
            setLoading(false);
        }
    };
    
    /**
     * Format growth rate with appropriate styling
     */
    const formatGrowthRate = (rate) => {
        const formatted = rate >= 0 ? `+${rate.toFixed(1)}%` : `${rate.toFixed(1)}%`;
        return {
            text: formatted,
            className: rate >= 0 ? 'positive' : 'negative'
        };
    };
    
    /**
     * Get metric display name
     */
    const getMetricName = (metricType) => {
        const names = {
            profileView: 'Profile Views',
            searchImpression: 'Search Impressions',
            contactClick: 'Contact Clicks',
            enquiryReceived: 'Enquiries Received'
        };
        return names[metricType] || metricType;
    };
    
    // Fetch data on mount and set up auto-refresh
    useEffect(() => {
        fetchStats();
        
        // Set up auto-refresh every 60 seconds
        const interval = setInterval(fetchStats, 60000);
        
        // Cleanup on unmount
        return () => clearInterval(interval);
    }, [businessId]);
    
    // Render loading state
    if (loading) {
        return (
            <div className="analytics-container">
                <div className="loading-state">
                    <h2>Loading Analytics...</h2>
                    <p>Fetching data for business: {businessId}</p>
                </div>
            </div>
        );
    }
    
    // Render error state
    if (error) {
        return (
            <div className="analytics-container">
                <div className="error-state">
                    <h2>Error Loading Analytics</h2>
                    <p>{error}</p>
                    <button onClick={fetchStats} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }
    
    // Render main dashboard
    return (
        <div className="analytics-container">
            <div className="dashboard-header">
                <h1>Business Analytics Dashboard</h1>
                <p>Business ID: {businessId}</p>
                {lastUpdated && (
                    <p className="last-updated">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                )}
            </div>
            
            <div className="metrics-grid">
                {Object.entries(stats).map(([metricType, data]) => {
                    const growth = formatGrowthRate(data.growthRate);
                    const metricName = getMetricName(metricType);
                    
                    return (
                        <div key={metricType} className="metric-box">
                            <h3>{metricName}</h3>
                            <p><strong>Total:</strong> {data.total.toLocaleString()}</p>
                            <p><strong>Today:</strong> {data.today.toLocaleString()}</p>
                            <p className={growth.className}>
                                <strong>Growth:</strong> {growth.text}
                            </p>
                        </div>
                    );
                })}
            </div>
            
            <div className="dashboard-footer">
                <p>Data refreshes automatically every 60 seconds</p>
                <button onClick={fetchStats} className="refresh-button">
                    Refresh Now
                </button>
            </div>
        </div>
    );
};

/**
 * Helper function to extract businessId from URL
 */
function getBusinessIdFromURL() {
    try {
        const url = new URL(window.location.href);
        return url.searchParams.get('businessId') || '';
    } catch (error) {
        console.error('Error parsing URL:', error);
        return '';
    }
}

export default BusinessAnalyticsDashboard;
