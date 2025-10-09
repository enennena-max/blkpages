/**
 * Persistent Customer Basket System
 * Handles basket persistence for unsigned users and auto-population on booking
 */

class PersistentBasketSystem {
    constructor() {
        this.basketKey = 'pending_basket';
        this.basketTimestampKey = 'basket_timestamp';
        this.basketExpiryHours = 24;
        this.isLoggedIn = false;
        this.customerId = null;
        this.initialized = false;
    }
    
    /**
     * Initialize the persistent basket system
     */
    init() {
        if (this.initialized) return;
        
        // Check if user is logged in
        this.checkLoginStatus();
        
        // Clean up expired baskets
        this.cleanupExpiredBaskets();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up mobile behavior
        this.setupMobileBehavior();
        
        // Load existing basket
        this.loadBasket();
        
        // Handle page navigation
        this.handlePageNavigation();
        
        this.initialized = true;
        console.log('Persistent Basket System initialized');
    }
    
    /**
     * Check if user is logged in
     */
    checkLoginStatus() {
        const customerId = localStorage.getItem('customerId');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        this.customerId = customerId;
        this.isLoggedIn = isLoggedIn;
        
        console.log('Login status:', { isLoggedIn, customerId });
    }
    
    /**
     * Clean up expired baskets
     */
    cleanupExpiredBaskets() {
        const timestamp = localStorage.getItem(this.basketTimestampKey);
        if (!timestamp) return;
        
        const basketAge = Date.now() - parseInt(timestamp);
        const expiryTime = this.basketExpiryHours * 60 * 60 * 1000; // 24 hours in ms
        
        if (basketAge > expiryTime) {
            console.log('Basket expired, clearing...');
            this.clearPendingBasket();
        }
    }
    
    /**
     * Set up event listeners for login/signup events
     */
    setupEventListeners() {
        // Listen for login events
        window.addEventListener('customer.login', (event) => {
            this.handleLogin(event.detail);
        });
        
        // Listen for signup events
        window.addEventListener('customer.signup', (event) => {
            this.handleSignup(event.detail);
        });
        
        // Listen for logout events
        window.addEventListener('customer.logout', () => {
            this.handleLogout();
        });
        
        // Listen for service additions
        window.addEventListener('service.added', (event) => {
            this.addServiceToBasket(event.detail);
        });
        
        // Listen for service removals
        window.addEventListener('service.removed', (event) => {
            this.removeServiceFromBasket(event.detail);
        });
    }
    
    /**
     * Add service to basket
     * @param {Object} serviceData - Service information
     */
    addServiceToBasket(serviceData) {
        const basketItem = {
            business_id: serviceData.businessId || serviceData.business_id,
            service_id: serviceData.serviceId || serviceData.id,
            service_name: serviceData.name,
            price: serviceData.price,
            duration: serviceData.duration,
            quantity: serviceData.quantity || 1,
            added_at: Date.now()
        };
        
        // Check for edge cases
        const edgeCaseResult = this.handleEdgeCases(basketItem);
        if (!edgeCaseResult.canProceed) {
            return edgeCaseResult;
        }
        
        if (this.isLoggedIn) {
            this.addToUserBasket(basketItem);
        } else {
            this.addToPendingBasket(basketItem);
        }
        
        console.log('Service added to basket:', basketItem);
        return { success: true, basketItem };
    }
    
    /**
     * Handle edge cases for basket operations
     * @param {Object} basketItem - New basket item
     * @returns {Object} Edge case result
     */
    handleEdgeCases(basketItem) {
        const currentBasket = this.getCurrentBasket();
        
        // Check if basket belongs to different business
        if (currentBasket.length > 0) {
            const existingBusinessId = currentBasket[0].business_id;
            if (existingBusinessId && existingBusinessId !== basketItem.business_id) {
                return {
                    canProceed: false,
                    type: 'different_business',
                    message: 'You already have items from another business. Clear basket to continue?',
                    action: 'show_business_warning'
                };
            }
        }
        
        // Check if service availability changed
        const serviceChanged = this.checkServiceAvailability(basketItem);
        if (serviceChanged) {
            return {
                canProceed: false,
                type: 'service_changed',
                message: 'Service availability has changed. Please refresh to see updated prices.',
                action: 'show_service_warning'
            };
        }
        
        return { canProceed: true };
    }
    
    /**
     * Check if service availability has changed
     * @param {Object} basketItem - Basket item to check
     * @returns {boolean} Whether service has changed
     */
    checkServiceAvailability(basketItem) {
        // Simulate checking service availability
        // In real implementation, this would check against current business data
        const currentBasket = this.getCurrentBasket();
        const existingItem = currentBasket.find(item => item.service_id === basketItem.service_id);
        
        if (existingItem) {
            // Check if price has changed
            if (existingItem.price !== basketItem.price) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Show business warning modal
     * @param {Object} basketItem - New basket item
     */
    showBusinessWarning(basketItem) {
        const modal = document.createElement('div');
        modal.className = 'basket-warning-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Different Business Detected</h3>
                <p>You already have items from another business in your basket.</p>
                <p>Would you like to clear your current basket and add this item?</p>
                <div class="modal-actions">
                    <button class="btn-clear-basket" onclick="persistentBasketSystem.clearBasketAndAdd('${JSON.stringify(basketItem).replace(/"/g, '&quot;')}')">
                        Clear & Add
                    </button>
                    <button class="btn-cancel" onclick="this.closest('.basket-warning-modal').remove()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Show service warning modal
     * @param {Object} basketItem - Basket item with changes
     */
    showServiceWarning(basketItem) {
        const modal = document.createElement('div');
        modal.className = 'basket-warning-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Service Updated</h3>
                <p>This service has been updated since you last viewed it.</p>
                <p>New price: £${basketItem.price}</p>
                <div class="modal-actions">
                    <button class="btn-refresh" onclick="location.reload()">
                        Refresh Page
                    </button>
                    <button class="btn-cancel" onclick="this.closest('.basket-warning-modal').remove()">
                        Continue Anyway
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Clear basket and add new item
     * @param {string} basketItemJson - JSON string of basket item
     */
    clearBasketAndAdd(basketItemJson) {
        try {
            const basketItem = JSON.parse(basketItemJson);
            this.clearCurrentBasket();
            this.addServiceToBasket(basketItem);
            
            // Remove modal
            const modal = document.querySelector('.basket-warning-modal');
            if (modal) modal.remove();
            
            this.showNotification('Basket cleared and new item added!', 'success');
        } catch (error) {
            console.error('Error clearing basket and adding item:', error);
        }
    }
    
    /**
     * Remove service from basket
     * @param {Object} serviceData - Service information
     */
    removeServiceFromBasket(serviceData) {
        const serviceId = serviceData.serviceId || serviceData.id;
        
        if (this.isLoggedIn) {
            this.removeFromUserBasket(serviceId);
        } else {
            this.removeFromPendingBasket(serviceId);
        }
        
        console.log('Service removed from basket:', serviceId);
    }
    
    /**
     * Add service to pending basket (for unsigned users)
     * @param {Object} basketItem - Basket item to add
     */
    addToPendingBasket(basketItem) {
        const pendingBasket = this.getPendingBasket();
        
        // Check if service already exists
        const existingIndex = pendingBasket.findIndex(item => 
            item.service_id === basketItem.service_id && 
            item.business_id === basketItem.business_id
        );
        
        if (existingIndex >= 0) {
            // Update quantity
            pendingBasket[existingIndex].quantity += basketItem.quantity;
        } else {
            // Add new item
            pendingBasket.push(basketItem);
        }
        
        this.savePendingBasket(pendingBasket);
        this.updateBasketDisplay();
    }
    
    /**
     * Remove service from pending basket
     * @param {string} serviceId - Service ID to remove
     */
    removeFromPendingBasket(serviceId) {
        const pendingBasket = this.getPendingBasket();
        const filteredBasket = pendingBasket.filter(item => item.service_id !== serviceId);
        this.savePendingBasket(filteredBasket);
        this.updateBasketDisplay();
    }
    
    /**
     * Get pending basket from localStorage
     * @returns {Array} Pending basket items
     */
    getPendingBasket() {
        try {
            const basket = localStorage.getItem(this.basketKey);
            return basket ? JSON.parse(basket) : [];
        } catch (error) {
            console.error('Error reading pending basket:', error);
            return [];
        }
    }
    
    /**
     * Save pending basket to localStorage
     * @param {Array} basket - Basket items to save
     */
    savePendingBasket(basket) {
        try {
            localStorage.setItem(this.basketKey, JSON.stringify(basket));
            localStorage.setItem(this.basketTimestampKey, Date.now().toString());
        } catch (error) {
            console.error('Error saving pending basket:', error);
        }
    }
    
    /**
     * Clear pending basket
     */
    clearPendingBasket() {
        localStorage.removeItem(this.basketKey);
        localStorage.removeItem(this.basketTimestampKey);
        this.updateBasketDisplay();
    }
    
    /**
     * Handle customer login
     * @param {Object} loginData - Login event data
     */
    async handleLogin(loginData) {
        console.log('Handling customer login:', loginData);
        
        this.isLoggedIn = true;
        this.customerId = loginData.customerId;
        
        // Update localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('customerId', loginData.customerId);
        
        // Merge pending basket if exists
        const pendingBasket = this.getPendingBasket();
        if (pendingBasket.length > 0) {
            await this.mergePendingBasket(loginData.customerId, pendingBasket);
        }
        
        // Load user's saved basket
        await this.loadUserBasket(loginData.customerId);
        
        // Auto-populate booking form
        await this.autoPopulateBookingForm(loginData.customerId);
        
        console.log('Login handling completed');
    }
    
    /**
     * Handle customer signup
     * @param {Object} signupData - Signup event data
     */
    async handleSignup(signupData) {
        console.log('Handling customer signup:', signupData);
        
        this.isLoggedIn = true;
        this.customerId = signupData.customerId;
        
        // Update localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('customerId', signupData.customerId);
        
        // Merge pending basket if exists
        const pendingBasket = this.getPendingBasket();
        if (pendingBasket.length > 0) {
            await this.mergePendingBasket(signupData.customerId, pendingBasket);
        }
        
        // Auto-populate booking form with signup data
        await this.autoPopulateBookingForm(signupData.customerId, signupData.profile);
        
        console.log('Signup handling completed');
    }
    
    /**
     * Handle customer logout
     */
    handleLogout() {
        console.log('Handling customer logout');
        
        // Clear sensitive data for security
        this.clearSensitiveData();
        
        this.isLoggedIn = false;
        this.customerId = null;
        
        // Update localStorage
        localStorage.setItem('isLoggedIn', 'false');
        localStorage.removeItem('customerId');
        
        // Clear user basket from localStorage (security measure)
        if (this.customerId) {
            localStorage.removeItem(`user_basket_${this.customerId}`);
        }
        
        // Load pending basket if exists
        this.loadBasket();
        
        console.log('Logout handling completed');
    }
    
    /**
     * Clear sensitive data for security
     */
    clearSensitiveData() {
        // Clear user-specific data
        if (this.customerId) {
            localStorage.removeItem(`user_basket_${this.customerId}`);
            localStorage.removeItem(`user_profile_${this.customerId}`);
        }
        
        // Clear session data
        sessionStorage.removeItem('basket_navigation_state');
        sessionStorage.removeItem('basket_navigation_route');
        
        // Clear any cached profile data
        this.cachedProfile = null;
        
        console.log('Sensitive data cleared for security');
    }
    
    /**
     * Merge pending basket with user's saved basket
     * @param {string} customerId - Customer ID
     * @param {Array} pendingBasket - Pending basket items
     */
    async mergePendingBasket(customerId, pendingBasket) {
        try {
            console.log('Merging pending basket for customer:', customerId);
            
            // Simulate API call to merge basket
            const response = await this.callBasketMergeAPI(customerId, pendingBasket);
            
            if (response.success) {
                console.log('Basket merged successfully');
                this.clearPendingBasket();
                
                // Show success notification
                this.showNotification('Basket items saved to your account!', 'success');
            } else {
                console.error('Failed to merge basket:', response.error);
                this.showNotification('Failed to save basket items', 'error');
            }
        } catch (error) {
            console.error('Error merging basket:', error);
            this.showNotification('Error saving basket items', 'error');
        }
    }
    
    /**
     * Call basket merge API
     * @param {string} customerId - Customer ID
     * @param {Array} basketItems - Basket items to merge
     * @returns {Object} API response
     */
    async callBasketMergeAPI(customerId, basketItems) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate successful merge
                const mergedBasket = this.simulateBasketMerge(customerId, basketItems);
                resolve({
                    success: true,
                    basket: mergedBasket
                });
            }, 500);
        });
    }
    
    /**
     * Simulate basket merge logic
     * @param {string} customerId - Customer ID
     * @param {Array} basketItems - Basket items to merge
     * @returns {Object} Merged basket
     */
    simulateBasketMerge(customerId, basketItems) {
        // Get existing user basket
        const existingBasket = this.getUserBasket(customerId);
        
        // Merge items
        const mergedItems = [...existingBasket.items];
        
        basketItems.forEach(newItem => {
            const existingIndex = mergedItems.findIndex(item => 
                item.service_id === newItem.service_id && 
                item.business_id === newItem.business_id
            );
            
            if (existingIndex >= 0) {
                // Update quantity
                mergedItems[existingIndex].quantity += newItem.quantity;
            } else {
                // Add new item
                mergedItems.push(newItem);
            }
        });
        
        // Save merged basket
        const mergedBasket = {
            customer_id: customerId,
            items: mergedItems,
            updated_at: new Date().toISOString()
        };
        
        this.saveUserBasket(customerId, mergedBasket);
        
        return mergedBasket;
    }
    
    /**
     * Load user's saved basket
     * @param {string} customerId - Customer ID
     */
    async loadUserBasket(customerId) {
        try {
            const userBasket = this.getUserBasket(customerId);
            console.log('Loaded user basket:', userBasket);
            this.updateBasketDisplay();
        } catch (error) {
            console.error('Error loading user basket:', error);
        }
    }
    
    /**
     * Get user's saved basket
     * @param {string} customerId - Customer ID
     * @returns {Object} User basket
     */
    getUserBasket(customerId) {
        try {
            const basket = localStorage.getItem(`user_basket_${customerId}`);
            return basket ? JSON.parse(basket) : { customer_id: customerId, items: [], updated_at: null };
        } catch (error) {
            console.error('Error reading user basket:', error);
            return { customer_id: customerId, items: [], updated_at: null };
        }
    }
    
    /**
     * Save user's basket
     * @param {string} customerId - Customer ID
     * @param {Object} basket - Basket to save
     */
    saveUserBasket(customerId, basket) {
        try {
            localStorage.setItem(`user_basket_${customerId}`, JSON.stringify(basket));
        } catch (error) {
            console.error('Error saving user basket:', error);
        }
    }
    
    /**
     * Add service to user's basket
     * @param {Object} basketItem - Basket item to add
     */
    addToUserBasket(basketItem) {
        const userBasket = this.getUserBasket(this.customerId);
        
        // Check if service already exists
        const existingIndex = userBasket.items.findIndex(item => 
            item.service_id === basketItem.service_id && 
            item.business_id === basketItem.business_id
        );
        
        if (existingIndex >= 0) {
            // Update quantity
            userBasket.items[existingIndex].quantity += basketItem.quantity;
        } else {
            // Add new item
            userBasket.items.push(basketItem);
        }
        
        userBasket.updated_at = new Date().toISOString();
        this.saveUserBasket(this.customerId, userBasket);
        this.updateBasketDisplay();
    }
    
    /**
     * Remove service from user's basket
     * @param {string} serviceId - Service ID to remove
     */
    removeFromUserBasket(serviceId) {
        const userBasket = this.getUserBasket(this.customerId);
        userBasket.items = userBasket.items.filter(item => item.service_id !== serviceId);
        userBasket.updated_at = new Date().toISOString();
        this.saveUserBasket(this.customerId, userBasket);
        this.updateBasketDisplay();
    }
    
    /**
     * Auto-populate booking form with customer profile data
     * @param {string} customerId - Customer ID
     * @param {Object} profileData - Optional profile data from signup
     */
    async autoPopulateBookingForm(customerId, profileData = null) {
        try {
            console.log('Auto-populating booking form for customer:', customerId);
            
            let customerProfile;
            
            if (profileData) {
                // Use profile data from signup
                customerProfile = profileData;
            } else {
                // Fetch customer profile
                customerProfile = await this.getCustomerProfile(customerId);
            }
            
            if (customerProfile) {
                this.populateFormFields(customerProfile);
                this.showNotification('Form auto-populated with your details!', 'success');
            }
        } catch (error) {
            console.error('Error auto-populating form:', error);
        }
    }
    
    /**
     * Get customer profile data
     * @param {string} customerId - Customer ID
     * @returns {Object} Customer profile
     */
    async getCustomerProfile(customerId) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate customer profile data
                const profile = {
                    id: customerId,
                    first_name: 'John',
                    last_name: 'Smith',
                    email: 'john.smith@example.com',
                    phone: '07123456789',
                    postcode: 'SW1A 1AA'
                };
                resolve(profile);
            }, 300);
        });
    }
    
    /**
     * Populate form fields with customer data
     * @param {Object} profile - Customer profile data
     */
    populateFormFields(profile) {
        // Populate full name
        const fullNameField = document.getElementById('fullName');
        if (fullNameField && profile.first_name && profile.last_name) {
            fullNameField.value = `${profile.first_name} ${profile.last_name}`;
            fullNameField.classList.add('auto-populated');
        }
        
        // Populate email
        const emailField = document.getElementById('email');
        if (emailField && profile.email) {
            emailField.value = profile.email;
            emailField.classList.add('auto-populated');
            // Optionally disable email field to prevent mismatch
            // emailField.disabled = true;
        }
        
        // Populate phone
        const phoneField = document.getElementById('phone');
        if (phoneField && profile.phone) {
            phoneField.value = profile.phone;
            phoneField.classList.add('auto-populated');
        }
        
        // Populate postcode
        const postcodeField = document.getElementById('postcode');
        if (postcodeField && profile.postcode) {
            postcodeField.value = profile.postcode.toUpperCase();
            postcodeField.classList.add('auto-populated');
        }
        
        // Focus on first blank field or booking notes
        this.focusFirstBlankField();
        
        console.log('Form fields populated with customer data');
    }
    
    /**
     * Focus on first blank field
     */
    focusFirstBlankField() {
        const fields = ['fullName', 'email', 'phone', 'postcode', 'bookingNotes'];
        
        for (const fieldId of fields) {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                field.focus();
                break;
            }
        }
    }
    
    /**
     * Load basket (pending or user's saved basket)
     */
    loadBasket() {
        if (this.isLoggedIn && this.customerId) {
            this.loadUserBasket(this.customerId);
        } else {
            this.updateBasketDisplay();
        }
    }
    
    /**
     * Update basket display
     */
    updateBasketDisplay() {
        let basketItems = [];
        
        if (this.isLoggedIn && this.customerId) {
            const userBasket = this.getUserBasket(this.customerId);
            basketItems = userBasket.items || [];
        } else {
            basketItems = this.getPendingBasket();
        }
        
        // Update basket count
        const totalItems = basketItems.reduce((sum, item) => sum + item.quantity, 0);
        this.updateBasketCount(totalItems);
        
        // Update basket summary
        this.updateBasketSummary(basketItems);
        
        console.log('Basket display updated:', { totalItems, basketItems });
    }
    
    /**
     * Update basket count display
     * @param {number} count - Number of items in basket
     */
    updateBasketCount(count) {
        const basketCountElements = document.querySelectorAll('.basket-count');
        basketCountElements.forEach(element => {
            element.textContent = count;
            element.style.display = count > 0 ? 'inline' : 'none';
        });
    }
    
    /**
     * Update basket summary display
     * @param {Array} basketItems - Basket items
     */
    updateBasketSummary(basketItems) {
        const basketSummary = document.getElementById('basket-summary');
        if (!basketSummary) return;
        
        if (basketItems.length === 0) {
            basketSummary.innerHTML = '<p>Your basket is empty</p>';
            return;
        }
        
        const totalPrice = basketItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        basketSummary.innerHTML = `
            <h3>Your Basket</h3>
            <div class="basket-items">
                ${basketItems.map(item => `
                    <div class="basket-item">
                        <span class="service-name">${item.service_name}</span>
                        <span class="service-price">£${item.price}</span>
                        <span class="service-quantity">x${item.quantity}</span>
                    </div>
                `).join('')}
            </div>
            <div class="basket-total">
                <strong>Total: £${totalPrice.toFixed(2)}</strong>
            </div>
        `;
    }
    
    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    /**
     * Set up mobile behavior
     */
    setupMobileBehavior() {
        // Save current route for mobile navigation
        this.saveCurrentRoute();
        
        // Set up page visibility handling
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handlePageReturn();
            }
        });
        
        // Set up beforeunload to save state
        window.addEventListener('beforeunload', () => {
            this.saveNavigationState();
        });
        
        // Set up mobile-specific touch events
        this.setupMobileTouchEvents();
    }
    
    /**
     * Save current route for mobile navigation
     */
    saveCurrentRoute() {
        const currentRoute = {
            path: window.location.pathname,
            hash: window.location.hash,
            timestamp: Date.now()
        };
        
        sessionStorage.setItem('basket_navigation_route', JSON.stringify(currentRoute));
    }
    
    /**
     * Handle page navigation
     */
    handlePageNavigation() {
        // Check if returning from login/signup
        const savedRoute = sessionStorage.getItem('basket_navigation_route');
        if (savedRoute) {
            const route = JSON.parse(savedRoute);
            const timeDiff = Date.now() - route.timestamp;
            
            // If returning within 5 minutes, restore navigation state
            if (timeDiff < 300000) { // 5 minutes
                this.restoreNavigationState(route);
            }
        }
    }
    
    /**
     * Handle page return (mobile behavior)
     */
    handlePageReturn() {
        // Smooth scroll to basket section if exists
        const basketSection = document.getElementById('basket-section') || 
                             document.querySelector('.basket-display') ||
                             document.querySelector('.booking-section');
        
        if (basketSection) {
            setTimeout(() => {
                basketSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 100);
        }
        
        // Update basket display
        this.updateBasketDisplay();
    }
    
    /**
     * Set up mobile touch events
     */
    setupMobileTouchEvents() {
        // Add touch feedback for mobile
        document.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('add-service-btn')) {
                e.target.style.transform = 'scale(0.95)';
            }
        });
        
        document.addEventListener('touchend', (e) => {
            if (e.target.classList.contains('add-service-btn')) {
                e.target.style.transform = 'scale(1)';
            }
        });
    }
    
    /**
     * Save navigation state
     */
    saveNavigationState() {
        const navigationState = {
            basketItems: this.getCurrentBasket(),
            isLoggedIn: this.isLoggedIn,
            customerId: this.customerId,
            timestamp: Date.now()
        };
        
        sessionStorage.setItem('basket_navigation_state', JSON.stringify(navigationState));
    }
    
    /**
     * Restore navigation state
     * @param {Object} route - Saved route information
     */
    restoreNavigationState(route) {
        const savedState = sessionStorage.getItem('basket_navigation_state');
        if (savedState) {
            const state = JSON.parse(savedState);
            const timeDiff = Date.now() - state.timestamp;
            
            // Restore if within 5 minutes
            if (timeDiff < 300000) {
                console.log('Restoring navigation state');
                this.updateBasketDisplay();
            }
        }
    }
    
    /**
     * Get current basket items
     * @returns {Array} Current basket items
     */
    getCurrentBasket() {
        if (this.isLoggedIn && this.customerId) {
            const userBasket = this.getUserBasket(this.customerId);
            return userBasket.items || [];
        } else {
            return this.getPendingBasket();
        }
    }
    
    /**
     * Clear current basket
     */
    clearCurrentBasket() {
        if (this.isLoggedIn && this.customerId) {
            this.saveUserBasket(this.customerId, { customer_id: this.customerId, items: [], updated_at: new Date().toISOString() });
        } else {
            this.clearPendingBasket();
        }
        this.updateBasketDisplay();
    }
    
    /**
     * Save payment preference for returning customers
     * @param {string} paymentMethod - Preferred payment method
     */
    savePaymentPreference(paymentMethod) {
        if (this.isLoggedIn && this.customerId) {
            const preferences = this.getUserPreferences();
            preferences.payment_method = paymentMethod;
            preferences.updated_at = new Date().toISOString();
            
            localStorage.setItem(`user_preferences_${this.customerId}`, JSON.stringify(preferences));
            console.log('Payment preference saved:', paymentMethod);
        }
    }
    
    /**
     * Get user preferences
     * @returns {Object} User preferences
     */
    getUserPreferences() {
        if (!this.customerId) return {};
        
        try {
            const preferences = localStorage.getItem(`user_preferences_${this.customerId}`);
            return preferences ? JSON.parse(preferences) : {};
        } catch (error) {
            console.error('Error reading user preferences:', error);
            return {};
        }
    }
    
    /**
     * Save "Remember my details" preference
     * @param {boolean} remember - Whether to remember details
     */
    saveRememberDetailsPreference(remember) {
        if (this.isLoggedIn && this.customerId) {
            const preferences = this.getUserPreferences();
            preferences.remember_details = remember;
            preferences.updated_at = new Date().toISOString();
            
            localStorage.setItem(`user_preferences_${this.customerId}`, JSON.stringify(preferences));
            console.log('Remember details preference saved:', remember);
        }
    }
    
    /**
     * Send basket recovered event for analytics
     */
    sendBasketRecoveredEvent() {
        const basketItems = this.getCurrentBasket();
        if (basketItems.length > 0) {
            const eventData = {
                event: 'basket_recovered',
                items_count: basketItems.length,
                total_value: basketItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                is_logged_in: this.isLoggedIn,
                timestamp: new Date().toISOString()
            };
            
            // Send to analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'basket_recovered', {
                    'event_category': 'basket',
                    'event_label': 'recovery',
                    'value': eventData.total_value
                });
            }
            
            // Log for debugging
            console.log('Basket recovered event:', eventData);
            
            return eventData;
        }
        return null;
    }
    
    /**
     * Add "Clear Basket" functionality
     */
    addClearBasketButton() {
        const basketDisplay = document.getElementById('basketDisplay') || 
                             document.querySelector('.basket-display');
        
        if (basketDisplay && !document.getElementById('clearBasketBtn')) {
            const clearButton = document.createElement('button');
            clearButton.id = 'clearBasketBtn';
            clearButton.className = 'btn-clear-basket';
            clearButton.innerHTML = '<i class="fas fa-trash"></i> Clear Basket';
            clearButton.onclick = () => this.confirmClearBasket();
            
            basketDisplay.appendChild(clearButton);
        }
    }
    
    /**
     * Confirm basket clearing
     */
    confirmClearBasket() {
        if (confirm('Are you sure you want to clear your basket? This action cannot be undone.')) {
            this.clearCurrentBasket();
            this.showNotification('Basket cleared successfully', 'success');
        }
    }
    
    /**
     * Enhanced basket display with clear button
     */
    updateBasketDisplay() {
        let basketItems = [];
        
        if (this.isLoggedIn && this.customerId) {
            const userBasket = this.getUserBasket(this.customerId);
            basketItems = userBasket.items || [];
        } else {
            basketItems = this.getPendingBasket();
        }
        
        // Update basket count
        const totalItems = basketItems.reduce((sum, item) => sum + item.quantity, 0);
        this.updateBasketCount(totalItems);
        
        // Update basket summary
        this.updateBasketSummary(basketItems);
        
        // Add clear basket button if items exist
        if (basketItems.length > 0) {
            this.addClearBasketButton();
        }
        
        // Send basket recovered event
        this.sendBasketRecoveredEvent();
        
        console.log('Basket display updated:', { totalItems, basketItems });
    }
}

// Create global instance
const persistentBasketSystem = new PersistentBasketSystem();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    persistentBasketSystem.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PersistentBasketSystem, persistentBasketSystem };
} else {
    window.PersistentBasketSystem = PersistentBasketSystem;
    window.persistentBasketSystem = persistentBasketSystem;
}
