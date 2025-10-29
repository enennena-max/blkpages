// Firebase configuration for BlkPages
// Replace with your actual Firebase project configuration

const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = "pk_test_your_stripe_publishable_key_here";

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig, STRIPE_PUBLISHABLE_KEY };
} else {
  window.firebaseConfig = firebaseConfig;
  window.STRIPE_PUBLISHABLE_KEY = STRIPE_PUBLISHABLE_KEY;
}
