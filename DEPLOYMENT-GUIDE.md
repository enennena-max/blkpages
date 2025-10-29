# BlkPages Loyalty System - Complete Deployment Guide

## 🎯 Overview

This guide shows you how to deploy the complete BlkPages loyalty system with:
- ✅ Mobile verification with OTP
- ✅ £50 rolling 30-day redemption cap
- ✅ 24-hour pending system for all transactions
- ✅ Automated background jobs
- ✅ Smart notifications
- ✅ Referral bonus system

## 📁 Complete File Structure

```
blkpages-loyalty-system/
├── loyalty-engine.js              # Unified background job system
├── blkpoints-integration.js       # Core loyalty logic functions
├── loyalty-system-setup.js        # Complete Express.js server setup
├── loyalty-page.html              # Updated frontend with verification UI
├── loyalty-api.js                 # Express.js API endpoints
├── blkpoints-database-setup.sql   # Complete database schema
├── blkpoints-api-guide.md         # API integration guide
├── LOYALTY-SYSTEM-README.md       # System documentation
└── package.json                   # Dependencies
```

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
npm init -y
npm install express cors helmet express-rate-limit node-cron
```

### 2. Set Up Database

```bash
# MySQL/MariaDB
mysql -u username -p database_name < blkpoints-database-setup.sql

# PostgreSQL (convert schema as needed)
psql -U username -d database_name -f blkpoints-database-setup.sql
```

### 3. Start the System

```bash
# Run the complete setup
node loyalty-system-setup.js
```

The system will start on `http://localhost:3000` with:
- Mobile verification API
- BlkPoints redemption API
- Background job engine
- Admin endpoints

## 🔧 Production Deployment

### Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/blkpages
DB_HOST=localhost
DB_USER=blkpages_user
DB_PASSWORD=secure_password
DB_NAME=blkpages_production

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Email Service (SendGrid)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@blkpages.com

# Push Notifications (Firebase)
FIREBASE_PROJECT_ID=your_firebase_project
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# JWT Secret
JWT_SECRET=your_super_secure_jwt_secret

# Server
PORT=3000
NODE_ENV=production
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "loyalty-system-setup.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  loyalty-system:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://root:password@db:3306/blkpages
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=blkpages
    volumes:
      - mysql_data:/var/lib/mysql
      - ./blkpoints-database-setup.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

volumes:
  mysql_data:
```

Deploy with Docker:

```bash
docker-compose up -d
```

### Kubernetes Deployment

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blkpages-loyalty
spec:
  replicas: 3
  selector:
    matchLabels:
      app: blkpages-loyalty
  template:
    metadata:
      labels:
        app: blkpages-loyalty
    spec:
      containers:
      - name: loyalty-system
        image: blkpages/loyalty-system:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: blkpages-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: blkpages-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: blkpages-loyalty-service
spec:
  selector:
    app: blkpages-loyalty
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## 🔌 API Integration

### Frontend Integration

Update your existing loyalty page:

```html
<!-- Replace your current loyalty page with loyalty-page.html -->
<script>
// Load user status
async function loadUserStatus() {
  const response = await fetch('/api/loyalty/status', {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  });
  const status = await response.json();
  
  // Update UI
  updateVerificationUI(status);
  updateRedemptionCapUI(status);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadUserStatus);
</script>
```

### Backend Integration

Add to your existing Express app:

```javascript
const loyaltyEngine = require('./loyalty-engine');
const blkpointsIntegration = require('./blkpoints-integration');

// Initialize loyalty engine
loyaltyEngine.setupLoyaltyEngine(db);

// Add API routes
app.use('/api/loyalty', loyaltyApi);
app.use('/api/user', userVerificationApi);
```

## 📊 Monitoring & Analytics

### Health Checks

Add health check endpoint:

```javascript
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;
    
    // Check loyalty engine status
    const stats = await getLoyaltyStats(db);
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      database: 'connected',
      loyaltyEngine: 'running',
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### Metrics Collection

```javascript
// Prometheus metrics
const prometheus = require('prom-client');

const loyaltyTransactions = new prometheus.Counter({
  name: 'blkpoints_transactions_total',
  help: 'Total number of BlkPoints transactions',
  labelNames: ['type', 'status']
});

const redemptionCapUsage = new prometheus.Gauge({
  name: 'blkpoints_redemption_cap_usage_percent',
  help: 'Percentage of redemption cap used',
  labelNames: ['user_id']
});

// Update metrics in your functions
loyaltyTransactions.inc({ type: 'earn', status: 'confirmed' });
redemptionCapUsage.set({ user_id: userId }, usagePercentage);
```

### Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'loyalty-system.log' }),
    new winston.transports.Console()
  ]
});

// Use in your functions
logger.info('Loyalty engine run completed', { processed, errors });
logger.error('Failed to process transaction', { error: error.message, txId });
```

## 🧪 Testing

### Unit Tests

```javascript
// test/loyalty-engine.test.js
const { runLoyaltyEngine } = require('../loyalty-engine');

describe('Loyalty Engine', () => {
  test('should process pending transactions', async () => {
    const mockDb = createMockDatabase();
    const result = await runLoyaltyEngine(mockDb, mockNotifyUser);
    
    expect(result.success).toBe(true);
    expect(result.processed).toBeGreaterThan(0);
  });
  
  test('should handle errors gracefully', async () => {
    const mockDb = createFailingDatabase();
    const result = await runLoyaltyEngine(mockDb, mockNotifyUser);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Integration Tests

```javascript
// test/api-integration.test.js
const request = require('supertest');
const app = require('../loyalty-system-setup');

describe('API Integration', () => {
  test('should verify mobile number', async () => {
    const response = await request(app)
      .post('/api/user/send-otp')
      .send({ mobile_number: '+447123456789' })
      .expect(200);
    
    expect(response.body.message).toBe('OTP sent successfully');
  });
  
  test('should redeem BlkPoints', async () => {
    const response = await request(app)
      .post('/api/loyalty/redeem')
      .send({ selectedPoints: 1000 })
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

### Load Testing

```javascript
// test/load-test.js
const autocannon = require('autocannon');

const runLoadTest = async () => {
  const result = await autocannon({
    url: 'http://localhost:3000',
    connections: 100,
    duration: 60,
    requests: [
      {
        method: 'GET',
        path: '/api/loyalty/status'
      },
      {
        method: 'POST',
        path: '/api/loyalty/redeem',
        body: JSON.stringify({ selectedPoints: 1000 })
      }
    ]
  });
  
  console.log('Load test results:', result);
};

runLoadTest();
```

## 🔒 Security Checklist

- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] JWT token validation
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Helmet security headers
- [ ] Environment variables secured
- [ ] Database credentials encrypted
- [ ] Audit logging enabled

## 📈 Performance Optimization

### Database Indexing

```sql
-- Add indexes for performance
CREATE INDEX idx_ledger_user_type_date ON blkpoints_ledger(user_id, type, created_at);
CREATE INDEX idx_ledger_status ON blkpoints_ledger(status);
CREATE INDEX idx_users_verified ON users(is_verified);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);
```

### Caching

```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache user status
async function getCachedUserStatus(userId) {
  const cached = await client.get(`user_status:${userId}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const status = await getUserBlkPointsStatus(userId, db);
  await client.setex(`user_status:${userId}`, 300, JSON.stringify(status)); // 5 min cache
  return status;
}
```

### Connection Pooling

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

## 🚨 Troubleshooting

### Common Issues

1. **OTP not sending**
   - Check SMS provider configuration
   - Verify API keys and credentials
   - Check rate limiting

2. **Redemption blocked**
   - Verify mobile number verification
   - Check redemption cap status
   - Ensure sufficient balance

3. **Points not confirming**
   - Check cron job is running
   - Verify database connection
   - Check transaction status

4. **Database errors**
   - Verify schema is applied correctly
   - Check connection string
   - Ensure proper permissions

### Debug Commands

```bash
# Check system status
curl http://localhost:3000/api/admin/status

# Run loyalty engine manually
curl -X POST http://localhost:3000/api/admin/run-loyalty-engine

# Test notification
curl -X POST http://localhost:3000/api/admin/test-notification

# Check logs
tail -f loyalty-system.log
```

## 📞 Support

### Monitoring Dashboard

Create a simple admin dashboard:

```html
<!DOCTYPE html>
<html>
<head>
    <title>BlkPages Loyalty Admin</title>
</head>
<body>
    <h1>Loyalty System Status</h1>
    <div id="status"></div>
    
    <script>
    async function loadStatus() {
        const response = await fetch('/api/admin/status');
        const data = await response.json();
        document.getElementById('status').innerHTML = JSON.stringify(data, null, 2);
    }
    
    setInterval(loadStatus, 5000);
    loadStatus();
    </script>
</body>
</html>
```

### Alerting

Set up alerts for:
- High error rates
- Failed OTP deliveries
- Users approaching redemption limits
- Database connection issues
- Loyalty engine failures

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: January 2025

Your BlkPages loyalty system is now fully deployed and ready to handle real users! 🎉