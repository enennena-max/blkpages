// BusinessDashboardStarter.jsx
// Live Starter Package Business Dashboard Component

const { useState, useEffect, useRef } = React;

function BusinessDashboardStarter() {
    // State management
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('overview');
    const [notification, setNotification] = useState(null);
    const [sectionLoading, setSectionLoading] = useState(false);
    
    // Dashboard data state
    const [dashboardData, setDashboardData] = useState({
        reviewStats: null,
        bookingStats: null,
        profileViewsStats: null,
        businessProfile: null,
        basicSettings: null,
        basicAnalytics: null,
        planInfo: null
    });
    
    // Form states
    const [profileForm, setProfileForm] = useState({
        business_name: '',
        description: '',
        contact_email: '',
        phone_number: '',
        address: '',
        opening_hours: '',
        instagram: '',
        facebook: '',
        website: ''
    });
    
    const [settingsForm, setSettingsForm] = useState({
        notifications_enabled: true,
        allow_public_reviews: true,
        booking_cancellation_policy: ''
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
        
        // Update sidebar active state
        updateSidebarActiveState(section);
    };
    
    // Update sidebar active state
    const updateSidebarActiveState = (activeSection) => {
        // Remove active class from all sidebar links
        const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
        sidebarLinks.forEach(link => link.classList.remove('active'));
        
        // Add active class to current section
        const currentLink = document.querySelector(`[data-section="${activeSection}"]`);
        if (currentLink) {
            currentLink.classList.add('active');
        }
    };
    
    // Mock data for testing without backend
    const mockData = {
        reviewStats: {
            business_id: businessId,
            average_rating: 4.4,
            total_reviews: 27,
            recent_reviews: [
                {
                    reviewer_name: "Naomi Johnson",
                    rating: 5,
                    comment: "Brilliant service, quick and professional.",
                    date: "2025-10-09T14:32:00Z",
                },
                {
                    reviewer_name: "Tayo Smith",
                    rating: 4,
                    comment: "Clean shop, friendly staff.",
                    date: "2025-10-07T10:11:00Z",
                },
            ],
        },
        bookingStats: {
            business_id: businessId,
            total_bookings: 35,
            bookings_this_month: 8,
            recent_bookings: [
                {
                    id: "bk_001",
                    customer_name: "Sarah Thompson",
                    service: "Haircut",
                    date: "2025-10-10T13:00:00Z",
                    status: "Completed",
                },
                {
                    id: "bk_002",
                    customer_name: "Jordan Miles",
                    service: "Beard Trim",
                    date: "2025-10-09T15:30:00Z",
                    status: "Pending",
                },
            ],
        },
        profileViewsStats: {
            business_id: businessId,
            total_views: 428,
            views_this_month: 76,
            views_last_month: 65,
        },
        businessProfile: {
            business_id: businessId,
            business_name: "Royal Hair Studio",
            category: "Barbering",
            description: "Professional barber studio specialising in modern cuts.",
            contact_email: "info@royalhair.co.uk",
            phone_number: "020 1234 5678",
            address: "123 Lewisham High Street, London SE13",
            opening_hours: "Mon–Sat: 9:00 – 18:00",
            social_links: {
                instagram: "@royalhairstudio",
                facebook: "",
                website: "",
            },
        },
        basicSettings: {
            business_id: businessId,
            notifications_enabled: true,
            allow_public_reviews: true,
            booking_cancellation_policy: "24-hour notice required",
        },
        basicAnalytics: {
            business_id: businessId,
            total_visits: 428,
            bookings_this_month: 8,
            average_rating: 4.4,
            conversion_rate: 12.6,
        },
        planInfo: {
            business_id: businessId,
            plan: "Starter",
            upgrade_available: true,
            next_tier: "Professional",
            message: "Upgrade to unlock advanced analytics, loyalty rewards, and team management.",
        }
    };

    // Initialize Starter Dashboard - main function called on page load
    const initStarterDashboard = async () => {
        try {
            setLoading(true);
            console.log('Initializing Starter Dashboard...');
            
            let reviewStats, bookingStats, profileViewsStats, businessProfile, basicSettings, basicAnalytics, planInfo;
            
            try {
                // Try to fetch from API first
                const [
                    reviewStatsRes,
                    bookingStatsRes,
                    profileViewsStatsRes,
                    businessProfileRes,
                    basicSettingsRes,
                    basicAnalyticsRes,
                    planInfoRes
                ] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/businesses/${businessId}/review-stats`).then(r => r.json()),
                    fetch(`${API_BASE_URL}/api/businesses/${businessId}/booking-stats`).then(r => r.json()),
                    fetch(`${API_BASE_URL}/api/businesses/${businessId}/profile-views-stats`).then(r => r.json()),
                    fetch(`${API_BASE_URL}/api/businesses/${businessId}/profile`).then(r => r.json()),
                    fetch(`${API_BASE_URL}/api/businesses/${businessId}/settings-basic`).then(r => r.json()),
                    fetch(`${API_BASE_URL}/api/businesses/${businessId}/analytics/basic`).then(r => r.json()),
                    fetch(`${API_BASE_URL}/api/businesses/${businessId}/plan-info`).then(r => r.json())
                ]);
                
                reviewStats = reviewStatsRes;
                bookingStats = bookingStatsRes;
                profileViewsStats = profileViewsStatsRes;
                businessProfile = businessProfileRes;
                basicSettings = basicSettingsRes;
                basicAnalytics = basicAnalyticsRes;
                planInfo = planInfoRes;
                
                console.log('✅ Using live API data');
            } catch (apiError) {
                console.log('⚠️ API not available, using mock data:', apiError.message);
                reviewStats = mockData.reviewStats;
                bookingStats = mockData.bookingStats;
                profileViewsStats = mockData.profileViewsStats;
                businessProfile = mockData.businessProfile;
                basicSettings = mockData.basicSettings;
                basicAnalytics = mockData.basicAnalytics;
                planInfo = mockData.planInfo;
            }
            
            setDashboardData({
                reviewStats,
                bookingStats,
                profileViewsStats,
                businessProfile,
                basicSettings,
                basicAnalytics,
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
                    opening_hours: businessProfile.opening_hours || '',
                    instagram: businessProfile.social_links?.instagram || '',
                    facebook: businessProfile.social_links?.facebook || '',
                    website: businessProfile.social_links?.website || ''
                });
            }
            
            if (basicSettings) {
                setSettingsForm({
                    notifications_enabled: basicSettings.notifications_enabled || true,
                    allow_public_reviews: basicSettings.allow_public_reviews || true,
                    booking_cancellation_policy: basicSettings.booking_cancellation_policy || ''
                });
            }
            
            console.log('Dashboard data loaded successfully:', {
                reviewStats,
                bookingStats,
                profileViewsStats,
                businessProfile,
                basicSettings,
                basicAnalytics,
                planInfo
            });
            
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            showNotification('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    // Fetch dashboard data (alias for backward compatibility)
    const fetchDashboardData = initStarterDashboard;
    
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
                    initStarterDashboard(); // Refresh data
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
                    initStarterDashboard(); // Refresh data
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
            console.log('WebSocket connected for Starter Dashboard');
            ws.send(JSON.stringify({ type: 'join_business', businessId }));
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            switch (data.type) {
                case 'new_review':
                    showNotification('New review received!', 'info');
                    initStarterDashboard(); // Refresh data
                    break;
                case 'new_booking':
                    showNotification('New booking received!', 'info');
                    initStarterDashboard(); // Refresh data
                    break;
                case 'profile_updated':
                    showNotification('Profile updated!', 'info');
                    initStarterDashboard(); // Refresh data
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
        initStarterDashboard();
        initializeWebSocket();
        
        // Set up polling for live updates (fallback) - poll every 30 seconds
        const pollInterval = setInterval(() => {
            console.log('Polling for live updates...');
            initStarterDashboard();
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
                <p style={{ color: '#888' }}>Loading dashboard data...</p>
            </div>
        );
    }
    
    // Render reviews section
    const renderReviews = () => (
        <div>
            <div className="section">
                <div className="section-header">
                    <div>
                        <h3 className="section-title">Recent Reviews</h3>
                        <p className="section-subtitle">Latest customer feedback</p>
                    </div>
                </div>
                
                {dashboardData.reviewStats?.recent_reviews?.length > 0 ? (
                    <div>
                        {dashboardData.reviewStats.recent_reviews.slice(0, 5).map((review, index) => (
                            <div key={index} style={{ 
                                background: '#333', 
                                padding: '20px', 
                                borderRadius: '8px', 
                                marginBottom: '15px',
                                border: '1px solid #444'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div>
                                        <h4 style={{ color: '#fff', margin: '0 0 5px', fontSize: '1.1rem' }}>
                                            {review.reviewer_name}
                                        </h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <i 
                                                    key={i} 
                                                    className={`fas fa-star ${i < review.rating ? 'text-yellow-400' : 'text-gray-500'}`}
                                                    style={{ color: i < review.rating ? '#fbbf24' : '#6b7280' }}
                                                ></i>
                                            ))}
                                            <span style={{ color: '#888', fontSize: '0.9rem', marginLeft: '8px' }}>
                                                {new Date(review.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p style={{ color: '#ccc', margin: '0', lineHeight: '1.5' }}>
                                    {review.comment}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                        No reviews found
                    </p>
                )}
            </div>
            
            {/* Upgrade notice */}
            <div className="upgrade-notice">
                <div>
                    <i className="fas fa-chart-line"></i>
                    <strong>Advanced Review Analytics</strong>
                    <p style={{ margin: '5px 0 0', fontSize: '0.9rem' }}>
                        View detailed review analytics, sentiment analysis, and response management with the Professional Package.
                    </p>
                </div>
                <a href="#" className="upgrade-btn">Upgrade Now</a>
            </div>
        </div>
    );
    
    // Render bookings section
    const renderBookings = () => (
        <div>
            <div className="section">
                <div className="section-header">
                    <div>
                        <h3 className="section-title">Recent Bookings</h3>
                        <p className="section-subtitle">Latest customer appointments</p>
                    </div>
                </div>
                
                {dashboardData.bookingStats?.recent_bookings?.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Service</th>
                                <th>Date & Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dashboardData.bookingStats.recent_bookings.map((booking, index) => (
                                <tr key={index}>
                                    <td>{booking.customer_name}</td>
                                    <td>{booking.service}</td>
                                    <td>{new Date(booking.date).toLocaleString()}</td>
                                    <td>
                                        <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                        No recent bookings found
                    </p>
                )}
            </div>
            
            {/* Upgrade notice */}
            <div className="upgrade-notice">
                <div>
                    <i className="fas fa-calendar-plus"></i>
                    <strong>Advanced Booking Management</strong>
                    <p style={{ margin: '5px 0 0', fontSize: '0.9rem' }}>
                        Get calendar sync, automated reminders, and advanced booking management with the Professional Package.
                    </p>
                </div>
                <a href="#" className="upgrade-btn">Upgrade Now</a>
            </div>
        </div>
    );
    
    // Render overview section
    const renderOverview = () => (
        <div>
            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon">
                            <i className="fas fa-star"></i>
                        </div>
                    </div>
                    <div className="stat-value">
                        {dashboardData.reviewStats?.total_reviews || 0}
                    </div>
                    <div className="stat-label">Total Reviews</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon">
                            <i className="fas fa-star-half-alt"></i>
                        </div>
                    </div>
                    <div className="stat-value">
                        {dashboardData.reviewStats?.average_rating || '0.0'}
                    </div>
                    <div className="stat-label">Average Rating</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon">
                            <i className="fas fa-eye"></i>
                        </div>
                    </div>
                    <div className="stat-value">
                        {dashboardData.profileViewsStats?.total_views || 0}
                    </div>
                    <div className="stat-label">Profile Views</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon">
                            <i className="fas fa-calendar-check"></i>
                        </div>
                    </div>
                    <div className="stat-value">
                        {dashboardData.bookingStats?.bookings_this_month || 0}
                    </div>
                    <div className="stat-label">Bookings This Month</div>
                </div>
            </div>
            
            {/* Recent Bookings */}
            <div className="section">
                <div className="section-header">
                    <div>
                        <h3 className="section-title">Recent Bookings</h3>
                        <p className="section-subtitle">Latest customer appointments</p>
                    </div>
                </div>
                
                {dashboardData.bookingStats?.recent_bookings?.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Service</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dashboardData.bookingStats.recent_bookings.map((booking, index) => (
                                <tr key={index}>
                                    <td>{booking.customer_name}</td>
                                    <td>{booking.service}</td>
                                    <td>{new Date(booking.date).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                        No recent bookings found
                    </p>
                )}
            </div>
        </div>
    );
    
    // Render business profile section
    const renderBusinessProfile = () => (
        <div className="section">
            <div className="section-header">
                <div>
                    <h3 className="section-title">Business Profile</h3>
                    <p className="section-subtitle">Manage your business information</p>
                </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                    <label className="form-label">Business Name</label>
                    <input
                        type="text"
                        className="form-input"
                        value={profileForm.business_name}
                        onChange={(e) => setProfileForm({...profileForm, business_name: e.target.value})}
                    />
                </div>
                
                <div className="form-group">
                    <label className="form-label">Contact Email</label>
                    <input
                        type="email"
                        className="form-input"
                        value={profileForm.contact_email}
                        onChange={(e) => setProfileForm({...profileForm, contact_email: e.target.value})}
                    />
                </div>
                
                <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                        type="tel"
                        className="form-input"
                        value={profileForm.phone_number}
                        onChange={(e) => setProfileForm({...profileForm, phone_number: e.target.value})}
                    />
                </div>
                
                <div className="form-group">
                    <label className="form-label">Address</label>
                    <input
                        type="text"
                        className="form-input"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                    />
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description</label>
                    <textarea
                        className="form-input"
                        rows="3"
                        value={profileForm.description}
                        onChange={(e) => setProfileForm({...profileForm, description: e.target.value})}
                    />
                </div>
                
                <div className="form-group">
                    <label className="form-label">Opening Hours</label>
                    <input
                        type="text"
                        className="form-input"
                        value={profileForm.opening_hours}
                        onChange={(e) => setProfileForm({...profileForm, opening_hours: e.target.value})}
                    />
                </div>
                
                <div className="form-group">
                    <label className="form-label">Instagram</label>
                    <input
                        type="text"
                        className="form-input"
                        value={profileForm.instagram}
                        onChange={(e) => setProfileForm({...profileForm, instagram: e.target.value})}
                    />
                </div>
                
                <div className="form-group">
                    <label className="form-label">Facebook</label>
                    <input
                        type="text"
                        className="form-input"
                        value={profileForm.facebook}
                        onChange={(e) => setProfileForm({...profileForm, facebook: e.target.value})}
                    />
                </div>
                
                <div className="form-group">
                    <label className="form-label">Website</label>
                    <input
                        type="url"
                        className="form-input"
                        value={profileForm.website}
                        onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                    />
                </div>
            </div>
            
            <div style={{ marginTop: '20px' }}>
                <button className="btn btn-primary" onClick={saveBusinessProfile}>
                    Save Changes
                </button>
            </div>
        </div>
    );
    
    // Render settings section
    const renderSettings = () => (
        <div className="section">
            <div className="section-header">
                <div>
                    <h3 className="section-title">Basic Settings</h3>
                    <p className="section-subtitle">Manage your business preferences</p>
                </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                    <label className="form-label">
                        <input
                            type="checkbox"
                            checked={settingsForm.notifications_enabled}
                            onChange={(e) => setSettingsForm({...settingsForm, notifications_enabled: e.target.checked})}
                            style={{ marginRight: '8px' }}
                        />
                        Enable Notifications
                    </label>
                </div>
                
                <div className="form-group">
                    <label className="form-label">
                        <input
                            type="checkbox"
                            checked={settingsForm.allow_public_reviews}
                            onChange={(e) => setSettingsForm({...settingsForm, allow_public_reviews: e.target.checked})}
                            style={{ marginRight: '8px' }}
                        />
                        Allow Public Reviews
                    </label>
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Cancellation Policy</label>
                    <textarea
                        className="form-input"
                        rows="3"
                        value={settingsForm.booking_cancellation_policy}
                        onChange={(e) => setSettingsForm({...settingsForm, booking_cancellation_policy: e.target.value})}
                        placeholder="e.g., 24-hour notice required for cancellations"
                    />
                </div>
            </div>
            
            <div style={{ marginTop: '20px' }}>
                <button className="btn btn-primary" onClick={saveBasicSettings}>
                    Save Settings
                </button>
            </div>
        </div>
    );
    
    // Render analytics section
    const renderAnalytics = () => (
        <div>
            <div className="section">
                <div className="section-header">
                    <div>
                        <h3 className="section-title">Basic Analytics</h3>
                        <p className="section-subtitle">Overview of your business performance</p>
                    </div>
                </div>
                
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon">
                                <i className="fas fa-eye"></i>
                            </div>
                        </div>
                        <div className="stat-value">
                            {dashboardData.basicAnalytics?.total_visits || 0}
                        </div>
                        <div className="stat-label">Total Visits</div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon">
                                <i className="fas fa-calendar-check"></i>
                            </div>
                        </div>
                        <div className="stat-value">
                            {dashboardData.basicAnalytics?.bookings_this_month || 0}
                        </div>
                        <div className="stat-label">Bookings This Month</div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon">
                                <i className="fas fa-star"></i>
                            </div>
                        </div>
                        <div className="stat-value">
                            {dashboardData.basicAnalytics?.average_rating || '0.0'}
                        </div>
                        <div className="stat-label">Average Rating</div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon">
                                <i className="fas fa-percentage"></i>
                            </div>
                        </div>
                        <div className="stat-value">
                            {dashboardData.basicAnalytics?.conversion_rate || '0.0'}%
                        </div>
                        <div className="stat-label">Conversion Rate</div>
                    </div>
                </div>
            </div>
            
            {/* Upgrade notice for advanced analytics */}
            <div className="upgrade-notice">
                <div>
                    <i className="fas fa-lock"></i>
                    <strong>Advanced Analytics Available</strong>
                    <p style={{ margin: '5px 0 0', fontSize: '0.9rem' }}>
                        Upgrade to Professional to unlock detailed insights, audience analytics, and growth trends.
                    </p>
                </div>
                <a href="#" className="upgrade-btn">Upgrade Now</a>
            </div>
        </div>
    );
    
    // Render loyalty rewards section (locked)
    const renderLoyaltyRewards = () => (
        <div className="section locked-section">
            <div className="section-header">
                <div>
                    <h3 className="section-title">Loyalty Rewards</h3>
                    <p className="section-subtitle">Manage customer loyalty programs</p>
                </div>
            </div>
            
            <div className="locked-overlay">
                <div className="locked-message">
                    <i className="fas fa-lock"></i>
                    <h4>Feature Not Available</h4>
                    <p>Loyalty Rewards are only available on the Professional Package.</p>
                    <a href="#" className="btn btn-primary" style={{ marginTop: '15px' }}>
                        Upgrade to Professional
                    </a>
                </div>
            </div>
        </div>
    );
    
    // Render manage plan section
    const renderManagePlan = () => (
        <div className="section">
            <div className="section-header">
                <div>
                    <h3 className="section-title">Manage Plan</h3>
                    <p className="section-subtitle">Current subscription and upgrade options</p>
                </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div style={{ background: '#333', padding: '20px', borderRadius: '8px' }}>
                    <h4 style={{ color: '#1E90FF', margin: '0 0 10px' }}>Current Plan</h4>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '10px' }}>
                        {dashboardData.planInfo?.plan || 'Starter'}
                    </div>
                    <p style={{ color: '#888', margin: '0' }}>
                        Basic features for growing businesses
                    </p>
                </div>
                
                <div style={{ background: '#333', padding: '20px', borderRadius: '8px' }}>
                    <h4 style={{ color: '#1E90FF', margin: '0 0 10px' }}>Upgrade Available</h4>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', marginBottom: '10px' }}>
                        {dashboardData.planInfo?.next_tier || 'Professional'}
                    </div>
                    <p style={{ color: '#888', margin: '0 0 15px' }}>
                        {dashboardData.planInfo?.message || 'Unlock advanced features and analytics'}
                    </p>
                    <a href="#" className="btn btn-primary">
                        Upgrade Now
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
                    <p style={{ color: '#888' }}>Loading section...</p>
                </div>
            );
        }
        
        switch (activeSection) {
            case 'overview':
                return renderOverview();
            case 'reviews':
                return renderReviews();
            case 'bookings':
                return renderBookings();
            case 'profile':
                return renderBusinessProfile();
            case 'settings':
                return renderSettings();
            case 'analytics':
                return renderAnalytics();
            case 'loyalty':
                return renderLoyaltyRewards();
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

// Export for use in HTML
window.BusinessDashboardStarter = BusinessDashboardStarter;
