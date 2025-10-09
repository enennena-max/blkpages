# BlkPages Loyalty Rewards Demo

## 🚨 IMPORTANT SAFEGUARDS

- **DO NOT run in production environment**
- **All demo data is flagged with `demo=true`**
- **All demo records are prefixed with `DEMO_`**
- **Use cleanup function to remove demo data**

## 🎯 Purpose

This demo creates a complete end-to-end loyalty rewards system for testing and demonstration purposes. It includes:

- Business setup of loyalty programmes
- Customer progress and unlocking behaviour
- Automatic voucher generation (codes)
- Redemption flow at checkout (promo code validation)
- Admin view / CSV of all generated RewardVouchers

## 🚀 Quick Start

### 1. Run the Demo Seeder

```bash
node run-demo.js
```

This will:
- Create 5 demo businesses with different loyalty programmes
- Create 8 demo customers
- Generate completed bookings to trigger loyalty progress
- Generate reward vouchers for customers who meet thresholds
- Create admin demo UI and CSV export

### 2. Access Demo Interfaces

After running the seeder, you'll get links to:

- **Admin Demo UI**: View all generated vouchers, stats, and export options
- **CSV Export**: Download all voucher data for analysis
- **Demo Checkout**: Test promo code redemption
- **Cleanup Function**: Remove all demo data

## 📊 Demo Data Created

### Businesses (5)
1. **DEMO_GlowHair** - Professional plan
   - Loyalty: 5 visits → Free Service ("Blow Dry")
   - Expiry: 30 days

2. **DEMO_ZenSpa** - Starter plan
   - Loyalty: £200 spend → Credit (£20)
   - Expiry: 60 days

3. **DEMO_CityNails** - Starter plan
   - Loyalty: 3 visits → Discount (20%)
   - Expiry: 14 days

4. **DEMO_FreshCuts** - Professional plan
   - Loyalty: 4 visits in 60 days → Free Service ("Express Cut")
   - Expiry: 45 days

5. **DEMO_LuxeBrow** - FreeGrowth plan
   - Loyalty: 5 visits → Free Service ("Brow Wax")
   - Expiry: 30 days

### Customers (8)
- DemoAlice, DemoBen, DemoCara, DemoDan
- DemoEve, DemoFred, DemoGina, DemoHugo
- All with emails: demo_customer1-8@blkpages.test

### Bookings & Progress
- **GlowHair**: DemoAlice → 5 completed bookings (unlocked voucher)
- **ZenSpa**: DemoBen → £210 spend (unlocked voucher)
- **CityNails**: DemoCara → 2 bookings (not unlocked), DemoDan → 3 bookings (unlocked)
- **FreshCuts**: DemoEve → 4 bookings within 60 days (unlocked)
- **LuxeBrow**: DemoFred → 5 bookings (unlocked)

## 🎫 Generated Vouchers

Each unlocked customer receives a unique voucher code in format `BP-XXXXXX` with:
- Unique 6-character alphanumeric code
- Business-specific validation
- Expiry dates based on programme settings
- Reward type and value from programme configuration

## 🛒 Demo Checkout Testing

The demo checkout page (`/demo/business/checkout.html`) allows you to:

1. **Enter Promo Code**: Test voucher validation
2. **Apply Discount**: See discount calculation
3. **Complete Booking**: Mark voucher as redeemed
4. **Reset Demo**: Clear and test again

### Promo Code Validation Tests
- ✅ Valid code → Apply discount
- ❌ Invalid code → Show error
- ❌ Expired code → Show expiry message
- ❌ Already used → Show used message
- ❌ Wrong business → Show business error

## 📊 Admin Demo UI Features

The admin interface (`/admin/demo/loyalty.html`) provides:

### Statistics Dashboard
- Total vouchers generated
- Number redeemed
- Number expired
- Number active

### Vouchers Table
- Code, Business, Customer (first name only)
- Reward type and value
- Expiry date and status
- Redemption information

### Export Options
- **Download CSV**: Export all voucher data
- **Re-run Generation**: Regenerate vouchers from current data
- **Cleanup Demo**: Remove all demo data

## 🧹 Cleanup

### Automatic Cleanup
```bash
node backend/demo-cleanup.js
```

### Manual Cleanup
```javascript
// In browser console or Node.js
demoCleanup();
```

### What Gets Cleaned
- All records with `demo=true` flag
- All localStorage keys prefixed with `demo_`
- Admin UI and CSV files remain for reference

## 📁 File Structure

```
blkpages/
├── backend/
│   ├── demo-loyalty-seeder.js    # Main seeder script
│   └── demo-cleanup.js           # Cleanup function
├── admin/
│   └── demo/
│       └── loyalty.html          # Admin demo UI
├── demo/
│   └── business/
│       └── checkout.html         # Demo checkout page
├── exports/
│   └── loyalty_demo_vouchers_YYYYMMDD.csv
├── run-demo.js                   # Demo runner script
└── DEMO_README.md               # This file
```

## 🔧 Technical Details

### Database Tables (Demo)
- `demo_Businesses` - Demo business records
- `demo_Customers` - Demo customer records
- `demo_Bookings` - Demo booking records
- `demo_LoyaltyProgrammes` - Loyalty programme configurations
- `demo_LoyaltyProgress` - Customer loyalty progress
- `demo_RewardVouchers` - Generated reward vouchers

### Voucher Code Format
- Prefix: `BP-`
- Format: `BP-XXXXXX` (6 alphanumeric uppercase)
- Uniqueness: Enforced at generation time
- Validation: Business-specific and expiry checks

### Security Features
- Environment checks prevent production execution
- Demo flag separation from production data
- Secure voucher generation with crypto.randomUUID()
- Transaction safety for voucher creation

## 🎯 Test Cases

### Acceptance Criteria
- ✅ Environment guard prevents production execution
- ✅ 5 demo businesses and 8 demo customers created
- ✅ Completed bookings trigger correct loyalty progress
- ✅ Vouchers generated with unique codes
- ✅ Admin demo UI renders table and CSV download
- ✅ Promo code redemption works on demo checkout
- ✅ Cleanup removes demo records cleanly
- ✅ At least one unlocked voucher per business that met thresholds

### Sample Test Scenarios
1. **Valid Promo Code**: Enter `BP-ABC123` → Should apply discount
2. **Invalid Code**: Enter `INVALID` → Should show error
3. **Expired Code**: Enter expired voucher → Should show expiry message
4. **Wrong Business**: Use voucher from different business → Should show business error
5. **Already Used**: Use redeemed voucher → Should show used message

## 📞 Support

For questions or issues with the demo:
- Email: support@blkpages.co.uk
- Check console logs for detailed error messages
- Verify demo data exists in localStorage
- Ensure cleanup was not run recently

## ⚠️ Important Notes

- **Never run in production**
- **All data is demo-only**
- **Use cleanup when finished**
- **Check environment before running**
- **Demo data is stored in localStorage (browser) or demo tables (database)**

---

**Happy Testing! 🎉**

This demo provides a complete end-to-end loyalty rewards system for testing, demonstration, and development purposes.

