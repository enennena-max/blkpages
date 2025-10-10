import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

export default function ContactClicksAnalytics() {
    const businessId = getBusinessIdFromURL();
    const [stats, setStats] = useState({
        totalClicks: 0,
        todaysClicks: 0,
        growthRate: 0,
        conversionRate: 0,
        trend: []
    });

    const fetchStats = async () => {
        const res = await fetch(`/api/contact-clicks?businessId=${businessId}&days=30`);
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
            label: 'Contact Clicks (Last 30 Days)',
            data: stats.trend.map(t => t.clicks),
            borderColor: '#4BC0C0',
            backgroundColor: 'rgba(75,192,192,0.25)',
            fill: true,
            tension: 0.3
        }]
    };

    return (
        <div className="contact-clicks-dashboard">
            <h2>Contact Clicks Analytics</h2>
            <div className="stats-grid">
                <div className="metric-box">
                    <h4>Total Contact Clicks</h4>
                    <p>{stats.totalClicks}</p>
                </div>
                <div className="metric-box">
                    <h4>Today's Clicks</h4>
                    <p>{stats.todaysClicks}</p>
                </div>
                <div className="metric-box">
                    <h4>Growth Rate</h4>
                    <p className={stats.growthRate >= 0 ? 'positive' : 'negative'}>
                        {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
                    </p>
                </div>
                <div className="metric-box">
                    <h4>Conversion (Impressions → Clicks)</h4>
                    <p>{stats.conversionRate.toFixed(1)}%</p>
                </div>
            </div>

            <div className="trend-section">
                <h3>30-Day Contact Clicks Trend</h3>
                <Line data={chartData} />
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
