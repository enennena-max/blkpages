/**
 * BlkPages Review System
 * Handles review verification, moderation, and business replies
 */

class ReviewSystem {
    constructor() {
        this.profanityFilter = new ProfanityFilter();
        this.emailService = new EmailService();
    }

    // ========================================
    // REVIEW VERIFICATION
    // ========================================

    /**
     * Verify if customer can leave a review
     * Only customers who booked and attended a service can review
     */
    async verifyReviewEligibility(customerId, businessId, bookingId) {
        try {
            // Check if booking exists and is completed
            const booking = await this.getBooking(bookingId);
            
            if (!booking) {
                return { eligible: false, reason: 'Booking not found' };
            }

            if (booking.customerId !== customerId) {
                return { eligible: false, reason: 'Booking does not belong to customer' };
            }

            if (booking.businessId !== businessId) {
                return { eligible: false, reason: 'Booking does not belong to business' };
            }

            if (booking.status !== 'completed') {
                return { eligible: false, reason: 'Booking not completed' };
            }

            // Check if customer already left a review for this booking
            const existingReview = await this.getReviewByBooking(bookingId);
            if (existingReview) {
                return { eligible: false, reason: 'Review already exists for this booking' };
            }

            return { eligible: true };
        } catch (error) {
            console.error('Review verification failed:', error);
            return { eligible: false, reason: 'Verification error' };
        }
    }

    /**
     * Submit a new review
     */
    async submitReview(reviewData) {
        try {
            const { customerId, businessId, bookingId, rating, reviewText } = reviewData;

            // Verify eligibility
            const verification = await this.verifyReviewEligibility(customerId, businessId, bookingId);
            if (!verification.eligible) {
                throw new Error(verification.reason);
            }

            // Moderate content
            const moderatedText = this.profanityFilter.moderate(reviewText);
            
            // Create review
            const review = {
                id: `review_${Date.now()}`,
                customerId,
                businessId,
                bookingId,
                rating: Math.max(1, Math.min(5, rating)), // Ensure rating is between 1-5
                reviewText: moderatedText,
                isModerated: moderatedText !== reviewText,
                createdAt: new Date(),
                status: 'published'
            };

            // Save review
            await this.saveReview(review);

            // Update business rating
            await this.updateBusinessRating(businessId);

            // Send notification to business
            await this.notifyBusinessOfReview(businessId, review);

            return review;
        } catch (error) {
            console.error('Review submission failed:', error);
            throw error;
        }
    }

    // ========================================
    // BUSINESS REPLY SYSTEM
    // ========================================

    /**
     * Submit business reply to a review
     */
    async submitBusinessReply(reviewId, replyText, businessId) {
        try {
            // Get review
            const review = await this.getReview(reviewId);
            if (!review) {
                throw new Error('Review not found');
            }

            if (review.businessId !== businessId) {
                throw new Error('Unauthorized to reply to this review');
            }

            if (review.businessReply) {
                throw new Error('Reply already exists for this review');
            }

            // Moderate reply content
            const moderatedReply = this.profanityFilter.moderate(replyText);

            // Create business reply
            const businessReply = {
                reviewId,
                replyText: moderatedReply,
                isModerated: moderatedReply !== replyText,
                businessId,
                createdAt: new Date(),
                status: 'published'
            };

            // Save reply
            await this.saveBusinessReply(businessReply);

            // Update review with reply
            await this.updateReviewWithReply(reviewId, businessReply);

            // Notify customer of reply
            await this.notifyCustomerOfReply(review.customerId, review, businessReply);

            return businessReply;
        } catch (error) {
            console.error('Business reply submission failed:', error);
            throw error;
        }
    }

    // ========================================
    // REVIEW DISPLAY
    // ========================================

    /**
     * Get reviews for a business
     */
    async getBusinessReviews(businessId, options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                sortBy = 'newest', 
                rating = null 
            } = options;

            const reviews = await this.database.getBusinessReviews({
                businessId,
                page,
                limit,
                sortBy,
                rating,
                status: 'published'
            });

            // Calculate average rating
            const averageRating = await this.calculateAverageRating(businessId);
            const totalReviews = await this.getTotalReviewCount(businessId);

            return {
                reviews,
                averageRating,
                totalReviews,
                pagination: {
                    page,
                    limit,
                    total: totalReviews
                }
            };
        } catch (error) {
            console.error('Failed to get business reviews:', error);
            throw error;
        }
    }

    /**
     * Calculate average rating for business
     */
    async calculateAverageRating(businessId) {
        const reviews = await this.database.getBusinessReviews({ businessId, status: 'published' });
        
        if (reviews.length === 0) return 0;
        
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        return Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
    }

    // ========================================
    // AUTOMATED REVIEW REQUESTS
    // ========================================

    /**
     * Send review request email after booking completion
     */
    async sendReviewRequest(bookingId) {
        try {
            const booking = await this.getBooking(bookingId);
            if (!booking || booking.status !== 'completed') {
                console.log('Booking not completed, skipping review request');
                return;
            }

            // Check if review request already sent
            const existingRequest = await this.getReviewRequest(bookingId);
            if (existingRequest) {
                console.log('Review request already sent for booking', bookingId);
                return;
            }

            // Send review request email
            await this.emailService.sendReviewRequest({
                to: booking.customer.email,
                customerName: booking.customer.firstName,
                businessName: booking.business.name,
                service: booking.service.name,
                bookingDate: booking.bookingTime,
                reviewUrl: `${process.env.PLATFORM_URL}/review/${bookingId}`
            });

            // Mark review request as sent
            await this.markReviewRequestSent(bookingId);

        } catch (error) {
            console.error('Failed to send review request:', error);
        }
    }

    // ========================================
    // CONTENT MODERATION
    // ========================================

    /**
     * Moderate review content
     */
    moderateContent(content) {
        return this.profanityFilter.moderate(content);
    }

    // ========================================
    // DATABASE OPERATIONS
    // ========================================

    async getBooking(bookingId) {
        // Implementation would query database
        return {
            id: bookingId,
            customerId: 'customer_123',
            businessId: 'business_456',
            customer: { firstName: 'Jane', email: 'jane.smith@email.com' },
            business: { name: 'Glow Salon', email: 'glow.salon@email.com' },
            service: { name: 'Haircut' },
            bookingTime: new Date(),
            status: 'completed'
        };
    }

    async getReview(reviewId) {
        // Implementation would query database
        return {
            id: reviewId,
            customerId: 'customer_123',
            businessId: 'business_456',
            bookingId: 'booking_789',
            rating: 5,
            reviewText: 'Great service!',
            createdAt: new Date(),
            status: 'published'
        };
    }

    async getReviewByBooking(bookingId) {
        // Implementation would query database
        return null; // No existing review
    }

    async saveReview(review) {
        // Implementation would save to database
        console.log('Saving review:', review);
    }

    async saveBusinessReply(reply) {
        // Implementation would save to database
        console.log('Saving business reply:', reply);
    }

    async updateReviewWithReply(reviewId, reply) {
        // Implementation would update database
        console.log('Updating review with reply:', reviewId, reply);
    }

    async updateBusinessRating(businessId) {
        // Implementation would update business rating
        console.log('Updating business rating for:', businessId);
    }

    async getTotalReviewCount(businessId) {
        // Implementation would query database
        return 127; // Sample count
    }

    async getReviewRequest(bookingId) {
        // Implementation would query database
        return null; // No existing request
    }

    async markReviewRequestSent(bookingId) {
        // Implementation would save to database
        console.log('Marking review request as sent for booking:', bookingId);
    }

    async notifyBusinessOfReview(businessId, review) {
        // Implementation would send notification
        console.log('Notifying business of new review:', businessId, review);
    }

    async notifyCustomerOfReply(customerId, review, reply) {
        // Implementation would send notification
        console.log('Notifying customer of business reply:', customerId, review, reply);
    }
}

// ========================================
// PROFANITY FILTER
// ========================================

class ProfanityFilter {
    constructor() {
        this.profanityWords = [
            // Add profanity words here
            'badword1', 'badword2', 'badword3'
        ];
    }

    moderate(content) {
        let moderatedContent = content;
        
        // Check for profanity
        this.profanityWords.forEach(word => {
            const regex = new RegExp(word, 'gi');
            if (regex.test(content)) {
                moderatedContent = moderatedContent.replace(regex, '[Content removed]');
            }
        });

        return moderatedContent;
    }

    isProfane(content) {
        return this.profanityWords.some(word => {
            const regex = new RegExp(word, 'gi');
            return regex.test(content);
        });
    }
}

// ========================================
// EMAIL SERVICE
// ========================================

class EmailService {
    async sendReviewRequest(data) {
        console.log('Sending review request email:', data);
        // Implementation would use email service
    }
}

module.exports = ReviewSystem;