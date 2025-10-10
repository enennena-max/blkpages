# Customer Welcome Email System

## 📧 Personalized Welcome Emails with Local Business Recommendations

A complete email system for BlkPages that automatically sends personalized welcome emails to new customers with local business recommendations based on their location.

## ✨ Key Features

### 📍 **Location-Based Recommendations**
- **Borough Matching**: Recommendations based on customer's borough/location
- **Local Businesses**: Showcase nearby Black-owned businesses
- **Dynamic Content**: Personalized business listings per customer
- **Geographic Targeting**: Precise location-based email content

### 🏪 **Business Discovery**
- **Curated Listings**: Hand-picked local business recommendations
- **Category Diversity**: Various business types and services
- **Direct Links**: One-click access to business profiles
- **Fresh Content**: Regularly updated business listings

### 📧 **Email Personalization**
- **Customer Name**: Personalized greeting with customer's name
- **Location Context**: Borough-specific content and recommendations
- **Business Links**: Direct links to recommended businesses
- **Browse Integration**: Seamless integration with main platform

## 🔧 Technical Implementation

### **Backend API Endpoints**
```javascript
POST /api/customer/register              // Register customer & send email
GET /api/businesses/local?borough=XYZ   // Get local businesses
POST /api/email/send-customer-welcome   // Send welcome email
```

### **Database Queries**
```javascript
// Get local businesses for customer's area
const localBusinesses = await db
  .collection('businesses')
  .find({ 
    borough: customer.borough, 
    isPublished: true,
    status: 'active'
  })
  .limit(5)
  .project({ name: 1, category: 1, town: 1, slug: 1, _id: 1 })
  .toArray();
```

### **Email Template Variables**
```javascript
// EJS template variables
{
  customerName: 'Sarah Johnson',
  customerEmail: 'sarah.johnson@email.com',
  localBusinesses: [
    { name: 'Royal Hair Studio', category: 'Hair & Beauty', town: 'Hackney', profileUrl: '...' }
  ],
  browseLink: 'https://blkpages.co.uk/search?borough=Hackney',
  appUrl: 'https://blkpages.co.uk'
}
```

## 📊 Database Schema

### **Customer Registration**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  borough: String,           // Customer's location
  preferences: Object,      // Customer preferences
  createdAt: Date,
  status: String
}
```

### **Business Data**
```javascript
{
  _id: ObjectId,
  name: String,
  category: String,
  town: String,
  borough: String,          // Business location
  slug: String,             // URL-friendly identifier
  isPublished: Boolean,
  status: String
}
```

## 🎨 Email Template Features

### **Responsive Design**
- **Mobile-First**: Optimized for all screen sizes
- **Cross-Client**: Works in all major email clients
- **Fallback Support**: Graceful degradation for older clients
- **Accessibility**: WCAG compliant design

### **Content Sections**
- **Welcome Header**: Personalized greeting with customer name
- **Local Businesses**: Curated business recommendations
- **Browse CTA**: Prominent call-to-action button
- **Support Information**: Contact details and help resources

### **Visual Elements**
- **Gradient Headers**: Modern gradient backgrounds
- **Business Cards**: Clean, organized business listings
- **Icon Integration**: Emoji and icon usage for visual appeal
- **Color Coding**: Consistent color scheme throughout

## 🚀 Setup Instructions

### **1. Install Dependencies**
```bash
npm install ejs nodemailer
```

### **2. Environment Variables**
```env
# SMTP Configuration
SMTP_HOST=smtp.yourmailhost.com
SMTP_PORT=465
SMTP_USER=youruser
SMTP_PASS=yourpass
SMTP_FROM="BlkPages <no-reply@blkpages.co.uk>"

# Application URLs
APP_UI_BASE_URL=https://blkpages.co.uk
```

### **3. Email Template Setup**
```bash
mkdir email-templates
# Place customerWelcome.ejs in email-templates/
```

### **4. Start Server**
```bash
npm start
```

## 🎯 Usage Examples

### **Customer Registration Flow**
```javascript
// 1. Register customer
const response = await fetch('/api/customer/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah.johnson@email.com',
        customerPhone: '020 7123 4567',
        borough: 'Hackney',
        preferences: { categories: ['Hair & Beauty', 'Restaurant'] }
    })
});

// 2. Welcome email sent automatically with local business recommendations
// 3. Customer receives personalized email with nearby businesses
```

### **Local Business Query**
```javascript
// Get businesses for specific borough
const localBusinesses = await db
  .collection('businesses')
  .find({ 
    borough: 'Hackney', 
    isPublished: true,
    status: 'active'
  })
  .limit(5)
  .project({ name: 1, category: 1, town: 1, slug: 1 })
  .toArray();
```

### **Email Template Rendering**
```javascript
// Render email template with customer data
const html = await ejs.renderFile(templatePath, {
  customerName: customer.name,
  customerEmail: customer.email,
  localBusinesses,
  browseLink,
  appUrl
});
```

## 📱 Frontend Integration

### **Customer Registration Form**
```html
<form id="customerRegistration">
  <input type="text" name="customerName" placeholder="Your Name" required>
  <input type="email" name="customerEmail" placeholder="Email Address" required>
  <select name="borough" required>
    <option value="Hackney">Hackney</option>
    <option value="Lambeth">Lambeth</option>
    <option value="Southwark">Southwark</option>
  </select>
  <button type="submit">Register</button>
</form>
```

### **Registration Handler**
```javascript
document.getElementById('customerRegistration').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const response = await fetch('/api/customer/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(formData))
  });
  
  const result = await response.json();
  if (result.success) {
    alert('Registration successful! Check your email for local business recommendations.');
  }
});
```

## 🔒 Security Features

### **Data Privacy**
- **Location Data**: Secure handling of customer location information
- **Email Privacy**: Secure email delivery and storage
- **Business Data**: Protected business information
- **GDPR Compliance**: European data protection compliance

### **Email Security**
- **SMTP Authentication**: Secure email delivery
- **Content Validation**: Safe email content generation
- **Rate Limiting**: Prevent email abuse
- **Spam Prevention**: Anti-spam measures

## 📊 Analytics & Tracking

### **Email Metrics**
- **Delivery Rate**: Successful email deliveries
- **Open Rate**: Email open tracking
- **Click Rate**: Business link clicks
- **Location Analytics**: Borough-based engagement

### **Business Metrics**
- **Recommendation Views**: Business profile views from emails
- **Click-Through Rate**: Email to website conversion
- **Geographic Distribution**: Location-based performance
- **Category Performance**: Business category engagement

## 🎨 Customization Options

### **Email Templates**
- **Brand Colors**: Customizable color schemes
- **Logo Integration**: Business logo support
- **Content Customization**: Dynamic content based on location
- **Localization**: Multi-language support

### **Business Recommendations**
- **Algorithm Tuning**: Custom recommendation algorithms
- **Category Filtering**: Industry-specific recommendations
- **Distance Calculation**: Geographic proximity matching
- **Freshness Scoring**: Recent business prioritization

## 🚀 Advanced Features

### **Smart Recommendations**
- **Machine Learning**: AI-powered recommendations
- **Behavioral Analysis**: Customer preference learning
- **Seasonal Content**: Time-based recommendations
- **A/B Testing**: Recommendation algorithm testing

### **Integration Options**
- **CRM Integration**: Customer relationship management
- **Analytics Integration**: Email analytics tracking
- **Social Media**: Social sharing integration
- **Mobile Apps**: Mobile application integration

## 📞 Support & Troubleshooting

### **Common Issues**
1. **No Local Businesses**: Check business data and borough matching
2. **Email Not Sending**: Verify SMTP configuration
3. **Template Errors**: Check EJS template syntax
4. **Location Issues**: Verify borough data accuracy

### **Debugging**
```javascript
// Enable debug logging
console.log('Customer borough:', customer.borough);
console.log('Local businesses found:', localBusinesses.length);
console.log('Email template path:', templatePath);
```

### **Testing**
```bash
# Test customer registration
curl -X POST http://localhost:5000/api/customer/register \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Test User","customerEmail":"test@example.com","borough":"Hackney"}'

# Test local businesses query
curl -X GET "http://localhost:5000/api/businesses/local?borough=Hackney"
```

## 🎯 Future Enhancements

### **Planned Features**
- **AI Recommendations**: Machine learning-based suggestions
- **Real-time Updates**: Live business data integration
- **Social Features**: Community-driven recommendations
- **Mobile Optimization**: Enhanced mobile experience

### **Integration Roadmap**
- **Maps Integration**: Google Maps location services
- **Social Media**: Instagram, Facebook integration
- **Analytics Platforms**: Google Analytics, Mixpanel
- **CRM Systems**: Salesforce, HubSpot integration

## 📈 Performance Optimization

### **Database Optimization**
- **Indexing**: Optimized database indexes for location queries
- **Caching**: Redis caching for frequently accessed data
- **Query Optimization**: Efficient database queries
- **Data Pagination**: Large dataset handling

### **Email Performance**
- **Template Caching**: Compiled template caching
- **Async Processing**: Background email processing
- **Batch Operations**: Bulk email operations
- **Delivery Optimization**: SMTP connection pooling

---

**Customer Welcome Email System** - Personalized welcome emails with local business discovery! 📧🏪🚀
