# 🔒 BlkPages Referral Fraud Prevention Guide

This document outlines the complete fraud prevention system for the BlkPages referral program.

## 🧱 Fraud Prevention Checks

### 1️⃣ Signup-Level Protection

**Self-Referral Blocking**
- Blocks if referrer and referee have same email
- Blocks if referrer and referee have same mobile number

**Duplicate Phone Detection**
- Checks if the referee's phone number is already registered to another account
- Prevents one person from creating multiple accounts with the same phone

**Device Fingerprint Tracking**
- Tracks device fingerprints for each referral signup
- Blocks referrals from devices that have already been used for signups
- Prevents reusing the same device to game the system

**Payment Card Hash Detection**
- Tracks hashed payment card information (optional)
- Blocks referrals using the same payment card across multiple accounts
- Prevents creating fake accounts with the same payment method

### 2️⃣ Booking-Level Protection

**First Booking Only**
- Referral bonus only awarded on referee's FIRST completed booking
- Subsequent bookings don't trigger additional bonuses
- Prevents earning multiple referral bonuses from the same person

**Duplicate Bonus Prevention**
- Checks if referral bonus already exists for this referee
- Prevents duplicate bonuses if booking completion is triggered multiple times

**Self-Referral Safety Check**
- Double-checks that referrer and referee are different users
- Extra validation in booking completion logic

### 3️⃣ 24-Hour Confirmation Window

**Pending Status**
- All referral bonuses start as "pending"
- Points are not added to balance until 24 hours after booking completion

**Cancellation Protection**
- If booking is cancelled/refunded within 24 hours, bonus is released (not awarded)
- Protects against short-term bookings made just for referral bonus

**Automatic Confirmation**
- After 24 hours, if booking is still "completed", bonus is confirmed
- Points automatically added to referrer's balance

## 📊 Admin Monitoring

### Suspicious Referral Detection

Query endpoint: `GET /api/admin/suspicious-referrals`

**Flags referrers who:**
- Have more than 5 referrals
- Have device ratio < 80% (same devices used repeatedly)
- Have phone ratio < 80% (same phone numbers used repeatedly)

**Returns:**
- Risk score (0-100)
- Total referrals
- Unique devices, phones, IPs
- Full referral list for investigation

## 🛠️ Implementation Details

### Frontend Integration

Include device fingerprint capture in signup forms:

```html
<script src="https://openfpcdn.io/fingerprintjs/v3"></script>
<script src="/device-fingerprint.js"></script>

<script>
// When submitting signup form:
const deviceFp = window.BlkDeviceFingerprint.get();

fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    mobile_number: '+447123456789',
    device_fingerprint: deviceFp,
    payment_hash: 'hashed_card_data' // optional
  })
});
</script>
```

### Backend Endpoints

**Signup with Fraud Checks:**
```
POST /api/auth/signup
Body: {
  email: string,
  password: string,
  mobile_number?: string,
  device_fingerprint?: string,
  payment_hash?: string
}
```

**Admin Monitoring:**
```
GET /api/admin/suspicious-referrals
Returns: {
  suspicious: Array<{
    referrer_id: string,
    total_refs: number,
    unique_devices: number,
    unique_phones: number,
    risk_score: number,
    referrals: Array
  }>,
  summary: {
    total_referrers: number,
    flagged: number
  }
}
```

## 🔄 Workflow Summary

| Stage | Security Checks |
|-------|----------------|
| **Link Click** | Store referral code (7-day cookie) |
| **Signup** | Validate phone + device uniqueness, block self-referral |
| **Booking** | Reward only first completed booking |
| **+24h Window** | Confirm if booking still completed |
| **Cancellation** | Release pending bonus automatically |

## ✅ Fraud-Resistant Features

1. ✅ Self-referral blocking (email + phone)
2. ✅ Duplicate phone detection
3. ✅ Device fingerprint tracking
4. ✅ Payment card hash tracking (optional)
5. ✅ First-booking-only rewards
6. ✅ 24-hour confirmation window
7. ✅ Automatic cancellation handling
8. ✅ Admin monitoring & risk scoring

## 🧾 Database Schema

The `referrals` table includes:
- `device_fingerprint` - For tracking unique devices
- `payment_hash` - For tracking payment cards (hashed)
- `ip_address` - For audit trail
- `status` - clicked → signed_up → completed → cancelled

All referral records are stored for audit and fraud detection.

