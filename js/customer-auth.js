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
        e.preventDefault();
        this.clearErrors();

        const formData = new FormData(e.target);
        const email = formData.get('email').trim().toLowerCase();
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe');

        // Validation
        if (!email || !password) {
            this.showError('emailError', 'Please enter both email and password.');
            return;
        }

        try {
            // Show loading state
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing In...';
            submitBtn.disabled = true;

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

            // Login successful
            this.currentUser = user;
            this.saveAuthState(user, rememberMe);
            
            // Update UI to show customer menu
            this.updateLoginUI(user);
            
            // Show success message
            alert('✅ Login successful! You can now access the customer dashboard.');
            
            this.redirectAfterLogin();

        } catch (error) {
            this.showError('emailError', 'Login failed. Please try again.');
        } finally {
            // Reset button
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Sign In';
            submitBtn.disabled = false;
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
        // Get return URL from localStorage
        const returnUrl = localStorage.getItem('returnUrl') || 'index.html';
        
        // Clear return URL
        localStorage.removeItem('returnUrl');
        
        // Redirect to previous page
        window.location.href = returnUrl;
    }

    redirectToOrigin() {
        // Get return URL from localStorage
        const returnUrl = localStorage.getItem('returnUrl') || 'index.html';
        
        // Clear return URL
        localStorage.removeItem('returnUrl');
        
        // Redirect to previous page
        window.location.href = returnUrl;
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
                localStorage.setItem('returnUrl', currentUrl);
            } else {
                localStorage.setItem('returnUrl', 'index.html');
            }
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
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const fullNameInput = document.querySelector('input[type="text"]:not([id="firstName"]):not([id="lastName"])');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const mobileInput = document.getElementById('mobile');
    const acceptTermsCheckbox = document.getElementById('acceptTerms');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    
    // Fill registration form fields (detailed form)
    if (firstNameInput) firstNameInput.value = 'John';
    if (lastNameInput) lastNameInput.value = 'Doe';
    if (fullNameInput && !firstNameInput) fullNameInput.value = 'John Doe';
    if (emailInput) emailInput.value = 'customer@example.com';
    if (passwordInput) passwordInput.value = 'Password123';
    if (confirmPasswordInput) confirmPasswordInput.value = 'Password123';
    if (mobileInput) mobileInput.value = '07123456789';
    if (acceptTermsCheckbox) acceptTermsCheckbox.checked = true;
    
    // Fill login form fields
    if (emailInput && !firstNameInput && !fullNameInput) emailInput.value = 'customer@example.com';
    if (passwordInput && !confirmPasswordInput) passwordInput.value = 'Password123';
    if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
    
    // Clear any existing errors
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
    });
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
