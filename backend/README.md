# Booking Link & WhatsApp Integration API

This Node.js API provides booking link generation and WhatsApp integration for the BlkPages business directory platform.

## Features

- **Booking Link Generation**: Create unique, secure booking links for customers
- **WhatsApp Integration**: Send booking links via WhatsApp using Twilio API
- **Booking Management**: Confirm, cancel, and track booking status
- **Expiry Handling**: Automatic link expiration (24 hours default)
- **Rate Limiting**: API protection with rate limiting
- **Modular Design**: Easy to integrate with existing systems

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the environment example file:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=+447700900123

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Twilio WhatsApp Setup

1. **Create Twilio Account**: Sign up at [twilio.com](https://www.twilio.com)
2. **Get WhatsApp Sandbox**: 
   - Go to Console > Messaging > Try it out > Send a WhatsApp message
   - Follow the sandbox setup instructions
3. **Get Credentials**:
   - Account SID and Auth Token from Console Dashboard
   - WhatsApp number from sandbox (usually +447700900123)

### 4. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Generate Booking Link
```
POST /api/generate-booking-link
```

**Request Body:**
```json
{
  "businessId": "123",
  "serviceId": "haircut",
  "slotDateTime": "2025-01-15T14:00:00",
  "customerPhone": "+1234567890",
  "customerName": "John Doe",
  "sendWhatsApp": true
}
```

**Response:**
```json
{
  "success": true,
  "bookingLink": "http://localhost:3000/book?token=abc123&biz=123&slot=2025-01-15T14:00:00&service=haircut",
  "whatsappLink": "https://wa.me/1234567890?text=...",
  "message": "Hi! 👋 ...",
  "whatsappSent": true,
  "bookingData": { ... }
}
```

### Get Booking Details
```
GET /api/booking/:token
```

### Confirm Booking
```
POST /api/booking/:token/confirm
```

**Request Body:**
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "specialRequests": "Please use organic products"
}
```

### Cancel Booking
```
POST /api/booking/:token/cancel
```

### Get Business Bookings
```
GET /api/business/:businessId/bookings
```

## Frontend Integration

### Business Interface
- **File**: `business-booking-manager.html`
- **Purpose**: Form for businesses to generate booking links
- **Features**: Customer details, service selection, WhatsApp options

### Customer Interface
- **File**: `customer-booking.html`
- **Purpose**: Customer booking confirmation page
- **Features**: Booking details, confirmation form, expiry timer

### Dashboard Integration
- Added "Generate Booking Link" button to business dashboard
- Links to the booking manager interface

## WhatsApp Message Templates

### Booking Link Message
```
Hi! 👋 

Royal Hair Studio has reserved a booking for you:

📅 *Service:* Haircut & Style
🕐 *Date & Time:* Monday, January 15, 2025 at 02:00 PM

Click the link below to confirm your appointment:
[BOOKING_LINK]

This link is valid for 24 hours. Please confirm to secure your slot! ✨
```

### Confirmation Message
```
✅ *Booking Confirmed!*

Thank you for confirming your appointment with Royal Hair Studio.

📅 *Service:* Haircut & Style
🕐 *Date & Time:* Monday, January 15, 2025 at 02:00 PM

We look forward to seeing you! If you need to reschedule, please contact us directly.

Royal Hair Studio 💫
```

## Security Features

- **Unique Tokens**: SHA-256 hashed booking tokens
- **Expiry Handling**: Automatic link expiration
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Required field validation
- **CORS Protection**: Configurable CORS settings

## Database Integration

Currently uses in-memory storage. To integrate with your database:

1. Replace `Map` objects with database calls
2. Add database connection in the API
3. Update CRUD operations for bookings and business data

Example with MongoDB:
```javascript
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

// Replace bookings.set() with:
await Booking.create(bookingData);

// Replace bookings.get() with:
const booking = await Booking.findOne({ token });
```

## Testing

Test the API endpoints using curl or Postman:

```bash
# Generate booking link
curl -X POST http://localhost:3001/api/generate-booking-link \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "123",
    "serviceId": "haircut",
    "slotDateTime": "2025-01-15T14:00:00",
    "customerPhone": "+1234567890",
    "customerName": "John Doe",
    "sendWhatsApp": false
  }'
```

## Troubleshooting

### Common Issues

1. **Twilio Authentication Error**
   - Verify Account SID and Auth Token
   - Check WhatsApp number format (+447700900123)

2. **CORS Errors**
   - Update FRONTEND_URL in .env
   - Check CORS configuration

3. **WhatsApp Not Sending**
   - Verify Twilio WhatsApp sandbox setup
   - Check phone number format (international format)
   - Ensure WhatsApp Business API is enabled

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

## Production Deployment

1. **Environment Variables**: Set production values
2. **Database**: Replace in-memory storage with database
3. **HTTPS**: Use HTTPS for production
4. **Rate Limiting**: Adjust rate limits for production load
5. **Monitoring**: Add logging and monitoring

## Support

For issues or questions:
- Check the Twilio documentation
- Review API logs
- Test with sandbox environment first
- Verify all environment variables are set

