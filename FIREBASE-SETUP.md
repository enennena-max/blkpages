# Firebase Setup Guide for BlkPages

This guide will help you set up Firebase for secure payment processing with Stripe Elements and BlkPoints.

## 1. Firebase Project Setup

### Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `blkpages` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### Enable Required Services

#### Firebase Authentication
1. In Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable "Email/Password" provider
3. Enable "Phone" provider (for mobile verification)
4. Add your domain to authorized domains

#### Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" (we'll update rules)
4. Select a location (choose closest to your users)

#### Cloud Functions
1. Go to "Functions"
2. Click "Get started"
3. Follow the setup instructions

## 2. Install Firebase CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init
```

When prompted, select:
- ✅ Functions
- ✅ Firestore
- ✅ Hosting (optional)

## 3. Configure Firebase Functions

```bash
# Navigate to functions directory
cd firebase-functions

# Install dependencies
npm install

# Set Stripe secret key
firebase functions:config:set stripe.secret="sk_test_your_stripe_secret_key_here"
```

## 4. Update Firebase Configuration

Edit `firebase-config.js` with your actual Firebase project details:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
};

const STRIPE_PUBLISHABLE_KEY = "pk_test_your_stripe_publishable_key";
```

## 5. Deploy Functions

```bash
# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

## 6. Test the Setup

1. Open `payment.html` in your browser
2. The page should automatically sign in a demo user
3. You should see BlkPoints balance and Stripe Elements
4. Try making a test payment

## 7. Stripe Test Cards

Use these test card numbers for testing:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Insufficient funds**: 4000 0000 0000 9995
- **Expired card**: 4000 0000 0000 0069

Use any future expiry date (e.g., 12/27) and any 3-digit CVV.

## 8. Production Setup

### Update to Live Keys
1. Replace test keys with live Stripe keys
2. Update Firebase security rules for production
3. Set up proper domain restrictions

### Security Rules
The included `firestore.rules` file provides basic security:
- Users can only access their own data
- Admin users have full access
- Bookings are protected by user ownership

### Environment Variables
For production, use environment variables instead of hardcoded keys:

```bash
# Set production Stripe key
firebase functions:config:set stripe.secret="sk_live_your_live_stripe_key"
```

## 9. Monitoring

### Firebase Console
- Monitor function executions
- View Firestore data
- Check authentication logs

### Stripe Dashboard
- Monitor payments
- View customer data
- Check webhook logs

## 10. Troubleshooting

### Common Issues

**"Firebase not initialized"**
- Check that `firebase-config.js` has correct values
- Ensure Firebase SDK is loaded before your scripts

**"Stripe not defined"**
- Check that Stripe script is loaded
- Verify publishable key is correct

**"Functions not found"**
- Ensure functions are deployed
- Check function names match exactly

**"Permission denied"**
- Check Firestore security rules
- Ensure user is authenticated

### Debug Mode
Add this to your browser console for debugging:

```javascript
// Check Firebase connection
console.log('Firebase app:', firebase.app());

// Check user authentication
firebase.auth().onAuthStateChanged(user => {
  console.log('User:', user);
});

// Check Firestore connection
firebase.firestore().collection('users').get().then(snap => {
  console.log('Firestore data:', snap.docs.map(d => d.data()));
});
```

## 11. Next Steps

1. **Customize UI**: Update colors, fonts, and layout to match your brand
2. **Add Webhooks**: Set up Stripe webhooks for payment confirmations
3. **Email Integration**: Add email notifications for bookings
4. **Admin Dashboard**: Create admin interface for managing bookings
5. **Analytics**: Add Firebase Analytics for user behavior tracking

## Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Firebase Support](https://firebase.google.com/support)
