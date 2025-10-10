import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

export default function SearchImpressionsAnalytics() {
    const businessId = getBusinessIdFromURL();
    const [stats, setStats] = useState({
        totalImpressions: 0,
        todayImpressions: 0,
        growthRate: 0,
        conversionRate: 0,
        trend: []
    });

    const fetchStats = async () => {
        const res = await fetch(`/api/search-impressions?businessId=${businessId}&days=30`);
        const json = await res.json();
        setStats(json);
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    const chartData = {
        labels: stats.trend.map(t => t.date),
        datasets: [{
            label: 'Daily Impressions (30-Day Trend)',
            data: stats.trend.map(t => t.impressions),
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54,162,235,0.25)',
            fill: true,
            tension: 0.3
        }]
    };

    const ctr = stats.conversionRate.toFixed(1);

    return (
        <div className="search-impressions-dashboard">
            <h2>Search Impressions Analytics</h2>
            <div className="stats-grid">
                <div className="metric-box">
                    <h4>Total Impressions</h4>
                    <p>{stats.totalImpressions}</p>
                </div>
                <div className="metric-box">
                    <h4>Today's Impressions</h4>
                    <p>{stats.todayImpressions}</p>
                </div>
                <div className="metric-box">
                    <h4>Growth Rate</h4>
                    <p className={stats.growthRate >= 0 ? 'positive' : 'negative'}>
                        {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
                    </p>
                </div>
                <div className="metric-box">
                    <h4>Impressions → Clicks</h4>
                    <p>{stats.conversionRate.toFixed(1)}%</p>
                </div>
            </div>

            <div className="trend-section">
                <h3>Impressions Trend (Last 30 Days)</h3>
                <Line data={chartData} />
            </div>

            <div className="ctr-summary">
                <h3>Click-Through Rate</h3>
                <p>{ctr}% of all impressions became profile clicks</p>
            </div>
        </div>
    );
}

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
