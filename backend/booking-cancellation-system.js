/**
 * Booking Cancellation and Amendment System
 * Handles business-initiated cancellations and amendments with audit logging
 */

const BookingCancellationSystem = {
    // Cancellation reasons
    cancellationReasons: [
        "Staff illness",
        "Emergency closure", 
        "Equipment failure",
        "Duplicate booking",
        "Customer breach",
        "Other (explain)"
    ],

    // Simulate business bookings data
    businessBookings: {
        'royal-hair-studio': [
            {
                id: 'booking_001',
                customerId: 'customer_123',
                customerName: 'Sarah Johnson',
                service: 'Haircut & Style',
                date: '2024-12-20',
                time: '14:00',
                status: 'confirmed',
                paymentStatus: 'paid',
                amount: 45,
                createdAt: '2024-12-15T10:00:00Z'
            },
            {
                id: 'booking_002', 
                customerId: 'customer_456',
                customerName: 'Mike Smith',
                service: 'Hair Treatment',
                date: '2024-12-18',
                time: '16:30',
                status: 'confirmed',
                paymentStatus: 'paid',
                amount: 65,
                createdAt: '2024-12-14T15:30:00Z'
            },
            {
                id: 'booking_003',
                customerId: 'customer_789',
                customerName: 'Emma Wilson',
                service: 'Haircut & Style',
                date: '2024-12-19',
                time: '11:00',
                status: 'confirmed',
                paymentStatus: 'paid',
                amount: 45,
                createdAt: '2024-12-13T09:15:00Z'
            }
        ]
    },

    // Audit log for all cancellation/amendment events
    auditLog: [
        {
            id: 'audit_001',
            businessId: 'royal-hair-studio',
            bookingId: 'booking_001',
            eventType: 'cancellation_request',
            reason: 'Staff illness',
            explanation: 'Hair stylist called in sick',
            timestamp: '2024-12-16T14:30:00Z',
            ipAddress: '192.168.1.100',
            status: 'approved'
        }
    ],

    // Check if booking can be cancelled (24+ hours away)
    canCancelBooking: function(bookingId, businessId) {
        const booking = this.getBookingById(bookingId, businessId);
        if (!booking) return { canCancel: false, reason: 'Booking not found' };

        const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
        const now = new Date();
        const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

        if (hoursUntilBooking < 24) {
            return { 
                canCancel: false, 
                reason: 'Cancellations within 24 hours require BlkPages Support approval',
                requiresSupport: true
            };
        }

        return { canCancel: true, reason: 'Booking can be cancelled' };
    },

    // Get booking by ID
    getBookingById: function(bookingId, businessId) {
        const bookings = this.businessBookings[businessId] || [];
        return bookings.find(booking => booking.id === bookingId);
    },

    // Request booking cancellation
    requestCancellation: function(bookingId, businessId, reason, explanation) {
        console.log('BCC: Requesting cancellation for booking', bookingId);
        
        const canCancel = this.canCancelBooking(bookingId, businessId);
        if (!canCancel.canCancel) {
            return { 
                success: false, 
                error: canCancel.reason,
                requiresSupport: canCancel.requiresSupport || false
            };
        }

        // Validate reason
        if (!this.cancellationReasons.includes(reason)) {
            return { success: false, error: 'Invalid cancellation reason' };
        }

        // Validate explanation length
        if (explanation.length > 150) {
            return { success: false, error: 'Explanation must be 150 characters or less' };
        }

        // Create audit log entry
        const auditEntry = {
            id: 'audit_' + Date.now(),
            businessId: businessId,
            bookingId: bookingId,
            eventType: 'cancellation_request',
            reason: reason,
            explanation: explanation,
            timestamp: new Date().toISOString(),
            ipAddress: '192.168.1.100', // Simulated IP
            status: 'pending'
        };

        this.auditLog.push(auditEntry);

        // Update booking status
        const booking = this.getBookingById(bookingId, businessId);
        if (booking) {
            booking.status = 'cancellation_requested';
            booking.cancellationReason = reason;
            booking.cancellationExplanation = explanation;
        }

        return { 
            success: true, 
            message: 'Cancellation request submitted successfully',
            auditId: auditEntry.id
        };
    },

    // Approve cancellation (admin or system)
    approveCancellation: function(bookingId, businessId, adminId = null) {
        console.log('BCC: Approving cancellation for booking', bookingId);
        
        const booking = this.getBookingById(bookingId, businessId);
        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        // Update booking status
        booking.status = 'cancelled_by_business';
        booking.cancelledAt = new Date().toISOString();

        // Process refund if payment was made
        let refundResult = null;
        if (booking.paymentStatus === 'paid') {
            refundResult = this.processRefund(bookingId, booking.amount);
        }

        // Send customer notification
        this.sendCancellationNotification(booking);

        // Update audit log
        const auditEntry = {
            id: 'audit_' + Date.now(),
            businessId: businessId,
            bookingId: bookingId,
            eventType: 'cancellation_approved',
            reason: booking.cancellationReason,
            explanation: booking.cancellationExplanation,
            timestamp: new Date().toISOString(),
            ipAddress: '192.168.1.100',
            status: 'approved',
            adminId: adminId
        };

        this.auditLog.push(auditEntry);

        return { 
            success: true, 
            message: 'Cancellation approved and customer notified',
            refundProcessed: refundResult ? refundResult.success : false
        };
    },

    // Process refund through Stripe
    processRefund: function(bookingId, amount) {
        console.log('BCC: Processing refund for booking', bookingId, 'amount:', amount);
        
        // Simulate Stripe refund
        return {
            success: true,
            refundId: 'refund_' + Date.now(),
            amount: amount,
            status: 'succeeded',
            processedAt: new Date().toISOString()
        };
    },

    // Send cancellation notification to customer
    sendCancellationNotification: function(booking) {
        console.log('BCC: Sending cancellation notification to customer', booking.customerId);
        
        // Simulate sending email and dashboard notification
        return {
            success: true,
            emailSent: true,
            dashboardNotification: true,
            message: 'Customer notified of cancellation'
        };
    },

    // Request booking amendment
    requestAmendment: function(bookingId, businessId, newDate, newTime, reason) {
        console.log('BCC: Requesting amendment for booking', bookingId);
        
        const booking = this.getBookingById(bookingId, businessId);
        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        // Validate new date/time is in the future
        const newDateTime = new Date(`${newDate}T${newTime}`);
        const now = new Date();
        if (newDateTime <= now) {
            return { success: false, error: 'New booking time must be in the future' };
        }

        // Create amendment request
        const amendmentRequest = {
            id: 'amendment_' + Date.now(),
            bookingId: bookingId,
            businessId: businessId,
            originalDate: booking.date,
            originalTime: booking.time,
            newDate: newDate,
            newTime: newTime,
            reason: reason,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Update booking status
        booking.status = 'amendment_requested';
        booking.amendmentRequest = amendmentRequest;

        // Create audit log entry
        const auditEntry = {
            id: 'audit_' + Date.now(),
            businessId: businessId,
            bookingId: bookingId,
            eventType: 'amendment_request',
            reason: reason,
            explanation: `Request to change from ${booking.date} ${booking.time} to ${newDate} ${newTime}`,
            timestamp: new Date().toISOString(),
            ipAddress: '192.168.1.100',
            status: 'pending'
        };

        this.auditLog.push(auditEntry);

        // Send notification to customer
        this.sendAmendmentNotification(booking, amendmentRequest);

        return { 
            success: true, 
            message: 'Amendment request sent to customer',
            amendmentId: amendmentRequest.id
        };
    },

    // Send amendment notification to customer
    sendAmendmentNotification: function(booking, amendmentRequest) {
        console.log('BCC: Sending amendment notification to customer', booking.customerId);
        
        // Simulate sending email and dashboard notification
        return {
            success: true,
            emailSent: true,
            dashboardNotification: true,
            message: 'Customer notified of amendment request'
        };
    },

    // Customer response to amendment request
    respondToAmendment: function(amendmentId, customerId, accepted) {
        console.log('BCC: Customer responding to amendment', amendmentId, 'accepted:', accepted);
        
        // Find the amendment request
        const auditEntry = this.auditLog.find(entry => 
            entry.eventType === 'amendment_request' && 
            entry.bookingId === amendmentId.split('_')[1]
        );

        if (!auditEntry) {
            return { success: false, error: 'Amendment request not found' };
        }

        const booking = this.getBookingById(auditEntry.bookingId, auditEntry.businessId);
        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        if (accepted) {
            // Update booking with new date/time
            booking.date = booking.amendmentRequest.newDate;
            booking.time = booking.amendmentRequest.newTime;
            booking.status = 'confirmed';
            booking.amendmentRequest.status = 'accepted';
            booking.amendmentRequest.respondedAt = new Date().toISOString();

            // Create audit log entry
            const responseEntry = {
                id: 'audit_' + Date.now(),
                businessId: auditEntry.businessId,
                bookingId: auditEntry.bookingId,
                eventType: 'amendment_accepted',
                reason: 'Customer accepted amendment',
                explanation: `Booking updated to ${booking.date} ${booking.time}`,
                timestamp: new Date().toISOString(),
                ipAddress: '192.168.1.100',
                status: 'approved'
            };

            this.auditLog.push(responseEntry);

            return { 
                success: true, 
                message: 'Amendment accepted and booking updated',
                newDate: booking.date,
                newTime: booking.time
            };
        } else {
            // Reject amendment
            booking.status = 'confirmed';
            booking.amendmentRequest.status = 'declined';
            booking.amendmentRequest.respondedAt = new Date().toISOString();

            // Create audit log entry
            const responseEntry = {
                id: 'audit_' + Date.now(),
                businessId: auditEntry.businessId,
                bookingId: auditEntry.bookingId,
                eventType: 'amendment_declined',
                reason: 'Customer declined amendment',
                explanation: 'Booking remains unchanged',
                timestamp: new Date().toISOString(),
                ipAddress: '192.168.1.100',
                status: 'declined'
            };

            this.auditLog.push(responseEntry);

            return { 
                success: true, 
                message: 'Amendment declined, booking unchanged'
            };
        }
    },

    // Get business cancellation rate
    getCancellationRate: function(businessId, days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const businessAuditLog = this.auditLog.filter(entry => 
            entry.businessId === businessId && 
            new Date(entry.timestamp) >= cutoffDate
        );

        const totalBookings = businessAuditLog.filter(entry => 
            entry.eventType === 'cancellation_request'
        ).length;

        const approvedCancellations = businessAuditLog.filter(entry => 
            entry.eventType === 'cancellation_approved'
        ).length;

        const cancellationRate = totalBookings > 0 ? (approvedCancellations / totalBookings) * 100 : 0;

        return {
            totalBookings: totalBookings,
            cancellations: approvedCancellations,
            cancellationRate: Math.round(cancellationRate * 100) / 100,
            flagged: cancellationRate > 5
        };
    },

    // Get booking changes for business dashboard
    getBookingChanges: function(businessId) {
        const businessAuditLog = this.auditLog.filter(entry => 
            entry.businessId === businessId
        );

        return businessAuditLog.map(entry => {
            const booking = this.getBookingById(entry.bookingId, businessId);
            return {
                id: entry.id,
                bookingId: entry.bookingId,
                date: entry.timestamp.split('T')[0],
                time: entry.timestamp.split('T')[1].split('.')[0],
                service: booking ? booking.service : 'Unknown',
                reason: entry.reason,
                customerName: booking ? this.maskCustomerName(booking.customerName) : 'Unknown',
                status: entry.status,
                eventType: entry.eventType,
                explanation: entry.explanation
            };
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    // Mask customer name for privacy
    maskCustomerName: function(name) {
        if (!name) return 'Unknown';
        const parts = name.split(' ');
        if (parts.length === 1) {
            return parts[0].charAt(0) + '***';
        }
        return parts[0].charAt(0) + '*** ' + parts[parts.length - 1].charAt(0) + '***';
    },

    // Get business bookings
    getBusinessBookings: function(businessId) {
        return this.businessBookings[businessId] || [];
    }
};

// Make available globally
window.BookingCancellationSystem = BookingCancellationSystem;

