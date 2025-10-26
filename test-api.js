// test-api.js - Simple test to verify the API is working
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';
const CUSTOMER_ID = 'customer-1';

async function testAPI() {
  console.log('🧪 Testing BlkPages API...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    const healthCheck = await fetch(`${API_BASE}/bookings?customerId=${CUSTOMER_ID}`);
    console.log(`   Status: ${healthCheck.status} ${healthCheck.ok ? '✅' : '❌'}`);
    
    if (!healthCheck.ok) {
      console.log('❌ Server not running or API not available');
      console.log('   Make sure to run: node server.js');
      return;
    }
    
    // Test 2: Test bookings endpoint
    console.log('\n2. Testing bookings endpoint...');
    const bookings = await healthCheck.json();
    console.log(`   Found ${bookings.length} bookings`);
    
    // Test 3: Test payments endpoint
    console.log('\n3. Testing payments endpoint...');
    const paymentsResponse = await fetch(`${API_BASE}/payments?customerId=${CUSTOMER_ID}`);
    const payments = await paymentsResponse.json();
    console.log(`   Found ${payments.length} payments`);
    
    // Test 4: Test reviews endpoint
    console.log('\n4. Testing reviews endpoint...');
    const reviewsResponse = await fetch(`${API_BASE}/reviews?customerId=${CUSTOMER_ID}`);
    const reviews = await reviewsResponse.json();
    console.log(`   Found ${reviews.length} reviews`);
    
    // Test 5: Test loyalty endpoint
    console.log('\n5. Testing loyalty endpoint...');
    const loyaltyResponse = await fetch(`${API_BASE}/loyalty?customerId=${CUSTOMER_ID}`);
    const loyalty = await loyaltyResponse.json();
    console.log(`   Loyalty: ${loyalty.points} points, ${loyalty.tier} tier`);
    
    console.log('\n✅ All API endpoints working!');
    console.log('\n📋 Next steps:');
    console.log('   1. Open customer-dashboard.html in browser');
    console.log('   2. Check browser console for API calls');
    console.log('   3. If you see CORS errors, add CORS headers to server.js');
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure server.js is running (node server.js)');
    console.log('   2. Check DATABASE_URL is correct');
    console.log('   3. Verify STRIPE_SECRET_KEY is valid');
    console.log('   4. Check if database tables exist');
  }
}

testAPI();

