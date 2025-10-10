/**
 * Review Data Synchronization Utility
 * 
 * This utility ensures that both the business dashboard and reviews dashboard
 * use the same data source and stay synchronized in real-time.
 */

class ReviewDataSync {
    constructor() {
        this.businessId = this.getBusinessId();
        this.ws = null;
        this.stats = {
            average_rating: 0,
            total_reviews: 0,
            reviews_this_month: 0,
            positive_percentage: 0
        };
        this.reviews = [];
        this.newReviewsCount = 0;
        this.subscribers = new Set();
        this.isInitialized = false;
    }

    // Get business ID (replace with actual authentication logic)
    getBusinessId() {
        // In a real implementation, this would come from authentication
        return 'royal-hair-studio';
    }

    // Subscribe to data updates
    subscribe(callback) {
        this.subscribers.add(callback);
        
        // If already initialized, send current data immediately
        if (this.isInitialized) {
            callback({
                type: 'stats_update',
                stats: this.stats,
                reviews: this.reviews,
                newReviewsCount: this.newReviewsCount
            });
        }
        
        return () => this.subscribers.delete(callback);
    }

    // Notify all subscribers of data changes
    notifySubscribers(type, data) {
        this.subscribers.forEach(callback => {
            callback({ type, ...data });
        });
    }

    // Fetch review statistics from API
    async fetchStats() {
        try {
            const response = await fetch(`/api/businesses/${this.businessId}/review-stats`);
            const data = await response.json();
            
            this.stats = data;
            this.notifySubscribers('stats_update', { stats: data });
            
            return data;
        } catch (error) {
            console.error('Error fetching review stats:', error);
            return null;
        }
    }

    // Fetch reviews list from API
    async fetchReviews() {
        try {
            const response = await fetch(`/api/businesses/${this.businessId}/reviews`);
            const data = await response.json();
            
            this.reviews = data.reviews;
            this.notifySubscribers('reviews_update', { reviews: data.reviews });
            
            return data.reviews;
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }
    }

    // Initialize WebSocket connection
    initializeWebSocket() {
        const wsUrl = `ws://localhost:5000`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('Review Data Sync WebSocket connected');
            // Join business room for review notifications
            this.ws.send(JSON.stringify({
                type: 'join_business',
                businessId: this.businessId
            }));
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'new_review') {
                // Add new review to the list
                const newReview = {
                    id: data.id,
                    reviewer_name: data.reviewerName,
                    rating: data.rating,
                    text: data.text,
                    date: data.createdAt,
                    reply: null,
                    reply_date: null
                };
                
                this.reviews = [newReview, ...this.reviews];
                this.newReviewsCount++;
                
                // Update stats immediately
                this.fetchStats();
                
                // Notify subscribers
                this.notifySubscribers('new_review', {
                    review: newReview,
                    newReviewsCount: this.newReviewsCount
                });
            }
        };

        this.ws.onclose = () => {
            console.log('Review Data Sync WebSocket disconnected, reconnecting...');
            setTimeout(() => this.initializeWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('Review Data Sync WebSocket error:', error);
        };
    }

    // Initialize the complete system
    async initialize() {
        if (this.isInitialized) return;
        
        // Fetch initial data
        await Promise.all([
            this.fetchStats(),
            this.fetchReviews()
        ]);
        
        // Initialize WebSocket
        this.initializeWebSocket();
        
        // Set up polling as fallback (every 30 seconds)
        setInterval(() => {
            this.fetchStats();
            this.fetchReviews();
        }, 30000);
        
        this.isInitialized = true;
        console.log('Review Data Sync initialized');
    }

    // Clear new reviews count
    clearNewReviewsCount() {
        this.newReviewsCount = 0;
        this.notifySubscribers('clear_new_reviews', { newReviewsCount: 0 });
    }

    // Submit reply to a review
    async submitReply(reviewId, reply) {
        try {
            const response = await fetch(`/api/reviews/${reviewId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reply })
            });
            
            if (response.ok) {
                // Update the review in the list
                this.reviews = this.reviews.map(review => 
                    review.id === reviewId 
                        ? { 
                            ...review, 
                            reply: reply,
                            reply_date: new Date().toISOString()
                        }
                        : review
                );
                
                this.notifySubscribers('review_updated', { 
                    reviewId, 
                    reply,
                    reviews: this.reviews 
                });
                
                return true;
            }
        } catch (error) {
            console.error('Error submitting reply:', error);
        }
        return false;
    }

    // Get current stats
    getStats() {
        return this.stats;
    }

    // Get current reviews
    getReviews() {
        return this.reviews;
    }

    // Get new reviews count
    getNewReviewsCount() {
        return this.newReviewsCount;
    }
}

// Create global instance
window.reviewDataSync = new ReviewDataSync();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.reviewDataSync.initialize();
    });
} else {
    window.reviewDataSync.initialize();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReviewDataSync;
}
