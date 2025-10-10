import { useEffect, useState } from 'react';
import './DashboardAuth.css';

export default function DashboardAuth() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [businessId, setBusinessId] = useState(null);

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const params = new URLSearchParams(window.location.search);
                const token = params.get('token');
                
                if (!token) {
                    setError('No access token provided');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`/api/auth/verify-dashboard-token?token=${encodeURIComponent(token)}`);
                const data = await response.json();

                if (data.success && data.valid) {
                    setBusinessId(data.businessId);
                    
                    // Store business ID in localStorage for future use
                    localStorage.setItem('businessId', data.businessId);
                    localStorage.setItem('businessToken', token);
                    
                    // Redirect to dashboard
                    window.location.replace(`/dashboard/${data.businessId}`);
                } else {
                    setError(data.error || 'Invalid or expired token');
                }
            } catch (err) {
                console.error('Token verification error:', err);
                setError('Failed to verify access token');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, []);

    const handleRetry = () => {
        setLoading(true);
        setError(null);
        window.location.reload();
    };

    const handleContactSupport = () => {
        window.location.href = 'mailto:support@blkpages.co.uk?subject=Dashboard Access Issue';
    };

    if (loading) {
        return (
            <div className="dashboard-auth">
                <div className="auth-container">
                    <div className="loading-section">
                        <div className="loading-spinner"></div>
                        <h2>Verifying Access</h2>
                        <p>Please wait while we verify your dashboard access...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-auth">
                <div className="auth-container">
                    <div className="error-section">
                        <div className="error-icon">⚠️</div>
                        <h2>Access Denied</h2>
                        <p className="error-message">{error}</p>
                        
                        <div className="error-details">
                            <h3>What this means:</h3>
                            <ul>
                                <li>Your access link may have expired (links are valid for 7 days)</li>
                                <li>The link may have been used already</li>
                                <li>There may be a technical issue with the link</li>
                            </ul>
                        </div>
                        
                        <div className="error-actions">
                            <button onClick={handleRetry} className="retry-btn">
                                Try Again
                            </button>
                            <button onClick={handleContactSupport} className="support-btn">
                                Contact Support
                            </button>
                        </div>
                        
                        <div className="help-section">
                            <h3>Need Help?</h3>
                            <p>If you continue to have issues accessing your dashboard, please contact our support team:</p>
                            <div className="contact-info">
                                <p>📧 Email: <a href="mailto:support@blkpages.co.uk">support@blkpages.co.uk</a></p>
                                <p>📞 Phone: 0800 123 4567</p>
                                <p>🕒 Hours: Monday - Friday, 9 AM - 6 PM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (businessId) {
        return (
            <div className="dashboard-auth">
                <div className="auth-container">
                    <div className="success-section">
                        <div className="success-icon">✅</div>
                        <h2>Access Granted</h2>
                        <p>Redirecting to your dashboard...</p>
                        <div className="loading-spinner"></div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
