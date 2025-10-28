// Test script to verify Socket.IO integration
// Run this after starting the backend server

const io = require('socket.io-client');

const API_BASE = 'http://localhost:3001';
const CUSTOMER_ID = 'test-customer-123';

console.log('🧪 Testing Socket.IO Integration...');

const socket = io(API_BASE, { 
  transports: ['websocket'],
  autoConnect: true
});

socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
  
  // Register customer
  socket.emit('register', { customerId: CUSTOMER_ID });
  console.log('📝 Registered customer:', CUSTOMER_ID);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('booking_status_changed', (data) => {
  console.log('📅 Booking status changed:', data);
});

socket.on('loyalty_points_updated', (data) => {
  console.log('🎁 Loyalty points updated:', data);
});

socket.on('new_notification', (data) => {
  console.log('🔔 New notification:', data);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

// Test API endpoints
async function testAPI() {
  try {
    console.log('\n🌐 Testing API endpoints...');
    
    const response = await fetch(`${API_BASE}/health`);
    const health = await response.json();
    console.log('✅ Health check:', health);
    
    const bookings = await fetch(`${API_BASE}/api/bookings?customerId=${CUSTOMER_ID}`);
    const bookingsData = await bookings.json();
    console.log('📅 Bookings API:', bookingsData);
    
    const loyalty = await fetch(`${API_BASE}/api/loyalty?customerId=${CUSTOMER_ID}`);
    const loyaltyData = await loyalty.json();
    console.log('🎁 Loyalty API:', loyaltyData);
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Run tests after 2 seconds
setTimeout(() => {
  testAPI();
  
  // Simulate some events after 5 seconds
  setTimeout(() => {
    console.log('\n🎭 Simulating events...');
    
    // Simulate booking status change
    socket.emit('booking_status_changed', { 
      bookingId: 'test-123', 
      status: 'confirmed' 
    });
    
    // Simulate loyalty points update
    socket.emit('loyalty_points_updated', { 
      points: 1500,
      added: 50,
      reason: 'Test points'
    });
    
    // Simulate notification
    socket.emit('new_notification', {
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'info',
      target: 'dashboard'
    });
    
  }, 5000);
  
}, 2000);

console.log('⏳ Waiting for connection...');
