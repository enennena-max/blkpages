# BlkPages Communication System Documentation

## Overview
This document outlines the comprehensive communication system for BlkPages, covering all customer and business communication scenarios with automatic triggering logic.

## Core Rules
- **Emails**: Always sent for all communication types
- **SMS**: Only sent if business has Premium package AND only for booking alerts + 24h reminders
- **Automatic**: All messages trigger automatically without manual intervention
- **Timezone**: All timestamps use business's timezone (or booking's stored timezone)

---

## CUSTOMER COMMUNICATION RULES

### 1. Booking Confirmation
**Trigger**: Immediately after customer completes a booking
**Email**: ✅ Always sent
**SMS**: ✅ Only if Premium business

```javascript
// Email Content
- Detailed booking confirmation
- Service, date/time, business details
- Payment information based on model
- Dashboard link

// SMS Content (Premium only)
"Booking confirmed: [Service] at [Business Name], [Date/Time]. Pay details in email. Keep this SMS as your quick reminder. No reply."
```

### 2. Reminder (24h)
**Trigger**: 24 hours before booking start time
**Email**: ✅ Always sent
**SMS**: ✅ Only if Premium business
**Conditions**: 
- Only if booking is more than 24 hours away at creation
- Skip if booking is cancelled before reminder time

```javascript
// Email Content
- Full reminder with booking details
- Payment information
- Business contact details
- Dashboard link

// SMS Content (Premium only)
"Reminder: [Service] at [Business Name], [Date/Time] tomorrow. Details in your email. No reply — contact the business directly."
```

### 3. Cancellation Confirmation
**Trigger**: Immediately after customer cancels via dashboard or cancellation link
**Email**: ✅ Always sent
**SMS**: ✅ Only if Premium business

```javascript
// Email Content
- Cancellation confirmation
- Refund/policy details based on payment model
- Business contact information
- Dashboard link

// SMS Content (Premium only)
"Your booking for [Service] at [Business Name] on [Date/Time] is cancelled. Refund/policy in email. No reply – contact business direct."
```

### 4. Refund Notification
**Trigger**: When Stripe processes a refund (full or partial)
**Email**: ✅ Always sent
**SMS**: ❌ Never sent

```javascript
// Email Content
- Refund amount and processing details
- Expected timeline for refund to appear
- Original booking information
- Dashboard link
```

### 5. Account-Related Emails
**Trigger**: Various account events
**Email**: ✅ Always sent
**SMS**: ❌ Never sent

#### Welcome Email
- **Trigger**: On account signup
- **Content**: Platform introduction, features, dashboard link

#### Password Reset
- **Trigger**: When customer requests password reset
- **Content**: Secure reset link, 24h expiry, security notice

#### Profile Updated
- **Trigger**: When account profile is updated
- **Content**: Update confirmation, security alert

#### New Card Added
- **Trigger**: When customer adds a new card
- **Content**: Card details, security warning

---

## BUSINESS COMMUNICATION RULES

### 1. New Booking Alert
**Trigger**: Immediately when a customer books with the business
**Email**: ✅ Always sent
**SMS**: ✅ Only if Premium business

```javascript
// Email Content
- Customer details and booking information
- Payment status and model
- Payout implications
- Dashboard link

// SMS Content (Premium only)
"New booking: [Customer Name] booked [Service], [Date/Time]. Check dashboard for payment/refunds. No reply."
```

### 2. Cancellation Alert
**Trigger**: Immediately when a customer cancels
**Email**: ✅ Always sent
**SMS**: ✅ Only if Premium business

```javascript
// Email Content
- Customer cancellation details
- Refund implications for business
- Payout adjustments
- Dashboard link

// SMS Content (Premium only)
"[Customer Name] cancelled [Service], [Date/Time]. See dashboard for refund/payment status. No reply."
```

### 3. Reschedule Alert
**Trigger**: Immediately when a booking is rescheduled
**Email**: ✅ Always sent
**SMS**: ✅ Only if Premium business

```javascript
// Email Content
- Original and new booking times
- Customer details
- Payment implications
- Dashboard link

// SMS Content (Premium only)
"[Customer Name] rescheduled [Service] to [New Date/Time]. Check dashboard for details. No reply."
```

### 4. Payout Notification
**Trigger**: When Stripe payout is confirmed
**Email**: ✅ Always sent
**SMS**: ❌ Never sent

```javascript
// Email Content
- Payout amount and number of bookings
- Expected clearing time
- Payment method details
- Dashboard link
```

### 5. Account-Related Emails
**Trigger**: Various business account events
**Email**: ✅ Always sent
**SMS**: ❌ Never sent

#### Welcome Email
- **Trigger**: When business signs up
- **Content**: Business setup confirmation, dashboard features

#### Profile Approved/Updated
- **Trigger**: When admin approves or business updates profile
- **Content**: Live status confirmation, customer visibility

#### Payment Details Updated
- **Trigger**: When payout details are updated
- **Content**: Update confirmation, security alert

#### Subscription Receipt
- **Trigger**: When business pays for subscription/package
- **Content**: Package details, renewal date, billing receipt

---

## TECHNICAL IMPLEMENTATION

### Scheduling Logic
```javascript
// 24-hour reminder scheduling
if (hoursUntilBooking > 24) {
    const reminderTime = bookingTime - 24 hours;
    scheduleJob('booking_reminder', reminderTime);
}
```

### Premium Business Check
```javascript
// SMS sending logic
if (business.package === 'Premium' && contact.phoneNumber) {
    sendSMS();
}
```

### Timezone Handling
```javascript
// All timestamps use business timezone
const formattedTime = formatDateTime(bookingTime, business.timezone);
```

### Cancellation Logic
```javascript
// Check if booking is still active before sending reminder
if (booking.status === 'cancelled') {
    skipReminder();
}
```

---

## COMMUNICATION MATRIX

| Communication Type | Customer Email | Customer SMS | Business Email | Business SMS |
|-------------------|----------------|---------------|----------------|--------------|
| Booking Confirmation | ✅ Always | ✅ Premium Only | ✅ Always | ✅ Premium Only |
| 24h Reminder | ✅ Always | ✅ Premium Only | ❌ Never | ❌ Never |
| Cancellation | ✅ Always | ✅ Premium Only | ✅ Always | ✅ Premium Only |
| Refund Notification | ✅ Always | ❌ Never | ❌ Never | ❌ Never |
| Payout Notification | ❌ Never | ❌ Never | ✅ Always | ❌ Never |
| Account Events | ✅ Always | ❌ Never | ✅ Always | ❌ Never |

---

## PREVIEW INTEGRATION

All communication templates are available in the preview system:
- **Email Previews**: `/email-previews/` directory
- **SMS Previews**: `/email-previews/sms-*` files
- **Preview Test Page**: `/preview-test.html`

### Preview Data
- **Customer**: Jane Smith (jane.smith@email.com)
- **Business**: Glow Salon (glow.salon@email.com)
- **Service**: Haircut (£45)
- **Package**: Premium (for SMS testing)

---

## ERROR HANDLING

### Failed Email Delivery
- Retry logic with exponential backoff
- Fallback to alternative email if available
- Log failures for manual review

### Failed SMS Delivery
- Retry logic for Premium businesses
- Log failures for manual review
- No fallback (SMS is optional)

### Timezone Issues
- Use stored timezone from booking
- Fallback to business timezone
- Log timezone conversion errors

---

## MONITORING AND LOGGING

### Communication Logs
- All sent communications logged with timestamps
- Delivery status tracked
- Failure reasons recorded

### Performance Metrics
- Email delivery rates
- SMS delivery rates (Premium only)
- Response times
- Error rates

### Business Intelligence
- Communication effectiveness
- Premium vs Basic engagement
- Customer satisfaction correlation
