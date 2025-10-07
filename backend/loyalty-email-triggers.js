/**
 * Loyalty Reward Email Trigger System
 * 
 * This file documents the automatic email triggers for loyalty reward unlocks.
 * Each reward can only be unlocked once per customer per loyalty program.
 */

// Email Template Configuration
const LOYALTY_EMAIL_CONFIG = {
    template: 'loyalty-reward-unlocked.html',
    subject: '🎉 You\'ve unlocked a reward at [Business Name]!',
    trigger: 'immediate', // Send immediately when threshold is met
    oneTimeOnly: true, // Each reward can only be unlocked once
};

// Loyalty Program Types
const LOYALTY_TYPES = {
    VISIT_BASED: 'visitBased',
    SPEND_BASED: 'spendBased', 
    TIME_LIMITED: 'timeLimited'
};

// Reward Types
const REWARD_TYPES = {
    FREE_SERVICE: 'freeService',
    FIXED_DISCOUNT: 'fixedDiscount',
    PERCENTAGE_DISCOUNT: 'percentageDiscount'
};

/**
 * Check if customer has unlocked a loyalty reward
 * @param {Object} customer - Customer data
 * @param {Object} business - Business data with loyalty program
 * @param {Object} booking - Current booking data
 * @returns {Object|null} - Reward unlock data or null if no reward
 */
function checkLoyaltyRewardUnlock(customer, business, booking) {
    const loyaltyProgram = business.loyaltyProgram;
    
    // Check if business has active loyalty program
    if (!loyaltyProgram || !loyaltyProgram.isActive) {
        return null;
    }
    
    // Check if customer has already unlocked this reward
    if (customer.unlockedRewards && customer.unlockedRewards.includes(loyaltyProgram.id)) {
        return null;
    }
    
    // Get customer's loyalty progress for this business
    const customerProgress = getCustomerLoyaltyProgress(customer.id, business.id);
    
    // Check threshold based on loyalty type
    let hasUnlockedReward = false;
    
    switch (loyaltyProgram.type) {
        case LOYALTY_TYPES.VISIT_BASED:
            hasUnlockedReward = customerProgress.visitCount >= loyaltyProgram.threshold;
            break;
            
        case LOYALTY_TYPES.SPEND_BASED:
            hasUnlockedReward = customerProgress.totalSpent >= loyaltyProgram.threshold;
            break;
            
        case LOYALTY_TYPES.TIME_LIMITED:
            // Check if within time limit and visit threshold met
            const timeLimitExpired = isTimeLimitExpired(loyaltyProgram.timeLimit, customerProgress.firstVisitDate);
            hasUnlockedReward = !timeLimitExpired && customerProgress.visitCount >= loyaltyProgram.threshold;
            break;
    }
    
    if (hasUnlockedReward) {
        return {
            customerId: customer.id,
            businessId: business.id,
            loyaltyProgramId: loyaltyProgram.id,
            rewardType: loyaltyProgram.rewardType,
            rewardValue: loyaltyProgram.rewardValue,
            progressData: customerProgress
        };
    }
    
    return null;
}

/**
 * Generate email data for loyalty reward unlock
 * @param {Object} unlockData - Reward unlock data
 * @param {Object} customer - Customer data
 * @param {Object} business - Business data
 * @returns {Object} - Email data for template
 */
function generateLoyaltyEmailData(unlockData, customer, business) {
    const loyaltyProgram = business.loyaltyProgram;
    
    // Generate reward name and description
    let rewardName, rewardDescription;
    
    switch (loyaltyProgram.rewardType) {
        case REWARD_TYPES.FREE_SERVICE:
            rewardName = '1 Free Service';
            rewardDescription = `You've completed ${loyaltyProgram.threshold} ${loyaltyProgram.type === LOYALTY_TYPES.VISIT_BASED ? 'visits' : 'spending milestone'}! Enjoy a complimentary service on your next booking.`;
            break;
            
        case REWARD_TYPES.FIXED_DISCOUNT:
            rewardName = `£${loyaltyProgram.rewardValue} Off Next Booking`;
            rewardDescription = `You've completed ${loyaltyProgram.threshold} ${loyaltyProgram.type === LOYALTY_TYPES.VISIT_BASED ? 'visits' : 'spending milestone'}! Get £${loyaltyProgram.rewardValue} off your next booking.`;
            break;
            
        case REWARD_TYPES.PERCENTAGE_DISCOUNT:
            rewardName = `${loyaltyProgram.rewardValue}% Off Next Booking`;
            rewardDescription = `You've completed ${loyaltyProgram.threshold} ${loyaltyProgram.type === LOYALTY_TYPES.VISIT_BASED ? 'visits' : 'spending milestone'}! Get ${loyaltyProgram.rewardValue}% off your next booking.`;
            break;
    }
    
    // Generate progress text
    let progressText;
    switch (loyaltyProgram.type) {
        case LOYALTY_TYPES.VISIT_BASED:
            progressText = `${unlockData.progressData.visitCount} of ${loyaltyProgram.threshold} visits complete`;
            break;
        case LOYALTY_TYPES.SPEND_BASED:
            progressText = `£${unlockData.progressData.totalSpent} of £${loyaltyProgram.threshold} spent`;
            break;
        case LOYALTY_TYPES.TIME_LIMITED:
            progressText = `${unlockData.progressData.visitCount} of ${loyaltyProgram.threshold} visits complete (within ${loyaltyProgram.timeLimit} weeks)`;
            break;
    }
    
    return {
        customerFirstName: customer.firstName,
        businessName: business.name,
        rewardName: rewardName,
        rewardDescription: rewardDescription,
        progressText: progressText,
        platformName: 'BlkPages',
        bookingUrl: `${process.env.BASE_URL}/book/${business.id}?reward=${loyaltyProgram.id}`
    };
}

/**
 * Send loyalty reward unlock email
 * @param {Object} unlockData - Reward unlock data
 * @param {Object} customer - Customer data
 * @param {Object} business - Business data
 */
async function sendLoyaltyRewardEmail(unlockData, customer, business) {
    try {
        // Generate email data
        const emailData = generateLoyaltyEmailData(unlockData, customer, business);
        
        // Mark reward as unlocked for this customer
        await markRewardAsUnlocked(unlockData.customerId, unlockData.loyaltyProgramId);
        
        // Send email
        await sendEmail({
            to: customer.email,
            subject: LOYALTY_EMAIL_CONFIG.subject.replace('[Business Name]', business.name),
            template: LOYALTY_EMAIL_CONFIG.template,
            data: emailData
        });
        
        console.log(`Loyalty reward email sent to ${customer.email} for ${business.name}`);
        
    } catch (error) {
        console.error('Error sending loyalty reward email:', error);
        throw error;
    }
}

/**
 * Process booking completion and check for loyalty rewards
 * @param {Object} booking - Completed booking data
 */
async function processBookingCompletion(booking) {
    try {
        // Get customer and business data
        const customer = await getCustomerById(booking.customerId);
        const business = await getBusinessById(booking.businessId);
        
        // Check if customer has unlocked a reward
        const unlockData = checkLoyaltyRewardUnlock(customer, business, booking);
        
        if (unlockData) {
            // Send loyalty reward email
            await sendLoyaltyRewardEmail(unlockData, customer, business);
        }
        
    } catch (error) {
        console.error('Error processing booking completion for loyalty rewards:', error);
    }
}

/**
 * Helper function to get customer loyalty progress
 * @param {string} customerId - Customer ID
 * @param {string} businessId - Business ID
 * @returns {Object} - Customer progress data
 */
function getCustomerLoyaltyProgress(customerId, businessId) {
    // This would query the database for customer's loyalty progress
    // For now, returning mock data
    return {
        visitCount: 5,
        totalSpent: 225,
        firstVisitDate: new Date('2024-01-01'),
        lastVisitDate: new Date()
    };
}

/**
 * Helper function to check if time limit has expired
 * @param {number} timeLimitWeeks - Time limit in weeks
 * @param {Date} firstVisitDate - Date of first visit
 * @returns {boolean} - True if time limit expired
 */
function isTimeLimitExpired(timeLimitWeeks, firstVisitDate) {
    const timeLimitMs = timeLimitWeeks * 7 * 24 * 60 * 60 * 1000;
    const now = new Date();
    return (now - firstVisitDate) > timeLimitMs;
}

/**
 * Mark reward as unlocked for customer
 * @param {string} customerId - Customer ID
 * @param {string} loyaltyProgramId - Loyalty program ID
 */
async function markRewardAsUnlocked(customerId, loyaltyProgramId) {
    // This would update the database to mark the reward as unlocked
    // Implementation depends on your database structure
    console.log(`Marking reward ${loyaltyProgramId} as unlocked for customer ${customerId}`);
}

/**
 * Send email using your email service
 * @param {Object} emailData - Email data
 */
async function sendEmail(emailData) {
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log('Sending email:', emailData);
}

/**
 * Get customer by ID
 * @param {string} customerId - Customer ID
 * @returns {Object} - Customer data
 */
async function getCustomerById(customerId) {
    // This would query your database
    // Returning mock data for documentation
    return {
        id: customerId,
        firstName: 'Sarah',
        email: 'sarah@example.com'
    };
}

/**
 * Get business by ID
 * @param {string} businessId - Business ID
 * @returns {Object} - Business data
 */
async function getBusinessById(businessId) {
    // This would query your database
    // Returning mock data for documentation
    return {
        id: businessId,
        name: 'Glow Salon',
        loyaltyProgram: {
            id: 'loyalty_123',
            type: LOYALTY_TYPES.VISIT_BASED,
            threshold: 5,
            rewardType: REWARD_TYPES.FREE_SERVICE,
            rewardValue: null,
            isActive: true
        }
    };
}

// Export functions for use in other modules
module.exports = {
    checkLoyaltyRewardUnlock,
    generateLoyaltyEmailData,
    sendLoyaltyRewardEmail,
    processBookingCompletion,
    LOYALTY_EMAIL_CONFIG,
    LOYALTY_TYPES,
    REWARD_TYPES
};
