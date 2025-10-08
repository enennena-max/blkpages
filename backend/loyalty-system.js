/**
 * BlkPages Loyalty Rewards System
 * Template-based loyalty schemes for businesses with add-on subscription
 */

class LoyaltySystem {
    constructor() {
        this.loyaltyTemplates = {
            visitBased: {
                id: 'visit_based',
                name: 'Visit-based',
                description: 'Book X visits, get reward',
                fields: ['threshold', 'rewardType', 'rewardValue']
            },
            spendBased: {
                id: 'spend_based', 
                name: 'Spend-based',
                description: 'Spend £Y, get reward',
                fields: ['threshold', 'rewardType', 'rewardValue']
            },
            timeLimited: {
                id: 'time_limited',
                name: 'Time-limited',
                description: 'Book X visits within Z weeks, get reward',
                fields: ['threshold', 'timeLimit', 'rewardType', 'rewardValue']
            }
        };

        this.rewardTypes = {
            freeService: {
                id: 'free_service',
                name: '1 Free Service',
                description: 'Customer gets one free service of their choice'
            },
            fixedDiscount: {
                id: 'fixed_discount',
                name: 'Fixed £ Discount',
                description: 'Customer gets a fixed amount off their next booking'
            },
            percentageDiscount: {
                id: 'percentage_discount',
                name: '% Discount',
                description: 'Customer gets a percentage off their next booking'
            }
        };
    }

    // ========================================
    // LOYALTY PROGRAM MANAGEMENT
    // ========================================

    /**
     * Check if business has loyalty add-on enabled
     */
    async hasLoyaltyAddOn(businessId) {
        const business = await this.getBusiness(businessId);
        return business.addOns && business.addOns.includes('loyalty_rewards');
    }

    /**
     * Create or update loyalty program for business
     */
    async setLoyaltyProgram(businessId, programData) {
        try {
            // Check if business has loyalty add-on
            const hasAddOn = await this.hasLoyaltyAddOn(businessId);
            if (!hasAddOn) {
                throw new Error('Loyalty Rewards add-on not enabled');
            }

            // Validate program data
            this.validateLoyaltyProgram(programData);

            // Create loyalty program
            const loyaltyProgram = {
                id: `loyalty_${Date.now()}`,
                businessId,
                type: programData.type,
                threshold: programData.threshold,
                timeLimit: programData.timeLimit || null,
                rewardType: programData.rewardType,
                rewardValue: programData.rewardValue,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Save loyalty program
            await this.saveLoyaltyProgram(loyaltyProgram);

            return loyaltyProgram;
        } catch (error) {
            console.error('Failed to set loyalty program:', error);
            throw error;
        }
    }

    /**
     * Get loyalty program for business
     */
    async getLoyaltyProgram(businessId) {
        try {
            const program = await this.database.getLoyaltyProgram(businessId);
            return program;
        } catch (error) {
            console.error('Failed to get loyalty program:', error);
            return null;
        }
    }

    /**
     * Validate loyalty program data
     */
    validateLoyaltyProgram(programData) {
        const { type, threshold, rewardType, rewardValue, timeLimit } = programData;

        // Validate type
        if (!this.loyaltyTemplates[type]) {
            throw new Error('Invalid loyalty type');
        }

        // Validate threshold
        if (!threshold || threshold < 1) {
            throw new Error('Threshold must be at least 1');
        }

        // Validate time limit for time-limited programs
        if (type === 'timeLimited' && (!timeLimit || timeLimit < 1)) {
            throw new Error('Time limit must be at least 1 week');
        }

        // Validate reward type
        if (!this.rewardTypes[rewardType]) {
            throw new Error('Invalid reward type');
        }

        // Validate reward value
        if (!rewardValue || rewardValue <= 0) {
            throw new Error('Reward value must be greater than 0');
        }

        // Additional validation for percentage discounts
        if (rewardType === 'percentageDiscount' && rewardValue > 100) {
            throw new Error('Percentage discount cannot exceed 100%');
        }
    }

    // ========================================
    // CUSTOMER LOYALTY TRACKING
    // ========================================

    /**
     * Get customer loyalty progress for a business
     */
    async getCustomerLoyaltyProgress(customerId, businessId) {
        try {
            const loyaltyProgram = await this.getLoyaltyProgram(businessId);
            if (!loyaltyProgram || !loyaltyProgram.isActive) {
                return null;
            }

            // Get customer's booking history with this business
            const bookings = await this.getCustomerBookings(customerId, businessId);
            
            // Calculate progress based on program type
            const progress = this.calculateProgress(loyaltyProgram, bookings);
            
            // Check if reward is unlocked
            const isRewardUnlocked = this.isRewardUnlocked(loyaltyProgram, progress);
            
            // Check if reward has been used
            const isRewardUsed = await this.isRewardUsed(customerId, businessId);

            return {
                program: loyaltyProgram,
                progress,
                isRewardUnlocked,
                isRewardUsed,
                bookings: bookings.length
            };
        } catch (error) {
            console.error('Failed to get customer loyalty progress:', error);
            return null;
        }
    }

    /**
     * Calculate loyalty progress based on program type
     */
    calculateProgress(program, bookings) {
        const now = new Date();
        
        switch (program.type) {
            case 'visitBased':
                return {
                    current: bookings.length,
                    target: program.threshold,
                    percentage: Math.min(100, (bookings.length / program.threshold) * 100)
                };

            case 'spendBased':
                const totalSpent = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
                return {
                    current: totalSpent,
                    target: program.threshold,
                    percentage: Math.min(100, (totalSpent / program.threshold) * 100)
                };

            case 'timeLimited':
                const weeksAgo = new Date(now.getTime() - (program.timeLimit * 7 * 24 * 60 * 60 * 1000));
                const recentBookings = bookings.filter(booking => 
                    new Date(booking.bookingTime) >= weeksAgo
                );
                return {
                    current: recentBookings.length,
                    target: program.threshold,
                    percentage: Math.min(100, (recentBookings.length / program.threshold) * 100),
                    timeRemaining: this.calculateTimeRemaining(program.timeLimit, bookings)
                };

            default:
                return { current: 0, target: 0, percentage: 0 };
        }
    }

    /**
     * Check if reward is unlocked
     */
    isRewardUnlocked(program, progress) {
        return progress.current >= program.threshold;
    }

    /**
     * Check if reward has been used
     */
    async isRewardUsed(customerId, businessId) {
        const usedReward = await this.database.getUsedReward(customerId, businessId);
        return !!usedReward;
    }

    /**
     * Apply loyalty reward at checkout
     */
    async applyLoyaltyReward(customerId, businessId, bookingData) {
        try {
            const loyaltyProgress = await this.getCustomerLoyaltyProgress(customerId, businessId);
            
            if (!loyaltyProgress || !loyaltyProgress.isRewardUnlocked || loyaltyProgress.isRewardUsed) {
                return { applied: false, discount: 0 };
            }

            const program = loyaltyProgress.program;
            let discount = 0;
            let rewardDescription = '';

            switch (program.rewardType) {
                case 'freeService':
                    // Find the cheapest service for free
                    const services = await this.getBusinessServices(businessId);
                    const cheapestService = services.reduce((min, service) => 
                        service.price < min.price ? service : min
                    );
                    discount = cheapestService.price;
                    rewardDescription = `Free ${cheapestService.name}`;
                    break;

                case 'fixedDiscount':
                    discount = Math.min(program.rewardValue, bookingData.totalAmount);
                    rewardDescription = `£${program.rewardValue} off`;
                    break;

                case 'percentageDiscount':
                    discount = (bookingData.totalAmount * program.rewardValue) / 100;
                    rewardDescription = `${program.rewardValue}% off`;
                    break;
            }

            // Mark reward as used
            await this.markRewardAsUsed(customerId, businessId, program.id);

            return {
                applied: true,
                discount,
                rewardDescription,
                program
            };
        } catch (error) {
            console.error('Failed to apply loyalty reward:', error);
            return { applied: false, discount: 0 };
        }
    }

    // ========================================
    // BOOKING INTEGRATION
    // ========================================

    /**
     * Increment loyalty progress for customer and business
     */
    async increment(customerId, businessId, bookingData) {
        try {
            // Get business loyalty program
            const loyaltyProgram = await this.getLoyaltyProgram(businessId);
            if (!loyaltyProgram || !loyaltyProgram.isActive) {
                console.log('No active loyalty program for business:', businessId);
                return;
            }

            // Get customer's current progress
            const currentProgress = await this.getCustomerLoyaltyProgress(customerId, businessId);
            
            // Calculate new progress based on loyalty program type
            const newProgress = this.calculateProgressIncrement(currentProgress, loyaltyProgram, bookingData);
            
            // Update customer loyalty progress
            await this.updateCustomerLoyaltyProgress(customerId, businessId, newProgress);
            
            // Check if reward is newly unlocked
            if (newProgress.isRewardUnlocked && !currentProgress.isRewardUnlocked) {
                // Send reward notification to customer
                await this.sendRewardNotification(customerId, businessId, loyaltyProgram);
            }
            
            // Check if customer is close to unlocking reward (for "almost unlocked" emails)
            if (this.isAlmostUnlocked(newProgress, loyaltyProgram)) {
                await this.sendAlmostUnlockedNotification(customerId, businessId, loyaltyProgram, newProgress);
            }

            console.log('Loyalty progress updated for customer:', customerId, 'business:', businessId);
            return newProgress;
        } catch (error) {
            console.error('Failed to increment loyalty progress:', error);
            throw error;
        }
    }

    /**
     * Calculate progress increment based on loyalty program type
     */
    calculateProgressIncrement(currentProgress, loyaltyProgram, bookingData) {
        const newProgress = { ...currentProgress };
        
        switch (loyaltyProgram.type) {
            case 'visit_based':
                newProgress.visitCount = (currentProgress.visitCount || 0) + 1;
                newProgress.isRewardUnlocked = newProgress.visitCount >= loyaltyProgram.threshold;
                break;
                
            case 'spend_based':
                newProgress.totalSpent = (currentProgress.totalSpent || 0) + bookingData.totalAmount;
                newProgress.isRewardUnlocked = newProgress.totalSpent >= loyaltyProgram.threshold;
                break;
                
            case 'time_limited':
                newProgress.visitCount = (currentProgress.visitCount || 0) + 1;
                const timeLimitExpired = this.isTimeLimitExpired(loyaltyProgram.timeLimit, currentProgress.firstVisitDate);
                newProgress.isRewardUnlocked = !timeLimitExpired && newProgress.visitCount >= loyaltyProgram.threshold;
                break;
        }
        
        // Update timestamps
        newProgress.lastVisit = new Date().toISOString();
        if (!newProgress.firstVisit) {
            newProgress.firstVisit = new Date().toISOString();
        }
        
        return newProgress;
    }

    /**
     * Check if customer is almost unlocked (for notifications)
     */
    isAlmostUnlocked(progress, loyaltyProgram) {
        switch (loyaltyProgram.type) {
            case 'visit_based':
                return progress.visitCount === loyaltyProgram.threshold - 1;
            case 'spend_based':
                return progress.totalSpent >= loyaltyProgram.threshold * 0.8; // 80% of threshold
            case 'time_limited':
                return progress.visitCount === loyaltyProgram.threshold - 1;
            default:
                return false;
        }
    }

    /**
     * Update loyalty progress when booking is completed
     */
    async updateLoyaltyProgress(bookingId) {
        try {
            const booking = await this.getBooking(bookingId);
            if (!booking || booking.status !== 'completed') {
                return;
            }

            const { customerId, businessId } = booking;
            
            // Use the new increment method
            await this.increment(customerId, businessId, {
                bookingId: bookingId,
                totalAmount: booking.totalAmount,
                services: booking.services,
                completedAt: new Date()
            });
        } catch (error) {
            console.error('Failed to update loyalty progress:', error);
        }
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Update customer loyalty progress in database
     */
    async updateCustomerLoyaltyProgress(customerId, businessId, progress) {
        // Implementation would update database
        const key = `loyalty_${customerId}_${businessId}`;
        localStorage.setItem(key, JSON.stringify(progress));
        console.log('Updated loyalty progress:', key, progress);
    }

    /**
     * Check if time limit has expired
     */
    isTimeLimitExpired(timeLimitDays, firstVisitDate) {
        if (!firstVisitDate) return false;
        const firstVisit = new Date(firstVisitDate);
        const now = new Date();
        const daysDiff = (now - firstVisit) / (1000 * 60 * 60 * 24);
        return daysDiff > timeLimitDays;
    }

    /**
     * Send almost unlocked notification
     */
    async sendAlmostUnlockedNotification(customerId, businessId, loyaltyProgram, progress) {
        try {
            const customer = await this.getCustomer(customerId);
            const business = await this.getBusiness(businessId);
            
            // Calculate progress percentage
            const progressPercentage = this.calculateProgressPercentage(progress, loyaltyProgram);
            
            // Send notification
            await this.emailService.sendAlmostUnlockedNotification({
                to: customer.email,
                customerName: customer.firstName,
                businessName: business.name,
                progressPercentage: progressPercentage,
                loyaltyProgram: loyaltyProgram
            });
            
            console.log('Almost unlocked notification sent to customer:', customerId);
        } catch (error) {
            console.error('Failed to send almost unlocked notification:', error);
        }
    }

    /**
     * Calculate progress percentage
     */
    calculateProgressPercentage(progress, loyaltyProgram) {
        switch (loyaltyProgram.type) {
            case 'visit_based':
                return Math.round((progress.visitCount / loyaltyProgram.threshold) * 100);
            case 'spend_based':
                return Math.round((progress.totalSpent / loyaltyProgram.threshold) * 100);
            case 'time_limited':
                return Math.round((progress.visitCount / loyaltyProgram.threshold) * 100);
            default:
                return 0;
        }
    }

    // ========================================
    // NOTIFICATIONS
    // ========================================

    /**
     * Send reward notification to customer
     */
    async sendRewardNotification(customerId, businessId, program) {
        try {
            const customer = await this.getCustomer(customerId);
            const business = await this.getBusiness(businessId);
            
            await this.emailService.sendRewardNotification({
                to: customer.email,
                customerName: customer.firstName,
                businessName: business.name,
                rewardDescription: this.getRewardDescription(program),
                dashboardUrl: `${process.env.PLATFORM_URL}/customer-dashboard`
            });
        } catch (error) {
            console.error('Failed to send reward notification:', error);
        }
    }

    /**
     * Get reward description for display
     */
    getRewardDescription(program) {
        switch (program.rewardType) {
            case 'freeService':
                return '1 Free Service';
            case 'fixedDiscount':
                return `£${program.rewardValue} off your next booking`;
            case 'percentageDiscount':
                return `${program.rewardValue}% off your next booking`;
            default:
                return 'Loyalty Reward';
        }
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    calculateTimeRemaining(timeLimitWeeks, bookings) {
        if (bookings.length === 0) return timeLimitWeeks;
        
        const latestBooking = bookings[bookings.length - 1];
        const bookingDate = new Date(latestBooking.bookingTime);
        const weeksSinceBooking = (Date.now() - bookingDate.getTime()) / (7 * 24 * 60 * 60 * 1000);
        
        return Math.max(0, timeLimitWeeks - weeksSinceBooking);
    }

    // ========================================
    // DATABASE OPERATIONS
    // ========================================

    async getBusiness(businessId) {
        // Implementation would query database
        return {
            id: businessId,
            name: 'Glow Hair',
            addOns: ['loyalty_rewards']
        };
    }

    async getCustomer(customerId) {
        // Implementation would query database
        return {
            id: customerId,
            firstName: 'Jane',
            email: 'jane.smith@email.com'
        };
    }

    async getBooking(bookingId) {
        // Implementation would query database
        return {
            id: bookingId,
            customerId: 'customer_123',
            businessId: 'business_456',
            status: 'completed',
            totalAmount: 45,
            bookingTime: new Date()
        };
    }

    async getCustomerBookings(customerId, businessId) {
        // Implementation would query database
        return [
            { id: 'booking_1', totalAmount: 45, bookingTime: new Date('2024-12-01') },
            { id: 'booking_2', totalAmount: 50, bookingTime: new Date('2024-12-15') },
            { id: 'booking_3', totalAmount: 40, bookingTime: new Date('2024-12-28') }
        ];
    }

    async getBusinessServices(businessId) {
        // Implementation would query database
        return [
            { id: 'service_1', name: 'Haircut', price: 45 },
            { id: 'service_2', name: 'Styling', price: 60 },
            { id: 'service_3', name: 'Coloring', price: 80 }
        ];
    }

    async saveLoyaltyProgram(program) {
        // Implementation would save to database
        console.log('Saving loyalty program:', program);
    }

    async markRewardAsUsed(customerId, businessId, programId) {
        // Implementation would save to database
        console.log('Marking reward as used:', { customerId, businessId, programId });
    }

    async getUsedReward(customerId, businessId) {
        // Implementation would query database
        return null; // No used reward
    }
}

module.exports = LoyaltySystem;
