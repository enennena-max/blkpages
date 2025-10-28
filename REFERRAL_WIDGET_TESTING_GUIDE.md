# Referral Widget Integration - Testing Guide

## ✅ What's Been Added

The referral widget has been successfully integrated into the customer dashboard (`customer-dashboard.html`). Here's what you'll see:

### **🎁 Referral Widget Features**
- **Prominent Placement**: Shows at the top of the dashboard, below the welcome message
- **Dynamic Referral Code**: Displays current active referral code
- **Copy & Share Buttons**: Functional copy and share functionality
- **Live Statistics**: Shows total referrals, completed referrals, and BlkPoints earned
- **Professional Styling**: Matches BlkPages black-and-gold theme

## 🧪 Testing the Referral Widget

### **1. Demo Mode (Current)**
The widget is currently in **demo mode** and will show:
- **Referral Code**: `https://blkpages.com/referral/BLK-DEMO123`
- **Total Referrals**: 3
- **Completed Referrals**: 2
- **BlkPoints Earned**: 200

### **2. Live Mode (When Backend is Ready)**
To test with real data:

1. **Update Customer ID**:
   ```javascript
   // In customer-dashboard.html, change:
   const CUSTOMER_ID = 'replace-with-real-customer-id';
   // To:
   const CUSTOMER_ID = '123'; // Your actual customer ID
   ```

2. **Ensure Backend is Running**:
   ```bash
   cd backend
   npm start
   ```

3. **Run Database Migration**:
   ```bash
   psql -d your_database -f backend/02_dynamic_referral_codes.sql
   ```

## 🔧 How It Works

### **Widget Initialization**
```javascript
// Automatically initializes when dashboard loads
window.referralWidget = new ReferralWidget(CUSTOMER_ID, API_BASE);
```

### **Data Loading**
- **Demo Mode**: Shows fake data for preview
- **Live Mode**: Calls `/api/referral-code` and `/api/referral/stats` endpoints
- **Fallback**: If API fails, falls back to demo data

### **User Interactions**
- **Copy Button**: Copies referral link to clipboard
- **Share Button**: Uses native share API or falls back to clipboard
- **Notifications**: Shows success messages for user actions

## 🎨 Visual Design

The referral widget features:
- **Gold Border**: Matches BlkPages branding
- **Dark Gradient**: Professional dark theme
- **Monospace Font**: For referral code display
- **Responsive Design**: Works on all screen sizes
- **Hover Effects**: Interactive button animations

## 🚀 Next Steps

### **To Enable Live Data**:

1. **Set Real Customer ID**:
   ```javascript
   const CUSTOMER_ID = 'your-actual-customer-id';
   ```

2. **Ensure Backend Endpoints Work**:
   - `GET /api/referral-code?customerId=123`
   - `GET /api/referral/stats?userId=123`

3. **Test Referral Flow**:
   - User shares referral link
   - Friend uses link to register
   - System generates new code for referrer
   - Dashboard shows updated code and stats

## 🔍 Troubleshooting

### **If Referral Widget Doesn't Show**:
1. Check browser console for JavaScript errors
2. Ensure the HTML was properly added to `customer-dashboard.html`
3. Verify CSS styles are included

### **If Copy/Share Doesn't Work**:
1. Check browser permissions for clipboard access
2. Test on HTTPS (required for clipboard API)
3. Check console for error messages

### **If Data Doesn't Load**:
1. Check network tab for API call failures
2. Verify backend is running on correct port
3. Check CORS settings if testing locally

## 📱 Mobile Testing

The referral widget is fully responsive:
- **Mobile**: Buttons stack vertically
- **Tablet**: Maintains horizontal layout
- **Desktop**: Full-width layout with side-by-side buttons

## 🎯 Expected Behavior

When working correctly, you should see:
1. **Referral widget** appears at top of dashboard
2. **Referral code** displays in input field
3. **Statistics** show referral performance
4. **Copy button** copies link to clipboard
5. **Share button** opens native share dialog
6. **Notifications** appear for user actions

---

**Note**: The referral widget is now fully integrated and ready for testing. In demo mode, it shows sample data. When you're ready to test with real data, simply update the `CUSTOMER_ID` variable and ensure your backend is running!
