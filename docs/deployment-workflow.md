# BlkPages Staging-to-Production Deployment Workflow

## Overview

This document outlines the comprehensive staging-to-production workflow for all BlkPages website pages and demos. The workflow ensures safe testing of GDPR compliance, authentication, validation, and security updates before deployment.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │───▶│     Staging     │───▶│   Production    │
│                 │    │                 │    │                 │
│ • Feature dev   │    │ • Full testing  │    │ • Live site     │
│ • Local testing │    │ • GDPR checks   │    │ • User traffic  │
│ • Code review   │    │ • Security scan │    │ • Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Pages and Routes

### Core Pages
1. **Home Page** → `https://blkpages.com/`
2. **Search Results** → `https://blkpages.com/search-results`
3. **Business Profile** → `https://blkpages.com/business-profile`
4. **Customer Profile** → `https://blkpages.com/customer-profile`
5. **Booking Page** → `https://blkpages.com/booking`
6. **Payment Page** → `https://blkpages.com/payment`

### Dashboard Pages
7. **Admin Dashboard** → `https://blkpages.com/admin-dashboard`
8. **Business Dashboard** → `https://blkpages.com/business-dashboard`
9. **Customer Dashboard** → `https://blkpages.com/customer-dashboard`

### Demo Pages
10. **Demo Business** → `https://blkpages.com/demo-business`
11. **Demo Customer** → `https://blkpages.com/demo-customer`

### Legal Pages
12. **Terms & Conditions** → `https://blkpages.com/terms`
13. **Privacy Policy** → `https://blkpages.com/privacy`
14. **Contact Page** → `https://blkpages.com/contact`

## Staging Branches

Each page has its own staging branch for isolated testing:

```bash
# Core pages
staging-home
staging-search-results
staging-business-profile
staging-customer-profile
staging-booking
staging-payment

# Dashboard pages
staging-admin-dashboard
staging-business-dashboard
staging-customer-dashboard

# Demo pages
staging-demo-business
staging-demo-customer

# Legal pages
staging-terms
staging-privacy
staging-contact
```

## Workflow Process

### 1. Staging Branch Creation

```bash
# Create staging branch for a specific page
git checkout main
git checkout -b staging-[page-name]

# Copy demo changes to staging
git cherry-pick [demo-commit-hash]

# Configure staging environment
cp config/staging.env .env
```

### 2. Staging Environment Configuration

Each staging branch uses:
- **Separate database**: `blkpages_staging`
- **Staging API keys**: Test Stripe keys, staging SMTP
- **Staging domain**: `staging.blkpages.co.uk`
- **Isolated data**: No production data mixing

### 3. Automated Testing

#### Security Tests
- [ ] HTTPS enforcement
- [ ] Security headers (CSP, X-Frame-Options, etc.)
- [ ] CSRF protection
- [ ] Input validation and sanitization
- [ ] Rate limiting
- [ ] Session security

#### GDPR Compliance Tests
- [ ] Cookie consent banner
- [ ] Data export functionality
- [ ] Data deletion functionality
- [ ] Privacy policy links
- [ ] Marketing consent controls
- [ ] Audit logging

#### Authentication Tests
- [ ] Login functionality
- [ ] Signup process
- [ ] Password reset
- [ ] Session management
- [ ] Account deletion
- [ ] Email verification

#### Form Validation Tests
- [ ] Required field validation
- [ ] Email format validation
- [ ] Password strength validation
- [ ] Phone number validation
- [ ] Postcode validation
- [ ] Terms acceptance

#### Performance Tests
- [ ] Page load time (< 3 seconds)
- [ ] Resource optimization
- [ ] Mobile responsiveness
- [ ] Accessibility compliance

### 4. Manual Testing Checklist

#### Business Profile Page
- [ ] Service selection works
- [ ] Date/time picker functions
- [ ] Customer details form validates
- [ ] Payment processing works
- [ ] Booking confirmation displays
- [ ] GDPR features present

#### Customer Dashboard
- [ ] Login/signup works
- [ ] Booking history displays
- [ ] Data export functions
- [ ] Account deletion works
- [ ] Privacy settings save
- [ ] Cookie consent works

#### Business Dashboard
- [ ] Business login works
- [ ] Booking management functions
- [ ] Customer data privacy protected
- [ ] Analytics display correctly
- [ ] Settings save properly
- [ ] Audit logs accessible

### 5. Pre-Deployment Verification

Before merging to main:
- [ ] All automated tests pass
- [ ] Manual testing completed
- [ ] No console errors
- [ ] No network errors
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] GDPR compliance verified
- [ ] Performance acceptable

### 6. Deployment Process

#### Staging Deployment
```bash
# Deploy to staging
npm run deploy:staging

# Run staging tests
npm run test:staging

# Verify staging deployment
npm run verify:staging
```

#### Production Deployment
```bash
# Merge staging to main
git checkout main
git merge staging-[page-name]

# Deploy to production
npm run deploy:production

# Run production verification
npm run verify:production
```

### 7. Post-Deployment Monitoring

#### Automated Checks
- [ ] Health check endpoints
- [ ] Error rate monitoring
- [ ] Performance metrics
- [ ] Security scan results
- [ ] GDPR compliance status

#### Manual Verification
- [ ] Page loads correctly
- [ ] Forms submit successfully
- [ ] [ ] Payments process
- [ ] [ ] Emails send
- [ ] [ ] Data exports work
- [ ] [ ] Account deletion functions

## Environment Configuration

### Staging Environment
```env
NODE_ENV=staging
DB_HOST=staging-db.blkpages.co.uk
API_BASE_URL=https://staging-api.blkpages.co.uk
STRIPE_PUBLISHABLE_KEY=pk_test_staging_key
SMTP_HOST=staging-smtp.blkpages.co.uk
```

### Production Environment
```env
NODE_ENV=production
DB_HOST=prod-db.blkpages.co.uk
API_BASE_URL=https://api.blkpages.co.uk
STRIPE_PUBLISHABLE_KEY=pk_live_production_key
SMTP_HOST=smtp.blkpages.co.uk
```

## Security Considerations

### Data Protection
- All personal data encrypted at rest
- Secure transmission (HTTPS/TLS)
- Regular security audits
- GDPR compliance monitoring

### Access Control
- Staging environment isolated
- Production credentials secured
- Audit logging enabled
- Role-based access control

### Monitoring
- Real-time error tracking
- Performance monitoring
- Security event logging
- Compliance reporting

## Rollback Procedure

If deployment fails:
1. **Immediate**: Revert to previous version
2. **Investigation**: Analyze failure logs
3. **Fix**: Address root cause
4. **Re-test**: Full testing cycle
5. **Re-deploy**: After verification

## Quality Assurance

### Automated QA
- Continuous integration tests
- Security vulnerability scans
- Performance benchmarking
- Accessibility compliance checks

### Manual QA
- User acceptance testing
- Cross-browser compatibility
- Mobile device testing
- End-to-end workflow testing

## Documentation

### Deployment Reports
- Automated deployment logs
- Test result summaries
- Performance metrics
- Security scan results

### Change Logs
- Feature updates
- Security patches
- Bug fixes
- Configuration changes

## Contact Information

- **DevOps Team**: devops@blkpages.co.uk
- **Security Team**: security@blkpages.co.uk
- **QA Team**: qa@blkpages.co.uk
- **Emergency**: +44 20 7123 4567

## Version History

- **v1.0** - Initial workflow setup
- **v1.1** - Added GDPR compliance testing
- **v1.2** - Enhanced security testing
- **v1.3** - Added performance monitoring
