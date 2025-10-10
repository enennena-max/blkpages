import { useEffect, useState } from 'react';

function getBusinessIdFromURL() {
    const u = new URL(window.location.href);
    return u.searchParams.get('businessId') || '';
}

export default function BusinessBookingsDashboard() {
    const businessId = getBusinessIdFromURL();
    const [summary, setSummary] = useState({
        todaysCount: 0,
        totalCount: 0,
        completionRate: 0,
        monthlyRevenue: 0
    });
    const [services, setServices] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newBooking, setNewBooking] = useState({
        serviceId: '',
        customer: { name: '', phone: '', email: '' },
        startISO: '',
        notes: ''
    });

    const fetchSummary = async () => {
        try {
            const res = await fetch(`/api/bookings/summary?businessId=${businessId}`);
            const data = await res.json();
            setSummary(data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await fetch(`/api/bookings/services?businessId=${businessId}`);
            const data = await res.json();
            setServices(data);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const fetchBookings = async (status = 'all') => {
        try {
            const res = await fetch(`/api/bookings/list?businessId=${businessId}&status=${status}`);
            const data = await res.json();
            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const createBooking = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/bookings/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId,
                    ...newBooking
                })
            });
            
            if (res.ok) {
                setShowCreateForm(false);
                setNewBooking({
                    serviceId: '',
                    customer: { name: '', phone: '', email: '' },
                    startISO: '',
                    notes: ''
                });
                fetchSummary();
                fetchBookings(activeTab);
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create booking');
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Failed to create booking');
        }
    };

    const confirmBooking = async (bookingId) => {
        try {
            const res = await fetch('/api/bookings/confirm', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId })
            });
            
            if (res.ok) {
                fetchSummary();
                fetchBookings(activeTab);
            }
        } catch (error) {
            console.error('Error confirming booking:', error);
        }
    };

    const cancelBooking = async (bookingId, cancelReason) => {
        try {
            const res = await fetch('/api/bookings/cancel', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, cancelReason })
            });
            
            if (res.ok) {
                fetchSummary();
                fetchBookings(activeTab);
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
        }
    };

    useEffect(() => {
        fetchSummary();
        fetchServices();
        fetchBookings(activeTab);
    }, [businessId, activeTab]);

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#f39c12';
            case 'confirmed': return '#2ecc71';
            case 'completed': return '#3498db';
            case 'cancelled': return '#e74c3c';
            default: return '#95a5a6';
        }
    };

    return (
        <div className="bookings-dashboard">
            <h2>Business Bookings Dashboard</h2>

            {/* Summary Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <h3>Today's Bookings</h3>
                    <p className="metric-value">{summary.todaysCount}</p>
                </div>
                <div className="summary-card">
                    <h3>Total Bookings</h3>
                    <p className="metric-value">{summary.totalCount}</p>
                </div>
                <div className="summary-card">
                    <h3>Completion Rate</h3>
                    <p className="metric-value">{summary.completionRate.toFixed(1)}%</p>
                </div>
                <div className="summary-card">
                    <h3>Monthly Revenue</h3>
                    <p className="metric-value">£{summary.monthlyRevenue.toFixed(2)}</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <button 
                    className="btn btn-primary" 
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? 'Cancel' : 'Create Manual Booking'}
                </button>
            </div>

            {/* Create Booking Form */}
            {showCreateForm && (
                <div className="create-booking-form">
                    <h3>Create New Booking</h3>
                    <form onSubmit={createBooking}>
                        <div className="form-group">
                            <label>Service</label>
                            <select 
                                value={newBooking.serviceId} 
                                onChange={(e) => setNewBooking({...newBooking, serviceId: e.target.value})}
                                required
                            >
                                <option value="">Select Service</option>
                                {services.map(service => (
                                    <option key={service._id} value={service._id}>
                                        {service.name} - {service.durationMinutes}min - £{service.priceGBP}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Customer Name</label>
                                <input 
                                    type="text" 
                                    value={newBooking.customer.name}
                                    onChange={(e) => setNewBooking({
                                        ...newBooking, 
                                        customer: {...newBooking.customer, name: e.target.value}
                                    })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input 
                                    type="tel" 
                                    value={newBooking.customer.phone}
                                    onChange={(e) => setNewBooking({
                                        ...newBooking, 
                                        customer: {...newBooking.customer, phone: e.target.value}
                                    })}
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Email</label>
                            <input 
                                type="email" 
                                value={newBooking.customer.email}
                                onChange={(e) => setNewBooking({
                                    ...newBooking, 
                                    customer: {...newBooking.customer, email: e.target.value}
                                })}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Start Date & Time</label>
                            <input 
                                type="datetime-local" 
                                value={newBooking.startISO}
                                onChange={(e) => setNewBooking({...newBooking, startISO: e.target.value})}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Notes</label>
                            <textarea 
                                value={newBooking.notes}
                                onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                                rows="3"
                            />
                        </div>
                        
                        <div className="form-actions">
                            <button type="submit" className="btn btn-success">Create Booking</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Booking Tabs */}
            <div className="booking-tabs">
                <button 
                    className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending ({bookings.filter(b => b.status === 'pending').length})
                </button>
                <button 
                    className={`tab ${activeTab === 'confirmed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('confirmed')}
                >
                    Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
                </button>
                <button 
                    className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('completed')}
                >
                    Completed ({bookings.filter(b => b.status === 'completed').length})
                </button>
                <button 
                    className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cancelled')}
                >
                    Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
                </button>
            </div>

            {/* Bookings List */}
            <div className="bookings-list">
                {bookings.length === 0 ? (
                    <p className="no-bookings">No bookings found for this status.</p>
                ) : (
                    <div className="bookings-table">
                        <div className="table-header">
                            <div>Customer</div>
                            <div>Service</div>
                            <div>Date & Time</div>
                            <div>Status</div>
                            <div>Price</div>
                            <div>Actions</div>
                        </div>
                        {bookings.map(booking => (
                            <div key={booking._id} className="table-row">
                                <div>
                                    <strong>{booking.customer.name}</strong>
                                    <br />
                                    <small>{booking.customer.phone}</small>
                                </div>
                                <div>
                                    {services.find(s => s._id === booking.serviceId)?.name || 'Unknown Service'}
                                </div>
                                <div>
                                    {formatDate(booking.startISO)}
                                </div>
                                <div>
                                    <span 
                                        className="status-badge" 
                                        style={{ backgroundColor: getStatusColor(booking.status) }}
                                    >
                                        {booking.status}
                                    </span>
                                </div>
                                <div>£{booking.priceGBP}</div>
                                <div className="actions">
                                    {booking.status === 'pending' && (
                                        <button 
                                            className="btn btn-sm btn-success"
                                            onClick={() => confirmBooking(booking._id)}
                                        >
                                            Confirm
                                        </button>
                                    )}
                                    {booking.status === 'pending' && (
                                        <button 
                                            className="btn btn-sm btn-danger"
                                            onClick={() => {
                                                const reason = prompt('Cancellation reason:');
                                                if (reason) cancelBooking(booking._id, reason);
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
