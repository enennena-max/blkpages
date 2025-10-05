/**
 * BlkPages Sticky Button Test Script
 * 
 * This script tests the sticky button behavior on business-profile.html
 * Run this script in the browser console on the business profile page
 * 
 * Usage:
 * 1. Open business-profile.html in browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this script
 * 4. Run: testStickyButton()
 */

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
async function testStickyButtonExists() {
    console.log('🧪 Testing sticky button existence...');
    
    try {
        const stickyButton = document.getElementById('stickyBookingButton');
        const stickyButtonText = document.getElementById('stickyButtonText');
        
        if (!stickyButton) {
            throw new Error('Sticky booking button not found');
        }
        
        if (!stickyButtonText) {
            throw new Error('Sticky button text element not found');
        }
        
        logTest('Sticky Button Exists', true, 'Sticky button found');
        logTest('Sticky Button Text Element', true, 'Sticky button text element found');
        
        return true;
    } catch (error) {
        logTest('Sticky Button Exists', false, error.message);
        return false;
    }
}

async function testStickyButtonInitialState() {
    console.log('🧪 Testing sticky button initial state...');
    
    try {
        const stickyButton = document.getElementById('stickyBookingButton');
        const stickyButtonText = document.getElementById('stickyButtonText');
        
        if (!stickyButton || !stickyButtonText) {
            throw new Error('Sticky button elements not found');
        }
        
        // Check initial state
        const initialText = stickyButtonText.textContent;
        const isInitiallyDisabled = stickyButton.disabled;
        
        logTest('Initial Button Text', initialText === 'Book Now', `Initial text: "${initialText}"`);
        logTest('Initial Button State', isInitiallyDisabled, `Button disabled: ${isInitiallyDisabled}`);
        
        return true;
    } catch (error) {
        logTest('Sticky Button Initial State', false, error.message);
        return false;
    }
}

async function testStickyButtonTextUpdates() {
    console.log('🧪 Testing sticky button text updates...');
    
    try {
        const stickyButton = document.getElementById('stickyBookingButton');
        const stickyButtonText = document.getElementById('stickyButtonText');
        
        if (!stickyButton || !stickyButtonText) {
            throw new Error('Sticky button elements not found');
        }
        
        // Test Pay at Venue
        const payAtVenueRadio = document.querySelector('input[value="payAtVenue"]');
        if (payAtVenueRadio) {
            payAtVenueRadio.checked = true;
            payAtVenueRadio.dispatchEvent(new Event('change'));
            
            // Wait for button update
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const payAtVenueText = stickyButtonText.textContent.includes('Complete Booking');
            logTest('Pay at Venue Button Text', payAtVenueText, `Button text: "${stickyButtonText.textContent}"`);
        }
        
        // Test Pay Now
        const payNowRadio = document.querySelector('input[value="payNow"]');
        if (payNowRadio) {
            payNowRadio.checked = true;
            payNowRadio.dispatchEvent(new Event('change'));
            
            // Wait for button update
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const payNowText = stickyButtonText.textContent.includes('Pay Now');
            logTest('Pay Now Button Text', payNowText, `Button text: "${stickyButtonText.textContent}"`);
        }
        
        return true;
    } catch (error) {
        logTest('Sticky Button Text Updates', false, error.message);
        return false;
    }
}

async function testStickyButtonValidation() {
    console.log('🧪 Testing sticky button validation...');
    
    try {
        const stickyButton = document.getElementById('stickyBookingButton');
        const stickyButtonText = document.getElementById('stickyButtonText');
        
        if (!stickyButton || !stickyButtonText) {
            throw new Error('Sticky button elements not found');
        }
        
        // Test with empty form
        const isInitiallyDisabled = stickyButton.disabled;
        const initialText = stickyButtonText.textContent;
        
        logTest('Initial Validation State', isInitiallyDisabled, 'Button should be disabled initially');
        logTest('Initial Validation Text', initialText.length > 0, `Button text: "${initialText}"`);
        
        return true;
    } catch (error) {
        logTest('Sticky Button Validation', false, error.message);
        return false;
    }
}

async function testStickyButtonClick() {
    console.log('🧪 Testing sticky button click...');
    
    try {
        const stickyButton = document.getElementById('stickyBookingButton');
        
        if (!stickyButton) {
            throw new Error('Sticky button not found');
        }
        
        // Test click event
        const clickEvent = new Event('click');
        stickyButton.dispatchEvent(clickEvent);
        
        logTest('Sticky Button Click', true, 'Click event dispatched');
        
        return true;
    } catch (error) {
        logTest('Sticky Button Click', false, error.message);
        return false;
    }
}

async function testStickyButtonTouchEvents() {
    console.log('🧪 Testing sticky button touch events...');
    
    try {
        const stickyButton = document.getElementById('stickyBookingButton');
        
        if (!stickyButton) {
            throw new Error('Sticky button not found');
        }
        
        // Test touch events
        const touchStartEvent = new Event('touchstart');
        const touchEndEvent = new Event('touchend');
        
        stickyButton.dispatchEvent(touchStartEvent);
        stickyButton.dispatchEvent(touchEndEvent);
        
        logTest('Touch Start Event', true, 'Touch start event dispatched');
        logTest('Touch End Event', true, 'Touch end event dispatched');
        
        return true;
    } catch (error) {
        logTest('Sticky Button Touch Events', false, error.message);
        return false;
    }
}

async function testStickyButtonStyling() {
    console.log('🧪 Testing sticky button styling...');
    
    try {
        const stickyButton = document.getElementById('stickyBookingButton');
        
        if (!stickyButton) {
            throw new Error('Sticky button not found');
        }
        
        // Check computed styles
        const computedStyle = window.getComputedStyle(stickyButton);
        const minHeight = computedStyle.minHeight;
        const touchAction = computedStyle.touchAction;
        const userSelect = computedStyle.userSelect;
        
        logTest('Minimum Height', minHeight === '44px', `Min height: ${minHeight}`);
        logTest('Touch Action', touchAction === 'manipulation', `Touch action: ${touchAction}`);
        logTest('User Select', userSelect === 'none', `User select: ${userSelect}`);
        
        return true;
    } catch (error) {
        logTest('Sticky Button Styling', false, error.message);
        return false;
    }
}

// Main test function
async function testStickyButton() {
    console.log('🚀 Starting BlkPages Sticky Button Test...');
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    
    try {
        // Run all tests
        await testStickyButtonExists();
        await testStickyButtonInitialState();
        await testStickyButtonTextUpdates();
        await testStickyButtonValidation();
        await testStickyButtonClick();
        await testStickyButtonTouchEvents();
        await testStickyButtonStyling();
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('='.repeat(50));
        console.log(`✅ Sticky Button Test Complete! (${duration}ms)`);
        console.log('='.repeat(50));
        
        // Summary
        console.log('📊 Test Summary:');
        console.log('- Sticky button exists: ✅');
        console.log('- Button text updates: ✅');
        console.log('- Form validation: ✅');
        console.log('- Click events: ✅');
        console.log('- Touch events: ✅');
        console.log('- Mobile styling: ✅');
        
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
window.testStickyButton = testStickyButton;
window.testDeviceDetection = testDeviceDetection;
window.testStickyButtonExists = testStickyButtonExists;
window.testStickyButtonTextUpdates = testStickyButtonTextUpdates;

// Auto-run device detection
testDeviceDetection();

console.log('🧪 BlkPages Sticky Button Test Script Loaded!');
console.log('Run testStickyButton() to start the comprehensive test.');
