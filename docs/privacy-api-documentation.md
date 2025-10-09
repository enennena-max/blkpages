# Privacy-Protected API Documentation

## Overview

All shared datasets in the BlkPages system are automatically protected by the Global Privacy Enforcement System. This ensures customer personal details are never exposed to businesses while maintaining essential functionality.

## Privacy Enforcement

### Automatic Field Stripping

Before any data is shared between customer and business dashboards, the system automatically:

1. **Strips restricted fields** based on dataset-specific privacy schemas
2. **Adds privacy notices** to all shared data objects
3. **Logs all privacy actions** for audit and debugging
4. **Validates compliance** before data transmission

### Privacy Schemas

Each dataset has a defined privacy schema with:
- `allowed_fields`: Fields that can be shared
- `restricted_fields`: Fields that are automatically stripped
- `disclaimer`: Privacy notice text attached to all shared data

## Dataset Privacy Schemas

### 1. Bookings Dataset

**Allowed Fields:**
- `id`, `business_id`, `business_name`, `customer_id`
- `customerFirstName`, `customerLastName` (first name only)
- `serviceName`, `servicePrice`, `bookingDate`, `bookingTime`
- `totalAmount`, `paymentMethod`, `status`
- `createdAt`, `updatedAt`, `source`, `privacyNotice`

**Restricted Fields:**
- `customerEmail`, `customerPhone`, `customerPostcode`
- `customerAddress`, `customerFullName`, `customerDetails`
- `paymentDetails`, `cardInfo`, `billingAddress`
- `personalNotes`, `internalNotes`

**Privacy Disclaimer:**
> "Customer personal details are protected for privacy. Only essential booking information is shared with businesses."

### 2. Reviews Dataset

**Allowed Fields:**
- `id`, `business_id`, `customer_id`, `rating`, `comment`
- `bookingReference`, `createdAt`, `status`
- `businessReply`, `replyDate`, `moderated`, `privacyNotice`

**Restricted Fields:**
- `customerEmail`, `customerPhone`, `customerName`
- `customerDetails`, `customerAddress`
- `internalNotes`, `moderationNotes`

**Privacy Disclaimer:**
> "Reviews are anonymized. Customer contact details are never shared with businesses."

### 3. Loyalty Dataset

**Allowed Fields:**
- `id`, `customer_id`, `business_id`
- `total_visits`, `total_spend`, `last_visit`
- `reward_unlocked`, `reward_redeemed`, `reward_voucher_id`
- `created_at`, `updated_at`, `privacyNotice`

**Restricted Fields:**
- `customerEmail`, `customerPhone`, `customerName`
- `customerAddress`, `customerDetails`
- `internalNotes`, `personalData`

**Privacy Disclaimer:**
> "Loyalty progress is tracked anonymously. Personal details are protected."

### 4. Waiting List Dataset

**Allowed Fields:**
- `id`, `business_id`, `customer_id`
- `customerName` (first name only), `serviceName`
- `requestedDate`, `position`, `status`
- `createdAt`, `updatedAt`, `privacyNotice`

**Restricted Fields:**
- `customerEmail`, `customerPhone`, `customerAddress`
- `customerDetails`, `internalNotes`, `personalData`

**Privacy Disclaimer:**
> "Only customer first name and service are shown to businesses for managing the waiting list."

### 5. Analytics Dataset

**Allowed Fields:**
- `business_id`, `metric_type`, `metric_value`
- `date_range`, `aggregated_data`, `trends`
- `insights`, `generated_at`, `privacyNotice`

**Restricted Fields:**
- `customerEmail`, `customerPhone`, `customerName`
- `customerAddress`, `individualData`
- `personalIdentifiers`, `rawCustomerData`

**Privacy Disclaimer:**
> "Analytics show aggregated, anonymized data only. Individual customer information is never exposed."

### 6. Reward Vouchers Dataset

**Allowed Fields:**
- `id`, `code`, `business_id`
- `reward_type`, `reward_value`, `expiry_date`
- `redeemed`, `expired`, `created_at`, `privacyNotice`

**Restricted Fields:**
- `customerEmail`, `customerPhone`, `customerName`
- `customerAddress`, `customerDetails`, `internalNotes`

**Privacy Disclaimer:**
> "Voucher codes are generated securely. Customer personal details are not stored with vouchers."

## Implementation Examples

### JavaScript Usage

```javascript
// Import privacy enforcement
import { privacyEnforcement } from './backend/privacy-enforcement-system.js';

// Strip restricted fields before sharing booking data
const sanitizedBooking = privacyEnforcement.stripRestrictedFields(bookingData, 'bookings');

// Get privacy disclaimer for UI
const disclaimer = privacyEnforcement.getPrivacyDisclaimer('bookings');

// Validate data compliance
const validation = privacyEnforcement.validatePrivacyCompliance(data, 'bookings');
```

### Automatic Integration

The privacy enforcement system automatically integrates with:

- **Booking synchronization** between customer and business dashboards
- **Review submission** and business reply systems
- **Loyalty progress** tracking and reward generation
- **Waiting list** management and notifications
- **Analytics** data aggregation and reporting
- **Voucher** generation and redemption

## Privacy Logging

All privacy enforcement actions are logged with:

- **Timestamp** of the action
- **Action type** (field_stripping, validation, etc.)
- **Dataset** affected
- **Details** of fields stripped or validated
- **Session ID** for tracking
- **User agent** information

## Compliance Features

### GDPR Compliance

- **Data minimization**: Only necessary fields are shared
- **Purpose limitation**: Data is used only for stated purposes
- **Transparency**: Clear privacy notices on all shared data
- **Accountability**: Comprehensive logging of all privacy actions

### UK Data Protection

- **Privacy by design**: Privacy protection built into the system
- **Automatic enforcement**: No manual intervention required
- **Audit trail**: Complete record of all privacy actions
- **Customer rights**: Easy access to privacy information

## Monitoring and Alerts

The system provides:

- **Real-time validation** of all data sharing
- **Automatic logging** of privacy violations
- **Privacy reports** for compliance monitoring
- **Alert system** for unauthorized data access attempts

## Support and Contact

For privacy-related questions or concerns:

- **Email**: privacy@blkpages.co.uk
- **Phone**: +44 20 7123 4567
- **Address**: BlkPages Privacy Team, London, UK

---

*This documentation is automatically updated when privacy schemas are modified. Last updated: [Current Date]*
