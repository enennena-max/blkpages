import { useEffect, useState } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';

function formatMinutes(mins) {
    if (!mins || mins <= 0) return '—';
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getBusinessIdFromURL() {
    const u = new URL(window.location.href);
    return u.searchParams.get('businessId') || '';
}

export default function EnquiriesReceivedAnalytics() {
    const businessId = getBusinessIdFromURL();
    const [data, setData] = useState({
        totalEnquiries: 0,
        enquiriesLast24h: 0,
        growthRate: 0,
        averageResponseMinutes: 0,
        trend: [],
        typeBreakdown: { booking: 0, question: 0, information: 0, feedback: 0 },
        responsePerformance: { fast: 0, moderate: 0, slow: 0 }
    });

    const fetchData = async () => {
        const res = await fetch(`/api/enquiries-analytics?businessId=${encodeURIComponent(businessId)}&days=30`);
        const json = await res.json();
        setData(json);
    };

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 60000);
        return () => clearInterval(id);
    }, []);

    const trendData = {
        labels: data.trend.map(t => t.date),
        datasets: [{
            label: 'Enquiries per Day (30d)',
            data: data.trend.map(t => t.enquiries),
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54,162,235,0.25)',
            tension: 0.3,
            fill: true
        }]
    };

    const typesPie = {
        labels: ['Booking', 'Question', 'Information', 'Feedback'],
        datasets: [{
            data: [
                data.typeBreakdown.booking,
                data.typeBreakdown.question,
                data.typeBreakdown.information,
                data.typeBreakdown.feedback
            ],
            backgroundColor: ['#4BC0C0', '#FF6384', '#FFCE56', '#9966FF']
        }]
    };

    const perfBar = {
        labels: ['Fast (≤15m)', 'Moderate (16–60m)', 'Slow (>60m)'],
        datasets: [{
            label: 'Responses',
            data: [
                data.responsePerformance.fast,
                data.responsePerformance.moderate,
                data.responsePerformance.slow
            ],
            backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c']
        }]
    };

    return (
        <div className="enquiries-analytics">
            <h2>Enquiries Received Analytics</h2>

            <div className="stats-grid">
                <div className="metric-box">
                    <h4>Total Enquiries</h4>
                    <p>{data.totalEnquiries}</p>
                </div>
                <div className="metric-box">
                    <h4>Last 24 Hours</h4>
                    <p>{data.enquiriesLast24h}</p>
                </div>
                <div className="metric-box">
                    <h4>Growth Rate</h4>
                    <p className={data.growthRate >= 0 ? 'positive' : 'negative'}>
                        {data.growthRate >= 0 ? '+' : ''}{data.growthRate.toFixed(1)}%
                    </p>
                </div>
                <div className="metric-box">
                    <h4>Avg Response Time</h4>
                    <p>{formatMinutes(data.averageResponseMinutes)}</p>
                </div>
            </div>

            <div className="card">
                <h3>Enquiry Volume (Last 30 Days)</h3>
                <Line data={trendData} />
            </div>

            <div className="grid-2">
                <div className="card">
                    <h3>Enquiry Type Breakdown</h3>
                    <Pie data={typesPie} />
                </div>
                <div className="card">
                    <h3>Response Time Performance</h3>
                    <Bar data={perfBar} options={{ scales: { y: { beginAtZero: true } } }} />
                </div>
            </div>
        </div>
    );
}
