import { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';

export default function ContactEngagementAnalytics() {
    const businessId = getBusinessIdFromURL();
    const [stats, setStats] = useState({
        trend: [],
        breakdown: {},
        conversions: {},
        totalPositiveOutcomes: 0,
        positiveRate: 0
    });

    const fetchData = async () => {
        const res = await fetch(`/api/contact-engagement?businessId=${businessId}&days=30`);
        const json = await res.json();
        setStats(json);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    // Trend Chart
    const trendChartData = {
        labels: stats.trend.map(t => t.date),
        datasets: [{
            label: 'Contact Engagement (Last 30 Days)',
            data: stats.trend.map(t => t.total),
            borderColor: '#FF6384',
            backgroundColor: 'rgba(255,99,132,0.25)',
            fill: true,
            tension: 0.3
        }]
    };

    // Breakdown Bar Chart
    const breakdownChartData = {
        labels: ['Phone', 'Email', 'Form', 'Directions'],
        datasets: [{
            label: 'Contact Method Clicks',
            data: [
                stats.breakdown.phone || 0,
                stats.breakdown.email || 0,
                stats.breakdown.form || 0,
                stats.breakdown.directions || 0
            ],
            backgroundColor: ['#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
        }]
    };

    return (
        <div className="contact-engagement-dashboard">
            <h2>Contact Engagement & Conversion Analytics</h2>

            <div className="trend-section">
                <h3>Engagement Trend (30 Days)</h3>
                <Line data={trendChartData} />
            </div>

            <div className="breakdown-section">
                <h3>Engagement Breakdown</h3>
                <Bar data={breakdownChartData} />
            </div>

            <div className="conversion-section">
                <h3>Conversion Analysis</h3>
                <div className="conversion-grid">
                    <div className="conversion-box">
                        <h4>Bookings</h4>
                        <p>{stats.conversions.bookings || 0}</p>
                    </div>
                    <div className="conversion-box">
                        <h4>Enquiries</h4>
                        <p>{stats.conversions.enquiries || 0}</p>
                    </div>
                    <div className="conversion-box">
                        <h4>Store Visits</h4>
                        <p>{stats.conversions.visits || 0}</p>
                    </div>
                    <div className="conversion-box">
                        <h4>Total Positive Outcomes</h4>
                        <p>{stats.totalPositiveOutcomes}</p>
                    </div>
                    <div className="conversion-box">
                        <h4>Overall Positive Rate</h4>
                        <p>{stats.positiveRate.toFixed(1)}%</p>
                    </div>
                </div>
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
