/**
 * Integration Examples
 * Practical examples of how to integrate the communication system
 */

const CommunicationSystem = require('./communication-system');
const BookingIntegration = require('./booking-integration');
const { SMSService } = require('./sms-templates');

// ========================================
// BOOKING WORKFLOW EXAMPLES
// ========================================

/**
 * Example: Complete booking with all communications
 */
async function exampleCompleteBooking() {
    const bookingIntegration = new BookingIntegration();
    
    const bookingData = {
        customer: {
            firstName: 'Jane',
            email: 'jane.smith@email.com',
            phoneNumber: '+447123456789'
        },
        business: {
            name: 'Glow Salon',
            email: 'glow.salon@email.com',
            phoneNumber: '+447987654321',
            package: 'Premium',
            timezone: 'Europe/London'
        },
        service: {
            name: 'Haircut',
            price: 45
        },
        bookingTime: new Date('2025-01-15T14:00:00Z'),
        paymentModel: 'Full Payment Online',
        totalAmount: 45
    };

    try {
        // This will automatically trigger:
        // 1. Customer booking confirmation email
        // 2. Customer booking confirmation SMS (Premium only)
        // 3. Business booking alert email
        // 4. Business booking alert SMS (Premium only)
        // 5. Schedule 24-hour reminder
        const booking = await bookingIntegration.completeBooking(bookingData);
        
        console.log('Booking completed successfully:', booking.id);
    } catch (error) {
        console.error('Booking failed:', error);
    }
}

/**
 * Example: Cancel booking with all communications
 */
async function exampleCancelBooking() {
    const bookingIntegration = new BookingIntegration();
    
    const bookingId = 'booking_1234567890';
    const cancellationReason = 'Customer requested cancellation';
    
    try {
        // This will automatically trigger:
        // 1. Cancel scheduled reminder
        // 2. Process refund if applicable
        // 3. Customer cancellation confirmation email
        // 4. Customer cancellation confirmation SMS (Premium only)
        // 5. Business cancellation alert email
        // 6. Business cancellation alert SMS (Premium only)
        // 7. Refund notification email (if refund processed)
        const result = await bookingIntegration.cancelBooking(bookingId, cancellationReason);
        
        console.log('Booking cancelled successfully:', result);
    } catch (error) {
        console.error('Cancellation failed:', error);
    }
}

/**
 * Example: Reschedule booking with communications
 */
async function exampleRescheduleBooking() {
    const bookingIntegration = new BookingIntegration();
    
    const bookingId = 'booking_1234567890';
    const newBookingTime = new Date('2025-01-16T14:00:00Z');
    
    try {
        // This will automatically trigger:
        // 1. Cancel old reminder
        // 2. Schedule new reminder
        // 3. Business reschedule alert email
        // 4. Business reschedule alert SMS (Premium only)
        const result = await bookingIntegration.rescheduleBooking(bookingId, newBookingTime);
        
        console.log('Booking rescheduled successfully:', result);
    } catch (error) {
        console.error('Reschedule failed:', error);
    }
}

// ========================================
// ACCOUNT EVENT EXAMPLES
// ========================================

/**
 * Example: Customer account events
 */
async function exampleCustomerAccountEvents() {
    const bookingIntegration = new BookingIntegration();
    
    // Welcome email
    await bookingIntegration.handleCustomerAccountEvent('welcome', {
        firstName: 'Jane',
        email: 'jane.smith@email.com'
    });
    
    // Password reset
    await bookingIntegration.handleCustomerAccountEvent('password_reset', {
        firstName: 'Jane',
        email: 'jane.smith@email.com',
        resetToken: 'reset_token_123'
    });
    
    // Profile updated
    await bookingIntegration.handleCustomerAccountEvent('profile_updated', {
        firstName: 'Jane',
        email: 'jane.smith@email.com'
    });
    
    // New card added
    await bookingIntegration.handleCustomerAccountEvent('new_card_added', {
        firstName: 'Jane',
        email: 'jane.smith@email.com',
        cardLast4: '1234'
    });
}

/**
 * Example: Business account events
 */
async function exampleBusinessAccountEvents() {
    const bookingIntegration = new BookingIntegration();
    
    // Welcome email
    await bookingIntegration.handleBusinessAccountEvent('welcome', {
        businessName: 'Glow Salon',
        email: 'glow.salon@email.com'
    });
    
    // Profile approved
    await bookingIntegration.handleBusinessAccountEvent('profile_approved', {
        businessName: 'Glow Salon',
        email: 'glow.salon@email.com'
    });
    
    // Payment details updated
    await bookingIntegration.handleBusinessAccountEvent('payment_details_updated', {
        businessName: 'Glow Salon',
        email: 'glow.salon@email.com'
    });
    
    // Subscription receipt
    await bookingIntegration.handleBusinessAccountEvent('subscription_receipt', {
        businessName: 'Glow Salon',
        email: 'glow.salon@email.com',
        packageName: 'Premium',
        renewalDate: '2025-03-12'
    });
}

// ========================================
// PAYMENT INTEGRATION EXAMPLES
// ========================================

/**
 * Example: Process payout with notification
 */
async function exampleProcessPayout() {
    const bookingIntegration = new BookingIntegration();
    
    const payoutData = {
        business: {
            name: 'Glow Salon',
            email: 'glow.salon@email.com'
        },
        payoutAmount: 240,
        numberOfBookings: 5
    };
    
    try {
        // This will automatically trigger:
        // 1. Process payout with Stripe
        // 2. Send payout notification email
        const result = await bookingIntegration.processPayout(payoutData);
        
        console.log('Payout processed successfully:', result);
    } catch (error) {
        console.error('Payout failed:', error);
    }
}

// ========================================
// REMINDER JOB EXAMPLES
// ========================================

/**
 * Example: Process reminder job
 */
async function exampleProcessReminderJob() {
    const bookingIntegration = new BookingIntegration();
    
    const jobData = {
        bookingId: 'booking_1234567890'
    };
    
    try {
        // This will automatically:
        // 1. Check if booking is still active
        // 2. Send reminder email
        // 3. Send reminder SMS (Premium only)
        await bookingIntegration.processReminderJob(jobData);
        
        console.log('Reminder processed successfully');
    } catch (error) {
        console.error('Reminder processing failed:', error);
    }
}

// ========================================
// SMS TEMPLATE TESTING
// ========================================

/**
 * Example: Test SMS templates
 */
async function exampleTestSMSTemplates() {
    const { SMSTemplates } = require('./sms-templates');
    const templates = new SMSTemplates();
    
    // Test all templates
    const results = templates.testAllTemplates();
    
    console.log('SMS Template Test Results:');
    console.log(JSON.stringify(results, null, 2));
    
    // Test individual template
    const customerData = {
        service: 'Haircut',
        businessName: 'Glow Salon',
        bookingTime: 'Monday Jan 15 2025 at 2:00 PM'
    };
    
    const bookingConfirmation = templates.getCustomerTemplate('bookingConfirmation', customerData);
    console.log('Booking Confirmation SMS:', bookingConfirmation);
}

// ========================================
// ENVIRONMENT SETUP
// ========================================

/**
 * Example: Environment configuration
 */
function setupEnvironment() {
    // Set environment variables for communication system
    process.env.PLATFORM_URL = 'https://blkpages.com';
    process.env.SMS_ENABLED = 'true';
    process.env.SMS_PROVIDER = 'twilio';
    
    // Email service configuration
    process.env.EMAIL_PROVIDER = 'sendgrid';
    process.env.EMAIL_FROM = 'noreply@blkpages.com';
    
    // Database configuration
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/blkpages';
    
    console.log('Environment configured for communication system');
}

// ========================================
// ERROR HANDLING EXAMPLES
// ========================================

/**
 * Example: Error handling for failed communications
 */
async function exampleErrorHandling() {
    const communicationSystem = new CommunicationSystem();
    
    try {
        // Attempt to send communication
        await communicationSystem.handleBookingConfirmation({
            customer: { firstName: 'Jane', email: 'invalid-email' },
            business: { name: 'Glow Salon', package: 'Premium' },
            service: { name: 'Haircut' },
            bookingTime: new Date(),
            paymentModel: 'Full Payment Online',
            totalAmount: 45
        });
    } catch (error) {
        console.error('Communication failed:', error);
        
        // Log error for manual review
        await logCommunicationError({
            type: 'booking_confirmation',
            error: error.message,
            timestamp: new Date(),
            data: { customer: 'Jane', business: 'Glow Salon' }
        });
    }
}

async function logCommunicationError(errorData) {
    // Implementation would log to database or monitoring service
    console.log('Communication error logged:', errorData);
}

// ========================================
// EXPORT EXAMPLES
// ========================================

module.exports = {
    exampleCompleteBooking,
    exampleCancelBooking,
    exampleRescheduleBooking,
    exampleCustomerAccountEvents,
    exampleBusinessAccountEvents,
    exampleProcessPayout,
    exampleProcessReminderJob,
    exampleTestSMSTemplates,
    setupEnvironment,
    exampleErrorHandling
};
