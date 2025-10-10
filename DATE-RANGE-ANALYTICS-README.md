# BlkPages Analytics - Date Range Filtering

## Overview

The BlkPages analytics system has been enhanced with date range filtering capabilities for the Audience Insights section. Users can now view analytics data for specific time periods including "Last 7 Days", "Last 30 Days", or custom date ranges.

## Features

### 🗓️ **Date Range Options**
- **Last 7 Days**: Default view showing recent week data
- **Last 30 Days**: Extended view showing monthly trends
- **Custom Range**: User-defined start and end dates

### 📊 **Real-time Filtering**
- **Live Updates**: All charts and data update automatically when date range changes
- **Data Persistence**: Selected date ranges are maintained across page refreshes
- **Mobile Responsive**: Date pickers work seamlessly on all devices

## Technical Implementation

### Backend API Updates

#### **Enhanced Endpoint**
```javascript
GET /api/audience-insights?businessId=XYZ&from=YYYY-MM-DD&to=YYYY-MM-DD
```

**Query Parameters:**
- `businessId` (required): Business identifier
- `from` (optional): Start date in YYYY-MM-DD format
- `to` (optional): End date in YYYY-MM-DD format

**Example Requests:**
```javascript
// Last 7 days (default)
GET /api/audience-insights?businessId=business-123

// Last 30 days
GET /api/audience-insights?businessId=business-123&from=2024-01-01&to=2024-01-31

// Custom range
GET /api/audience-insights?businessId=business-123&from=2024-01-15&to=2024-01-22
```

#### **Response Format**
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

### Frontend Component Updates

#### **React Component**
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

#### **Date Range State Management**
```jsx
const [dateRange, setDateRange] = useState('7d');
const [customFrom, setCustomFrom] = useState('');
const [customTo, setCustomTo] = useState('');
```

#### **API URL Building**
```jsx
const buildApiUrl = () => {
  const baseUrl = `/api/audience-insights?businessId=${businessId}`;
  
  if (dateRange === 'custom' && customFrom && customTo) {
    return `${baseUrl}&from=${customFrom}&to=${customTo}`;
  }
  
  const days = dateRange === '30d' ? 30 : 7;
  const from = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const to = new Date().toISOString().split('T')[0];
  
  return `${baseUrl}&from=${from}&to=${to}`;
};
```

## Usage Examples

### **1. Basic Implementation**

#### **HTML Structure**
```html
<div class="range-selector">
  <label for="dateRange">Time Period:</label>
  <select id="dateRange">
    <option value="7d">Last 7 Days</option>
    <option value="30d">Last 30 Days</option>
    <option value="custom">Custom Range</option>
  </select>
  
  <div class="custom-range" id="customRange" style="display: none;">
    <input type="date" id="customFrom" placeholder="From date">
    <span>to</span>
    <input type="date" id="customTo" placeholder="To date">
  </div>
</div>
```

#### **JavaScript Functionality**
```javascript
function handleDateRangeChange() {
  const dateRangeSelect = document.getElementById('dateRange');
  const customRangeDiv = document.getElementById('customRange');
  
  if (dateRangeSelect.value === 'custom') {
    customRangeDiv.style.display = 'flex';
  } else {
    customRangeDiv.style.display = 'none';
  }
  
  // Update analytics data
  fetchAnalyticsData();
}
```

### **2. React Integration**

#### **Component Usage**
```jsx
function BusinessDashboard() {
  const [dateRange, setDateRange] = useState('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  
  const fetchAnalytics = async () => {
    const url = buildApiUrl(dateRange, customFrom, customTo);
    const response = await fetch(url);
    const data = await response.json();
    setAnalyticsData(data);
  };
  
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, customFrom, customTo]);
  
  return (
    <div>
      <AudienceInsights 
        businessId="business-123"
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />
    </div>
  );
}
```

### **3. API Integration**

#### **Fetching Data with Date Range**
```javascript
async function fetchAudienceInsights(businessId, dateRange, customFrom, customTo) {
  let url = `/api/audience-insights?businessId=${businessId}`;
  
  if (dateRange === 'custom' && customFrom && customTo) {
    url += `&from=${customFrom}&to=${customTo}`;
  } else {
    const days = dateRange === '30d' ? 30 : 7;
    const from = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];
    url += `&from=${from}&to=${to}`;
  }
  
  const response = await fetch(url);
  return await response.json();
}
```

## Styling

### **CSS Classes**
```css
.range-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e1e5e9;
}

.range-select {
  background: #ffffff;
  color: #1a1a1a;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.9rem;
  cursor: pointer;
}

.date-input {
  background: #ffffff;
  color: #1a1a1a;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.9rem;
  cursor: pointer;
}
```

### **Mobile Responsiveness**
```css
@media (max-width: 768px) {
  .range-selector {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .range-select,
  .date-input {
    width: 100%;
  }
  
  .custom-range {
    width: 100%;
    flex-direction: column;
  }
}
```

## Demo Implementation

### **Interactive Demo**
The `audience-insights-demo.html` page includes a fully functional date range selector:

1. **Select Time Period**: Choose from "Last 7 Days", "Last 30 Days", or "Custom Range"
2. **Custom Date Input**: When "Custom Range" is selected, date pickers appear
3. **Live Updates**: Charts and data update automatically when date range changes
4. **Mobile Friendly**: Responsive design works on all devices

### **Testing the Demo**
1. Open `audience-insights-demo.html`
2. Click "Generate Sample Data" to create test data
3. Select different date ranges from the dropdown
4. Watch charts update in real-time
5. Try the custom date range feature

## API Endpoints

### **Backend Endpoints**

#### **Get Audience Insights**
```http
GET /api/audience-insights?businessId=business-123&from=2024-01-01&to=2024-01-31
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

#### **Error Handling**
```json
{
  "success": false,
  "error": "Invalid date format. Use YYYY-MM-DD"
}
```

## Database Queries

### **MongoDB Aggregation**
```javascript
// Base match criteria with date range
const baseMatch = {
  businessId, 
  metricType: 'profileView', 
  timestamp: { $gte: startDate, $lte: endDate }
};

// Top Boroughs
const topBoroughs = await db.collection('business_analytics').aggregate([
  { $match: { ...baseMatch, borough: { $exists: true, $ne: null } } },
  { $group: { _id: "$borough", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 5 }
]).toArray();
```

## Performance Considerations

### **Database Optimization**
- **Indexes**: Ensure proper indexing on `timestamp` field
- **Date Range Queries**: Use efficient date range queries
- **Aggregation Pipelines**: Optimize MongoDB aggregation performance

### **Frontend Optimization**
- **Debounced Updates**: Prevent excessive API calls
- **Caching**: Cache results for common date ranges
- **Loading States**: Show loading indicators during data fetch

## Security & Validation

### **Input Validation**
```javascript
// Validate date format
if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
  return res.status(400).json({ 
    error: 'Invalid date format. Use YYYY-MM-DD' 
  });
}

// Validate date range
if (startDate > endDate) {
  return res.status(400).json({ 
    error: 'Start date cannot be after end date' 
  });
}
```

### **Rate Limiting**
- API rate limits to prevent abuse
- Input sanitization for date parameters
- Business ID validation

## Troubleshooting

### **Common Issues**

#### **Date Range Not Working**
```javascript
// Check date format
console.log('From:', customFrom, 'To:', customTo);

// Verify API call
const url = buildApiUrl();
console.log('API URL:', url);
```

#### **Charts Not Updating**
```javascript
// Check data structure
console.log('Analytics data:', insightsData);

// Verify chart re-render
if (deviceChart) {
  deviceChart.destroy();
}
deviceChart = new Chart(ctx, chartConfig);
```

#### **Mobile Date Picker Issues**
```css
/* Ensure proper styling for mobile date inputs */
.date-input {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
```

## Future Enhancements

### **Planned Features**
- **Preset Ranges**: "This Week", "Last Month", "Quarterly"
- **Date Range Presets**: Common business date ranges
- **Export Functionality**: Export filtered data
- **Advanced Filtering**: Multiple date range comparisons

### **Performance Improvements**
- **Data Caching**: Cache results for common date ranges
- **Lazy Loading**: Load data on demand
- **Real-time Updates**: WebSocket integration for live data

## Support

For technical support or questions about the date range functionality:

1. Check the demo page for examples
2. Review the API documentation
3. Test with different date ranges
4. Monitor console logs for errors

## License

This functionality is part of the BlkPages platform and follows the same licensing terms.
