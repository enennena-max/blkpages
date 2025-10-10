# Business Welcome Email System

## 📧 Automated Welcome Emails with Secure Dashboard Access

A complete email system for BlkPages that automatically sends personalized welcome emails to new businesses with secure JWT dashboard access tokens.

## ✨ Key Features

### 🔐 **JWT Token Security**
- **Secure Tokens**: JWT-based authentication for dashboard access
- **7-Day Expiry**: Automatic token expiration for security
- **Single-Use**: Optional single-use tokens for enhanced security
- **Business-Specific**: Tokens are tied to specific business IDs

### 📧 **Email Templates**
- **HTML Templates**: Beautiful, responsive email designs
- **Plain Text Fallback**: Automatic plain text generation
- **Personalization**: Dynamic content based on business details
- **Brand Consistency**: BlkPages branding and styling

### 🎯 **Dashboard Integration**
- **Direct Access**: One-click dashboard access from email
- **Token Verification**: Secure token validation on frontend
- **Automatic Redirect**: Seamless redirect to business dashboard
- **Error Handling**: Graceful handling of expired/invalid tokens

## 🔧 Technical Implementation

### **Backend API Endpoints**
```javascript
POST /api/business/register              // Register business & send email
GET /api/auth/verify-dashboard-token     // Verify JWT token
POST /api/email/send-welcome             // Send welcome email
```

### **JWT Token Generation**
```javascript
function generateDashboardToken(businessId) {
    return jwt.sign(
        { businessId, type: 'dashboardAccess' },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}
```

### **Email Template System**
```javascript
// EJS template rendering
const html = await ejs.renderFile(templatePath, {
    businessName: business.name,
    businessEmail: business.email,
    dashboardLink,
    appUrl: process.env.APP_UI_BASE_URL
});
```

### **Token Verification**
```javascript
function verifyDashboardToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}
```

## 📊 Database Schema

### **Business Registration**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  address: String,
  category: String,
  package: String,
  paymentDetails: Object,
  createdAt: Date,
  status: String
}
```

### **JWT Token Payload**
```javascript
{
  businessId: String,        // Business ID
  type: 'dashboardAccess',   // Token type
  iat: Number,               // Issued at timestamp
  exp: Number                // Expiration timestamp
}
```

## 🎨 Email Template Features

### **Responsive Design**
- **Mobile-First**: Optimized for all screen sizes
- **Cross-Client**: Works in all major email clients
- **Fallback Support**: Graceful degradation for older clients
- **Accessibility**: WCAG compliant design

### **Content Sections**
- **Welcome Header**: Personalized greeting with business name
- **Feature Highlights**: Key platform features and benefits
- **Dashboard Access**: Prominent call-to-action button
- **Security Notice**: Token expiry and security information
- **Support Information**: Contact details and help resources

### **Visual Elements**
- **Gradient Headers**: Modern gradient backgrounds
- **Icon Integration**: Emoji and icon usage for visual appeal
- **Color Coding**: Consistent color scheme throughout
- **Typography**: Professional font hierarchy

## 🚀 Setup Instructions

### **1. Install Dependencies**
```bash
npm install jsonwebtoken ejs nodemailer
```

### **2. Environment Variables**
```env
# JWT Configuration
JWT_SECRET=your-super-secret-key

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
# Place businessWelcome.ejs in email-templates/
```

### **4. Start Server**
```bash
npm start
```

## 🎯 Usage Examples

### **Business Registration Flow**
```javascript
// 1. Register business
const response = await fetch('/api/business/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        businessName: 'Royal Hair Studio',
        businessEmail: 'info@royalhair.co.uk',
        businessPhone: '020 7123 4567',
        businessAddress: '123 High Street, London',
        businessCategory: 'Hair & Beauty',
        selectedPackage: 'Professional',
        paymentDetails: { /* payment info */ }
    })
});

// 2. Welcome email sent automatically
// 3. Business receives email with dashboard link
```

### **Token Verification**
```javascript
// Frontend token verification
useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
        fetch(`/api/auth/verify-dashboard-token?token=${token}`)
            .then(res => res.json())
            .then(data => {
                if (data.valid) {
                    localStorage.setItem('businessId', data.businessId);
                    window.location.replace(`/dashboard/${data.businessId}`);
                }
            });
    }
}, []);
```

### **Email Template Variables**
```javascript
// EJS template variables
{
    businessName: 'Royal Hair Studio',
    businessEmail: 'info@royalhair.co.uk',
    dashboardLink: 'https://blkpages.co.uk/dashboard/123?token=xyz',
    appUrl: 'https://blkpages.co.uk'
}
```

## 📱 Frontend Integration

### **DashboardAuth Component**
```jsx
import DashboardAuth from './components/DashboardAuth';

// Automatic token verification and redirect
<DashboardAuth />
```

### **Token Handling**
```javascript
// Store token in localStorage
localStorage.setItem('businessToken', token);
localStorage.setItem('businessId', businessId);

// Check for existing token
const token = localStorage.getItem('businessToken');
if (token && !isExpired(token)) {
    // Auto-login user
}
```

## 🔒 Security Features

### **Token Security**
- **JWT Signing**: HMAC SHA-256 algorithm
- **Expiration**: 7-day automatic expiry
- **Business Binding**: Tokens tied to specific business IDs
- **Type Validation**: Token type verification

### **Email Security**
- **SPF Records**: Sender authentication
- **DKIM Signing**: Email integrity verification
- **DMARC Policy**: Email authentication policy
- **Rate Limiting**: Prevent email abuse

### **Access Control**
- **Token Verification**: Server-side token validation
- **Business Isolation**: Data isolation by business ID
- **Session Management**: Secure session handling
- **Error Handling**: Secure error responses

## 📊 Analytics & Tracking

### **Email Metrics**
- **Delivery Rate**: Successful email deliveries
- **Open Rate**: Email open tracking
- **Click Rate**: Dashboard link clicks
- **Token Usage**: Token verification attempts

### **Business Metrics**
- **Registration Rate**: New business signups
- **Dashboard Access**: Successful dashboard logins
- **Token Expiry**: Expired token statistics
- **Support Requests**: Help requests from emails

## 🎨 Customization Options

### **Email Templates**
- **Brand Colors**: Customizable color schemes
- **Logo Integration**: Business logo support
- **Content Customization**: Dynamic content based on package
- **Localization**: Multi-language support

### **Token Configuration**
- **Expiry Time**: Configurable token expiration
- **Token Types**: Different token types for different access levels
- **Refresh Tokens**: Optional refresh token support
- **Revocation**: Token revocation capabilities

## 🚀 Advanced Features

### **Email Automation**
- **Welcome Series**: Multi-email welcome sequence
- **Follow-up Emails**: Automated follow-up campaigns
- **Reminder Emails**: Token expiry reminders
- **Re-engagement**: Inactive user re-engagement

### **Integration Options**
- **CRM Integration**: Customer relationship management
- **Analytics Integration**: Email analytics tracking
- **A/B Testing**: Email template testing
- **Personalization**: Advanced personalization features

## 📞 Support & Troubleshooting

### **Common Issues**
1. **Email Not Sending**: Check SMTP configuration
2. **Token Expired**: Generate new token
3. **Template Errors**: Verify EJS template syntax
4. **JWT Issues**: Check JWT_SECRET configuration

### **Debugging**
```javascript
// Enable debug logging
console.log('JWT Secret:', process.env.JWT_SECRET);
console.log('SMTP Config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT
});
```

### **Testing**
```bash
# Test email sending
curl -X POST http://localhost:5000/api/test-email

# Test token generation
curl -X GET "http://localhost:5000/api/auth/verify-dashboard-token?token=test"
```

## 🎯 Future Enhancements

### **Planned Features**
- **Email Templates**: Multiple template options
- **Advanced Analytics**: Detailed email metrics
- **A/B Testing**: Template performance testing
- **Multi-language**: Internationalization support

### **Integration Roadmap**
- **CRM Systems**: Salesforce, HubSpot integration
- **Marketing Automation**: Mailchimp, SendGrid integration
- **Analytics Platforms**: Google Analytics, Mixpanel
- **Support Systems**: Zendesk, Intercom integration

---

**Business Welcome Email System** - Secure, automated welcome emails with dashboard access! 📧🔐🚀
