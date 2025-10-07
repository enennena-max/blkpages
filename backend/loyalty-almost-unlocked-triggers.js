/**
 * Loyalty "Almost Unlocked" Email Trigger System
 * 
 * This file documents the automatic email triggers for when customers are close to unlocking loyalty rewards.
 * Each customer can only receive one "almost unlocked" email per loyalty program.
 */

// Email Template Configuration
const ALMOST_UNLOCKED_EMAIL_CONFIG = {
    template: 'loyalty-almost-unlocked.html',
    subjects: [
        "You're nearly there at [Business Name]",
        "1 more to unlock your reward",
        "Almost unlocked: your [Reward Name] is next"
    ],
    trigger: 'conditional', // Send based on specific conditions
    oneTimeOnly: true, // Each customer gets one "almost unlocked" email per program
    defaultThreshold: 80 // Default percentage for spend-based programs
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
 * Check if customer should receive "Almost Unlocked" email
 * @param {Object} customer - Customer data
 * @param {Object} business - Business data with loyalty program
 * @param {Object} booking - Current booking data
 * @returns {Object|null} - Almost unlocked data or null if no email should be sent
 */
function checkAlmostUnlockedTrigger(customer, business, booking) {
    const loyaltyProgram = business.loyaltyProgram;
    
    // Check if business has active loyalty program
    if (!loyaltyProgram || !loyaltyProgram.isActive) {
        return null;
    }
    
    // Check if customer has already received "almost unlocked" email for this program
    if (customer.almostUnlockedEmails && customer.almostUnlockedEmails.includes(loyaltyProgram.id)) {
        return null;
    }
    
    // Check if customer has already unlocked this reward
    if (customer.unlockedRewards && customer.unlockedRewards.includes(loyaltyProgram.id)) {
        return null;
    }
    
    // Get customer's loyalty progress for this business
    const customerProgress = getCustomerLoyaltyProgress(customer.id, business.id);
    
    // Check conditions based on loyalty type
    let shouldSendEmail = false;
    let triggerData = {};
    
    switch (loyaltyProgram.type) {
        case LOYALTY_TYPES.VISIT_BASED:
            // Send when customer reaches Y-1 visits (e.g., 4 of 5)
            if (customerProgress.visitCount === (loyaltyProgram.threshold - 1)) {
                shouldSendEmail = true;
                triggerData = {
                    type: 'visitBased',
                    currentVisits: customerProgress.visitCount,
                    targetVisits: loyaltyProgram.threshold,
                    remainingVisits: 1
                };
            }
            break;
            
        case LOYALTY_TYPES.SPEND_BASED:
            // Send when customer reaches ≥80% of target spend (configurable)
            const spendThreshold = loyaltyProgram.almostUnlockedThreshold || ALMOST_UNLOCKED_EMAIL_CONFIG.defaultThreshold;
            const spendPercentage = (customerProgress.totalSpent / loyaltyProgram.threshold) * 100;
            
            if (spendPercentage >= spendThreshold && customerProgress.totalSpent < loyaltyProgram.threshold) {
                shouldSendEmail = true;
                triggerData = {
                    type: 'spendBased',
                    currentSpend: customerProgress.totalSpent,
                    targetSpend: loyaltyProgram.threshold,
                    spendPercentage: Math.round(spendPercentage),
                    remainingSpend: loyaltyProgram.threshold - customerProgress.totalSpent
                };
            }
            break;
            
        case LOYALTY_TYPES.TIME_LIMITED:
            // Send when customer is 1 visit away AND within the active timeframe
            const timeLimitExpired = isTimeLimitExpired(loyaltyProgram.timeLimit, customerProgress.firstVisitDate);
            const daysRemaining = getDaysRemaining(loyaltyProgram.timeLimit, customerProgress.firstVisitDate);
            
            if (!timeLimitExpired && 
                customerProgress.visitCount === (loyaltyProgram.threshold - 1) && 
                daysRemaining >= 7) {
                shouldSendEmail = true;
                triggerData = {
                    type: 'timeLimited',
                    currentVisits: customerProgress.visitCount,
                    targetVisits: loyaltyProgram.threshold,
                    remainingVisits: 1,
                    daysRemaining: daysRemaining,
                    showUrgency: daysRemaining < 7
                };
            }
            break;
    }
    
    if (shouldSendEmail) {
        return {
            customerId: customer.id,
            businessId: business.id,
            loyaltyProgramId: loyaltyProgram.id,
            rewardType: loyaltyProgram.rewardType,
            rewardValue: loyaltyProgram.rewardValue,
            progressData: customerProgress,
            triggerData: triggerData
        };
    }
    
    return null;
}

/**
 * Generate email data for "Almost Unlocked" email
 * @param {Object} almostUnlockedData - Almost unlocked trigger data
 * @param {Object} customer - Customer data
 * @param {Object} business - Business data
 * @returns {Object} - Email data for template
 */
function generateAlmostUnlockedEmailData(almostUnlockedData, customer, business) {
    const loyaltyProgram = business.loyaltyProgram;
    const triggerData = almostUnlockedData.triggerData;
    
    // Generate reward name and description
    let rewardName, rewardDescription;
    
    switch (loyaltyProgram.rewardType) {
        case REWARD_TYPES.FREE_SERVICE:
            rewardName = '1 Free Service';
            rewardDescription = '1 Free Service (up to £45 value) - applied automatically at checkout';
            break;
            
        case REWARD_TYPES.FIXED_DISCOUNT:
            rewardName = `£${loyaltyProgram.rewardValue} Off Next Booking`;
            rewardDescription = `£${loyaltyProgram.rewardValue} off your next booking - applied automatically at checkout`;
            break;
            
        case REWARD_TYPES.PERCENTAGE_DISCOUNT:
            rewardName = `${loyaltyProgram.rewardValue}% Off Next Booking`;
            rewardDescription = `${loyaltyProgram.rewardValue}% off your next booking - applied automatically at checkout`;
            break;
    }
    
    // Generate progress text based on trigger type
    let progressText, progressDetails;
    
    switch (triggerData.type) {
        case 'visitBased':
            progressText = `${triggerData.currentVisits} of ${triggerData.targetVisits} visits complete`;
            progressDetails = `You're just ${triggerData.remainingVisits} visit away from unlocking your reward!`;
            break;
            
        case 'spendBased':
            progressText = `£${triggerData.currentSpend} of £${triggerData.targetSpend} spent`;
            progressDetails = `You're ${triggerData.spendPercentage}% of the way to unlocking your reward!`;
            break;
            
        case 'timeLimited':
            progressText = `${triggerData.currentVisits} of ${triggerData.targetVisits} visits complete (${triggerData.daysRemaining} days remaining)`;
            progressDetails = `You're just ${triggerData.remainingVisits} visit away from unlocking your reward!`;
            break;
    }
    
    // Select random subject line
    const randomSubject = ALMOST_UNLOCKED_EMAIL_CONFIG.subjects[
        Math.floor(Math.random() * ALMOST_UNLOCKED_EMAIL_CONFIG.subjects.length)
    ];
    
    return {
        customerFirstName: customer.firstName,
        businessName: business.name,
        rewardName: rewardName,
        rewardDescription: rewardDescription,
        progressText: progressText,
        progressDetails: progressDetails,
        showUrgency: triggerData.showUrgency || false,
        platformName: 'BlkPages',
        bookingUrl: `${process.env.BASE_URL}/book/${business.id}?loyalty=${loyaltyProgram.id}`,
        subject: randomSubject.replace('[Business Name]', business.name).replace('[Reward Name]', rewardName)
    };
}

/**
 * Send "Almost Unlocked" email
 * @param {Object} almostUnlockedData - Almost unlocked trigger data
 * @param {Object} customer - Customer data
 * @param {Object} business - Business data
 */
async function sendAlmostUnlockedEmail(almostUnlockedData, customer, business) {
    try {
        // Generate email data
        const emailData = generateAlmostUnlockedEmailData(almostUnlockedData, customer, business);
        
        // Mark "almost unlocked" email as sent for this customer
        await markAlmostUnlockedEmailSent(almostUnlockedData.customerId, almostUnlockedData.loyaltyProgramId);
        
        // Send email
        await sendEmail({
            to: customer.email,
            subject: emailData.subject,
            template: ALMOST_UNLOCKED_EMAIL_CONFIG.template,
            data: emailData
        });
        
        console.log(`Almost unlocked email sent to ${customer.email} for ${business.name}`);
        
    } catch (error) {
        console.error('Error sending almost unlocked email:', error);
        throw error;
    }
}

/**
 * Process booking completion and check for "Almost Unlocked" triggers
 * @param {Object} booking - Completed booking data
 */
async function processBookingForAlmostUnlocked(booking) {
    try {
        // Get customer and business data
        const customer = await getCustomerById(booking.customerId);
        const business = await getBusinessById(booking.businessId);
        
        // Check if customer should receive "almost unlocked" email
        const almostUnlockedData = checkAlmostUnlockedTrigger(customer, business, booking);
        
        if (almostUnlockedData) {
            // Send "almost unlocked" email
            await sendAlmostUnlockedEmail(almostUnlockedData, customer, business);
        }
        
    } catch (error) {
        console.error('Error processing booking for almost unlocked triggers:', error);
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
        visitCount: 4,
        totalSpent: 85,
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
 * Helper function to get days remaining in time limit
 * @param {number} timeLimitWeeks - Time limit in weeks
 * @param {Date} firstVisitDate - Date of first visit
 * @returns {number} - Days remaining
 */
function getDaysRemaining(timeLimitWeeks, firstVisitDate) {
    const timeLimitMs = timeLimitWeeks * 7 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const elapsed = now - firstVisitDate;
    const remaining = timeLimitMs - elapsed;
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

/**
 * Mark "almost unlocked" email as sent for customer
 * @param {string} customerId - Customer ID
 * @param {string} loyaltyProgramId - Loyalty program ID
 */
async function markAlmostUnlockedEmailSent(customerId, loyaltyProgramId) {
    // This would update the database to mark the email as sent
    // Implementation depends on your database structure
    console.log(`Marking almost unlocked email sent for customer ${customerId}, program ${loyaltyProgramId}`);
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
        name: 'Glow Hair',
        loyaltyProgram: {
            id: 'loyalty_123',
            type: LOYALTY_TYPES.VISIT_BASED,
            threshold: 5,
            rewardType: REWARD_TYPES.FREE_SERVICE,
            rewardValue: null,
            isActive: true,
            almostUnlockedThreshold: 80
        }
    };
}

// Export functions for use in other modules
module.exports = {
    checkAlmostUnlockedTrigger,
    generateAlmostUnlockedEmailData,
    sendAlmostUnlockedEmail,
    processBookingForAlmostUnlocked,
    ALMOST_UNLOCKED_EMAIL_CONFIG,
    LOYALTY_TYPES,
    REWARD_TYPES
};
