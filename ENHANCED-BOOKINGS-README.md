# Enhanced Business Bookings Dashboard

## 🚀 New Features

### ✅ Google Calendar Sync
- Automatic sync of bookings to business Google Calendar
- Real-time event creation, updates, and deletion
- OAuth2 authentication with access/refresh tokens
- Support for multiple calendar IDs

### ✅ Automatic Email Notifications
- Confirmation emails when bookings are created
- Cancellation emails when bookings are cancelled
- 24-hour and 1-hour reminder emails
- Customizable email templates and sender addresses

## 📋 Setup Instructions

### 1. Install Dependencies
```bash
npm install express mongodb cors dotenv googleapis nodemailer node-cron
```

### 2. Environment Variables
Create a `.env` file with the following variables:

```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/blkpages

# Server Configuration
PORT=5000

# Google Calendar Integration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Email Configuration (SMTP)
SMTP_HOST=smtp.yourmailhost.com
SMTP_PORT=465
SMTP_USER=your_email@yourmailhost.com
SMTP_PASS=your_email_password
SMTP_FROM="BlkPages <no-reply@blkpages.co.uk>"
```

### 3. Google Calendar Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth2 credentials
5. Add your domain to authorized redirect URIs
6. Copy Client ID and Client Secret to `.env` file

### 4. Email Setup
Configure your SMTP settings for email notifications:
- **Gmail**: Use App Password for authentication
- **Outlook**: Use your regular password
- **Custom SMTP**: Configure according to your provider

### 5. Start Server
```bash
npm start
```

## 🔧 API Endpoints

### Booking Management
- `GET /api/bookings/summary?businessId=XYZ` - Get booking metrics
- `GET /api/bookings/list?businessId=XYZ&status=pending` - List bookings
- `POST /api/bookings/create` - Create new booking
- `PATCH /api/bookings/confirm` - Confirm booking
- `PATCH /api/bookings/cancel` - Cancel booking

### Integration Management
- `GET /api/integrations?businessId=XYZ` - Get integration settings
- `POST /api/integrations` - Update integration settings

## 📊 Data Models

### Enhanced Booking Model
```javascript
{
  _id: ObjectId,
  businessId: String,
  serviceId: String,
  customer: {
    name: String,
    phone: String,
    email: String
  },
  startISO: String,
  endISO: String,
  status: 'pending'|'confirmed'|'completed'|'cancelled',
  createdAt: Date,
  confirmedAt: Date|null,
  priceGBP: Number,
  notes: String|null,
  source: 'widget'|'manual',
  googleEventId: String|null,        // NEW: Google Calendar event ID
  customerEmailNotified: Boolean     // NEW: Email notification status
}
```

### Business Integration Model
```javascript
{
  businessId: String,
  google: {
    access_token: String,
    refresh_token: String,
    token_expiry: Date,
    calendar_id: String
  },
  emailSettings: {
    enabled: Boolean,
    fromAddress: String
  }
}
```

## 🔄 Workflow

### 1. Booking Creation
1. Customer creates booking via widget or manual entry
2. System creates booking record in database
3. **NEW**: Syncs to Google Calendar (if configured)
4. **NEW**: Sends confirmation email to customer (if enabled)

### 2. Booking Confirmation
1. Business confirms booking via dashboard
2. **NEW**: Creates Google Calendar event (if not already synced)
3. **NEW**: Updates booking status and timestamps

### 3. Booking Cancellation
1. Business cancels booking via dashboard
2. **NEW**: Deletes Google Calendar event
3. **NEW**: Sends cancellation email to customer

### 4. Automatic Reminders
1. Cron job runs every hour
2. Checks for bookings needing reminders (24h and 1h before)
3. **NEW**: Sends reminder emails to customers
4. Marks bookings as notified to prevent duplicate emails

## 🎯 Demo Features

### Enhanced Demo Page
- **Integration Settings Panel**: Configure Google Calendar and email settings
- **Status Indicators**: Visual indicators for connected integrations
- **Test Functions**: Test Google Calendar sync and email notifications
- **Simulation Controls**: Generate bookings with full integration testing

### Testing Features
- **Google Calendar Sync**: Test event creation and deletion
- **Email Notifications**: Test confirmation and reminder emails
- **Integration Status**: Real-time status of connected services
- **Sample Data**: Generate realistic test data with integrations

## 🔒 Security Considerations

### Google Calendar
- Access tokens are stored securely in database
- Refresh tokens used for automatic token renewal
- OAuth2 flow ensures secure authentication

### Email
- SMTP credentials stored in environment variables
- Email addresses validated before sending
- Rate limiting to prevent spam

## 📈 Benefits

### For Businesses
- **Automatic Calendar Sync**: No manual calendar management
- **Professional Communication**: Automated customer emails
- **Reduced No-shows**: Reminder emails improve attendance
- **Time Savings**: Eliminates manual booking management

### For Customers
- **Instant Confirmation**: Immediate booking confirmation emails
- **Reminder Notifications**: 24h and 1h reminder emails
- **Calendar Integration**: Bookings appear in their calendar
- **Professional Experience**: Consistent communication

## 🚀 Next Steps

1. **Test the Enhanced Demo**: Visit `business-bookings-enhanced-demo.html`
2. **Configure Integrations**: Set up Google Calendar and email settings
3. **Generate Sample Data**: Create test bookings with full integration
4. **Deploy to Production**: Use the provided environment variables
5. **Monitor Performance**: Check logs for integration status

## 📞 Support

For technical support or questions about the enhanced bookings system:
- Check server logs for integration errors
- Verify environment variables are correctly set
- Test Google Calendar and email configurations
- Monitor cron job execution for reminders

---

**Enhanced Business Bookings Dashboard** - Now with Google Calendar sync and automatic email notifications! 🚀📅📧
