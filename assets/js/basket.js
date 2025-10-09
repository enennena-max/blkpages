/**
 * BASKET ICON COUNT SYNC FIX
 * ==========================================================
 * PURPOSE:
 * Ensure the basket count icon displays the same number
 * on all customer-facing pages and stays synced in real time.
 * ==========================================================
 */

// Global basket functions using localStorage for consistency
function updateBasketBadge() {
    const basket = JSON.parse(localStorage.getItem('basket') || '[]');
    const badge = document.getElementById('basketCount');
    if (!badge) return;
    
    badge.textContent = basket.length > 0 ? basket.length : '';
    badge.style.display = basket.length > 0 ? 'flex' : 'none';
    
    // Also update any other basket count elements
    const basketCounts = document.querySelectorAll('.basket-count');
    basketCounts.forEach(count => {
        count.textContent = basket.length;
        count.style.display = basket.length > 0 ? 'inline' : 'none';
    });
}

function addToBasket(item) {
    let basket = JSON.parse(localStorage.getItem('basket') || '[]');
    
    // Check for single-business rule
    if (basket.length > 0 && basket[0].business_id !== item.business_id) {
        if (!confirm("Your current basket contains services from another business. Clear basket and continue?")) {
            return false;
        }
        basket = [];
    }
    
    // Add item with unique ID if not provided
    if (!item.id) {
        item.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    basket.push(item);
    localStorage.setItem('basket', JSON.stringify(basket));
    updateBasketBadge();
    
    // Trigger custom event for other scripts
    window.dispatchEvent(new CustomEvent('basketUpdated', { 
        detail: { action: 'add', item: item, basket: basket } 
    }));
    
    return true;
}

function removeFromBasket(itemId) {
    let basket = JSON.parse(localStorage.getItem('basket') || '[]');
    basket = basket.filter(i => i.id !== itemId);
    localStorage.setItem('basket', JSON.stringify(basket));
    updateBasketBadge();
    
    // Trigger custom event for other scripts
    window.dispatchEvent(new CustomEvent('basketUpdated', { 
        detail: { action: 'remove', itemId: itemId, basket: basket } 
    }));
}

function clearBasket() {
    localStorage.removeItem('basket');
    updateBasketBadge();
    
    // Trigger custom event for other scripts
    window.dispatchEvent(new CustomEvent('basketUpdated', { 
        detail: { action: 'clear', basket: [] } 
    }));
}

function getBasket() {
    return JSON.parse(localStorage.getItem('basket') || '[]');
}

function getBasketCount() {
    return getBasket().length;
}

// Clear basket on logout
function clearBasketOnLogout() {
    localStorage.removeItem('basket');
    updateBasketBadge();
}

// Session timeout management
let sessionTimeout = null;
let sessionWarningTimeout = null;
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 2 * 60 * 1000; // 2 minutes before timeout

function startSessionTimer() {
    // Clear existing timers
    if (sessionTimeout) clearTimeout(sessionTimeout);
    if (sessionWarningTimeout) clearTimeout(sessionWarningTimeout);
    
    // Set warning timer (28 minutes)
    sessionWarningTimeout = setTimeout(() => {
        showSessionWarning();
    }, SESSION_DURATION - WARNING_TIME);
    
    // Set session timeout (30 minutes)
    sessionTimeout = setTimeout(() => {
        handleSessionTimeout();
    }, SESSION_DURATION);
}

function showSessionWarning() {
    // Create warning modal
    const warningModal = document.createElement('div');
    warningModal.id = 'sessionWarningModal';
    warningModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    warningModal.innerHTML = `
        <div style="background: #1a1a1a; padding: 2rem; border-radius: 8px; border: 1px solid #333; max-width: 400px; text-align: center;">
            <div style="color: #F59E0B; font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
            <h3 style="color: #fff; margin-bottom: 1rem;">Session Expiring Soon</h3>
            <p style="color: #ccc; margin-bottom: 1.5rem;">Your session will expire in 2 minutes. Complete your booking or refresh to continue.</p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button onclick="refreshSession()" style="background: #0D9488; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: 600;">
                    Continue Session
                </button>
                <button onclick="closeSessionWarning()" style="background: #666; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer;">
                    Dismiss
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(warningModal);
}

function refreshSession() {
    startSessionTimer();
    closeSessionWarning();
    showSuccessMessage('Session refreshed! You have 30 minutes to complete your booking.');
}

function closeSessionWarning() {
    const modal = document.getElementById('sessionWarningModal');
    if (modal) modal.remove();
}

function handleSessionTimeout() {
    // Clear basket
    clearBasket();
    
    // Show timeout message
    showTimeoutMessage();
    
    // Clear any existing warnings
    closeSessionWarning();
}

function showTimeoutMessage() {
    const timeoutModal = document.createElement('div');
    timeoutModal.id = 'sessionTimeoutModal';
    timeoutModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;
    
    timeoutModal.innerHTML = `
        <div style="background: #1a1a1a; padding: 2rem; border-radius: 8px; border: 1px solid #EF4444; max-width: 400px; text-align: center;">
            <div style="color: #EF4444; font-size: 2rem; margin-bottom: 1rem;">⏰</div>
            <h3 style="color: #fff; margin-bottom: 1rem;">Session Expired</h3>
            <p style="color: #ccc; margin-bottom: 1.5rem;">Your session has expired for security and accuracy. Please start again.</p>
            <button onclick="restartSession()" style="background: #0D9488; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: 600;">
                Start Fresh
            </button>
        </div>
    `;
    
    document.body.appendChild(timeoutModal);
}

function restartSession() {
    const modal = document.getElementById('sessionTimeoutModal');
    if (modal) modal.remove();
    
    // Reset session
    startSessionTimer();
    showSuccessMessage('New session started! You have 30 minutes to complete your booking.');
}

// Auto-clear after successful checkout
function clearBasketAfterCheckout() {
    clearBasket();
    showSuccessMessage('Booking confirmed! Your basket has been cleared.');
}

// Partial clearing for unavailable slots
function removeUnavailableSlot(serviceId, slotInfo) {
    let basket = getBasket();
    const originalLength = basket.length;
    
    basket = basket.filter(item => !(item.id === serviceId && item.slotInfo === slotInfo));
    
    if (basket.length < originalLength) {
        localStorage.setItem('basket', JSON.stringify(basket));
        updateBasketBadge();
        
        showWarningMessage(`That slot has just been booked by another customer. Removed from your basket.`);
        
        // Trigger custom event
        window.dispatchEvent(new CustomEvent('basketUpdated', { 
            detail: { action: 'removeUnavailable', serviceId, slotInfo, basket: basket } 
        }));
    }
}

// Manual clearing with confirmation
function clearBasketWithConfirmation() {
    if (getBasketCount() === 0) {
        showInfoMessage('Your basket is already empty.');
        return;
    }
    
    if (confirm('Are you sure you want to empty your basket? This action cannot be undone.')) {
        clearBasket();
        showSuccessMessage('Basket cleared successfully.');
    }
}

// Enhanced addToBasket with business switching
function addToBasketWithBusinessCheck(item) {
    let basket = getBasket();
    
    // Check for different business
    if (basket.length > 0 && basket[0].business_id !== item.business_id) {
        if (confirm(`Your current basket contains services from "${basket[0].business}". Adding this service will clear your current basket. Continue?`)) {
            clearBasket();
            return addToBasket(item);
        } else {
            return false;
        }
    }
    
    return addToBasket(item);
}

// Message display functions
function showSuccessMessage(message) {
    showMessage(message, '#10B981');
}

function showWarningMessage(message) {
    showMessage(message, '#F59E0B');
}

function showInfoMessage(message) {
    showMessage(message, '#3B82F6');
}

function showMessage(message, color) {
    // Remove existing messages
    document.querySelectorAll('.basket-message').forEach(msg => msg.remove());
    
    const messageEl = document.createElement('div');
    messageEl.className = 'basket-message';
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        font-weight: 600;
        z-index: 9999;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 5000);
}

// Enhanced clearBasketOnLogout with GDPR compliance
function clearBasketOnLogout() {
    // Clear all basket-related data
    localStorage.removeItem('basket');
    localStorage.removeItem('booking_services');
    localStorage.removeItem('booking_date');
    localStorage.removeItem('booking_time');
    localStorage.removeItem('booking_customer');
    
    // Clear session timers
    if (sessionTimeout) clearTimeout(sessionTimeout);
    if (sessionWarningTimeout) clearTimeout(sessionWarningTimeout);
    
    updateBasketBadge();
    
    // Show privacy message
    showInfoMessage('Basket cleared for privacy. Your data has been removed.');
}

// Initialize basket badge on page load
document.addEventListener('DOMContentLoaded', function() {
    updateBasketBadge();
    startSessionTimer();
});

// Keep basket synced across tabs
window.addEventListener('storage', function(e) {
    if (e.key === 'basket') {
        updateBasketBadge();
    }
});

// Listen for custom basket events
window.addEventListener('basketUpdated', function(e) {
    console.log('Basket updated:', e.detail);
});

// Export functions for global use
window.updateBasketBadge = updateBasketBadge;
window.addToBasket = addToBasket;
window.removeFromBasket = removeFromBasket;
window.clearBasket = clearBasket;
window.getBasket = getBasket;
window.getBasketCount = getBasketCount;
window.clearBasketOnLogout = clearBasketOnLogout;
window.startSessionTimer = startSessionTimer;
window.clearBasketAfterCheckout = clearBasketAfterCheckout;
window.removeUnavailableSlot = removeUnavailableSlot;
window.clearBasketWithConfirmation = clearBasketWithConfirmation;
window.addToBasketWithBusinessCheck = addToBasketWithBusinessCheck;
window.refreshSession = refreshSession;
window.restartSession = restartSession;
