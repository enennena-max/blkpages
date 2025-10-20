# BlkPages Codebase Architecture & Onboarding Guide

This document provides a comprehensive overview of the BlkPages system architecture to help Claude Code instances quickly understand the project structure and make productive contributions.

## Project Overview

**BlkPages** is a comprehensive business directory and booking platform focused on connecting customers to Black-owned businesses. The platform features real-time analytics, booking management, loyalty rewards, notifications, and GDPR compliance.

**Key Stats:**
- Single repository (not a monorepo)
- ~3600 lines in main server.js
- 40+ backend system modules
- 15+ React dashboard components
- MongoDB database
- Node.js/Express backend with Socket.io real-time updates

---

## High-Level Architecture

The application follows a **monolithic architecture with modular backend services**:
- Single Express server handling all routing
- Modular backend system files (booking, loyalty, notifications, etc.)
- React frontend components in `/frontend/src/components`
- MongoDB as primary data store

### Main Layers

```
Frontend (React Components)
         ↓
REST API (Express server.js - 50+ endpoints)
         ↓
Backend Systems (40+ modules for business logic)
         ↓
Database (MongoDB collections with indexes)
         ↓
External APIs (Google Calendar, Twilio, Stripe, etc.)
```

---

## Core Directory Structure

```
blkpages/
├── server.js                          # MAIN: 3600-line Express server
├── package.json                       # Express, MongoDB, Google APIs, Nodemailer, Socket.io
├── config/
│   ├── production.env                 # Production security & GDPR settings
│   └── staging.env                    # Staging configuration
│
├── backend/                           # 40+ Backend system modules
│   ├── email-templates/               # 8 EJS email templates
│   ├── sms-templates/                 # SMS message templates
│   │
│   ├── Booking System
│   │   ├── booking-api.js
│   │   ├── booking-sync-system.js
│   │   ├── booking-cancellation-system.js
│   │   └── booking-event-system.js
│   │
│   ├── Loyalty System
│   │   ├── loyalty-system.js
│   │   ├── loyalty-notification-system.js
│   │   └── loyalty-email-triggers.js
│   │
│   ├── Communication System
│   │   ├── communication-system.js
│   │   ├── notification-automation-system.js
│   │   └── notification-log-system.js
│   │
│   ├── SMS & Messaging
│   │   ├── sms-messaging-system.js
│   │   ├── sms-credit-system.js
│   │   ├── verified-customer-numbers.js
│   │   └── verified-business-numbers.js
│   │
│   ├── Waiting List System
│   │   ├── waiting-list-system.js
│   │   └── waiting-list-offer-system.js
│   │
│   ├── Security & Compliance
│   │   ├── secure-auth-api.js
│   │   ├── gdpr-compliance-api.js
│   │   ├── security-privacy-system.js
│   │   └── customer-phone-verification.js
│   │
│   ├── Business Logic
│   │   ├── business-status-system.js
│   │   ├── review-system.js
│   │   └── stripe-refund-api.js
│   │
│   └── Configuration
│       ├── development-config.js
│       └── production-config.js
│
├── frontend/
│   └── src/
│       ├── components/                # 15+ React dashboard components
│       │   ├── BusinessAnalyticsDashboard.jsx
│       │   ├── BusinessBookingsDashboard.jsx
│       │   ├── BusinessDashboardFree.jsx
│       │   ├── BusinessDashboardStarter.jsx
│       │   ├── BusinessPayoutsDashboard.jsx
│       │   ├── BusinessReviewsDashboard.jsx
│       │   ├── BusinessServicesDashboard.jsx
│       │   ├── PhotoUploadManager.jsx
│       │   └── ...analytics components
│       │
│       └── utils/
│           └── getBusinessIdFromURL.js
│
├── uploads/
│   └── businesses/                    # Image storage by businessId
│       └── {businessId}/
│           ├── original/
│           ├── thumb/                 # 200px
│           ├── small/                 # 480px
│           ├── medium/                # 960px
│           └── large/                 # 1600px
│
├── email-templates/                   # Email template files
├── email-previews/                    # Email preview pages
└── *.html                             # 50+ HTML dashboard pages
```

---

## Technology Stack

### Backend
- **Framework**: Express.js 4.18
- **Database**: MongoDB 6.0
- **Real-time**: Socket.io 4.7
- **Email**: Nodemailer 6.9 (SMTP)
- **SMS**: Twilio API
- **Google Integration**: googleapis 126.0 (Calendar sync)
- **Images**: Sharp 0.32 (resize, format conversion)
- **File Upload**: Multer 1.4
- **Auth**: jsonwebtoken 9.0
- **Template Engine**: EJS 3.1
- **Scheduling**: node-cron 3.0

### Frontend
- **React**: Functional components with hooks
- **CSS**: Component-level and global styling
- **Integration**: Vanilla JavaScript with HTML pages

---

## Database Schema (MongoDB)

### Key Collections

**business_analytics**
```javascript
{
  businessId: String,
  metricType: 'profileView' | 'searchImpression' | 'contactClick' | 'enquiryReceived',
  timestamp: Date,
  borough: String (optional),
  deviceType: String (optional),
  hour: Number (optional)
}
Indexes: {businessId+metricType+timestamp}, {businessId+timestamp}
```

**business_bookings**
```javascript
{
  businessId: String,
  customerId: String,
  serviceId: String,
  startISO: String,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  googleEventId: String (optional),
  createdAt: Date
}
Indexes: {businessId+startISO+status}
```

**business_services**
```javascript
{
  businessId: String,
  name: String,
  durationMinutes: Number,
  priceGBP: Number,
  active: Boolean,
  featured: Boolean,
  order: Number
}
Indexes: {businessId+active+featured}, {businessId+order}
```

**business_photos**
```javascript
{
  businessId: String,
  hash: String,
  order: Number,
  variants: {
    thumb: {jpg, webp, avif},
    small: {jpg, webp, avif},
    medium: {jpg, webp, avif},
    large: {jpg, webp, avif}
  },
  lqip: {dataUri: String}
}
Indexes: {businessId+order}, {businessId+createdAt}
```

**business_integrations**
```javascript
{
  businessId: String,
  google: {access_token, refresh_token, calendar_id}
}
Indexes: {businessId}
```

---

## Server.js Architecture (3618 lines)

### Key Sections

**Lines 1-50**: Core setup
- Express initialization with Socket.io
- Environment variables loading
- Port defaults to 5000

**Lines 70-178**: Email utilities
- Nodemailer transporter setup
- `sendBusinessWelcomeEmail()` - New business welcome
- `sendCustomerWelcomeEmail()` - New customer welcome with local business suggestions

**Lines 177-248**: Image processing
- `generateDerivatives()` - Creates 4 size variants × 3 formats
- Sizes: thumb(200), small(480), medium(960), large(1600)
- Formats: jpg, webp, avif
- LQIP (Low Quality Image Placeholder) for blur-load effect
- Auto-rotate based on EXIF, EXIF stripping

**Lines 289-318**: MongoDB setup
- Connection to 'blkpages' database
- Index creation on collections (analytics, bookings, integrations, photos, services)

**Lines 350-850**: Analytics API Routes
```javascript
POST /api/record-event             // Record events (profileView, searchImpression, etc.)
GET /api/analytics                 // Get 4-metric dashboard
GET /api/audience-insights         // Demographics & device data
GET /api/search-impressions        // Search visibility stats
GET /api/contact-clicks            // Contact engagement
GET /api/enquiries-analytics       // Enquiry tracking
```

**Lines 850-1200**: Booking API Routes
```javascript
GET /api/bookings/summary
GET /api/bookings/list
POST /api/bookings/create          // Triggers: Google Calendar, emails, SMS (Premium)
PATCH /api/bookings/confirm
PATCH /api/bookings/cancel         // Handles: refunds, cancellation emails
```

**Lines 1200-1400**: Photo Gallery API
```javascript
GET /api/photos
POST /api/photos/upload            // Image processing pipeline
DELETE /api/photos/:photoId
PATCH /api/photos/reorder
POST /api/photos/backfill          // Generate missing derivatives
```

**Lines 1400-1500**: Auth API
```javascript
GET /api/auth/verify-dashboard-token
POST /api/business/register
POST /api/customer/register        // Includes location-based local businesses
```

**Lines 2400-2700**: Services API
```javascript
GET /api/services/list
POST /api/services/create
PATCH /api/services/update
PATCH /api/services/bulk-update
PATCH /api/services/reorder
DELETE /api/services/delete
```

**Lines 2900+**: Reviews, Payouts, Health Check

---

## Backend Systems Overview

### 1. Communication System
Central dispatcher for all messages:
- Email (always sent)
- SMS (Premium tier only, Twilio)
- Timezone-aware formatting
- Booking confirmations, reminders, cancellations

### 2. Booking System
Modular lifecycle:
- **booking-api.js**: CRUD operations
- **booking-sync-system.js**: Dashboard sync (privacy-protected)
- **booking-cancellation-system.js**: Refunds & cleanup
- **booking-event-system.js**: Event emitter
- **booking-integration.js**: Google Calendar, payments

### 3. Loyalty System
Template-based rewards (add-on):
- Visit-based: Book X visits → Reward
- Spend-based: Spend £Y → Reward
- Time-limited: Book X in Z weeks → Reward

### 4. Notification & Automation
Three-layer architecture:
- **notification-automation-system.js**: Waiting List Offers, bounce handling, dunning
- **notification-log-system.js**: Audit trail, delivery status
- **sms-messaging-system.js**: Twilio integration, credit tracking

### 5. Waiting List System
Manages overbooking:
- Join/leave waiting list
- Position calculation
- Offer generation (24-hour hold)
- Privacy-protected business queue

### 6. Security & Compliance
- **secure-auth-api.js**: Rate-limited auth, JWT tokens
- **gdpr-compliance-api.js**: Data export, deletion, 7-year retention
- **security-privacy-system.js**: Input validation, XSS/CSRF protection

### 7. Review System
- Verification (completed bookings only)
- Profanity filtering
- Business replies
- Rating aggregation

### 8. Environment Config
- **development-config.js**: Auto-detect localhost, debug mode
- **production-config.js**: HTTPS, session security, rate limiting, encryption

---

## Important Integration Points

### Google Calendar (Lines 1573-1850)
- Creates/updates/deletes calendar events
- Requires: access_token, refresh_token, calendar_id
- OAuth2 authentication

### Email (Nodemailer)
- SMTP configuration via environment variables
- EJS templates rendering
- Welcome, confirmation, reminder, notification emails

### SMS (Twilio)
- `sms-messaging-system.js` integration
- Credit tracking via `sms-credit-system.js`
- Verified phone numbers (encrypted)

### Payments (Stripe)
- `stripe-refund-api.js` for refund handling
- Webhook integration

### Real-time Updates (Socket.io)
- Global `io` object available
- Used for dashboard live updates
- Booking status changes, analytics updates

---

## Frontend React Components

### Dashboard Components
- **BusinessDashboardFree.jsx**: Free tier (read-only)
- **BusinessDashboardStarter.jsx**: Starter tier (booking management)
- **BusinessAnalyticsDashboard.jsx**: Main analytics display

### Feature Dashboards
- **BusinessBookingsDashboard.jsx**: Booking calendar
- **BusinessServicesDashboard.jsx**: Service management
- **BusinessReviewsDashboard.jsx**: Review management
- **BusinessPayoutsDashboard.jsx**: Payment tracking
- **BusinessSettingsDashboard.jsx**: Account settings

### Analytics Components
- ContactEngagementAnalytics.jsx
- SearchImpressionsAnalytics.jsx
- EnquiriesReceivedAnalytics.jsx
- AudienceInsights.jsx

### Utility Components
- DashboardAuth.jsx (authentication)
- PhotoUploadManager.jsx (image upload)
- GalleryImage.jsx (image display)

### React Patterns
- Functional components with hooks (useState, useEffect)
- Auto-refresh (default 60 seconds)
- Error handling with fallbacks
- Environment-based API URLs
- Color-coded indicators (positive/negative growth)

---

## Common Development Tasks

### Adding an API Endpoint

```javascript
// In server.js, organized by functional area
app.get('/api/path', async (req, res) => {
    try {
        const { param } = req.query;
        const result = await db.collection('collection').findOne(...);
        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});
```

### Creating a React Component

```jsx
// In /frontend/src/components/ComponentName.jsx
import React, { useState, useEffect } from 'react';
import './ComponentName.css';

const ComponentName = ({ businessId }) => {
    const [data, setData] = useState(null);
    
    useEffect(() => {
        fetch(`/api/endpoint?businessId=${businessId}`)
            .then(r => r.json())
            .then(setData);
    }, [businessId]);
    
    return <div>{/* render data */}</div>;
};

export default ComponentName;
```

### Adding an Email Template

```ejs
<!-- In /backend/email-templates/templateName.ejs -->
<h1>Hello <%= name %>!</h1>
<p><%= message %></p>
```

Then render and send:
```javascript
const html = await ejs.renderFile(
    path.resolve('backend/email-templates', 'templateName.ejs'),
    { name: 'John', message: 'Welcome!' }
);
await emailTransporter.sendMail({ to, subject, html });
```

---

## Environment Setup

### Required Environment Variables
```env
MONGO_URI=mongodb://localhost:27017/blkpages
PORT=5000
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=user@example.com
SMTP_PASS=password
```

### Optional Variables
```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
GOOGLE_CALENDAR_CLIENT_ID=
STRIPE_SECRET_KEY=
APP_UI_BASE_URL=https://blkpages.co.uk
UPLOAD_ROOT=/path/to/uploads
```

### Running the Server
```bash
npm install
npm run dev          # Development mode with nodemon
npm start           # Production mode
```

---

## Key Data Flows

### Booking Confirmation
```
POST /api/bookings/create
  ├─ Validate availability
  ├─ Create booking record (pending)
  ├─ Create Google Calendar event
  ├─ Send confirmation email
  ├─ Send business notification
  ├─ Emit booking.confirmed event
  └─ Trigger Socket.io dashboard update
```

### Photo Upload
```
POST /api/photos/upload
  ├─ Validate file (type, size < 8MB)
  ├─ Calculate SHA256 hash
  ├─ Generate 4 size × 3 format variants
  ├─ Generate LQIP blur placeholder
  ├─ Store in uploads/businesses/{businessId}/
  ├─ Insert photo record
  └─ Return photo data with variant URLs
```

### Analytics Recording
```
Tracking snippet fires (profileView, searchImpression, etc.)
  ↓
POST /api/record-event
  ├─ Insert into business_analytics collection
  ├─ Trigger Socket.io update
  └─ Dashboard auto-refreshes (60 seconds)
```

---

## Debugging

### Enable Debug Logging
```bash
DEBUG=* npm run dev
```

### Check MongoDB
```bash
mongosh mongodb://localhost:27017/blkpages
```

### Test API
```bash
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/record-event \
  -H "Content-Type: application/json" \
  -d '{"businessId":"test","metricType":"profileView"}'
```

---

## Performance Notes

### Database
- Indexes optimize: analytics queries, booking lookups, service filtering
- Most queries use indexed fields

### Images
- Multiple formats (jpg/webp/avif) for browser compatibility
- LQIP blur-load for perceived performance
- SHA256 hash-based deduplication
- 365-day cache headers

### Caching
- Uploads: 365-day immutable cache
- Analytics: Auto-refresh every 60 seconds
- Socket.io for real-time critical updates

---

## Security Considerations

### Authentication
- JWT tokens with 7-day expiry
- Token includes businessId and type
- Verified on dashboard routes

### Data Protection
- GDPR-compliant data deletion
- Encryption for sensitive fields (production)
- Phone numbers encrypted
- EXIF data stripped from images

### Rate Limiting
- 5 login attempts per 15 minutes
- 3 signup attempts per 15 minutes
- 10 booking attempts per 15 minutes

### Input Validation
- Required field checking
- Email format validation
- Image type/size validation
- Date format validation

---

## Summary

BlkPages is a well-structured Node.js/MongoDB application with:
- **Clear architecture**: Frontend (React) → Backend (Express) → Database (MongoDB)
- **Modular systems**: 40+ backend modules for specific concerns
- **Rich features**: Analytics, bookings, loyalty, notifications, GDPR compliance
- **Production-ready**: Security hardening, error handling, performance optimization

Start by reading `server.js`, then explore backend modules and React components as needed.

