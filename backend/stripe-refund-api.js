/**
 * Stripe Refund API Implementation
 * Handles cancellation refunds based on business policies
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Calculate refund amount based on cancellation policy and timing
 */
function calculateRefundAmount(booking, cancellationTime) {
    const { policy, appointmentDateTime, totalAmount } = booking;
    const hoursUntilAppointment = (new Date(appointmentDateTime) - new Date(cancellationTime)) / (1000 * 60 * 60);
    
    switch (policy) {
        case 'flexible':
            // ≥24h → refund 100%, <24h → refund 0%
            return hoursUntilAppointment >= 24 ? totalAmount : 0;
            
        case 'moderate':
            // ≥48h → refund 100%, <48h → refund 50%, no-show → refund 0%
            if (hoursUntilAppointment >= 48) {
                return totalAmount;
            } else if (hoursUntilAppointment > 0) {
                return totalAmount * 0.5;
            } else {
                return 0; // No-show
            }
            
        case 'strict':
            // Non-refundable at all times
            return 0;
            
        case 'custom':
            // Parse custom policy logic (simplified for demo)
            // In real implementation, this would parse the custom policy text
            // and apply the business's specific rules
            return parseCustomPolicy(booking.customPolicy, hoursUntilAppointment, totalAmount);
            
        default:
            return 0;
    }
}

/**
 * Parse custom policy text to determine refund amount
 */
function parseCustomPolicy(customPolicyText, hoursUntilAppointment, totalAmount) {
    // This is a simplified parser - in real implementation, 
    // you'd need a more sophisticated NLP approach
    
    const text = customPolicyText.toLowerCase();
    
    // Look for time-based refund rules
    if (text.includes('24 hours') && hoursUntilAppointment >= 24) {
        return totalAmount;
    } else if (text.includes('48 hours') && hoursUntilAppointment >= 48) {
        return totalAmount;
    } else if (text.includes('50%') && hoursUntilAppointment > 0) {
        return totalAmount * 0.5;
    } else if (text.includes('non-refundable')) {
        return 0;
    }
    
    // Default to no refund for custom policies
    return 0;
}

/**
 * Process cancellation and refund
 */
async function processCancellation(bookingId, cancellationReason = 'Customer cancellation') {
    try {
        // Get booking details from database
        const booking = await getBookingById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }
        
        // Calculate refund amount
        const refundAmount = calculateRefundAmount(booking, new Date());
        
        // Update booking status
        await updateBookingStatus(bookingId, 'cancelled', cancellationReason);
        
        let refundResult = null;
        
        // Process refund if applicable
        if (refundAmount > 0) {
            try {
                refundResult = await stripe.refunds.create({
                    payment_intent: booking.stripePaymentIntentId,
                    amount: Math.round(refundAmount * 100), // Convert to cents
                    reason: 'requested_by_customer',
                    metadata: {
                        booking_id: bookingId,
                        business_id: booking.businessId,
                        policy_type: booking.policy
                    }
                });
                
                console.log(`Refund processed: ${refundAmount} for booking ${bookingId}`);
            } catch (stripeError) {
                console.error('Stripe refund failed:', stripeError);
                // Continue with cancellation even if refund fails
            }
        }
        
        // Update both dashboards with cancellation and refund information
        await updateCustomerDashboard(booking, refundAmount, refundResult);
        await updateBusinessDashboard(booking, refundAmount, refundResult);
        
        // Send notifications
        await sendCancellationNotifications(booking, refundResult, refundAmount);
        
        // Update business payout (hold funds for 24h after appointment)
        await updateBusinessPayout(booking, refundAmount);
        
        return {
            success: true,
            refundAmount,
            refundId: refundResult?.id,
            message: refundAmount > 0 
                ? `Refund of £${refundAmount.toFixed(2)} will be processed within 5-10 business days`
                : 'This booking is non-refundable under the business cancellation policy'
        };
        
    } catch (error) {
        console.error('Cancellation processing failed:', error);
        throw error;
    }
}

/**
 * Send cancellation notifications
 */
async function sendCancellationNotifications(booking, refundResult, refundAmount) {
    // Customer notification
    const customerEmail = {
        to: booking.customerEmail,
        subject: 'Booking Cancellation Confirmed',
        html: `
            <h2>Booking Cancellation Confirmed</h2>
            <p>Your booking with ${booking.businessName} has been cancelled.</p>
            <p><strong>Appointment:</strong> ${new Date(booking.appointmentDateTime).toLocaleString()}</p>
            <p><strong>Services:</strong> ${booking.services.map(s => s.name).join(', ')}</p>
            ${refundAmount > 0 
                ? `<p><strong>Refund:</strong> £${refundAmount.toFixed(2)} will be returned to your original payment method within 5-10 business days.</p>`
                : '<p><strong>Refund:</strong> This booking is non-refundable under the business cancellation policy.</p>'
            }
            <p>Thank you for using BlkPages.</p>
        `
    };
    
    // Business notification
    const businessEmail = {
        to: booking.businessEmail,
        subject: 'Booking Cancellation - Payout Adjustment',
        html: `
            <h2>Booking Cancelled</h2>
            <p>A customer has cancelled their booking.</p>
            <p><strong>Customer:</strong> ${booking.customerName}</p>
            <p><strong>Appointment:</strong> ${new Date(booking.appointmentDateTime).toLocaleString()}</p>
            <p><strong>Services:</strong> ${booking.services.map(s => s.name).join(', ')}</p>
            <p><strong>Original Amount:</strong> £${booking.totalAmount.toFixed(2)}</p>
            <p><strong>Refund Amount:</strong> £${refundAmount.toFixed(2)}</p>
            <p><strong>Your Payout:</strong> £${(booking.totalAmount - refundAmount).toFixed(2)}</p>
            <p>Funds will be released 24 hours after the original appointment time.</p>
        `
    };
    
    // Send emails (implement your email service)
    await sendEmail(customerEmail);
    await sendEmail(businessEmail);
}

/**
 * Update customer dashboard with cancellation and refund information
 */
async function updateCustomerDashboard(booking, refundAmount, refundResult) {
    try {
        const customerId = booking.customerId;
        const customerBookings = JSON.parse(localStorage.getItem(`customerBookings_${customerId}`) || '[]');
        const bookingIndex = customerBookings.findIndex(b => b.bookingId === booking.id);
        
        if (bookingIndex !== -1) {
            // Update booking status to cancelled
            customerBookings[bookingIndex].status = 'Cancelled';
            customerBookings[bookingIndex].cancelledAt = new Date().toISOString();
            customerBookings[bookingIndex].cancellationReason = booking.cancellationReason || 'Customer cancellation';
            
            // Add refund information if applicable
            if (refundAmount > 0) {
                customerBookings[bookingIndex].refundAmount = refundAmount;
                customerBookings[bookingIndex].refundId = refundResult?.id;
                customerBookings[bookingIndex].refundStatus = 'Processed';
                customerBookings[bookingIndex].refundTimestamp = new Date().toISOString();
                customerBookings[bookingIndex].paymentStatus = 'Refunded';
            } else {
                customerBookings[bookingIndex].refundStatus = 'Non-refundable';
                customerBookings[bookingIndex].paymentStatus = 'Non-refundable';
            }
            
            // Save updated bookings
            localStorage.setItem(`customerBookings_${customerId}`, JSON.stringify(customerBookings));
            
            // Trigger storage event for real-time updates
            localStorage.setItem(`bookingCancelled_${booking.id}`, Date.now().toString());
            
            console.log('Customer dashboard updated for booking cancellation:', booking.id);
        }
    } catch (error) {
        console.error('Failed to update customer dashboard:', error);
    }
}

/**
 * Update business dashboard with cancellation and refund information
 */
async function updateBusinessDashboard(booking, refundAmount, refundResult) {
    try {
        const businessId = booking.businessId;
        const businessBookings = JSON.parse(localStorage.getItem(`businessBookings_${businessId}`) || '[]');
        const bookingIndex = businessBookings.findIndex(b => b.bookingId === booking.id);
        
        if (bookingIndex !== -1) {
            // Update booking status to refunded (from business perspective)
            businessBookings[bookingIndex].status = 'Refunded';
            businessBookings[bookingIndex].cancelledAt = new Date().toISOString();
            businessBookings[bookingIndex].cancellationReason = booking.cancellationReason || 'Customer cancellation';
            
            // Add refund information
            businessBookings[bookingIndex].refundAmount = refundAmount;
            businessBookings[bookingIndex].refundId = refundResult?.id;
            businessBookings[bookingIndex].refundStatus = refundAmount > 0 ? 'Processed' : 'Non-refundable';
            businessBookings[bookingIndex].refundTimestamp = new Date().toISOString();
            businessBookings[bookingIndex].originalAmount = booking.totalAmount;
            businessBookings[bookingIndex].netAmount = booking.totalAmount - refundAmount;
            
            // Save updated bookings
            localStorage.setItem(`businessBookings_${businessId}`, JSON.stringify(businessBookings));
            
            // Trigger storage event for real-time updates
            localStorage.setItem(`businessBookingCancelled_${booking.id}`, Date.now().toString());
            
            console.log('Business dashboard updated for booking cancellation:', booking.id);
        }
    } catch (error) {
        console.error('Failed to update business dashboard:', error);
    }
}

/**
 * Update business payout after cancellation
 */
async function updateBusinessPayout(booking, refundAmount) {
    const payoutAmount = booking.totalAmount - refundAmount;
    
    // In real implementation, you'd update the business's payout record
    // and schedule the payout for 24h after the original appointment
    const payoutDate = new Date(booking.appointmentDateTime);
    payoutDate.setHours(payoutDate.getHours() + 24);
    
    console.log(`Business payout scheduled: £${payoutAmount.toFixed(2)} for ${payoutDate.toISOString()}`);
}

/**
 * Hold funds in escrow until 24h after appointment
 */
async function releaseEscrowFunds(bookingId) {
    try {
        const booking = await getBookingById(bookingId);
        const appointmentTime = new Date(booking.appointmentDateTime);
        const releaseTime = new Date(appointmentTime.getTime() + 24 * 60 * 60 * 1000);
        
        // Schedule payout release
        setTimeout(async () => {
            await processBusinessPayout(booking);
        }, releaseTime.getTime() - Date.now());
        
    } catch (error) {
        console.error('Failed to schedule escrow release:', error);
    }
}

/**
 * Process business payout after escrow period
 */
async function processBusinessPayout(booking) {
    try {
        // Calculate final payout (original amount minus any refunds)
        const totalRefunds = await getTotalRefundsForBooking(booking.id);
        const finalPayout = booking.totalAmount - totalRefunds;
        
        if (finalPayout > 0) {
            // Transfer to business account
            const transfer = await stripe.transfers.create({
                amount: Math.round(finalPayout * 100),
                currency: 'gbp',
                destination: booking.businessStripeAccountId,
                metadata: {
                    booking_id: booking.id,
                    business_id: booking.businessId
                }
            });
            
            console.log(`Business payout processed: £${finalPayout.toFixed(2)}`);
        }
        
    } catch (error) {
        console.error('Business payout failed:', error);
    }
}

// Helper functions (implement based on your database)
async function getBookingById(bookingId) {
    // Implement database query
    return {
        id: bookingId,
        businessName: 'Royal Hair Studio',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        businessEmail: 'info@royalhairstudio.com',
        appointmentDateTime: '2024-12-28T14:00:00Z',
        totalAmount: 70,
        policy: 'moderate',
        stripePaymentIntentId: 'pi_1234567890',
        businessId: 'bus_123',
        businessStripeAccountId: 'acct_1234567890',
        services: [
            { name: 'Haircut & Style', price: 45 },
            { name: 'Hair Wash & Blow Dry', price: 25 }
        ]
    };
}

async function updateBookingStatus(bookingId, status, reason) {
    // Implement database update
    console.log(`Booking ${bookingId} status updated to ${status}: ${reason}`);
}

async function getTotalRefundsForBooking(bookingId) {
    // Implement database query for total refunds
    return 0;
}

async function sendEmail(emailData) {
    // Implement email service (SendGrid, AWS SES, etc.)
    console.log('Email sent:', emailData.subject);
}

module.exports = {
    processCancellation,
    calculateRefundAmount,
    releaseEscrowFunds,
    processBusinessPayout
};
