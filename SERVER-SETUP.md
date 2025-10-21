# BlkPages Backend Server Setup

## 🚀 Quick Start

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Set up Environment Variables:**
   ```bash
   cp env.example .env
   ```
   
   Then edit `.env` with your actual values:
   ```
   STRIPE_SECRET_KEY=sk_live_your_actual_stripe_key
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

3. **Run the Server:**
   ```bash
   npm start
   # or for development:
   npm run dev
   ```

## 📡 API Endpoints

### POST `/bookings/new`
Creates a new booking with Stripe payment processing.

**Request Body:**
```json
{
  "business": "business-slug",
  "services": [{"name": "Service Name", "price": 50}],
  "total": 50.00,
  "date": "2024-01-15",
  "time": "14:30",
  "customerEmail": "customer@example.com",
  "isNewCustomer": true
}
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx"
}
```

## 🔧 Features

- ✅ **Stripe Integration**: Payment processing with 10% commission for new customers
- ✅ **Email Notifications**: Automatic booking emails to businesses
- ✅ **CORS Support**: Frontend integration ready
- ✅ **Error Handling**: Comprehensive error responses
- ✅ **Logging**: Console logging for debugging

## 📧 Email Configuration

The server uses Gmail SMTP. For production, consider:
- Using a dedicated email service (SendGrid, Mailgun)
- Setting up proper authentication
- Adding email templates

## 🔒 Security Notes

- Store sensitive keys in `.env` file
- Use environment-specific Stripe keys
- Implement proper validation in production
- Add rate limiting for production use
