# BlkPages Customer Dashboard Setup

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm init -y
npm install express stripe cors body-parser pg dotenv
npm install -D node-fetch
```

### 2. Create Environment File
Create `.env` file with your credentials:
```env
PORT=3001
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
STRIPE_SECRET_KEY=sk_test_************************
STRIPE_WEBHOOK_SECRET=whsec_************************
```

### 3. Set Up Database
Run the SQL schema in your PostgreSQL database:
```sql
-- Enable UUIDs if needed
create extension if not exists "pgcrypto";

-- Run the full schema from your previous message
-- (customers, businesses, bookings, payments, reviews, loyalty_accounts, loyalty_transactions tables)
```

### 4. Start the Server
```bash
node server.js
```

### 5. Test the API
```bash
node test-api.js
```

### 6. Open Dashboard
Open `customer-dashboard.html` in your browser and check the console for API calls.

## 🔧 Troubleshooting

### CORS Issues
If you see CORS errors in the browser console, the server.js already has CORS enabled, but you might need to add specific origins:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'file://'],
  credentials: true
}));
```

### Database Connection
Make sure your DATABASE_URL is correct and the database is accessible.

### Stripe Keys
Use test keys for development. The webhook secret is only needed for production.

## 📊 Expected Behavior

1. **Dashboard loads** with demo data initially
2. **API calls** are made to localhost:3001
3. **Real data** replaces demo data if API is available
4. **Console logs** show API response status
5. **Fallback** to demo data if API fails

## 🎯 Next Steps

1. **Add sample data** to your database
2. **Test booking creation** with Stripe
3. **Implement authentication** for real customer IDs
4. **Deploy to production** with proper CORS settings

