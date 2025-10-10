import React, { useState, useEffect, useRef } from 'react';
import './BusinessServicesDashboard.css';

const BusinessServicesDashboard = () => {
    const [stats, setStats] = useState({
        active: 0,
        pending: 0,
        rejected: 0,
        archived: 0
    });
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Active');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [newServicesCount, setNewServicesCount] = useState(0);
    
    const wsRef = useRef(null);
    const businessId = getBusinessIdFromURL();

    // Get business ID from URL or use consistent business ID
    function getBusinessIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('businessId') || 'royal-hair-studio';
    }

    // Fetch service statistics
    const fetchStats = async () => {
        try {
            const response = await fetch(`/api/businesses/${businessId}/service-stats`);
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching service stats:', error);
        }
    };

    // Fetch services list
    const fetchServices = async (status = null) => {
        try {
            const url = status 
                ? `/api/businesses/${businessId}/services?status=${encodeURIComponent(status)}`
                : `/api/businesses/${businessId}/services`;
            const response = await fetch(url);
            const data = await response.json();
            setServices(data);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    // Fetch all data
    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([fetchStats(), fetchServices(activeTab)]);
        setLoading(false);
    };

    // Initialize WebSocket connection
    const initializeWebSocket = () => {
        const wsUrl = `ws://localhost:5000`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
            console.log('Services WebSocket connected');
            // Join business room
            wsRef.current.send(JSON.stringify({
                type: 'join_business',
                businessId: businessId
            }));
        };

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'new_service') {
                // Add new service to the list
                const newService = {
                    id: data.id,
                    name: data.name,
                    category: data.category,
                    price: data.price,
                    duration: data.duration,
                    status: data.status,
                    last_updated: data.last_updated,
                    description: data.description || '',
                    image_url: data.image_url || null
                };
                
                setServices(prev => [newService, ...prev]);
                setNewServicesCount(prev => prev + 1);
                
                // Update stats
                fetchStats();
                
                // Show notification
                showNewServiceNotification(newService);
            } else if (data.type === 'service_updated') {
                // Update existing service in the list
                setServices(prev => prev.map(service => 
                    service.id === data.id ? data.service : service
                ));
                
                // Update stats
                fetchStats();
                
                // Show update notification
                showServiceUpdateNotification(data);
            } else if (data.type === 'service_deleted') {
                // Remove service from the list
                setServices(prev => prev.filter(service => service.id !== data.id));
                
                // Update stats
                fetchStats();
            }
        };

        wsRef.current.onclose = () => {
            console.log('Services WebSocket disconnected, reconnecting...');
            setTimeout(initializeWebSocket, 3000);
        };

        wsRef.current.onerror = (error) => {
            console.error('Services WebSocket error:', error);
        };
    };

    // Show notification for new service
    const showNewServiceNotification = (service) => {
        const notification = document.createElement('div');
        notification.className = 'new-service-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <strong>New Service!</strong>
                <p>${service.name} added to ${service.status}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    };

    // Show notification for service update
    const showServiceUpdateNotification = (data) => {
        const notification = document.createElement('div');
        notification.className = 'service-update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <strong>Service Updated!</strong>
                <p>${data.service.name} is now ${data.service.status}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    };

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        fetchServices(tab);
    };

    // Handle service status change
    const handleStatusChange = async (serviceId, newStatus) => {
        try {
            const response = await fetch(`/api/services/${serviceId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (response.ok) {
                // Update local state immediately
                setServices(prev => prev.map(service => 
                    service.id === serviceId 
                        ? { ...service, status: newStatus, last_updated: new Date().toISOString() }
                        : service
                ));
                
                // Update stats
                fetchStats();
            }
        } catch (error) {
            console.error('Error updating service status:', error);
        }
    };

    // Handle service deletion
    const handleDeleteService = async (serviceId) => {
        if (confirm('Are you sure you want to delete this service?')) {
            try {
                const response = await fetch(`/api/services/${serviceId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    // Remove from local state
                    setServices(prev => prev.filter(service => service.id !== serviceId));
                    
                    // Update stats
                    fetchStats();
                }
            } catch (error) {
                console.error('Error deleting service:', error);
            }
        }
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
            case 'Active':
                return 'status-badge active';
            case 'Pending Approval':
                return 'status-badge pending';
            case 'Rejected':
                return 'status-badge rejected';
            case 'Archived':
                return 'status-badge archived';
            default:
                return 'status-badge';
        }
    };

    // Clear new services count
    const clearNewServicesCount = () => {
        setNewServicesCount(0);
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
    }, [activeTab]);

    if (loading) {
        return (
            <div className="services-dashboard">
                <div className="loading">Loading services...</div>
            </div>
        );
    }

    return (
        <div className="services-dashboard">
            <div className="dashboard-header">
                <h1>Services Management</h1>
                <p>Manage your business services and track their status</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{stats.active}</h3>
                        <p>Active Services</p>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <h3>{stats.pending}</h3>
                        <p>Pending Approval</p>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">❌</div>
                    <div className="stat-content">
                        <h3>{stats.rejected}</h3>
                        <p>Rejected</p>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">📁</div>
                    <div className="stat-content">
                        <h3>{stats.archived}</h3>
                        <p>Archived</p>
                    </div>
                </div>
            </div>

            {/* Services Section */}
            <div className="services-section">
                <div className="section-header">
                    <h2>Services</h2>
                    <div className="header-actions">
                        {newServicesCount > 0 && (
                            <button 
                                className="new-services-badge"
                                onClick={clearNewServicesCount}
                            >
                                {newServicesCount} new
                            </button>
                        )}
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowAddModal(true)}
                        >
                            + Add Service
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <button 
                        className={`tab ${activeTab === 'Active' ? 'active' : ''}`}
                        onClick={() => handleTabChange('Active')}
                    >
                        Active ({stats.active})
                    </button>
                    <button 
                        className={`tab ${activeTab === 'Pending Approval' ? 'active' : ''}`}
                        onClick={() => handleTabChange('Pending Approval')}
                    >
                        Pending Approval ({stats.pending})
                    </button>
                    <button 
                        className={`tab ${activeTab === 'Rejected' ? 'active' : ''}`}
                        onClick={() => handleTabChange('Rejected')}
                    >
                        Rejected ({stats.rejected})
                    </button>
                    <button 
                        className={`tab ${activeTab === 'Archived' ? 'active' : ''}`}
                        onClick={() => handleTabChange('Archived')}
                    >
                        Archived ({stats.archived})
                    </button>
                </div>

                {/* Services Grid */}
                <div className="services-grid">
                    {services.length === 0 ? (
                        <div className="no-services">
                            <p>No services in this category yet.</p>
                        </div>
                    ) : (
                        services.map((service) => (
                            <div key={service.id} className="service-card">
                                {service.image_url && (
                                    <div className="service-image">
                                        <img src={service.image_url} alt={service.name} />
                                    </div>
                                )}
                                
                                <div className="service-content">
                                    <div className="service-header">
                                        <h3>{service.name}</h3>
                                        <span className={getStatusBadgeClass(service.status)}>
                                            {service.status}
                                        </span>
                                    </div>
                                    
                                    <div className="service-details">
                                        <p className="service-category">{service.category}</p>
                                        <p className="service-price">{formatCurrency(service.price)}</p>
                                        <p className="service-duration">{service.duration}</p>
                                        {service.description && (
                                            <p className="service-description">{service.description}</p>
                                        )}
                                        <p className="service-updated">Updated: {formatDate(service.last_updated)}</p>
                                    </div>
                                    
                                    <div className="service-actions">
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={() => setEditingService(service)}
                                        >
                                            Edit
                                        </button>
                                        
                                        {service.status === 'Active' && (
                                            <button 
                                                className="btn btn-warning"
                                                onClick={() => handleStatusChange(service.id, 'Archived')}
                                            >
                                                Archive
                                            </button>
                                        )}
                                        
                                        {service.status === 'Pending Approval' && (
                                            <button 
                                                className="btn btn-success"
                                                onClick={() => handleStatusChange(service.id, 'Active')}
                                            >
                                                Approve
                                            </button>
                                        )}
                                        
                                        {service.status === 'Rejected' && (
                                            <button 
                                                className="btn btn-primary"
                                                onClick={() => handleStatusChange(service.id, 'Pending Approval')}
                                            >
                                                Resubmit
                                            </button>
                                        )}
                                        
                                        <button 
                                            className="btn btn-danger"
                                            onClick={() => handleDeleteService(service.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add Service Modal */}
            {showAddModal && (
                <AddServiceModal 
                    businessId={businessId}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchAllData();
                    }}
                />
            )}

            {/* Edit Service Modal */}
            {editingService && (
                <EditServiceModal 
                    service={editingService}
                    onClose={() => setEditingService(null)}
                    onSuccess={() => {
                        setEditingService(null);
                        fetchAllData();
                    }}
                />
            )}
        </div>
    );
};

// Add Service Modal Component
const AddServiceModal = ({ businessId, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        duration: '',
        description: '',
        image_url: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    businessId,
                    ...formData
                })
            });
            
            if (response.ok) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error creating service:', error);
        }
        setSubmitting(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h3>Add New Service</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Service Name</label>
                        <input 
                            type="text" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Category</label>
                        <input 
                            type="text" 
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>Price (£)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Duration</label>
                            <input 
                                type="text" 
                                value={formData.duration}
                                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                placeholder="e.g., 45 mins"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Description</label>
                        <textarea 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows="3"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Image URL (Optional)</label>
                        <input 
                            type="url" 
                            value={formData.image_url}
                            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        />
                    </div>
                    
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Adding...' : 'Add Service'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Edit Service Modal Component
const EditServiceModal = ({ service, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: service.name,
        category: service.category,
        price: service.price,
        duration: service.duration,
        description: service.description,
        image_url: service.image_url || ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            const response = await fetch(`/api/services/${service.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error updating service:', error);
        }
        setSubmitting(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h3>Edit Service</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Service Name</label>
                        <input 
                            type="text" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Category</label>
                        <input 
                            type="text" 
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>Price (£)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Duration</label>
                            <input 
                                type="text" 
                                value={formData.duration}
                                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                placeholder="e.g., 45 mins"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Description</label>
                        <textarea 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows="3"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Image URL (Optional)</label>
                        <input 
                            type="url" 
                            value={formData.image_url}
                            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        />
                    </div>
                    
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Updating...' : 'Update Service'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BusinessServicesDashboard;