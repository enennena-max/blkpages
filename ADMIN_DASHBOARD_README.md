# BlkPages Admin Dashboard

## Overview

A secure admin dashboard for BlkPages that allows staff to approve business accounts and verify reviews. The dashboard integrates seamlessly with the existing cron logic for 24-hour points release and maintains all existing customer/business functionality.

## ✅ Features

### **🛡️ Secure Admin Access**
- Role-based access control (admin/staff roles)
- JWT token authentication
- Protected admin routes with middleware
- Clean, professional admin interface

### **📊 Overview Dashboard**
- Live counts of pending reviews, businesses, and disputes
- Real-time statistics for quick admin insights
- Clean card-based layout with BlkPages branding

### **🧾 Review Verification**
- List all unverified reviews with business and user details
- One-click verification with confirmation dialog
- Automatic 24-hour points release via existing cron system
- Prevents fake reviews through staff verification

### **🏢 Business Approval**
- List all pending business signups
- One-click business approval
- Makes business listings live immediately upon approval
- Tracks approval timestamps for audit purposes

## 🗄️ Database Schema

### **Migration: 01_admin_basics.sql**
```sql
-- Users: add role for admin gating
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';

-- Businesses: approval gate
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Reviews: verification gate
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Bookings: dispute flag
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS disputed boolean DEFAULT false;
```

## 🔧 Backend Implementation

### **Authentication Middleware**
- `attachUserFromAuth()` - Decodes JWT tokens and populates req.user
- `requireAdmin()` - Protects admin routes, requires admin/staff role
- Seamless integration with existing authentication system

### **Admin Routes**
- `GET /api/admin/overview` - Dashboard statistics
- `GET /api/admin/reviews` - List unverified reviews
- `POST /api/admin/reviews/:id/verify` - Verify review
- `GET /api/admin/businesses` - List pending businesses
- `POST /api/admin/businesses/:id/approve` - Approve business

### **Integration Points**
- Uses existing `reviews` table with verification flags
- Integrates with existing cron system for 24-hour points release
- Maintains all existing customer/business functionality
- No changes to existing modals, routes, or Socket.IO events

## 🎨 Frontend Implementation

### **Design System**
- BlkPages black and gold theme
- Professional admin interface
- Responsive grid layout
- Clean typography and spacing

### **Pages**
- `overview.html` - Dashboard with live statistics
- `reviews.html` - Review verification interface
- `businesses.html` - Business approval interface
- `admin.css` - Shared styling
- `admin.js` - API helpers and utilities

### **Features**
- Real-time data loading
- Confirmation dialogs for actions
- Error handling with user feedback
- Navigation between admin sections

## 🚀 Installation & Setup

### **1. Database Migration**
```bash
# Run the admin migration
psql -d your_database -f backend/01_admin_basics.sql
```

### **2. Install Dependencies**
```bash
cd backend
npm install
# jsonwebtoken will be added to package.json
```

### **3. Environment Variables**
Add to your `.env` file:
```
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=https://blkpages.com
```

### **4. Create Admin User**
```sql
-- Create admin user (modify email as needed)
INSERT INTO users (email, role) VALUES ('admin@blkpages.com', 'admin') ON CONFLICT (email) DO NOTHING;
```

### **5. Serve Admin Files**
Add to your Express server or static hosting:
```javascript
// Serve admin files as static
app.use('/admin', express.static('admin'));
```

### **6. Authentication Setup**
Ensure your login system issues JWT tokens with role information:
```javascript
// Example JWT payload
{
  "id": 123,
  "email": "admin@blkpages.com",
  "role": "admin"
}
```

## 🔐 Security Features

### **Access Control**
- Role-based permissions (admin/staff only)
- JWT token validation
- Protected API endpoints
- Automatic redirect on unauthorized access

### **Data Protection**
- No sensitive data exposure in frontend
- Server-side validation for all actions
- Audit trail for all admin actions
- Secure API communication

## 📱 Usage Guide

### **Admin Login**
1. Admin users log in through existing authentication
2. JWT token must include `role: "admin"` or `role: "staff"`
3. Access admin dashboard at `/admin/overview.html`

### **Review Verification**
1. Navigate to Reviews section
2. View unverified reviews with business and user details
3. Click "Verify" to approve review
4. Points automatically release after 24 hours via cron

### **Business Approval**
1. Navigate to Businesses section
2. View pending business signups
3. Click "Approve" to make business live
4. Business listing becomes immediately available

### **Overview Monitoring**
1. Dashboard shows live counts
2. Monitor pending reviews, businesses, and disputes
3. Quick access to all admin functions

## 🔄 Integration with Existing System

### **Review Points Release**
- Admin verifies review → `verified=true`, `verified_at=NOW()`
- Existing cron job checks for verified reviews 24+ hours old
- Automatically releases +25 BlkPoints to reviewer
- No manual points management needed

### **Business Approval**
- Admin approves business → `approved=true`, `approved_at=NOW()`
- Business listings immediately become visible to customers
- No additional integration needed

### **Preserved Functionality**
- All existing customer/business modals unchanged
- All existing routes and Socket.IO events preserved
- All existing reward system functionality maintained
- No breaking changes to current system

## 🧪 Testing

### **Test Admin Access**
1. Create admin user in database
2. Login with admin credentials
3. Verify access to `/admin/overview.html`
4. Test navigation between admin sections

### **Test Review Verification**
1. Submit a review through customer interface
2. Verify review appears in admin dashboard
3. Approve review in admin interface
4. Wait 24+ hours and verify points are released

### **Test Business Approval**
1. Create business signup
2. Verify business appears in admin dashboard
3. Approve business in admin interface
4. Verify business listing becomes live

## 📊 API Endpoints

### **Overview**
```javascript
GET /api/admin/overview
// Returns: { pending_reviews, pending_businesses, disputes }
```

### **Reviews**
```javascript
GET /api/admin/reviews
// Returns: [{ id, business_name, user_email, rating, text, ... }]

POST /api/admin/reviews/:id/verify
// Returns: { ok: true, message: "Review verified (points will release after 24h)" }
```

### **Businesses**
```javascript
GET /api/admin/businesses
// Returns: [{ id, name, owner_user_id, created_at, ... }]

POST /api/admin/businesses/:id/approve
// Returns: { ok: true, message: "Business approved" }
```

## 🎯 Benefits

✅ **Secure Admin Control** - Role-based access with JWT authentication
✅ **Streamlined Workflow** - One-click approval and verification
✅ **Real-time Monitoring** - Live dashboard with current statistics
✅ **Quality Control** - Staff verification prevents fake reviews
✅ **Business Management** - Controlled business approval process
✅ **Seamless Integration** - Works with existing cron and reward systems
✅ **Professional Interface** - Clean, branded admin experience
✅ **Audit Trail** - Timestamps for all admin actions

---

**Note**: This admin dashboard is completely self-contained and adds powerful admin capabilities without affecting any existing customer or business functionality. All existing modals, routes, Socket.IO events, and reward systems remain unchanged.
