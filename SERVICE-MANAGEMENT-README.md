# Business Services Dashboard

## 🛠️ Live Service Management System

A complete service management system for BlkPages businesses with real-time updates, bulk operations, and booking integration.

## ✨ Key Features

### 📊 **Live Metrics Dashboard**
- **Total Services**: Count of all services for the business
- **Active Services**: Services available for booking
- **Featured Services**: Highlighted services on business profile
- **Average Price**: Calculated from active services
- **Visible Services**: Active and published services visible to customers

### ⚡ **Real-time Updates**
- **Auto-refresh**: Statistics update every 60 seconds
- **Live Updates**: Immediate updates after any change
- **Optimistic UI**: Instant feedback for better user experience
- **Error Handling**: Graceful error recovery and user notifications

### 🔧 **Service Management**
- **Inline Editing**: Edit service details directly in the table
- **Bulk Operations**: Select multiple services for batch updates
- **Service Creation**: Add new services with comprehensive forms
- **Service Deletion**: Remove services with confirmation

### 📅 **Booking Integration**
- **Duration Tracking**: Service duration used for booking slot blocking
- **Availability Control**: Active/inactive status affects booking availability
- **Featured Priority**: Featured services appear first on business profile
- **Public Visibility**: Published status controls customer visibility

## 🔧 Technical Implementation

### **Backend API Endpoints**
```javascript
GET /api/services/summary?businessId=XYZ    // Get service statistics
GET /api/services/list?businessId=XYZ       // Get all services
POST /api/services/create                   // Create new service
PATCH /api/services/update                  // Update service
PATCH /api/services/bulk-update             // Bulk update services
PATCH /api/services/reorder                  // Reorder services
DELETE /api/services/delete?serviceId=ABC   // Delete service
```

### **Database Schema**
```javascript
{
  _id: ObjectId,
  businessId: String,
  name: String,
  description: String,
  category: String,
  durationMinutes: Number,     // Used by booking engine
  priceGBP: Number,
  active: Boolean,             // Available for booking
  featured: Boolean,           // Highlighted on profile
  published: Boolean,          // Visible on public page
  order: Number,               // Display ordering
  createdAt: Date,
  updatedAt: Date
}
```

### **Database Indexes**
```javascript
// Performance indexes
db.business_services.createIndex({ businessId: 1, active: 1, featured: 1, published: 1 });
db.business_services.createIndex({ businessId: 1, order: 1 });
```

## 🎨 Frontend Components

### **BusinessServicesDashboard.jsx**
- **Main Component**: Complete service management interface
- **Statistics Display**: Live metrics with auto-refresh
- **Service Table**: Editable table with inline controls
- **Modal Forms**: Add service and bulk edit modals
- **Real-time Updates**: Automatic data refresh and UI updates

### **Key Features**
- **Service Statistics**: Live metrics dashboard
- **Quick Actions**: Add service, bulk edit, clear selection
- **Service Table**: Inline editing with validation
- **Modal Forms**: Comprehensive service creation and editing
- **Bulk Operations**: Multi-service selection and updates

## 📊 Service Statistics

### **Metrics Calculation**
```javascript
// Total services count
const total = await services.countDocuments({ businessId });

// Active services count
const active = await services.countDocuments({ businessId, active: true });

// Featured services count
const featured = await services.countDocuments({ businessId, featured: true });

// Visible services count (active AND published)
const visible = await services.countDocuments({ 
  businessId, 
  active: true, 
  published: true 
});

// Average price of active services
const avgResult = await services.aggregate([
  { $match: { businessId, active: true, priceGBP: { $ne: null } } },
  { $group: { _id: null, avg: { $avg: "$priceGBP" } } }
]);
```

### **Real-time Updates**
- **Auto-refresh**: Every 60 seconds
- **Mutation Updates**: Immediate refresh after changes
- **Optimistic UI**: Instant feedback for user actions
- **Error Recovery**: Graceful handling of failed operations

## 🔧 Service Management Features

### **Service Creation**
```javascript
// Create new service
const service = {
  businessId,
  name: 'Hair Cut & Style',
  description: 'Professional haircut and styling',
  category: 'Hair & Beauty',
  durationMinutes: 60,
  priceGBP: 35.00,
  active: true,
  featured: false,
  published: true,
  order: nextOrder,
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### **Inline Editing**
- **Name**: Editable service name
- **Category**: Service category
- **Duration**: Service duration in minutes
- **Price**: Service price in GBP
- **Status Toggles**: Active, Featured, Published

### **Bulk Operations**
```javascript
// Bulk update multiple services
const updateFields = {
  priceGBP: 50.00,           // Update price
  durationMinutes: 90,       // Update duration
  active: true,              // Set active status
  featured: false,           // Set featured status
  published: true,           // Set published status
  category: 'Hair & Beauty'  // Update category
};
```

## 📅 Booking Integration

### **Service Duration**
```javascript
// Service duration used for booking slot blocking
const bookingDuration = service.durationMinutes;
const endTime = startTime + (bookingDuration * 60000);

// Block calendar slots based on service duration
const blockedSlots = calculateBlockedSlots(startTime, bookingDuration);
```

### **Service Availability**
```javascript
// Only active and published services are bookable
const bookableServices = services.filter(service => 
  service.active && service.published
);

// Featured services appear first
const featuredServices = services
  .filter(service => service.featured && service.active && service.published)
  .sort((a, b) => a.order - b.order);
```

### **Public Profile Integration**
```javascript
// Services visible on business profile
const publicServices = services
  .filter(service => service.active && service.published)
  .sort((a, b) => {
    // Featured services first, then by order
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.order - b.order;
  });
```

## 🎨 User Interface

### **Dashboard Layout**
- **Statistics Grid**: 5 key metrics in responsive grid
- **Quick Actions**: Primary action buttons
- **Service Table**: Comprehensive service management
- **Modal Forms**: Service creation and bulk editing

### **Responsive Design**
- **Mobile-First**: Optimized for all screen sizes
- **Table Responsive**: Horizontal scroll on mobile
- **Touch-Friendly**: Mobile-optimized controls
- **Accessibility**: WCAG compliant design

### **Visual Design**
- **Dark Theme**: Consistent with BlkPages branding
- **Color Coding**: Status indicators and visual feedback
- **Interactive Elements**: Hover effects and transitions
- **Loading States**: Spinner and skeleton loading

## 🔒 Data Validation

### **Service Creation Validation**
```javascript
// Required fields validation
if (!businessId || !name || !durationMinutes || priceGBP == null) {
  return res.status(400).json({ 
    success: false, 
    error: 'Missing required fields' 
  });
}

// Numeric field validation
durationMinutes: Number(durationMinutes),
priceGBP: Number(priceGBP),

// Boolean field validation
active: !!active,
featured: !!featured,
published: !!published
```

### **Update Validation**
```javascript
// Convert numeric fields
if (patch.durationMinutes != null) patch.durationMinutes = Number(patch.durationMinutes);
if (patch.priceGBP != null) patch.priceGBP = Number(patch.priceGBP);

// Update timestamp
patch.updatedAt = new Date();
```

## 🚀 Performance Optimization

### **Database Queries**
- **Indexed Queries**: Optimized database indexes
- **Aggregation Pipelines**: Efficient statistics calculation
- **Batch Operations**: Bulk updates for better performance
- **Connection Pooling**: Optimized database connections

### **Frontend Optimization**
- **Component Memoization**: Prevent unnecessary re-renders
- **Debounced Updates**: Reduce API calls during editing
- **Lazy Loading**: Load components on demand
- **Caching**: Client-side data caching

## 📱 Mobile Responsiveness

### **Responsive Grid**
```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
  }
}
```

### **Table Responsiveness**
```css
.services-table-container {
  overflow-x: auto;
}

.services-table {
  min-width: 800px;
}

@media (max-width: 480px) {
  .services-table th,
  .services-table td {
    padding: 8px 6px;
    font-size: 12px;
  }
}
```

## 🔧 Setup Instructions

### **1. Install Dependencies**
```bash
npm install express mongodb cors
```

### **2. Environment Variables**
```env
MONGO_URI=mongodb://localhost:27017/blkpages
PORT=5000
```

### **3. Database Setup**
```javascript
// Create indexes for performance
await db.collection('business_services').createIndex({ 
  businessId: 1, active: 1, featured: 1, published: 1 
});
await db.collection('business_services').createIndex({ 
  businessId: 1, order: 1 
});
```

### **4. Start Server**
```bash
npm start
```

## 🎯 Usage Examples

### **Service Creation**
```javascript
// Create new service
const response = await fetch('/api/services/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    businessId: 'royalHairStudio',
    name: 'Hair Cut & Style',
    description: 'Professional haircut and styling',
    category: 'Hair & Beauty',
    durationMinutes: 60,
    priceGBP: 35.00,
    active: true,
    featured: false,
    published: true
  })
});
```

### **Bulk Service Update**
```javascript
// Bulk update multiple services
const response = await fetch('/api/services/bulk-update', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    businessId: 'royalHairStudio',
    serviceIds: ['service1', 'service2', 'service3'],
    patch: {
      priceGBP: 50.00,
      active: true,
      featured: false
    }
  })
});
```

### **Service Statistics**
```javascript
// Get service statistics
const response = await fetch('/api/services/summary?businessId=royalHairStudio');
const stats = await response.json();

console.log(stats);
// {
//   total: 8,
//   active: 6,
//   featured: 3,
//   averagePrice: 45.50,
//   visible: 5
// }
```

## 🔍 Testing

### **Demo Page Features**
- **Interactive Demo**: Full service management interface
- **Sample Data**: Pre-populated with realistic services
- **Simulation Tools**: Test all features without backend
- **Performance Testing**: Load testing and optimization

### **Test Scenarios**
- **Service Creation**: Add new services with validation
- **Bulk Operations**: Select and update multiple services
- **Booking Integration**: Test service duration and availability
- **Real-time Updates**: Verify auto-refresh functionality

## 📊 Analytics Integration

### **Service Metrics**
- **Service Performance**: Track service popularity
- **Revenue Analytics**: Service-based revenue tracking
- **Booking Conversion**: Service to booking conversion rates
- **Customer Preferences**: Most popular service categories

### **Business Intelligence**
- **Service Optimization**: Identify underperforming services
- **Pricing Analysis**: Optimize service pricing
- **Category Performance**: Track service category success
- **Featured Service Impact**: Measure featured service effectiveness

## 🚀 Future Enhancements

### **Planned Features**
- **Service Categories**: Advanced categorization system
- **Service Packages**: Bundle multiple services
- **Dynamic Pricing**: Time-based and demand-based pricing
- **Service Analytics**: Detailed service performance metrics

### **Integration Roadmap**
- **Calendar Integration**: Service scheduling optimization
- **Inventory Management**: Service capacity tracking
- **Customer Reviews**: Service-specific review system
- **Marketing Tools**: Service promotion and advertising

---

**Business Services Dashboard** - Complete service management with live updates and booking integration! 🛠️📊🚀
