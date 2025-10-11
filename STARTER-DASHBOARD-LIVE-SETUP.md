# Starter Package Dashboard - Live Setup Guide

## 🎯 Overview

This guide will help you set up and test the **live Starter Package Business Dashboard** with full backend API integration. The dashboard now fetches real data from the backend and updates in real-time.

## 🚀 Quick Setup

### 1. Start the Backend Server

```bash
cd /Users/shen/Desktop/blkpages
node server.js
```

**Expected Output:**
```
🚀 Server running on port 5000
📊 MongoDB connected successfully
🔌 WebSocket server ready
```

### 2. Test API Endpoints

Open a new terminal and run the test script:

```bash
node test-starter-api.js
```

**Expected Output:**
```
🧪 Testing Starter Package API Endpoints...

Testing: /api/businesses/royal-hair-studio/review-stats
✅ SUCCESS: 200 OK
   Data: {
     "business_id": "royal-hair-studio",
     "average_rating": 4.4,
     "total_reviews": 27,
     ...
   }

📊 Test Results:
✅ Successful: 7
❌ Failed: 0
📈 Success Rate: 100.0%

🎉 All endpoints are working correctly!
```

### 3. Access the Live Dashboard

Open your browser and navigate to:

- **Main Dashboard**: `http://localhost:5000/business-dashboard-starter.html`
- **Demo Page**: `http://localhost:5000/business-dashboard-starter-demo.html`
- **Preview Test**: `http://localhost:5000/preview-test.html`

## 🧪 Testing Features

### Browser Console Testing

1. **Open Browser Console** (F12)
2. **Check for Success Messages:**
   ```
   Initializing Starter Dashboard...
   Dashboard data loaded successfully: {reviewStats: {...}, bookingStats: {...}, ...}
   WebSocket connected for Starter Dashboard
   ```

3. **Test API Calls:**
   - Look for successful fetch requests (status 200)
   - Check for any CORS errors
   - Verify data is being received

### Demo Page Testing

1. **Open Demo Page**: `http://localhost:5000/business-dashboard-starter-demo.html`
2. **Use Demo Controls:**
   - Click "Test All API Endpoints" - should show "All 7 endpoints working!"
   - Click "Simulate New Review" - should show notification
   - Click "Refresh Dashboard" - should reload data
   - Test form submissions in Profile and Settings sections

### Live Data Testing

1. **Overview Section:**
   - Should show live stats: Total Reviews (27), Average Rating (4.4), Profile Views (428), Bookings This Month (8)
   - Numbers should update automatically every 30 seconds

2. **Business Profile Section:**
   - Form should be populated with live data
   - Edit any field and click "Save Changes"
   - Should show success notification
   - Data should persist after page refresh

3. **Settings Section:**
   - Should load current settings
   - Toggle checkboxes and update text
   - Click "Save Settings" - should show success notification

4. **Analytics Section:**
   - Should show basic analytics: Total Visits (428), Bookings This Month (8), Average Rating (4.4), Conversion Rate (12.6%)

5. **Loyalty Rewards Section:**
   - Should show locked overlay with upgrade message
   - Should not be interactive (Professional feature)

6. **Manage Plan Section:**
   - Should show current plan as "Starter"
   - Should show upgrade option to Professional

## 🔧 Troubleshooting

### Common Issues

#### 1. Dashboard Not Loading
**Symptoms:** Blank page, loading spinner never stops
**Solutions:**
- Check if server is running: `node server.js`
- Check browser console for errors
- Verify API_BASE_URL is correct: `http://localhost:5000`

#### 2. API Errors
**Symptoms:** Network errors in console, "Failed to load dashboard data"
**Solutions:**
- Run `node test-starter-api.js` to test endpoints
- Check server logs for errors
- Verify CORS is enabled (should be automatic)

#### 3. Forms Not Saving
**Symptoms:** Save button doesn't work, no success notification
**Solutions:**
- Check browser console for PATCH request errors
- Verify all required fields are filled
- Check network tab for failed requests

#### 4. Real-time Updates Not Working
**Symptoms:** Data doesn't update automatically
**Solutions:**
- Check WebSocket connection in console
- Verify polling is working (every 30 seconds)
- Check server WebSocket implementation

### Debug Commands

```bash
# Test all API endpoints
node test-starter-api.js

# Check server status
curl http://localhost:5000/api/businesses/royal-hair-studio/review-stats

# Check WebSocket connection
# Open browser console and look for "WebSocket connected" message
```

## 📊 Expected Data

### Review Stats
```json
{
  "business_id": "royal-hair-studio",
  "average_rating": 4.4,
  "total_reviews": 27,
  "recent_reviews": [...]
}
```

### Booking Stats
```json
{
  "business_id": "royal-hair-studio",
  "total_bookings": 35,
  "bookings_this_month": 8,
  "recent_bookings": [...]
}
```

### Profile Views Stats
```json
{
  "business_id": "royal-hair-studio",
  "total_views": 428,
  "views_this_month": 76,
  "views_last_month": 65
}
```

### Business Profile
```json
{
  "business_id": "royal-hair-studio",
  "business_name": "Royal Hair Studio",
  "category": "Barbering",
  "description": "Professional barber studio...",
  "contact_email": "info@royalhair.co.uk",
  "phone_number": "020 1234 5678",
  "address": "123 Lewisham High Street, London SE13",
  "opening_hours": "Mon–Sat: 9:00 – 18:00",
  "social_links": {
    "instagram": "@royalhairstudio",
    "facebook": "",
    "website": ""
  }
}
```

### Basic Settings
```json
{
  "business_id": "royal-hair-studio",
  "notifications_enabled": true,
  "allow_public_reviews": true,
  "booking_cancellation_policy": "24-hour notice required"
}
```

### Basic Analytics
```json
{
  "business_id": "royal-hair-studio",
  "total_visits": 428,
  "bookings_this_month": 8,
  "average_rating": 4.4,
  "conversion_rate": 12.6
}
```

### Plan Info
```json
{
  "business_id": "royal-hair-studio",
  "plan": "Starter",
  "upgrade_available": true,
  "next_tier": "Professional",
  "message": "Upgrade to unlock advanced analytics, loyalty rewards, and team management."
}
```

## 🎯 Success Criteria

The Starter Package Dashboard is working correctly when:

✅ **All 7 API endpoints return 200 status**  
✅ **Dashboard loads with live data**  
✅ **Forms save data successfully**  
✅ **Real-time updates work (WebSocket + polling)**  
✅ **Notifications appear for all actions**  
✅ **Locked features show upgrade prompts**  
✅ **Mobile responsive design works**  
✅ **No console errors**  

## 🚀 Next Steps

Once the dashboard is working:

1. **Test all sections** - Overview, Profile, Settings, Analytics, Plan
2. **Test form submissions** - Edit and save data
3. **Test real-time updates** - Use demo controls to simulate events
4. **Test mobile responsiveness** - Check on different screen sizes
5. **Test upgrade flow** - Click upgrade buttons (should show Professional features)

## 📝 Notes

- **API Base URL**: `http://localhost:5000` (matches backend server)
- **Business ID**: `royal-hair-studio` (used in all API calls)
- **Polling Interval**: 30 seconds for live updates
- **WebSocket**: Real-time updates with 3-second reconnection
- **CORS**: Enabled for all origins (`*`)

The dashboard now behaves exactly like the Professional Package dashboard but with Starter Package feature restrictions! 🎉
