# 🚀 BlkPages Backend Deployment Guide

## Quick Deploy Options (No Local Setup Required)

### Option 1: Railway (Recommended - Easiest)

1. **Go to [railway.app](https://railway.app)**
2. **Sign up with GitHub**
3. **Create New Project**
4. **Upload your backend folder**
5. **Set Environment Variables:**
   ```
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_WHATSAPP_NUMBER=+447700900123
   FRONTEND_URL=https://your-frontend-url.com
   PORT=3001
   NODE_ENV=production
   ```
6. **Deploy!** Railway will give you a URL like `https://your-app.railway.app`

### Option 2: Vercel (Serverless)

1. **Go to [vercel.com](https://vercel.com)**
2. **Import your GitHub repository**
3. **Configure as Node.js project**
4. **Set environment variables in Vercel dashboard**
5. **Deploy!**

### Option 3: Netlify Functions

1. **Go to [netlify.com](https://netlify.com)**
2. **Connect your GitHub repository**
3. **Configure build settings:**
   - Build command: `cd backend && npm install`
   - Publish directory: `backend`
4. **Set environment variables**
5. **Deploy!**

## Testing Your Backend

### 1. Use the Test Page
- Open `backend-test.html` in your browser
- Change the API_BASE_URL to your deployed backend URL
- Test all endpoints

### 2. Test with Frontend
- Update your frontend forms to point to your deployed backend
- Test the full booking flow

## Environment Variables Setup

### For Twilio WhatsApp (Optional - for WhatsApp features)
1. **Sign up at [twilio.com](https://twilio.com)**
2. **Get WhatsApp Sandbox credentials**
3. **Set these variables:**
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_NUMBER=+447700900123
   ```

### For Production
```
FRONTEND_URL=https://your-frontend-domain.com
PORT=3001
NODE_ENV=production
```

## API Endpoints Available

- `POST /api/generate-booking-link` - Create booking links
- `GET /api/booking/:token` - Get booking details
- `POST /api/booking/:token/confirm` - Confirm booking
- `POST /api/booking/:token/cancel` - Cancel booking
- `GET /api/business/:id/bookings` - Get business bookings

## Quick Test Commands

```bash
# Test API health
curl https://your-backend-url.com/api/health

# Generate booking link
curl -X POST https://your-backend-url.com/api/generate-booking-link \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "123",
    "serviceId": "haircut",
    "slotDateTime": "2025-01-15T14:00:00",
    "customerPhone": "+447712345678",
    "customerName": "Test Customer",
    "sendWhatsApp": false
  }'
```

## Frontend Integration

Update your frontend forms to use your deployed backend:

```javascript
// Change this in your HTML files
const API_BASE_URL = 'https://your-backend-url.com';
```

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Make sure FRONTEND_URL is set correctly
2. **WhatsApp Not Working**: Check Twilio credentials
3. **Database Issues**: Currently uses in-memory storage (resets on restart)

### Debug Mode:
Add this to your environment variables:
```
DEBUG=*
```

## Next Steps

1. **Deploy your backend** using one of the options above
2. **Test the API** using the test page
3. **Update your frontend** to use the deployed backend URL
4. **Test the full booking flow**

## Support

- Check the backend README.md for detailed setup
- Test with the provided test page
- Use browser developer tools to debug API calls

