import React, { useState, useEffect, useRef } from 'react';
import './BusinessReviewsDashboard.css';

const BusinessReviewsDashboard = () => {
    const [stats, setStats] = useState({
        average_rating: 0,
        total_reviews: 0,
        reviews_this_month: 0,
        positive_percentage: 0
    });
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newReviewsCount, setNewReviewsCount] = useState(0);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    
    const wsRef = useRef(null);
    const businessId = getBusinessIdFromURL();

    // Get business ID from URL or use consistent business ID
    function getBusinessIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('businessId') || 'royal-hair-studio';
    }

    // Fetch review statistics
    const fetchStats = async () => {
        try {
            const response = await fetch(`/api/businesses/${businessId}/review-stats`);
            const data = await response.json();
            setStats(data);
            
            // Trigger highlight effect on stat cards
            highlightStatCards();
        } catch (error) {
            console.error('Error fetching review stats:', error);
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

    // Fetch reviews list
    const fetchReviews = async () => {
        try {
            const response = await fetch(`/api/businesses/${businessId}/reviews`);
            const data = await response.json();
            setReviews(data.reviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    // Fetch all data
    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([fetchStats(), fetchReviews()]);
        setLoading(false);
    };

    // Initialize WebSocket connection
    const initializeWebSocket = () => {
        const wsUrl = `ws://localhost:5000/reviews`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
            console.log('WebSocket connected');
            // Join business room
            wsRef.current.send(JSON.stringify({
                type: 'join_business',
                businessId: businessId
            }));
        };

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'new_review') {
                // Add new review to the list with highlight effect
                const newReview = {
                    id: data.id,
                    reviewer_name: data.reviewerName,
                    rating: data.rating,
                    text: data.text,
                    date: data.createdAt,
                    reply: null,
                    reply_date: null
                };
                
                setReviews(prev => [newReview, ...prev]);
                setNewReviewsCount(prev => prev + 1);
                
                // Update stats immediately
                fetchStats();
                
                // Show notification
                showNewReviewNotification(newReview);
                
                // Highlight the new review card
                setTimeout(() => {
                    const newReviewCard = document.querySelector(`[data-review-id="${newReview.id}"]`);
                    if (newReviewCard) {
                        newReviewCard.classList.add('new-review-highlight');
                        setTimeout(() => {
                            newReviewCard.classList.remove('new-review-highlight');
                        }, 3000);
                    }
                }, 100);
            }
        };

        wsRef.current.onclose = () => {
            console.log('WebSocket disconnected, reconnecting...');
            setTimeout(initializeWebSocket, 3000);
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    };

    // Show notification for new review
    const showNewReviewNotification = (review) => {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'new-review-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <strong>New Review!</strong>
                <p>${review.reviewer_name} left a ${review.rating}-star review</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    };

    // Submit reply to review
    const submitReply = async (reviewId) => {
        if (!replyText.trim()) return;
        
        setSubmittingReply(true);
        try {
            const response = await fetch(`/api/reviews/${reviewId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reply: replyText })
            });
            
            if (response.ok) {
                // Update the review in the list
                setReviews(prev => prev.map(review => 
                    review.id === reviewId 
                        ? { 
                            ...review, 
                            reply: replyText,
                            reply_date: new Date().toISOString()
                        }
                        : review
                ));
                
                setReplyingTo(null);
                setReplyText('');
            }
        } catch (error) {
            console.error('Error submitting reply:', error);
        }
        setSubmittingReply(false);
    };

    // Clear new reviews count
    const clearNewReviewsCount = () => {
        setNewReviewsCount(0);
    };

    // Render star rating
    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span 
                key={i} 
                className={`star ${i < rating ? 'filled' : ''}`}
            >
                ★
            </span>
        ));
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
            <div className="reviews-dashboard">
                <div className="loading">Loading reviews...</div>
            </div>
        );
    }

    return (
        <div className="reviews-dashboard">
            <div className="dashboard-header">
                <h1>Reviews Dashboard</h1>
                <p>Manage and respond to customer reviews</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-content">
                        <h3>{stats.average_rating.toFixed(1)}</h3>
                        <p>Average Rating</p>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-content">
                        <h3>{stats.total_reviews}</h3>
                        <p>Total Reviews</p>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <h3>{stats.reviews_this_month}</h3>
                        <p>This Month</p>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">👍</div>
                    <div className="stat-content">
                        <h3>{stats.positive_percentage}%</h3>
                        <p>Positive Reviews</p>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="reviews-section">
                <div className="section-header">
                    <h2>All Reviews</h2>
                    {newReviewsCount > 0 && (
                        <button 
                            className="new-reviews-badge"
                            onClick={clearNewReviewsCount}
                        >
                            {newReviewsCount} new
                        </button>
                    )}
                </div>
                
                <div className="reviews-list">
                    {reviews.length === 0 ? (
                        <div className="no-reviews">
                            <p>No reviews yet. Encourage customers to leave reviews!</p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="review-card" data-review-id={review.id}>
                                <div className="review-header">
                                    <div className="reviewer-info">
                                        <h4>{review.reviewer_name}</h4>
                                        <div className="review-rating">
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>
                                    <div className="review-date">
                                        {formatDate(review.date)}
                                    </div>
                                </div>
                                
                                <div className="review-text">
                                    {review.text}
                                </div>
                                
                                {review.reply ? (
                                    <div className="review-reply">
                                        <div className="reply-header">
                                            <strong>Your Reply</strong>
                                            <span className="reply-date">
                                                {formatDate(review.reply_date)}
                                            </span>
                                        </div>
                                        <p>{review.reply}</p>
                                    </div>
                                ) : (
                                    <div className="reply-section">
                                        {replyingTo === review.id ? (
                                            <div className="reply-form">
                                                <textarea
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder="Write your reply..."
                                                    rows="3"
                                                />
                                                <div className="reply-actions">
                                                    <button 
                                                        onClick={() => submitReply(review.id)}
                                                        disabled={submittingReply || !replyText.trim()}
                                                        className="btn-primary"
                                                    >
                                                        {submittingReply ? 'Sending...' : 'Send Reply'}
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setReplyingTo(null);
                                                            setReplyText('');
                                                        }}
                                                        className="btn-secondary"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setReplyingTo(review.id)}
                                                className="btn-reply"
                                            >
                                                Reply to Review
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default BusinessReviewsDashboard;
