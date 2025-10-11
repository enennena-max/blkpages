// Live Free Package Business Dashboard Component

const { useState, useEffect, useRef } = React;

function BusinessDashboardFree() {
    // State management
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('dashboard');
    const [notification, setNotification] = useState(null);
    const [sectionLoading, setSectionLoading] = useState(false);
    
    // Dashboard data state
    const [dashboardData, setDashboardData] = useState({
        businessProfile: null,
        basicSettings: null,
        planInfo: null
    });
    
    // Form states
    const [profileForm, setProfileForm] = useState({
        business_name: '',
        description: '',
        contact_email: '',
        phone_number: '',
        address: '',
        website: '',
        instagram: ''
    });
    
    const [settingsForm, setSettingsForm] = useState({
        public_listing: true
    });
    
    // WebSocket connection
    const wsRef = useRef(null);
    const businessId = 'royal-hair-studio'; // Replace with dynamic business ID
    
    // API base URL - for static server setup, we'll use mock data
    // In production, this would be the actual backend server
    const API_BASE_URL = 'http://localhost:5000';
    
    // Show notification
    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };
    
    // Navigation function
    const navigateToSection = (section) => {
        setActiveSection(section);
        setSectionLoading(true);
        
        // Simulate loading for better UX
        setTimeout(() => {
            setSectionLoading(false);
        }, 300);
    };
    
    // Mock data for testing without backend
    const mockData = {
        businessProfile: {
            business_id: businessId,
            business_name: "Royal Hair Studio",
            description: "Professional barber studio specialising in modern cuts.",
            contact_email: "info@royalhair.co.uk",
            phone_number: "020 1234 5678",
            address: "123 Lewisham High Street, London SE13",
            website: "https://royalhair.co.uk",
            instagram: "@royalhairstudio"
        },
        basicSettings: {
            business_id: businessId,
            public_listing: true
        },
        planInfo: {
            business_id: businessId,
            plan: "Free",
            upgrade_available: true,
            next_tier: "Starter",
            message: "Upgrade to Starter or Professional to unlock reviews, bookings, analytics, and more."
        }
    };

    // Initialize Free Dashboard - main function called on page load
    const initFreeDashboard = async () => {
        try {
            setLoading(true);
            console.log('Initializing Free Dashboard...');
            
            let businessProfile, basicSettings, planInfo;
            
            try {
                // Try to fetch from API first
                const [
                    businessProfileRes,
                    basicSettingsRes,
                    planInfoRes
                ] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/businesses/${businessId}/profile`).then(r => r.json()),
                    fetch(`${API_BASE_URL}/api/businesses/${businessId}/settings-basic`).then(r => r.json()),
                    fetch(`${API_BASE_URL}/api/businesses/${businessId}/plan-info`).then(r => r.json())
                ]);
                
                businessProfile = businessProfileRes;
                basicSettings = basicSettingsRes;
                planInfo = planInfoRes;
                
                console.log('✅ Using live API data');
            } catch (apiError) {
                console.log('⚠️ API not available, using mock data:', apiError.message);
                businessProfile = mockData.businessProfile;
                basicSettings = mockData.basicSettings;
                planInfo = mockData.planInfo;
            }
            
            setDashboardData({
                businessProfile,
                basicSettings,
                planInfo
            });
            
            // Populate forms with fetched data
            if (businessProfile) {
                setProfileForm({
                    business_name: businessProfile.business_name || '',
                    description: businessProfile.description || '',
                    contact_email: businessProfile.contact_email || '',
                    phone_number: businessProfile.phone_number || '',
                    address: businessProfile.address || '',
                    website: businessProfile.website || '',
                    instagram: businessProfile.instagram || ''
                });
            }
            
            if (basicSettings) {
                setSettingsForm({
                    public_listing: basicSettings.public_listing || true
                });
            }
            
            console.log('Dashboard data loaded successfully:', {
                businessProfile,
                basicSettings,
                planInfo
            });
            
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            showNotification('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    // Save business profile
    const saveBusinessProfile = async () => {
        try {
            console.log('Saving business profile:', profileForm);
            
            try {
                const response = await fetch(`${API_BASE_URL}/api/businesses/${businessId}/profile`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(profileForm)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('Profile saved successfully:', result);
                    showNotification('Business profile updated successfully!', 'success');
                    initFreeDashboard(); // Refresh data
                } else {
                    throw new Error(`Failed to update profile: ${response.status}`);
                }
            } catch (apiError) {
                // API not available, simulate save with mock data
                console.log('API not available, simulating save:', apiError.message);
                showNotification('Business profile updated successfully! (Demo Mode)', 'success');
                // Update mock data
                mockData.businessProfile = { ...mockData.businessProfile, ...profileForm };
            }
        } catch (error) {
            console.error('Error saving business profile:', error);
            showNotification('Failed to update business profile', 'error');
        }
    };
    
    // Save basic settings
    const saveBasicSettings = async () => {
        try {
            console.log('Saving basic settings:', settingsForm);
            
            try {
                const response = await fetch(`${API_BASE_URL}/api/businesses/${businessId}/settings-basic`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(settingsForm)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('Settings saved successfully:', result);
                    showNotification('Settings updated successfully!', 'success');
                    initFreeDashboard(); // Refresh data
                } else {
                    throw new Error(`Failed to update settings: ${response.status}`);
                }
            } catch (apiError) {
                // API not available, simulate save with mock data
                console.log('API not available, simulating save:', apiError.message);
                showNotification('Settings updated successfully! (Demo Mode)', 'success');
                // Update mock data
                mockData.basicSettings = { ...mockData.basicSettings, ...settingsForm };
            }
        } catch (error) {
            console.error('Error saving basic settings:', error);
            showNotification('Failed to update settings', 'error');
        }
    };
    
    // Initialize WebSocket connection
    const initializeWebSocket = () => {
        if (wsRef.current) return;
        
        const ws = new WebSocket('ws://localhost:5000');
        wsRef.current = ws;
        
        ws.onopen = () => {
            console.log('WebSocket connected for Free Dashboard');
            ws.send(JSON.stringify({ type: 'join_business', businessId }));
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            switch (data.type) {
                case 'profile_updated':
                    showNotification('Profile updated!', 'info');
                    initFreeDashboard(); // Refresh data
                    break;
            }
        };
        
        ws.onclose = () => {
            console.log('WebSocket disconnected, reconnecting...');
            wsRef.current = null;
            setTimeout(initializeWebSocket, 3000);
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    };
    
    // Initialize component
    useEffect(() => {
        // Initialize dashboard on component mount
        initFreeDashboard();
        initializeWebSocket();
        
        // Set up polling for live updates (fallback) - poll every 30 seconds
        const pollInterval = setInterval(() => {
            console.log('Polling for live updates...');
            initFreeDashboard();
        }, 30000);
        
        // Listen for navigation events from sidebar
        const handleNavigation = (event) => {
            const { section } = event.detail;
            navigateToSection(section);
        };
        
        window.addEventListener('navigateToSection', handleNavigation);
        
        return () => {
            clearInterval(pollInterval);
            window.removeEventListener('navigateToSection', handleNavigation);
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);
    
    // Render loading state
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <div className="loading" style={{ margin: '0 auto 20px' }}></div>
                <p style={{ color: '#888' }}>Loading Free Dashboard...</p>
            </div>
        );
    }
    
    // Render overview section
    const renderOverview = () => (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title">Welcome to BlkPages</h3>
                        <p style={{ color: '#cccccc', fontSize: '0.9rem' }}>Your Free Business Dashboard</p>
                    </div>
                </div>
                
                <div className="info-card">
                    <h3>Welcome to your BlkPages Business Dashboard</h3>
                    <p>Your Free plan provides standard search placement so customers can find your business.</p>
                </div>
                
                <div className="info-card">
                    <h3><i className="fas fa-search" style={{ color: '#FF3CAC', marginRight: '10px' }}></i>Standard Visibility</h3>
                    <p>Your business appears in Browse and Search results with Free package placement.</p>
                </div>
            </div>
            
            {/* Upgrade notice */}
            <div className="upgrade-notice">
                <div>
                    <i className="fas fa-star"></i>
                    <strong>Unlock More Features</strong>
                    <p style={{ margin: '5px 0 0', fontSize: '0.9rem' }}>
                        Upgrade to Starter or Professional to unlock reviews, bookings, analytics, and advanced features.
                    </p>
                </div>
                <a href="#" className="upgrade-btn">View Plans</a>
            </div>
        </div>
    );
    
    // Render business profile section
    const renderBusinessProfile = () => (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title">Business Profile</h3>
                        <p style={{ color: '#cccccc', fontSize: '0.9rem' }}>Manage your business information</p>
                    </div>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); saveBusinessProfile(); }}>
                    <div className="form-group">
                        <label htmlFor="business_name">Business Name *</label>
                        <input
                            type="text"
                            id="business_name"
                            value={profileForm.business_name}
                            onChange={(e) => setProfileForm({...profileForm, business_name: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="description">Description *</label>
                        <textarea
                            id="description"
                            value={profileForm.description}
                            onChange={(e) => setProfileForm({...profileForm, description: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="contact_email">Contact Email *</label>
                        <input
                            type="email"
                            id="contact_email"
                            value={profileForm.contact_email}
                            onChange={(e) => setProfileForm({...profileForm, contact_email: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="phone_number">Phone Number *</label>
                        <input
                            type="tel"
                            id="phone_number"
                            value={profileForm.phone_number}
                            onChange={(e) => setProfileForm({...profileForm, phone_number: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="address">Address *</label>
                        <input
                            type="text"
                            id="address"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="website">Website (Optional)</label>
                        <input
                            type="url"
                            id="website"
                            value={profileForm.website}
                            onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                            placeholder="https://yourwebsite.com"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="instagram">Instagram (Optional)</label>
                        <input
                            type="text"
                            id="instagram"
                            value={profileForm.instagram}
                            onChange={(e) => setProfileForm({...profileForm, instagram: e.target.value})}
                            placeholder="@yourinstagram"
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary">
                        <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
    
    // Render settings section
    const renderSettings = () => (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title">Settings</h3>
                        <p style={{ color: '#cccccc', fontSize: '0.9rem' }}>Manage your business preferences</p>
                    </div>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); saveBasicSettings(); }}>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>Public Listing</span>
                            <div className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settingsForm.public_listing}
                                    onChange={(e) => setSettingsForm({...settingsForm, public_listing: e.target.checked})}
                                />
                                <span className="slider"></span>
                            </div>
                        </label>
                        <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '5px' }}>
                            Toggle this to control if your business is visible on BlkPages
                        </p>
                    </div>
                    
                    <button type="submit" className="btn btn-primary">
                        <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                        Save Settings
                    </button>
                </form>
            </div>
            
            {/* Upgrade notice */}
            <div className="upgrade-notice">
                <div>
                    <i className="fas fa-cog"></i>
                    <strong>More Customization Options</strong>
                    <p style={{ margin: '5px 0 0', fontSize: '0.9rem' }}>
                        Upgrade to Starter for more customization options and advanced settings.
                    </p>
                </div>
                <a href="#" className="upgrade-btn">Upgrade to Starter</a>
            </div>
        </div>
    );
    
    // Render manage plan section
    const renderManagePlan = () => (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title">Manage Plan</h3>
                        <p style={{ color: '#cccccc', fontSize: '0.9rem' }}>Your current subscription</p>
                    </div>
                </div>
                
                <div className="info-card">
                    <h3>Current Plan: Free</h3>
                    <p>You're currently on the Free package with basic features.</p>
                </div>
                
                <div className="info-card">
                    <h3>What's Included</h3>
                    <ul style={{ color: '#ccc', margin: '10px 0', paddingLeft: '20px' }}>
                        <li>Standard search placement</li>
                        <li>Basic business profile</li>
                        <li>Contact information display</li>
                        <li>Public listing visibility</li>
                    </ul>
                </div>
                
                <div className="info-card">
                    <h3>Upgrade to Unlock More</h3>
                    <p>Upgrade to Starter or Professional to unlock reviews, bookings, analytics, and more.</p>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <a href="#" className="btn btn-success" style={{ marginRight: '15px' }}>
                        <i className="fas fa-arrow-up" style={{ marginRight: '8px' }}></i>
                        Upgrade to Starter
                    </a>
                    <a href="#" className="btn btn-primary">
                        <i className="fas fa-crown" style={{ marginRight: '8px' }}></i>
                        Upgrade to Professional
                    </a>
                </div>
            </div>
        </div>
    );
    
    // Render locked feature message
    const renderLockedFeature = () => (
        <div>
            <div className="section">
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <i className="fas fa-lock" style={{ fontSize: '4rem', color: '#1E90FF', marginBottom: '20px' }}></i>
                    <h3 style={{ color: '#fff', marginBottom: '15px' }}>Feature Not Available</h3>
                    <p style={{ color: '#888', marginBottom: '30px', fontSize: '1.1rem' }}>
                        This feature is not available on the Free Package. Upgrade to Starter to unlock.
                    </p>
                    <a href="#" className="btn btn-primary">
                        <i className="fas fa-arrow-up" style={{ marginRight: '8px' }}></i>
                        Upgrade to Starter
                    </a>
                </div>
            </div>
        </div>
    );
    
    // Render active section
    const renderActiveSection = () => {
        if (sectionLoading) {
            return (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <div className="loading" style={{ margin: '0 auto 20px' }}></div>
                    <p style={{ color: '#cccccc' }}>Loading section...</p>
                </div>
            );
        }
        
        switch (activeSection) {
            case 'dashboard':
                return renderOverview();
            case 'profile':
                return renderBusinessProfile();
            case 'settings':
                return renderSettings();
            case 'plan':
                return renderManagePlan();
            default:
                return renderOverview();
        }
    };
    
    return (
        <div>
            {/* Notification */}
            {notification && (
                <div className={`notification ${notification.type} show`}>
                    {notification.message}
                </div>
            )}
            
            {/* Active Section Content */}
            {renderActiveSection()}
        </div>
    );
}
