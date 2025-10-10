# BlkPages Analytics System

A complete, production-ready real-time analytics system for tracking business profile metrics.

## 🚀 Features

- **Real-time Analytics**: Track 4 key metrics with live updates
- **Auto-refresh**: Dashboard updates every 60 seconds
- **Production-ready**: Robust error handling and MongoDB optimization
- **Mobile-friendly**: Responsive design with accessibility support
- **Easy Integration**: Simple JavaScript snippets for existing pages

## 📊 Tracked Metrics

1. **Profile Views** - When users visit business profiles
2. **Search Impressions** - When businesses appear in search results  
3. **Contact Clicks** - When users click "Call" or "Message" buttons
4. **Enquiries Received** - When users submit enquiry forms

Each metric shows:
- **Total** (all-time count)
- **Today** (last 24 hours)
- **Growth Rate** (this month vs last month)

## 🛠 Tech Stack

- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React (functional components, hooks)
- **Database**: MongoDB with optimized indexes
- **API**: RESTful endpoints with CORS support

## 📁 Project Structure

```
/
├── server.js                                    # Express server
├── package.json                                 # Dependencies
├── env.example                                  # Environment variables template
├── analytics-tracking-snippets.js              # Integration snippets
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── BusinessAnalyticsDashboard.jsx   # React dashboard component
│       │   └── BusinessAnalyticsDashboard.css  # Dashboard styles
│       └── utils/
│           └── getBusinessIdFromURL.js          # URL helper utility
└── README.md                                    # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp env.example .env
```

Edit `.env`:
```env
MONGO_URI=mongodb://localhost:27017/blkpages
PORT=5000
```

### 3. Start the Server

```bash
npm start
```

Server runs on `http://localhost:5000`

### 4. View Analytics Dashboard

```
http://localhost:5000/frontend/src/components/BusinessAnalyticsDashboard.jsx?businessId=your-business-id
```

## 📡 API Endpoints

### POST /api/record-event

Record an analytics event.

**Request:**
```json
{
  "businessId": "business-123",
  "metricType": "profileView"
}
```

**Response:**
```json
{
  "success": true
}
```

**Valid metricType values:**
- `profileView`
- `searchImpression`
- `contactClick`
- `enquiryReceived`

### GET /api/analytics?businessId=XYZ

Get analytics statistics for a business.

**Response:**
```json
{
  "profileView": {
    "total": 150,
    "today": 12,
    "growthRate": 15.3
  },
  "searchImpression": {
    "total": 89,
    "today": 5,
    "growthRate": -2.1
  },
  "contactClick": {
    "total": 23,
    "today": 3,
    "growthRate": 8.7
  },
  "enquiryReceived": {
    "total": 7,
    "today": 1,
    "growthRate": 0
  }
}
```

## 🔧 Integration

### React Component Usage

```jsx
import BusinessAnalyticsDashboard from './components/BusinessAnalyticsDashboard';

function App() {
  return (
    <div>
      <BusinessAnalyticsDashboard businessId="your-business-id" />
    </div>
  );
}
```

### JavaScript Tracking Snippets

```javascript
import { 
  trackProfileView, 
  trackSearchImpression, 
  trackContactClick, 
  trackEnquiryReceived 
} from './analytics-tracking-snippets';

// Track profile view on page load
trackProfileView('business-123');

// Track search impression for each business in results
businesses.forEach(business => {
  trackSearchImpression(business.id);
});

// Track contact button clicks
button.addEventListener('click', () => {
  trackContactClick('business-123');
});

// Track enquiry form submissions
form.addEventListener('submit', () => {
  trackEnquiryReceived('business-123');
});
```

## 🗄 Database Schema

**Collection:** `business_analytics`

```javascript
{
  _id: ObjectId,
  businessId: String,                           // required
  metricType: 'profileView'|'searchImpression'|'contactClick'|'enquiryReceived',
  timestamp: Date                                // server time
}
```

**Indexes:**
- `{ businessId: 1, metricType: 1, timestamp: 1 }`
- `{ businessId: 1, timestamp: 1 }`

## 🎨 Dashboard Features

- **Real-time Updates**: Auto-refreshes every 60 seconds
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessibility**: High contrast mode and reduced motion support
- **Error Handling**: Graceful fallbacks and retry mechanisms
- **Growth Indicators**: Color-coded positive/negative growth rates

## 🔒 Production Considerations

- **Environment Variables**: Use `.env` for configuration
- **CORS**: Configured for cross-origin requests
- **Error Handling**: Comprehensive try-catch blocks
- **Database Optimization**: Indexed queries for performance
- **UTC Timestamps**: Consistent date boundaries globally
- **Graceful Shutdown**: Proper cleanup on server stop

## 🧪 Testing

### Manual Testing

1. **Start the server**: `npm start`
2. **Record events**: Use the tracking snippets
3. **View dashboard**: Check real-time updates
4. **Test error handling**: Disconnect MongoDB

### API Testing

```bash
# Record a profile view
curl -X POST http://localhost:5000/api/record-event \
  -H "Content-Type: application/json" \
  -d '{"businessId":"test-business","metricType":"profileView"}'

# Get analytics
curl "http://localhost:5000/api/analytics?businessId=test-business"
```

## 📈 Performance

- **Database Indexes**: Optimized for fast queries
- **Debounced Tracking**: Prevents duplicate events
- **Fire-and-forget**: Non-blocking analytics calls
- **Efficient Aggregations**: MongoDB count operations
- **Auto-refresh**: Configurable update intervals

## 🛡 Security

- **Input Validation**: Required fields and metric type validation
- **CORS Configuration**: Controlled cross-origin access
- **Error Sanitization**: No sensitive data in error responses
- **Database Connection**: Secure MongoDB URI handling

## 📱 Mobile Support

- **Responsive Grid**: Adapts to screen size
- **Touch-friendly**: Large buttons and touch targets
- **Performance**: Optimized for mobile networks
- **Accessibility**: Screen reader and keyboard navigation

## 🔄 Deployment

### Environment Variables

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/blkpages
PORT=5000
REACT_APP_API_BASE_URL=https://api.blkpages.com
```

### Serverless Deployment

The Express app is exported for serverless adapters:

```javascript
// For Vercel, Netlify Functions, etc.
module.exports = app;
```

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify MongoDB connection
3. Test API endpoints manually
4. Check environment variables

## 📄 License

MIT License - see LICENSE file for details.