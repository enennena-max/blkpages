import React, { useState, useEffect, useRef } from 'react';
import './BusinessPayoutsDashboard.css';

const BusinessPayoutsDashboard = () => {
    const [stats, setStats] = useState({
        total_earnings: 0,
        pending_payouts: 0,
        completed_payouts: 0,
        last_payout_date: null
    });
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPayoutsCount, setNewPayoutsCount] = useState(0);
    
    const wsRef = useRef(null);
    const businessId = getBusinessIdFromURL();

    // Get business ID from URL or use consistent business ID
    function getBusinessIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('businessId') || 'royal-hair-studio';
    }

    // Fetch payout statistics
    const fetchStats = async () => {
        try {
            const response = await fetch(`/api/businesses/${businessId}/payout-stats`);
            const data = await response.json();
            setStats(data);
            
            // Trigger highlight effect on stat cards
            highlightStatCards();
        } catch (error) {
            console.error('Error fetching payout stats:', error);
        }
    };

    // Add highlight effect to stat cards when updated
    const highlightStatCards = () => {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.style.transition = 'all 0.3s ease';
            card.style.transform = 'scale(1.05)';
            card.style.boxShadow = '0 8px 25px rgba(30, 144, 255, 0.3)';
            
            setTimeout(() => {
                card.style.transform = 'scale(1)';
                card.style.boxShadow = '';
            }, 500);
        });
    };

    // Fetch payouts list
    const fetchPayouts = async () => {
        try {
            const response = await fetch(`/api/businesses/${businessId}/payouts`);
            const data = await response.json();
            setPayouts(data);
        } catch (error) {
            console.error('Error fetching payouts:', error);
        }
    };

    // Fetch all data
    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([fetchStats(), fetchPayouts()]);
        setLoading(false);
    };

    // Initialize WebSocket connection
    const initializeWebSocket = () => {
        const wsUrl = `ws://localhost:5000`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
            console.log('Payouts WebSocket connected');
            // Join business room
            wsRef.current.send(JSON.stringify({
                type: 'join_business',
                businessId: businessId
            }));
        };

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'new_payout') {
                // Add new payout to the list with highlight effect
                const newPayout = {
                    id: data.id,
                    date: data.date,
                    amount: data.amount,
                    status: data.status,
                    method: data.method,
                    reference: data.reference
                };
                
                setPayouts(prev => [newPayout, ...prev]);
                setNewPayoutsCount(prev => prev + 1);
                
                // Update stats immediately
                fetchStats();
                
                // Show notification
                showNewPayoutNotification(newPayout);
                
                // Highlight the new payout row
                setTimeout(() => {
                    const newPayoutRow = document.querySelector(`[data-payout-id="${newPayout.id}"]`);
                    if (newPayoutRow) {
                        newPayoutRow.classList.add('new-payout-highlight');
                        setTimeout(() => {
                            newPayoutRow.classList.remove('new-payout-highlight');
                        }, 3000);
                    }
                }, 100);
            } else if (data.type === 'payout_updated') {
                // Update existing payout in the list
                setPayouts(prev => prev.map(payout => 
                    payout.id === data.id 
                        ? { ...payout, status: data.status }
                        : payout
                ));
                
                // Update stats
                fetchStats();
                
                // Show update notification
                showPayoutUpdateNotification(data);
            }
        };

        wsRef.current.onclose = () => {
            console.log('Payouts WebSocket disconnected, reconnecting...');
            setTimeout(initializeWebSocket, 3000);
        };

        wsRef.current.onerror = (error) => {
            console.error('Payouts WebSocket error:', error);
        };
    };

    // Show notification for new payout
    const showNewPayoutNotification = (payout) => {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'new-payout-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <strong>New Payout!</strong>
                <p>£${payout.amount} payout via ${payout.method}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    };

    // Show notification for payout update
    const showPayoutUpdateNotification = (data) => {
        const notification = document.createElement('div');
        notification.className = 'payout-update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <strong>Payout Updated!</strong>
                <p>Payout ${data.id} is now ${data.status}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    };

    // Clear new payouts count
    const clearNewPayoutsCount = () => {
        setNewPayoutsCount(0);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount);
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Completed':
                return 'status-badge completed';
            case 'Pending':
                return 'status-badge pending';
            case 'Failed':
                return 'status-badge failed';
            default:
                return 'status-badge';
        }
    };

    useEffect(() => {
        fetchAllData();
        initializeWebSocket();
        
        // Polling fallback every 30 seconds
        const pollInterval = setInterval(fetchAllData, 30000);
        
        return () => {
            clearInterval(pollInterval);
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [businessId]);

    if (loading) {
        return (
            <div className="payouts-dashboard">
                <div className="loading">Loading payouts...</div>
            </div>
        );
    }

    return (
        <div className="payouts-dashboard">
            <div className="dashboard-header">
                <h1>Payouts Dashboard</h1>
                <p>Track your earnings and payout history</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">💷</div>
                    <div className="stat-content">
                        <h3>{formatCurrency(stats.total_earnings)}</h3>
                        <p>Total Earnings</p>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <h3>{stats.pending_payouts}</h3>
                        <p>Pending Payouts</p>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{stats.completed_payouts}</h3>
                        <p>Completed Payouts</p>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <h3>{stats.last_payout_date ? formatDate(stats.last_payout_date) : 'N/A'}</h3>
                        <p>Last Payout Date</p>
                    </div>
                </div>
            </div>

            {/* Payouts Table */}
            <div className="payouts-section">
                <div className="section-header">
                    <h2>Payout History</h2>
                    {newPayoutsCount > 0 && (
                        <button 
                            className="new-payouts-badge"
                            onClick={clearNewPayoutsCount}
                        >
                            {newPayoutsCount} new
                        </button>
                    )}
                </div>
                
                <div className="payouts-table-container">
                    {payouts.length === 0 ? (
                        <div className="no-payouts">
                            <p>No payouts yet. Your earnings will appear here once processed.</p>
                        </div>
                    ) : (
                        <table className="payouts-table">
                            <thead>
                                <tr>
                                    <th>Payout ID</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Payment Method</th>
                                    <th>Reference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payouts.map((payout) => (
                                    <tr key={payout.id} data-payout-id={payout.id}>
                                        <td className="payout-id">{payout.id}</td>
                                        <td className="payout-date">{formatDate(payout.date)}</td>
                                        <td className="payout-amount">{formatCurrency(payout.amount)}</td>
                                        <td className="payout-status">
                                            <span className={getStatusBadgeClass(payout.status)}>
                                                {payout.status}
                                            </span>
                                        </td>
                                        <td className="payout-method">{payout.method}</td>
                                        <td className="payout-reference">{payout.reference}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BusinessPayoutsDashboard;
