import React, { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import './AudienceInsights.css';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

/**
 * AudienceInsights Component
 * 
 * Displays audience insights and visitor analytics including:
 * - Top visitor areas by borough
 * - Device usage (mobile vs desktop)
 * - Most active days and times
 * 
 * Auto-refreshes every 60 seconds
 */

const AudienceInsights = ({ businessId: propBusinessId }) => {
    // Get businessId from URL or props
    const urlBusinessId = getBusinessIdFromURL();
    const businessId = propBusinessId || urlBusinessId || 'default-business';
    
    // State for insights data
    const [insights, setInsights] = useState({
        topBoroughs: [],
        deviceUsage: { mobile: 0, desktop: 0 },
        activePeriods: []
    });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    
    // Date range state
    const [dateRange, setDateRange] = useState('7d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    
    // API base URL (configurable for different deployments)
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
    
    /**
     * Build API URL based on selected date range
     */
    const buildApiUrl = () => {
        const baseUrl = `${API_BASE_URL}/api/audience-insights?businessId=${encodeURIComponent(businessId)}`;
        
        if (dateRange === 'custom' && customFrom && customTo) {
            return `${baseUrl}&from=${customFrom}&to=${customTo}`;
        }
        
        const days = dateRange === '30d' ? 30 : 7;
        const from = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
        const to = new Date().toISOString().split('T')[0];
        
        return `${baseUrl}&from=${from}&to=${to}`;
    };
    
    /**
     * Fetch audience insights from the API
     */
    const fetchInsights = async () => {
        try {
            setError(null);
            const response = await fetch(buildApiUrl());
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            setInsights(data);
            setLastUpdated(new Date());
            
        } catch (err) {
            console.error('Error fetching audience insights:', err);
            setError(err.message);
            // Set fallback data on error
            setInsights({
                topBoroughs: [],
                deviceUsage: { mobile: 0, desktop: 0 },
                activePeriods: []
            });
        } finally {
            setLoading(false);
        }
    };
    
    /**
     * Format day of week number to readable string
     */
    const formatDayOfWeek = (dayOfWeek) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayOfWeek - 1] || `Day ${dayOfWeek}`;
    };
    
    /**
     * Format hour to readable time
     */
    const formatHour = (hour) => {
        return `${hour}:00`;
    };
    
    // Fetch data on mount and when date range changes
    useEffect(() => {
        fetchInsights();
        
        // Set up auto-refresh every 60 seconds
        const interval = setInterval(fetchInsights, 60000);
        
        // Cleanup on unmount
        return () => clearInterval(interval);
    }, [businessId, dateRange, customFrom, customTo]);
    
    // Render loading state
    if (loading) {
        return (
            <div className="audience-insights">
                <div className="loading-state">
                    <h2>Loading Audience Insights...</h2>
                    <p>Fetching visitor analytics for business: {businessId}</p>
                </div>
            </div>
        );
    }
    
    // Render error state
    if (error) {
        return (
            <div className="audience-insights">
                <div className="error-state">
                    <h2>Error Loading Audience Insights</h2>
                    <p>{error}</p>
                    <button onClick={fetchInsights} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }
    
    // Prepare chart data
    const deviceChartData = {
        labels: ['Mobile', 'Desktop'],
        datasets: [{
            data: [
                insights.deviceUsage.mobile || 0,
                insights.deviceUsage.desktop || 0
            ],
            backgroundColor: ['#36A2EB', '#FFCE56'],
            borderColor: ['#36A2EB', '#FFCE56'],
            borderWidth: 1
        }]
    };
    
    const activePeriodsChartData = {
        labels: insights.activePeriods.map(p => 
            `${formatDayOfWeek(p.dayOfWeek)}, ${formatHour(p.hour)}`
        ),
        datasets: [{
            label: 'Profile Views',
            data: insights.activePeriods.map(p => p.count),
            backgroundColor: '#4BC0C0',
            borderColor: '#4BC0C0',
            borderWidth: 1
        }]
    };
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
            title: {
                display: false
            }
        }
    };
    
    const barChartOptions = {
        ...chartOptions,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    };
    
    // Render main component
    return (
        <div className="audience-insights">
        <div className="insights-header">
            <h2>Audience Insights</h2>
            <p>Visitor analytics and engagement patterns</p>
            {lastUpdated && (
                <p className="last-updated">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
            )}
        </div>
        
        {/* Date range selector */}
        <div className="range-selector">
            <label htmlFor="dateRange">Time Period:</label>
            <select 
                id="dateRange"
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="range-select"
            >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="custom">Custom Range</option>
            </select>
            
            {dateRange === 'custom' && (
                <div className="custom-range">
                    <input 
                        type="date" 
                        value={customFrom} 
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="date-input"
                        placeholder="From date"
                    />
                    <span>to</span>
                    <input 
                        type="date" 
                        value={customTo} 
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="date-input"
                        placeholder="To date"
                    />
                </div>
            )}
        </div>
            
            <div className="insights-grid">
                {/* Top Visitor Areas by Borough */}
                <div className="insight-box">
                    <h3>Top Visitor Areas by Borough</h3>
                    {insights.topBoroughs.length > 0 ? (
                        <ul className="borough-list">
                            {insights.topBoroughs.map((borough, index) => (
                                <li key={index} className="borough-item">
                                    <span className="borough-name">{borough.borough}</span>
                                    <span className="borough-count">{borough.count}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-data">No location data available</p>
                    )}
                </div>
                
                {/* Device Usage */}
                <div className="insight-box">
                    <h3>Device Usage</h3>
                    {insights.deviceUsage.mobile > 0 || insights.deviceUsage.desktop > 0 ? (
                        <div className="chart-container">
                            <Pie data={deviceChartData} options={chartOptions} />
                        </div>
                    ) : (
                        <p className="no-data">No device data available</p>
                    )}
                </div>
                
                {/* Most Active Days & Times */}
                <div className="insight-box">
                    <h3>Most Active Days & Times</h3>
                    {insights.activePeriods.length > 0 ? (
                        <div className="chart-container">
                            <Bar data={activePeriodsChartData} options={barChartOptions} />
                        </div>
                    ) : (
                        <p className="no-data">No activity data available</p>
                    )}
                </div>
            </div>
            
            <div className="insights-footer">
                <p>Data refreshes automatically every 60 seconds</p>
                <button onClick={fetchInsights} className="refresh-button">
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

export default AudienceInsights;
