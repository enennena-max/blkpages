// Customer Authentication System
class CustomerAuth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.loadBasket();
        this.storeReturnUrl();
        this.handleUrlParameters(); // Add URL parameter handling
        this.ensureDefaultContext(); // Add default context handling
    }

    setupEventListeners() {
        // Registration form
        const registrationForm = document.getElementById('registrationForm');
        if (registrationForm) {
            registrationForm.addEventListener('submit', (e) => this.handleRegistration(e));
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Forgot password
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => this.showForgotPasswordModal(e));
        }

        // Forgot password form
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        }

        // Cancel reset
        const cancelReset = document.getElementById('cancelReset');
        if (cancelReset) {
            cancelReset.addEventListener('click', () => this.hideForgotPasswordModal());
        }

        // Password toggle
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Real-time validation
        this.setupRealTimeValidation();
    }

    setupRealTimeValidation() {
        // Email validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => this.validateEmail(emailInput.value));
        }

        // Password validation
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.validatePassword(passwordInput.value));
        }

        // Confirm password validation
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => this.validateConfirmPassword());
        }

        // Mobile validation
        const mobileInput = document.getElementById('mobile');
        if (mobileInput) {
            mobileInput.addEventListener('blur', () => this.validateMobile(mobileInput.value));
        }
    }

    async handleRegistration(e) {
        e.preventDefault();
        this.clearErrors();

        const formData = new FormData(e.target);
        const userData = {
            firstName: formData.get('firstName').trim(),
            lastName: formData.get('lastName').trim(),
            email: formData.get('email').trim().toLowerCase(),
            phone: formData.get('phone').trim(),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            acceptTerms: formData.get('acceptTerms')
        };

        // Validation
        if (!this.validateRegistration(userData)) {
            return;
        }

        try {
            // Show loading state
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating Account...';
            submitBtn.disabled = true;

            // Simulate API call
            await this.simulateApiCall(2000);

            // Store user data (in real app, this would be sent to server)
            const user = {
                id: this.generateUserId(),
                ...userData,
                emailVerified: false,
                createdAt: new Date().toISOString(),
                verificationToken: this.generateVerificationToken()
            };

            // Store in localStorage (in real app, this would be handled by server)
            localStorage.setItem('pendingUser', JSON.stringify(user));
            
            // Set the values that the existing checkLoginStatus function looks for
            localStorage.setItem('customerLoggedIn', 'true');
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userEmail', user.email);

            // Show success message
            alert('✅ Registration successful! You can now access the customer dashboard.');

            // Hide form
            e.target.style.display = 'none';
            
            // Update UI to show customer menu
            this.updateLoginUI(user);
            
            // Redirect after a short delay
            setTimeout(() => {
                this.redirectToOrigin();
            }, 2000);

        } catch (error) {
            this.showError('registrationError', 'Registration failed. Please try again.');
        } finally {
            // Reset button
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Create Account';
            submitBtn.disabled = false;
        }
    }

    async handleLogin(e) {
        console.log('handleLogin called', e);
        e.preventDefault();
        this.clearErrors();

        const formData = new FormData(e.target);
        const email = formData.get('email').trim().toLowerCase();
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe');

        console.log('Login attempt:', { email, password: password ? '***' : 'empty', rememberMe: !!rememberMe });

        // Validation
        if (!email || !password) {
            console.log('Validation failed: missing email or password');
            this.showError('emailError', 'Please enter both email and password.');
            return;
        }

        try {
            // Show loading state
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing In...';
            submitBtn.disabled = true;

            console.log('Starting login process...');

            // Simulate API call
            await this.simulateApiCall(1500);

            // For demo purposes, accept any email/password combination
            // In real app, verify against database
            const user = {
                id: this.generateUserId(),
                firstName: email.split('@')[0],
                lastName: 'User',
                email: email,
                emailVerified: true,
                createdAt: new Date().toISOString()
            };

            console.log('Login successful, user created:', user);

            // Login successful
            this.currentUser = user;
            this.saveAuthState(user, rememberMe);
            
            // Update UI to show customer menu
            this.updateLoginUI(user);
            
            // Show success message
            alert('✅ Login successful! You can now access the customer dashboard.');
            
            console.log('Redirecting after login...');
            this.redirectAfterLogin();

        } catch (error) {
            console.error('Login error:', error);
            this.showError('emailError', 'Login failed. Please try again.');
        } finally {
            // Reset button
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Sign In';
                submitBtn.disabled = false;
            }
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        this.clearErrors();

        const formData = new FormData(e.target);
        const email = formData.get('resetEmail').trim().toLowerCase();

        if (!email) {
            this.showError('resetEmailError', 'Please enter your email address.');
            return;
        }

        try {
            // Show loading state
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
            submitBtn.disabled = true;

            // Simulate API call
            await this.simulateApiCall(2000);

            // Check if user exists
            const user = this.getUserByEmail(email);
            if (!user) {
                this.showError('resetEmailError', 'No account found with this email address.');
                return;
            }

            // Generate reset token (1 hour expiry)
            const resetToken = this.generateResetToken();
            const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            // Store reset token (in real app, this would be stored in database)
            localStorage.setItem('passwordResetToken', JSON.stringify({
                token: resetToken,
                email: email,
                expiry: resetExpiry.toISOString()
            }));

            // Show success message
            this.showSuccess('resetEmailError', 'Password reset link sent to your email!');
            
            // Hide modal after 2 seconds
            setTimeout(() => {
                this.hideForgotPasswordModal();
            }, 2000);
        } catch (error) {
            this.showError('resetEmailError', 'Failed to send reset link. Please try again.');
        } finally {
            // Reset button
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.innerHTML = 'Send Reset Link';
            submitBtn.disabled = false;
        }
    }

    validateRegistration(userData) {
        let isValid = true;

        // First name validation
        if (!userData.firstName) {
            this.showError('firstNameError', 'First name is required.');
            isValid = false;
        }

        // Last name validation
        if (!userData.lastName) {
            this.showError('lastNameError', 'Last name is required.');
            isValid = false;
        }

        // Email validation
        if (!this.validateEmail(userData.email)) {
            isValid = false;
        }

        // Phone validation (required)
        if (!userData.phone) {
            this.showError('phoneError', 'Mobile number is required.');
            isValid = false;
        } else if (!this.validatePhone(userData.phone)) {
            isValid = false;
        }

        // Password validation
        if (!this.validatePassword(userData.password)) {
            isValid = false;
        }

        // Confirm password validation
        if (userData.password !== userData.confirmPassword) {
            this.showError('confirmPasswordError', 'Passwords do not match.');
            isValid = false;
        }

        // Terms validation
        if (!userData.acceptTerms) {
            this.showError('termsError', 'Please accept the terms and conditions.');
            isValid = false;
        }

        return isValid;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            this.showError('emailError', 'Email address is required.');
            return false;
        }
        if (!emailRegex.test(email)) {
            this.showError('emailError', 'Please enter a valid email address.');
            return false;
        }
        this.clearError('emailError');
        return true;
    }

    validatePassword(password) {
        if (!password) {
            this.showError('passwordError', 'Password is required.');
            return false;
        }
        if (password.length < 8) {
            this.showError('passwordError', 'Password must be at least 8 characters long.');
            return false;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            this.showError('passwordError', 'Password must contain uppercase, lowercase, and number.');
            return false;
        }
        this.clearError('passwordError');
        return true;
    }

    validateConfirmPassword() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showError('confirmPasswordError', 'Passwords do not match.');
            return false;
        }
        this.clearError('confirmPasswordError');
        return true;
    }

    validateMobile(mobile) {
        if (!mobile) return true; // Optional field
        
        const mobileRegex = /^(\+44|0)7[0-9]{9}$/;
        const cleanMobile = mobile.replace(/[\s\-\(\)]/g, '');
        
        if (!mobileRegex.test(cleanMobile)) {
            this.showError('mobileError', 'Please enter a valid UK mobile number.');
            return false;
        }
        this.clearError('mobileError');
        return true;
    }

    validatePhone(phone) {
        if (!phone) {
            this.showError('phoneError', 'Mobile number is required.');
            return false;
        }
        
        const phoneRegex = /^(\+44|0)7[0-9]{9}$/;
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        if (!phoneRegex.test(cleanPhone)) {
            this.showError('phoneError', 'Please enter a valid UK mobile number.');
            return false;
        }
        this.clearError('phoneError');
        return true;
    }

    showForgotPasswordModal(e) {
        e.preventDefault();
        const modal = document.getElementById('forgotPasswordModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideForgotPasswordModal() {
        const modal = document.getElementById('forgotPasswordModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.clearErrors();
    }

    showVerificationBanner() {
        const banner = document.getElementById('verificationBanner');
        if (banner) {
            banner.style.display = 'block';
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.getElementById('togglePassword');
        const icon = toggleBtn.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    checkAuthStatus() {
        const authData = localStorage.getItem('authData');
        if (authData) {
            this.currentUser = JSON.parse(authData);
            this.updateAuthUI();
        }
        
        // Also check for the old localStorage format
        const customerLoggedIn = localStorage.getItem('customerLoggedIn');
        const userLoggedIn = localStorage.getItem('userLoggedIn');
        if ((customerLoggedIn === 'true' || userLoggedIn === 'true') && !this.currentUser) {
            // User is logged in but we don't have the full user data
            // Create a minimal user object from available data
            const userEmail = localStorage.getItem('userEmail');
            if (userEmail) {
                this.currentUser = {
                    email: userEmail,
                    firstName: userEmail.split('@')[0],
                    lastName: '',
                    emailVerified: true
                };
                console.log('Created minimal user object from localStorage data');
                this.updateAuthUI();
            } else {
                console.log('User appears to be logged in but missing user data - clearing auth');
                // Clear invalid auth state
                this.logout();
            }
        }
    }

    saveAuthState(user, rememberMe = false) {
        const authData = {
            user: user,
            timestamp: new Date().toISOString(),
            rememberMe: rememberMe
        };
        
        localStorage.setItem('authData', JSON.stringify(authData));
        
        // Set the values that the existing checkLoginStatus function looks for
        localStorage.setItem('customerLoggedIn', 'true');
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userEmail', user.email);
        
        if (!rememberMe) {
            // Set session expiry (24 hours)
            setTimeout(() => {
                this.logout();
            }, 24 * 60 * 60 * 1000);
        }
    }

    redirectAfterLogin() {
        // Use smart redirect system
        const redirectUrl = this.getRedirectUrl();
        console.log(`Redirecting to: ${redirectUrl}`);
        console.log(`Current URL: ${window.location.href}`);
        console.log(`Current pathname: ${window.location.pathname}`);
        
        // Handle basket restoration for booking context
        this.handleBasketRestoration();
        
        // Add a small delay to ensure everything is processed
        setTimeout(() => {
            console.log(`About to redirect to: ${redirectUrl}`);
            window.location.href = redirectUrl;
        }, 100);
    }

    redirectToOrigin() {
        // Use smart redirect system
        const redirectUrl = this.getRedirectUrl();
        console.log(`Redirecting to: ${redirectUrl}`);
        
        // Handle basket restoration for booking context
        this.handleBasketRestoration();
        
        window.location.href = redirectUrl;
    }

    /**
     * Handle basket restoration for booking context
     */
    handleBasketRestoration() {
        const authContext = localStorage.getItem('authContext');
        
        if (authContext === 'booking') {
            // For booking context, ensure basket data is preserved
            const bookingBasket = localStorage.getItem('bookingBasket');
            if (bookingBasket) {
                console.log('Preserving booking basket for restoration:', bookingBasket);
                // The basket will be restored by the booking page itself
            }
        }
    }

    /**
     * Handle URL parameters for auto-filling forms
     */
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        const password = urlParams.get('password');
        const firstName = urlParams.get('firstName');
        const lastName = urlParams.get('lastName');
        const phone = urlParams.get('phone');
        
        if (email || password || firstName || lastName || phone) {
            console.log('URL parameters detected, auto-filling form:', { email, password, firstName, lastName, phone });
            
            // Wait for DOM to be ready
            setTimeout(() => {
                this.fillFormFromUrlParams({ email, password, firstName, lastName, phone });
            }, 100);
        }
    }

    /**
     * Ensure default context is set for direct access to auth pages
     */
    ensureDefaultContext() {
        // If no context is set and we're on an auth page, set default to navigation
        const authContext = localStorage.getItem('authContext');
        const currentPage = window.location.pathname || window.location.href;
        
        if (!authContext && (currentPage.includes('customer-login') || currentPage.includes('customer-register'))) {
            console.log('No context set, defaulting to navigation context');
            localStorage.setItem('authContext', 'navigation');
            // Set return URL to home if not already set
            if (!localStorage.getItem('returnUrl')) {
                localStorage.setItem('returnUrl', 'index.html');
            }
        }
    }

    /**
     * Fill form fields from URL parameters
     */
    fillFormFromUrlParams(params) {
        const { email, password, firstName, lastName, phone } = params;
        
        // Find form elements
        const emailInput = document.getElementById('email') || document.querySelector('input[name="email"]');
        const passwordInput = document.getElementById('password') || document.querySelector('input[name="password"]');
        const firstNameInput = document.getElementById('firstName') || document.querySelector('input[name="firstName"]');
        const lastNameInput = document.getElementById('lastName') || document.querySelector('input[name="lastName"]');
        const phoneInput = document.getElementById('mobile') || document.querySelector('input[name="phone"]');
        const confirmPasswordInput = document.getElementById('confirmPassword') || document.querySelector('input[name="confirmPassword"]');
        const acceptTermsCheckbox = document.getElementById('acceptTerms') || document.querySelector('input[name="acceptTerms"]');
        const rememberMeCheckbox = document.getElementById('rememberMe') || document.querySelector('input[name="rememberMe"]');
        
        // Fill fields if they exist and have values
        if (email && emailInput) {
            emailInput.value = email;
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('Auto-filled email from URL');
        }
        
        if (password && passwordInput) {
            passwordInput.value = password;
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('Auto-filled password from URL');
        }
        
        if (firstName && firstNameInput) {
            firstNameInput.value = firstName;
            firstNameInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('Auto-filled firstName from URL');
        }
        
        if (lastName && lastNameInput) {
            lastNameInput.value = lastName;
            lastNameInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('Auto-filled lastName from URL');
        }
        
        if (phone && phoneInput) {
            phoneInput.value = phone;
            phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('Auto-filled phone from URL');
        }
        
        // Auto-fill confirm password if password is provided
        if (password && confirmPasswordInput) {
            confirmPasswordInput.value = password;
            confirmPasswordInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('Auto-filled confirmPassword from URL');
        }
        
        // Auto-check terms if this looks like demo credentials
        if (email === 'customer@example.com' && acceptTermsCheckbox) {
            acceptTermsCheckbox.checked = true;
            acceptTermsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Auto-checked acceptTerms for demo credentials');
        }
        
        // Auto-check remember me for login forms
        if (email === 'customer@example.com' && rememberMeCheckbox) {
            rememberMeCheckbox.checked = true;
            rememberMeCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Auto-checked rememberMe for demo credentials');
        }
        
        // Clear URL parameters after filling
        if (window.history && window.history.replaceState) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            console.log('Cleared URL parameters');
        }
    }

    updateLoginUI(user) {
        // Update the UI to show customer menu instead of auth links
        const authLinks = document.getElementById('authLinks');
        const mobileAuthLinks = document.getElementById('mobileAuthLinks');
        const customerMenu = document.getElementById('customerMenu');
        const mobileCustomerMenu = document.getElementById('mobileCustomerMenu');
        
        if (authLinks) authLinks.style.display = 'none';
        if (mobileAuthLinks) mobileAuthLinks.style.display = 'none';
        if (customerMenu) customerMenu.style.display = 'block';
        if (mobileCustomerMenu) mobileCustomerMenu.style.display = 'block';
        
        // Update customer initials
        const initials = user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
        const customerInitialText = document.getElementById('customerInitialText');
        const mobileCustomerInitialText = document.getElementById('mobileCustomerInitialText');
        
        if (customerInitialText) customerInitialText.textContent = initials;
        if (mobileCustomerInitialText) mobileCustomerInitialText.textContent = initials;
    }

    storeReturnUrl() {
        // Store the current page URL as return URL if not already set
        if (!localStorage.getItem('returnUrl')) {
            const currentUrl = window.location.pathname;
            // Don't store auth pages as return URLs
            if (!currentUrl.includes('customer-login') && !currentUrl.includes('customer-register')) {
                // If it's a file:// URL, extract just the filename
                if (window.location.href.includes('file://')) {
                    const urlParts = window.location.href.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    localStorage.setItem('returnUrl', filename);
                } else {
                    localStorage.setItem('returnUrl', currentUrl);
                }
            } else {
                localStorage.setItem('returnUrl', 'index.html');
            }
        }
    }

    /**
     * Store return URL for specific scenarios
     * @param {string} url - URL to return to after authentication
     * @param {string} context - Context of the authentication (e.g., 'booking', 'navigation')
     */
    setReturnUrl(url, context = 'navigation') {
        // If it's a file:// URL, extract just the filename
        let cleanUrl = url;
        if (url && url.includes('file://')) {
            const urlParts = url.split('/');
            cleanUrl = urlParts[urlParts.length - 1];
        }
        
        localStorage.setItem('returnUrl', cleanUrl);
        localStorage.setItem('authContext', context);
        console.log(`Return URL set: ${cleanUrl} (context: ${context})`);
    }

    /**
     * Get the appropriate redirect URL based on context
     * @returns {string} URL to redirect to
     */
    getRedirectUrl() {
        const returnUrl = localStorage.getItem('returnUrl');
        const authContext = localStorage.getItem('authContext');
        
        console.log('getRedirectUrl called:', { returnUrl, authContext });
        
        // Clear stored values
        localStorage.removeItem('returnUrl');
        localStorage.removeItem('authContext');
        
        // Handle different contexts
        if (authContext === 'booking') {
            console.log('Booking context - returning to booking page');
            return returnUrl || 'booking.html';
        } else if (authContext === 'navigation') {
            console.log('Navigation context - returning to customer dashboard');
            return 'customer-dashboard.html';
        } else {
            console.log('Default context - processing return URL');
            // Default behavior - return to stored URL or home
            // If returnUrl is a full file path, extract just the filename
            if (returnUrl && returnUrl.includes('file://')) {
                const urlParts = returnUrl.split('/');
                const filename = urlParts[urlParts.length - 1];
                console.log('Extracted filename from file URL:', filename);
                return filename || 'index.html';
            }
            console.log('Using return URL as-is:', returnUrl);
            // If we're on an auth page and no specific context, default to customer dashboard
            const currentPage = window.location.pathname || window.location.href;
            if (currentPage.includes('customer-login') || currentPage.includes('customer-register')) {
                console.log('On auth page with no context, defaulting to customer dashboard');
                return 'customer-dashboard.html';
            }
            return returnUrl || 'index.html';
        }
    }

    loadBasket() {
        // Load basket from localStorage if user is not logged in
        const basket = localStorage.getItem('guestBasket');
        if (basket && !this.currentUser) {
            // Preserve basket for when user logs in
            localStorage.setItem('pendingBasket', basket);
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('authData');
        localStorage.removeItem('customerLoggedIn');
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }

    getUserByEmail(email) {
        // In real app, this would be an API call
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(user => user.email === email);
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    generateVerificationToken() {
        return 'verify_' + Math.random().toString(36).substr(2, 32);
    }

    generateResetToken() {
        return 'reset_' + Math.random().toString(36).substr(2, 32);
    }

    async simulateApiCall(delay = 1000) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    showError(fieldId, message) {
        const errorElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    showSuccess(fieldId, message) {
        const errorElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.color = '#51cf66';
            errorElement.style.display = 'block';
        }
    }

    clearError(fieldId) {
        const errorElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
    }

    updateAuthUI() {
        // Update navigation based on auth status
        const authLinks = document.querySelectorAll('.auth-links');
        authLinks.forEach(link => {
            if (this.currentUser) {
                link.innerHTML = `
                    <div class="flex items-center space-x-4">
                        <span class="text-white">Welcome, ${this.currentUser.firstName}</span>
                        <button onclick="customerAuth.logout()" class="text-white hover:text-neon-pink transition-colors duration-300">
                            <i class="fas fa-sign-out-alt mr-1"></i>Sign Out
                        </button>
                    </div>
                `;
            }
        });
    }
}

// Initialize authentication system
const customerAuth = new CustomerAuth();

// Demo credentials function
function fillDemoCredentials() {
    console.log('fillDemoCredentials called');
    
    // Try to find elements by ID first, then by name as fallback
    const firstNameInput = document.getElementById('firstName') || document.querySelector('input[name="firstName"]');
    const lastNameInput = document.getElementById('lastName') || document.querySelector('input[name="lastName"]');
    const fullNameInput = document.querySelector('input[type="text"]:not([id="firstName"]):not([id="lastName"])');
    const emailInput = document.getElementById('email') || document.querySelector('input[name="email"]');
    const passwordInput = document.getElementById('password') || document.querySelector('input[name="password"]');
    const confirmPasswordInput = document.getElementById('confirmPassword') || document.querySelector('input[name="confirmPassword"]');
    const mobileInput = document.getElementById('mobile') || document.querySelector('input[name="phone"]');
    const acceptTermsCheckbox = document.getElementById('acceptTerms') || document.querySelector('input[name="acceptTerms"]');
    const rememberMeCheckbox = document.getElementById('rememberMe') || document.querySelector('input[name="rememberMe"]');
    
    console.log('Found elements:', {
        firstNameInput: !!firstNameInput,
        lastNameInput: !!lastNameInput,
        emailInput: !!emailInput,
        passwordInput: !!passwordInput,
        confirmPasswordInput: !!confirmPasswordInput,
        mobileInput: !!mobileInput,
        acceptTermsCheckbox: !!acceptTermsCheckbox,
        rememberMeCheckbox: !!rememberMeCheckbox
    });
    
    // Add visual feedback
    const demoBtn = document.getElementById('demoCredentialsBtn');
    if (demoBtn) {
        demoBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Filling...';
        demoBtn.disabled = true;
    }
    
    // Fill registration form fields (detailed form)
    if (firstNameInput) {
        firstNameInput.value = 'John';
        firstNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        firstNameInput.style.borderColor = '#10B981';
        console.log('Filled firstName');
    }
    if (lastNameInput) {
        lastNameInput.value = 'Doe';
        lastNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        lastNameInput.style.borderColor = '#10B981';
        console.log('Filled lastName');
    }
    if (fullNameInput && !firstNameInput) {
        fullNameInput.value = 'John Doe';
        fullNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        fullNameInput.style.borderColor = '#10B981';
        console.log('Filled fullName');
    }
    if (emailInput) {
        emailInput.value = 'customer@example.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.style.borderColor = '#10B981';
        console.log('Filled email');
    }
    if (passwordInput) {
        passwordInput.value = 'Password123';
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.style.borderColor = '#10B981';
        console.log('Filled password');
    }
    if (confirmPasswordInput) {
        confirmPasswordInput.value = 'Password123';
        confirmPasswordInput.dispatchEvent(new Event('input', { bubbles: true }));
        confirmPasswordInput.style.borderColor = '#10B981';
        console.log('Filled confirmPassword');
    }
    if (mobileInput) {
        mobileInput.value = '07123456789';
        mobileInput.dispatchEvent(new Event('input', { bubbles: true }));
        mobileInput.style.borderColor = '#10B981';
        console.log('Filled mobile');
    }
    if (acceptTermsCheckbox) {
        acceptTermsCheckbox.checked = true;
        acceptTermsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Checked acceptTerms');
    }
    
    // Fill login form fields
    if (emailInput && !firstNameInput && !fullNameInput) {
        emailInput.value = 'customer@example.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.style.borderColor = '#10B981';
        console.log('Filled login email');
    }
    if (passwordInput && !confirmPasswordInput) {
        passwordInput.value = 'Password123';
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.style.borderColor = '#10B981';
        console.log('Filled login password');
    }
    if (rememberMeCheckbox) {
        rememberMeCheckbox.checked = true;
        rememberMeCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Checked rememberMe');
    }
    
    // Clear any existing errors
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
    });
    
    // Reset button after a short delay
    setTimeout(() => {
        if (demoBtn) {
            demoBtn.innerHTML = '<i class="fas fa-check mr-2"></i> Demo Credentials Applied!';
            demoBtn.style.backgroundColor = '#10B981';
            demoBtn.style.borderColor = '#10B981';
            demoBtn.style.color = 'white';
            
            // Reset button after 2 seconds
            setTimeout(() => {
                demoBtn.innerHTML = '<i class="fas fa-magic mr-2"></i> Use Demo Credentials';
                demoBtn.style.backgroundColor = '';
                demoBtn.style.borderColor = '';
                demoBtn.style.color = '';
                demoBtn.disabled = false;
            }, 2000);
        }
    }, 500);
    
    console.log('Demo credentials filled successfully');
}

// Debug function to check authentication status
function debugAuthStatus() {
    console.log('=== Authentication Debug Info ===');
    console.log('customerLoggedIn:', localStorage.getItem('customerLoggedIn'));
    console.log('userLoggedIn:', localStorage.getItem('userLoggedIn'));
    console.log('userEmail:', localStorage.getItem('userEmail'));
    console.log('authData:', localStorage.getItem('authData'));
    console.log('currentUser:', localStorage.getItem('currentUser'));
    console.log('isLoggedIn:', localStorage.getItem('isLoggedIn'));
    
    // Check access control
    if (window.AccessControl) {
        console.log('AccessControl.isCustomerLoggedIn():', window.AccessControl.isCustomerLoggedIn());
        console.log('AccessControl.getUserRole():', window.AccessControl.getUserRole());
    }
    
    console.log('=== End Debug Info ===');
}

// Make it globally accessible
window.customerAuth = customerAuth;
window.fillDemoCredentials = fillDemoCredentials;
window.debugAuthStatus = debugAuthStatus;
window.handleLogin = (e) => customerAuth.handleLogin(e);
window.handleRegistration = (e) => customerAuth.handleRegistration(e);
window.setAuthReturnUrl = (url, context) => customerAuth.setReturnUrl(url, context);

// Test function accessibility
console.log('fillDemoCredentials function available:', typeof window.fillDemoCredentials);

// Add event listener as backup for demo credentials button
document.addEventListener('DOMContentLoaded', function() {
    const demoBtn = document.getElementById('demoCredentialsBtn');
    if (demoBtn) {
        console.log('Demo credentials button found, adding event listener');
        demoBtn.addEventListener('click', function(e) {
            console.log('Demo credentials button clicked via event listener');
            fillDemoCredentials();
        });
    } else {
        console.log('Demo credentials button not found');
    }
});
