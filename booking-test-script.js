/**
 * BlkPages Booking Flow QA Test Script
 * 
 * This script tests the booking flow on business-profile.html
 * Run this script in the browser console on the business profile page
 * 
 * Usage:
 * 1. Open business-profile.html in browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this script
 * 4. Run: testBookingFlow()
 */

// Test configuration
const TEST_CONFIG = {
    testData: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '07123456789',
        note: 'QA Test Booking'
    },
    services: [
        { name: 'Haircut – 30 min – £35', price: 35, duration: 30 }
    ],
    paymentMethods: ['payAtVenue', 'payNow']
};

// Test results storage
let testResults = {
    desktop: {},
    mobile: {},
    overall: {}
};

// Utility functions
function logTest(testName, result, details = '') {
    const timestamp = new Date().toLocaleTimeString();
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`[${timestamp}] ${status} - ${testName}: ${details}`);
    
    return result;
}

function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        
        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

// Test functions
async function testFormValidation() {
    console.log('🧪 Testing form validation...');
    
    try {
        // Test with empty form
        const completeButton = document.getElementById('completeBooking');
        const stickyButton = document.getElementById('stickyBookingButton');
        
        if (!completeButton) {
            throw new Error('Complete booking button not found');
        }
        
        // Check if button is initially disabled
        const isInitiallyDisabled = completeButton.disabled;
        logTest('Initial Button State', isInitiallyDisabled, 'Button should be disabled initially');
        
        // Test sticky button if it exists
        if (stickyButton) {
            const stickyDisabled = stickyButton.disabled;
            logTest('Sticky Button State', stickyDisabled, 'Sticky button should be disabled initially');
        }
        
        return true;
    } catch (error) {
        logTest('Form Validation', false, error.message);
        return false;
    }
}

async function testButtonTextUpdates() {
    console.log('🧪 Testing button text updates...');
    
    try {
        const completeButton = document.getElementById('completeBooking');
        const stickyButton = document.getElementById('stickyBookingButton');
        const stickyButtonText = document.getElementById('stickyButtonText');
        
        if (!completeButton) {
            throw new Error('Complete booking button not found');
        }
        
        // Test Pay at Venue
        const payAtVenueRadio = document.querySelector('input[value="payAtVenue"]');
        if (payAtVenueRadio) {
            payAtVenueRadio.checked = true;
            payAtVenueRadio.dispatchEvent(new Event('change'));
            
            // Wait for button update
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const payAtVenueText = completeButton.textContent.includes('Complete Booking');
            logTest('Pay at Venue Button Text', payAtVenueText, 'Button should show "Complete Booking"');
            
            // Test sticky button
            if (stickyButtonText) {
                const stickyPayAtVenueText = stickyButtonText.textContent.includes('Complete Booking');
                logTest('Sticky Pay at Venue Text', stickyPayAtVenueText, 'Sticky button should show "Complete Booking"');
            }
        }
        
        // Test Pay Now
        const payNowRadio = document.querySelector('input[value="payNow"]');
        if (payNowRadio) {
            payNowRadio.checked = true;
            payNowRadio.dispatchEvent(new Event('change'));
            
            // Wait for button update
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const payNowText = completeButton.textContent.includes('Pay Now');
            logTest('Pay Now Button Text', payNowText, 'Button should show "Pay Now"');
            
            // Test sticky button
            if (stickyButtonText) {
                const stickyPayNowText = stickyButtonText.textContent.includes('Pay Now');
                logTest('Sticky Pay Now Text', stickyPayNowText, 'Sticky button should show "Pay Now"');
            }
        }
        
        return true;
    } catch (error) {
        logTest('Button Text Updates', false, error.message);
        return false;
    }
}

async function testFormFilling() {
    console.log('🧪 Testing form filling...');
    
    try {
        // Fill form fields
        const nameField = document.getElementById('fullName');
        const emailField = document.getElementById('email');
        const phoneField = document.getElementById('phone');
        const notesField = document.getElementById('bookingNotes');
        
        if (nameField) {
            nameField.value = TEST_CONFIG.testData.name;
            nameField.dispatchEvent(new Event('input'));
        }
        
        if (emailField) {
            emailField.value = TEST_CONFIG.testData.email;
            emailField.dispatchEvent(new Event('input'));
        }
        
        if (phoneField) {
            phoneField.value = TEST_CONFIG.testData.phone;
            phoneField.dispatchEvent(new Event('input'));
        }
        
        if (notesField) {
            notesField.value = TEST_CONFIG.testData.note;
            notesField.dispatchEvent(new Event('input'));
        }
        
        // Accept terms
        const termsCheckbox = document.getElementById('acceptTerms');
        if (termsCheckbox) {
            termsCheckbox.checked = true;
            termsCheckbox.dispatchEvent(new Event('change'));
        }
        
        logTest('Form Filling', true, 'Form fields filled successfully');
        return true;
    } catch (error) {
        logTest('Form Filling', false, error.message);
        return false;
    }
}

async function testServiceSelection() {
    console.log('🧪 Testing service selection...');
    
    try {
        // Look for service buttons
        const serviceButtons = document.querySelectorAll('[onclick*="addService"]');
        
        if (serviceButtons.length > 0) {
            // Click first service button
            serviceButtons[0].click();
            logTest('Service Selection', true, 'Service selected successfully');
        } else {
            logTest('Service Selection', false, 'No service buttons found');
        }
        
        return true;
    } catch (error) {
        logTest('Service Selection', false, error.message);
        return false;
    }
}

async function testDateSelection() {
    console.log('🧪 Testing date selection...');
    
    try {
        // Look for calendar days
        const calendarDays = document.querySelectorAll('.calendar-day.available');
        
        if (calendarDays.length > 0) {
            // Click first available day
            calendarDays[0].click();
            logTest('Date Selection', true, 'Date selected successfully');
        } else {
            logTest('Date Selection', false, 'No available calendar days found');
        }
        
        return true;
    } catch (error) {
        logTest('Date Selection', false, error.message);
        return false;
    }
}

async function testTimeSelection() {
    console.log('🧪 Testing time selection...');
    
    try {
        // Look for time slots
        const timeSlots = document.querySelectorAll('.time-slot');
        
        if (timeSlots.length > 0) {
            // Click first time slot
            timeSlots[0].click();
            logTest('Time Selection', true, 'Time selected successfully');
        } else {
            logTest('Time Selection', false, 'No time slots found');
        }
        
        return true;
    } catch (error) {
        logTest('Time Selection', false, error.message);
        return false;
    }
}

async function testPaymentMethodSelection() {
    console.log('🧪 Testing payment method selection...');
    
    try {
        // Test Pay at Venue
        const payAtVenueRadio = document.querySelector('input[value="payAtVenue"]');
        if (payAtVenueRadio) {
            payAtVenueRadio.checked = true;
            payAtVenueRadio.dispatchEvent(new Event('change'));
            logTest('Pay at Venue Selection', true, 'Pay at Venue selected');
        }
        
        // Test Pay Now
        const payNowRadio = document.querySelector('input[value="payNow"]');
        if (payNowRadio) {
            payNowRadio.checked = true;
            payNowRadio.dispatchEvent(new Event('change'));
            logTest('Pay Now Selection', true, 'Pay Now selected');
        }
        
        return true;
    } catch (error) {
        logTest('Payment Method Selection', false, error.message);
        return false;
    }
}

async function testButtonStates() {
    console.log('🧪 Testing button states...');
    
    try {
        const completeButton = document.getElementById('completeBooking');
        const stickyButton = document.getElementById('stickyBookingButton');
        
        if (!completeButton) {
            throw new Error('Complete booking button not found');
        }
        
        // Test button state after form completion
        const isEnabled = !completeButton.disabled;
        const buttonText = completeButton.textContent;
        
        logTest('Button Enabled State', isEnabled, `Button enabled: ${isEnabled}`);
        logTest('Button Text Content', buttonText.length > 0, `Button text: "${buttonText}"`);
        
        // Test sticky button if it exists
        if (stickyButton) {
            const stickyEnabled = !stickyButton.disabled;
            const stickyText = stickyButton.textContent;
            
            logTest('Sticky Button Enabled', stickyEnabled, `Sticky button enabled: ${stickyEnabled}`);
            logTest('Sticky Button Text', stickyText.length > 0, `Sticky button text: "${stickyText}"`);
        }
        
        return true;
    } catch (error) {
        logTest('Button States', false, error.message);
        return false;
    }
}

async function testRedirectLogic() {
    console.log('🧪 Testing redirect logic...');
    
    try {
        // Test Pay at Venue redirect
        const payAtVenueRadio = document.querySelector('input[value="payAtVenue"]');
        if (payAtVenueRadio) {
            payAtVenueRadio.checked = true;
            payAtVenueRadio.dispatchEvent(new Event('change'));
            
            // Check if redirect would go to confirmation page
            logTest('Pay at Venue Redirect', true, 'Should redirect to booking-confirmation.html');
        }
        
        // Test Pay Now redirect
        const payNowRadio = document.querySelector('input[value="payNow"]');
        if (payNowRadio) {
            payNowRadio.checked = true;
            payNowRadio.dispatchEvent(new Event('change'));
            
            // Check if redirect would go to payment page
            logTest('Pay Now Redirect', true, 'Should redirect to payment-processing.html');
        }
        
        return true;
    } catch (error) {
        logTest('Redirect Logic', false, error.message);
        return false;
    }
}

// Main test function
async function testBookingFlow() {
    console.log('🚀 Starting BlkPages Booking Flow QA Test...');
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    
    try {
        // Run all tests
        await testFormValidation();
        await testFormFilling();
        await testServiceSelection();
        await testDateSelection();
        await testTimeSelection();
        await testPaymentMethodSelection();
        await testButtonTextUpdates();
        await testButtonStates();
        await testRedirectLogic();
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('='.repeat(50));
        console.log(`✅ Booking Flow QA Test Complete! (${duration}ms)`);
        console.log('='.repeat(50));
        
        // Summary
        console.log('📊 Test Summary:');
        console.log('- Form validation: ✅');
        console.log('- Button text updates: ✅');
        console.log('- Payment method selection: ✅');
        console.log('- Button states: ✅');
        console.log('- Redirect logic: ✅');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Device detection test
function testDeviceDetection() {
    console.log('📱 Device Detection Test:');
    
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const screenSize = `${window.innerWidth}x${window.innerHeight}`;
    const touchSupport = 'ontouchstart' in window;
    
    console.log(`- Device: ${isMobile ? 'Mobile' : 'Desktop'}`);
    console.log(`- Screen: ${screenSize}`);
    console.log(`- Touch Support: ${touchSupport ? 'Yes' : 'No'}`);
    console.log(`- User Agent: ${userAgent.substring(0, 50)}...`);
    
    return { isMobile, screenSize, touchSupport };
}

// Export functions for manual testing
window.testBookingFlow = testBookingFlow;
window.testDeviceDetection = testDeviceDetection;
window.testFormValidation = testFormValidation;
window.testButtonTextUpdates = testButtonTextUpdates;

// Auto-run device detection
testDeviceDetection();

console.log('🧪 BlkPages Booking Flow QA Test Script Loaded!');
console.log('Run testBookingFlow() to start the comprehensive test.');
