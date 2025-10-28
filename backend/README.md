# BlkPages Backend Setup

This backend provides the API and real-time functionality for BlkPages using Express.js, PostgreSQL, and Socket.IO.

## Features

- ✅ Express.js REST API
- ✅ PostgreSQL database integration
- ✅ Socket.IO real-time updates
- ✅ Stripe payment processing
- ✅ Email notifications
- ✅ Customer loyalty system
- ✅ Booking management
- ✅ Review system
- ✅ Notification system

## Quick Start

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Database Setup**
   - Create a PostgreSQL database
   - Run the schema.sql file to create tables
   - Set your DATABASE_URL in .env

3. **Environment Variables**
   Create a `.env` file with:
   ```
   PORT=3001
   DATABASE_URL=postgresql://username:password@localhost:5432/blkpages_db
   STRIPE_SECRET_KEY=sk_test_your_key_here
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Start the Server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## API Endpoints

### Bookings
- `GET /api/bookings?customerId=123` - Get customer bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking status

### Loyalty
- `GET /api/loyalty?customerId=123` - Get loyalty data
- `POST /api/loyalty/add-points` - Add loyalty points

### Reviews
- `GET /api/reviews?customerId=123` - Get customer reviews
- `POST /api/reviews` - Create new review

### Notifications
- `GET /api/notifications?customerId=123` - Get notifications
- `POST /api/notifications` - Create notification

## Socket.IO Events

### Client → Server
- `register` - Register customer for updates: `{ customerId: "123" }`

### Server → Client
- `booking_status_changed` - Booking status updated
- `loyalty_points_updated` - Loyalty points changed
- `new_notification` - New notification received

## Real-time Updates

The backend automatically emits real-time updates when:
- Booking status changes (confirmed, cancelled, completed)
- Loyalty points are added/updated
- New notifications are created
- Reviews are submitted

## Database Schema

See `schema.sql` for the complete database structure including:
- Customers, Businesses, Bookings
- Payments, Loyalty, Reviews
- Notifications and Transactions

## Development

- Uses ES modules (`import/export`)
- Includes error handling and logging
- CORS enabled for frontend integration
- WebSocket transport for Socket.IO
- Health check endpoint at `/health`

## Production Notes

- Set `NODE_ENV=production`
- Use SSL for PostgreSQL in production
- Configure proper CORS origins
- Set up Stripe webhook endpoints
- Use environment-specific email settings