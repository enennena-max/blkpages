import React, { useState, useEffect, useRef } from 'react';
import './BusinessSettingsDashboard.css';

const BusinessSettingsDashboard = () => {
    const [settings, setSettings] = useState({
        business_name: '',
        description: '',
        email: '',
        phone: '',
        address: '',
        opening_hours: '',
        instagram: '',
        facebook: '',
        website: '',
        package_type: 'Free'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [originalSettings, setOriginalSettings] = useState({});
    
    const wsRef = useRef(null);
    const businessId = getBusinessIdFromURL();

    // Get business ID from URL or use consistent business ID
    function getBusinessIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('businessId') || 'royal-hair-studio';
    }

    // Fetch business settings
    const fetchSettings = async () => {
        try {
            const response = await fetch(`/api/businesses/${businessId}/settings`);
            const data = await response.json();
            setSettings(data);
            setOriginalSettings(data);
            setErrors({});
        } catch (error) {
            console.error('Error fetching settings:', error);
            showNotification('Error loading settings', 'error');
        }
    };

    // Initialize WebSocket connection
    const initializeWebSocket = () => {
        const wsUrl = `ws://localhost:5000`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
            console.log('Settings WebSocket connected');
            // Join business room
            wsRef.current.send(JSON.stringify({
                type: 'join_business',
                businessId: businessId
            }));
        };

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'settings_updated') {
                // Update settings if they were updated by another session
                setSettings(data.settings);
                setOriginalSettings(data.settings);
                setHasChanges(false);
                showNotification('Settings updated from another session', 'info');
            }
        };

        wsRef.current.onclose = () => {
            console.log('Settings WebSocket disconnected, reconnecting...');
            setTimeout(initializeWebSocket, 3000);
        };

        wsRef.current.onerror = (error) => {
            console.error('Settings WebSocket error:', error);
        };
    };

    // Show notification
    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `settings-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <strong>${type === 'success' ? 'Success!' : type === 'error' ? 'Error!' : 'Info!'}</strong>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};
        
        if (!settings.business_name.trim()) {
            newErrors.business_name = 'Business name is required';
        }
        
        if (!settings.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!settings.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input change
    const handleInputChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Check if there are changes
        const newSettings = { ...settings, [field]: value };
        const hasChanges = JSON.stringify(newSettings) !== JSON.stringify(originalSettings);
        setHasChanges(hasChanges);
        
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Save settings
    const saveSettings = async () => {
        if (!validateForm()) {
            showNotification('Please fix the errors before saving', 'error');
            return;
        }
        
        setSaving(true);
        
        try {
            const response = await fetch(`/api/businesses/${businessId}/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setOriginalSettings(settings);
                setHasChanges(false);
                showNotification('Settings saved successfully!', 'success');
            } else {
                showNotification(data.error || 'Failed to save settings', 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showNotification('Error saving settings', 'error');
        }
        
        setSaving(false);
    };

    // Reset form
    const resetForm = () => {
        if (confirm('Are you sure you want to discard your changes?')) {
            setSettings(originalSettings);
            setHasChanges(false);
            setErrors({});
        }
    };

    useEffect(() => {
        fetchSettings();
        initializeWebSocket();
        
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    if (loading) {
        return (
            <div className="settings-dashboard">
                <div className="loading">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="settings-dashboard">
            <div className="dashboard-header">
                <h1>Business Settings</h1>
                <p>Manage your business information and preferences</p>
            </div>

            {/* Package Notice */}
            <div className="package-notice">
                <div className="notice-content">
                    <i className="fas fa-info-circle"></i>
                    <div>
                        <strong>You are on the Free Package</strong>
                        <p>Upgrade to unlock advanced settings like staff management, payment preferences, and custom branding.</p>
                    </div>
                    <button className="btn btn-primary">Upgrade Now</button>
                </div>
            </div>

            {/* Settings Form */}
            <div className="settings-form">
                <div className="form-section">
                    <h3>Basic Information</h3>
                    
                    <div className="form-group">
                        <label htmlFor="business_name">Business Name *</label>
                        <input
                            type="text"
                            id="business_name"
                            value={settings.business_name}
                            onChange={(e) => handleInputChange('business_name', e.target.value)}
                            className={errors.business_name ? 'error' : ''}
                            placeholder="Enter your business name"
                        />
                        {errors.business_name && <span className="error-message">{errors.business_name}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="description">Business Description</label>
                        <textarea
                            id="description"
                            value={settings.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows="3"
                            placeholder="Describe your business and services"
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h3>Contact Information</h3>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="email">Email Address *</label>
                            <input
                                type="email"
                                id="email"
                                value={settings.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={errors.email ? 'error' : ''}
                                placeholder="info@yourbusiness.co.uk"
                            />
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="phone">Phone Number *</label>
                            <input
                                type="tel"
                                id="phone"
                                value={settings.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className={errors.phone ? 'error' : ''}
                                placeholder="020 1234 5678"
                            />
                            {errors.phone && <span className="error-message">{errors.phone}</span>}
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="address">Business Address</label>
                        <input
                            type="text"
                            id="address"
                            value={settings.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder="123 High Street, London SE13"
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h3>Business Hours</h3>
                    
                    <div className="form-group">
                        <label htmlFor="opening_hours">Opening Hours</label>
                        <input
                            type="text"
                            id="opening_hours"
                            value={settings.opening_hours}
                            onChange={(e) => handleInputChange('opening_hours', e.target.value)}
                            placeholder="Mon–Sat 9:00–18:00"
                        />
                        <small>Example: Mon–Sat 9:00–18:00, Sun 10:00–16:00</small>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Social Media & Website</h3>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="instagram">Instagram</label>
                            <input
                                type="text"
                                id="instagram"
                                value={settings.instagram}
                                onChange={(e) => handleInputChange('instagram', e.target.value)}
                                placeholder="@yourbusiness"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="facebook">Facebook</label>
                            <input
                                type="text"
                                id="facebook"
                                value={settings.facebook}
                                onChange={(e) => handleInputChange('facebook', e.target.value)}
                                placeholder="facebook.com/yourbusiness"
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="website">Website</label>
                        <input
                            type="url"
                            id="website"
                            value={settings.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            placeholder="https://www.yourbusiness.co.uk"
                        />
                    </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={resetForm}
                        disabled={!hasChanges || saving}
                    >
                        Reset
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={saveSettings}
                        disabled={!hasChanges || saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Advanced Settings (Disabled for Free Package) */}
            <div className="advanced-settings">
                <h3>Advanced Settings</h3>
                <div className="disabled-notice">
                    <i className="fas fa-lock"></i>
                    <p>Advanced settings are available with Starter or Professional packages</p>
                </div>
                
                <div className="disabled-features">
                    <div className="feature-item">
                        <i className="fas fa-users"></i>
                        <span>Staff Management</span>
                    </div>
                    <div className="feature-item">
                        <i className="fas fa-credit-card"></i>
                        <span>Payment Preferences</span>
                    </div>
                    <div className="feature-item">
                        <i className="fas fa-palette"></i>
                        <span>Custom Branding</span>
                    </div>
                    <div className="feature-item">
                        <i className="fas fa-bell"></i>
                        <span>Notification Settings</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessSettingsDashboard;
