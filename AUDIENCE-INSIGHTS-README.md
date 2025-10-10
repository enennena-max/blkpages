# BlkPages Audience Insights System

## Overview

The Audience Insights system extends the existing BlkPages analytics platform to provide detailed visitor analytics including top visitor areas, device usage patterns, and activity timing insights.

## Features

### 🎯 **Core Analytics**
- **Top Visitor Areas by Borough**: Track which London boroughs generate the most profile views
- **Device Usage Analytics**: Monitor mobile vs desktop visitor patterns
- **Activity Timing**: Identify most active days and hours for profile views

### 📊 **Real-time Updates**
- Auto-refresh every 60 seconds
- Live data visualization with Chart.js
- Responsive design for all devices

## System Architecture

### Backend (Node.js + MongoDB)

#### **Enhanced API Endpoint**
```javascript
POST /api/record-event
```

**New Request Body Format:**
```json
{
  "businessId": "abc123",
  "metricType": "profileView",
  "borough": "Lewisham",           // Optional: visitor location
  "deviceType": "mobile"            // Optional: mobile or desktop
}
```

#### **New Audience Insights Endpoint**
```javascript
GET /api/audience-insights?businessId=XYZ&period=weekly
```

**Response Format:**
```json
{
  "topBoroughs": [
    { "borough": "Lewisham", "count": 47 },
    { "borough": "Southwark", "count": 36 }
  ],
  "deviceUsage": {
    "mobile": 128,
    "desktop": 57
  },
  "activePeriods": [
    { "dayOfWeek": 6, "hour": 19, "count": 22 },
    { "dayOfWeek": 5, "hour": 18, "count": 17 }
  ]
}
```

### Frontend (React Component)

#### **AudienceInsights.jsx**
```jsx
import AudienceInsights from './components/AudienceInsights';

function BusinessDashboard() {
  return (
    <div>
      <AudienceInsights businessId="your-business-id" />
    </div>
  );
}
```

## Implementation Guide

### 1. **Backend Setup**

#### **Install Dependencies**
```bash
npm install express mongodb cors dotenv
```

#### **Environment Variables**
```env
MONGO_URI=mongodb://localhost:27017/blkpages
PORT=5000
FRONTEND_ORIGIN=http://localhost:3000
```

#### **Start Server**
```bash
node server.js
```

### 2. **Frontend Integration**

#### **Install React Dependencies**
```bash
npm install react-chartjs-2 chart.js
```

#### **Add Component to Dashboard**
```jsx
import AudienceInsights from './components/AudienceInsights';

function BusinessDashboard() {
  return (
    <div className="dashboard">
      <AudienceInsights businessId="your-business-id" />
    </div>
  );
}
```

### 3. **Tracking Implementation**

#### **Enhanced Profile View Tracking**
```javascript
// Detect device type
const deviceType = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop';

// Get user location (implement based on your needs)
const borough = getUserBorough(); // Your location detection logic

// Track with visitor context
trackProfileView(businessId, { 
  borough, 
  deviceType 
});
```

#### **Location Detection Options**
```javascript
// Option 1: IP-based geolocation
async function getUserBorough() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.city; // or use a mapping service for boroughs
  } catch (error) {
    return null;
  }
}

// Option 2: User consent-based location
function getUserBorough() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Convert coordinates to borough
        return getBoroughFromCoordinates(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.log('Location access denied');
        return null;
      }
    );
  }
  return null;
}
```

## Data Model

### **MongoDB Collection: business_analytics**

```javascript
{
  _id: ObjectId,
  businessId: String,              // Business identifier
  metricType: String,              // 'profileView', 'searchImpression', etc.
  timestamp: Date,                 // Server timestamp
  borough: String,                 // Optional: visitor location
  deviceType: 'mobile'|'desktop'   // Optional: device type
}
```

### **Database Indexes**
```javascript
// Performance optimization
db.business_analytics.createIndex({ businessId: 1, metricType: 1, timestamp: 1 });
db.business_analytics.createIndex({ businessId: 1, borough: 1 });
db.business_analytics.createIndex({ businessId: 1, deviceType: 1 });
```

## API Endpoints

### **Record Event with Context**
```http
POST /api/record-event
Content-Type: application/json

{
  "businessId": "business-123",
  "metricType": "profileView",
  "borough": "Lewisham",
  "deviceType": "mobile"
}
```

### **Get Audience Insights**
```http
GET /api/audience-insights?businessId=business-123&period=weekly
```

**Response:**
```json
{
  "topBoroughs": [
    { "borough": "Lewisham", "count": 47 },
    { "borough": "Southwark", "count": 36 }
  ],
  "deviceUsage": {
    "mobile": 128,
    "desktop": 57
  },
  "activePeriods": [
    { "dayOfWeek": 6, "hour": 19, "count": 22 }
  ]
}
```

## Demo Pages

### **1. Audience Insights Demo**
- **URL**: `audience-insights-demo.html`
- **Features**: Interactive demo with sample data
- **Charts**: Pie chart for device usage, bar chart for activity
- **Testing**: Simulate profile views with different contexts

### **2. Analytics System Demo**
- **URL**: `analytics-demo.html`
- **Features**: Complete analytics dashboard
- **Testing**: All tracking functions and real-time updates

## Usage Examples

### **React Component Usage**
```jsx
import AudienceInsights from './components/AudienceInsights';

function BusinessDashboard() {
  return (
    <div className="dashboard">
      <h1>Business Dashboard</h1>
      <AudienceInsights businessId="royal-hair-studio" />
    </div>
  );
}
```

### **Vanilla JavaScript Tracking**
```javascript
// Track profile view with context
function trackProfileViewWithContext(businessId) {
  const deviceType = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop';
  const borough = getUserBorough(); // Your location detection
  
  fetch('/api/record-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId,
      metricType: 'profileView',
      borough,
      deviceType
    })
  });
}
```

## Performance Considerations

### **Database Optimization**
- Indexes on frequently queried fields
- Aggregation pipelines for efficient data processing
- Time-based partitioning for large datasets

### **Frontend Optimization**
- Chart.js for efficient rendering
- Auto-refresh with cleanup on unmount
- Error handling and fallback states

### **Caching Strategy**
- Redis for frequently accessed insights
- Client-side caching for chart data
- Background data refresh

## Security & Privacy

### **Data Protection**
- No personal information stored
- Anonymous location data only
- GDPR-compliant data handling

### **Rate Limiting**
- API rate limits to prevent abuse
- Debounced tracking to prevent duplicates
- Input validation and sanitization

## Monitoring & Analytics

### **System Health**
- Health check endpoint: `/api/health`
- Database connection monitoring
- Error logging and alerting

### **Performance Metrics**
- API response times
- Database query performance
- Frontend rendering metrics

## Troubleshooting

### **Common Issues**

#### **Charts Not Rendering**
```javascript
// Ensure Chart.js is loaded
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
```

#### **Data Not Updating**
```javascript
// Check API endpoint
const response = await fetch('/api/audience-insights?businessId=test');
console.log(await response.json());
```

#### **Location Detection Failing**
```javascript
// Fallback to default location
const borough = getUserBorough() || 'Unknown';
```

## Future Enhancements

### **Planned Features**
- Real-time WebSocket updates
- Advanced location analytics
- User behavior patterns
- A/B testing integration
- Export functionality

### **Scalability**
- Microservices architecture
- Database sharding
- CDN integration
- Load balancing

## Support

For technical support or questions about the Audience Insights system:

1. Check the demo pages for examples
2. Review the API documentation
3. Test with the provided sample data
4. Monitor console logs for errors

## License

This system is part of the BlkPages platform and follows the same licensing terms.
