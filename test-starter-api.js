// test-starter-api.js
// Test script to verify all Starter Package API endpoints are working

const API_BASE_URL = 'http://localhost:5000';
const businessId = 'royal-hair-studio';

const endpoints = [
    `/api/businesses/${businessId}/review-stats`,
    `/api/businesses/${businessId}/booking-stats`,
    `/api/businesses/${businessId}/profile-views-stats`,
    `/api/businesses/${businessId}/profile`,
    `/api/businesses/${businessId}/settings-basic`,
    `/api/businesses/${businessId}/analytics/basic`,
    `/api/businesses/${businessId}/plan-info`
];

async function testAllEndpoints() {
    console.log('🧪 Testing Starter Package API Endpoints...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing: ${endpoint}`);
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ SUCCESS: ${response.status} ${response.statusText}`);
                console.log(`   Data:`, JSON.stringify(data, null, 2));
                successCount++;
            } else {
                console.log(`❌ FAILED: ${response.status} ${response.statusText}`);
                errorCount++;
            }
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
            errorCount++;
        }
        console.log(''); // Empty line for readability
    }
    
    console.log('📊 Test Results:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📈 Success Rate: ${((successCount / endpoints.length) * 100).toFixed(1)}%`);
    
    if (errorCount === 0) {
        console.log('\n🎉 All endpoints are working correctly!');
    } else {
        console.log('\n⚠️  Some endpoints failed. Check the server logs.');
    }
}

// Test PATCH endpoints
async function testPatchEndpoints() {
    console.log('\n🧪 Testing PATCH Endpoints...\n');
    
    // Test profile update
    try {
        console.log('Testing profile update...');
        const profileData = {
            business_name: 'Royal Hair Studio (Test)',
            description: 'Test description update',
            contact_email: 'test@royalhair.co.uk'
        };
        
        const response = await fetch(`${API_BASE_URL}/api/businesses/${businessId}/profile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Profile update successful:', result);
        } else {
            console.log('❌ Profile update failed:', response.status, response.statusText);
        }
    } catch (error) {
        console.log('❌ Profile update error:', error.message);
    }
    
    // Test settings update
    try {
        console.log('\nTesting settings update...');
        const settingsData = {
            notifications_enabled: true,
            allow_public_reviews: true,
            booking_cancellation_policy: '24-hour notice required (Test)'
        };
        
        const response = await fetch(`${API_BASE_URL}/api/businesses/${businessId}/settings-basic`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settingsData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Settings update successful:', result);
        } else {
            console.log('❌ Settings update failed:', response.status, response.statusText);
        }
    } catch (error) {
        console.log('❌ Settings update error:', error.message);
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting Starter Package API Tests...\n');
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`Business ID: ${businessId}\n`);
    
    await testAllEndpoints();
    await testPatchEndpoints();
    
    console.log('\n✨ Test completed!');
}

// Run if this script is executed directly
if (typeof window === 'undefined') {
    // Node.js environment - use built-in fetch (Node 18+)
    console.log('Running in Node.js environment...');
    runTests();
} else {
    // Browser environment
    console.log('Running in browser environment...');
    runTests();
}
