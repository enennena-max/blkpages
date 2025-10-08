/**
 * Access Control System for BlkPages
 * Implements role-based page access with automatic redirects
 */

// Page access rules
const PAGE_ACCESS_RULES = {
    // Public pages - accessible to everyone
    public: [
        'index.html',
        'search-results.html',
        'offers.html',
        'business-profile.html',
        'basket.html',
        'why-list-with-us.html',
        'pricing.html',
        'contact.html',
        'blog.html',
        'hair-businesses.html',
        'nail-businesses.html',
        'barber-businesses.html',
        'beauty-businesses.html',
        'coming-soon.html',
        'customer-login.html',
        'customer-register.html',
        'business-login.html',
        'business-register.html',
        'business-login-fixed.html',
        'terms.html',
        'privacy.html'
    ],
    
    // Customer-only pages
    customer: [
        'customer-dashboard.html',
        'favorites.html',
        'bookings-history.html',
        'account-settings.html'
    ],
    
    // Business-only pages
    business: [
        'business-dashboard.html',
        'business-loyalty-dashboard.html',
        'business-dashboard-fixed.html',
        'business-dashboard-test.html',
        'business-dashboard-test-v2.html',
        'business-dashboard-backup.html',
        'business-analytics-dashboard.html',
        'business-booking-manager.html',
        'business-payment.html',
        'business-plan-management.html',
        'business-photo-upload.html',
        'business-royal-hair.html',
        'demo-business-dashboard-starter.html',
        'manage-profile.html',
        'services-prices.html',
        'bookings.html',
        'payments-payouts.html',
        'analytics.html',
        'business-settings.html'
    ]
};

/**
 * Get the current page name from the URL
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop();
    return page || 'index.html';
}

/**
 * Check if user is logged in as customer
 */
function isCustomerLoggedIn() {
    return localStorage.getItem('customerLoggedIn') === 'true' || 
           localStorage.getItem('userLoggedIn') === 'true';
}

/**
 * Check if user is logged in as business
 */
function isBusinessLoggedIn() {
    return localStorage.getItem('businessLoggedIn') === 'true';
}

/**
 * Get user's current role
 */
function getUserRole() {
    if (isBusinessLoggedIn()) {
        return 'business';
    } else if (isCustomerLoggedIn()) {
        return 'customer';
    }
    return 'guest';
}

/**
 * Check if current page is accessible to user's role
 */
function isPageAccessible(page, role) {
    // Public pages are accessible to everyone
    if (PAGE_ACCESS_RULES.public.includes(page)) {
        return true;
    }
    
    // Check role-specific access
    if (role === 'customer' && PAGE_ACCESS_RULES.customer.includes(page)) {
        return true;
    }
    
    if (role === 'business' && PAGE_ACCESS_RULES.business.includes(page)) {
        return true;
    }
    
    return false;
}

/**
 * Get the appropriate login page for the required role
 */
function getLoginPageForRole(requiredRole) {
    switch (requiredRole) {
        case 'customer':
            return 'customer-login.html';
        case 'business':
            return 'business-login.html';
        default:
            return 'customer-login.html';
    }
}

/**
 * Determine what role is required for the current page
 */
function getRequiredRoleForPage(page) {
    if (PAGE_ACCESS_RULES.customer.includes(page)) {
        return 'customer';
    }
    
    if (PAGE_ACCESS_RULES.business.includes(page)) {
        return 'business';
    }
    
    return 'public';
}

/**
 * Handle access control for the current page
 */
function checkPageAccess() {
    const currentPage = getCurrentPage();
    const userRole = getUserRole();
    const requiredRole = getRequiredRoleForPage(currentPage);
    
    console.log('Access Control Check:', {
        page: currentPage,
        userRole: userRole,
        requiredRole: requiredRole
    });
    
    // If page is public, allow access
    if (requiredRole === 'public') {
        return true;
    }
    
    // If user is not logged in, redirect to appropriate login page
    if (userRole === 'guest') {
        const loginPage = getLoginPageForRole(requiredRole);
        console.log('Redirecting to login page:', loginPage);
        window.location.href = loginPage;
        return false;
    }
    
    // If user has wrong role, redirect to appropriate login page
    if (userRole !== requiredRole) {
        const loginPage = getLoginPageForRole(requiredRole);
        console.log('Wrong role access - redirecting to:', loginPage);
        alert(`You need to be logged in as a ${requiredRole} to access this page. Redirecting to ${requiredRole} login...`);
        window.location.href = loginPage;
        return false;
    }
    
    // Access granted
    return true;
}

/**
 * Initialize access control on page load
 */
function initializeAccessControl() {
    // Only run access control if not on a login/register page
    const currentPage = getCurrentPage();
    const isLoginPage = currentPage.includes('login') || currentPage.includes('register');
    const isPublicPage = PAGE_ACCESS_RULES.public.includes(currentPage);
    
    // Only run access control on protected pages
    if (!isLoginPage && !isPublicPage) {
        checkPageAccess();
    }
}

/**
 * Check if user can access a specific page (for navigation)
 */
function canAccessPage(pageName) {
    const userRole = getUserRole();
    return isPageAccessible(pageName, userRole);
}

/**
 * Get navigation items based on user role
 */
function getNavigationItems() {
    const userRole = getUserRole();
    const items = [];
    
    // Public navigation items
    items.push(
        { name: 'Home', url: 'index.html', accessible: true },
        { name: 'Browse', url: 'search-results.html', accessible: true },
        { name: 'Offers', url: 'offers.html', accessible: true }
    );
    
    // Role-specific items
    if (userRole === 'customer') {
        items.push(
            { name: 'Dashboard', url: 'customer-dashboard.html', accessible: true },
            { name: 'Favorites', url: 'favorites.html', accessible: true },
            { name: 'Bookings', url: 'bookings-history.html', accessible: true }
        );
    }
    
    if (userRole === 'business') {
        items.push(
            { name: 'Dashboard', url: 'business-dashboard.html', accessible: true },
            { name: 'Bookings', url: 'bookings.html', accessible: true },
            { name: 'Analytics', url: 'analytics.html', accessible: true }
        );
    }
    
    return items;
}

// Initialize access control when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAccessControl();
});

// Export functions for use in other scripts
window.AccessControl = {
    checkPageAccess,
    canAccessPage,
    getNavigationItems,
    getUserRole,
    isCustomerLoggedIn,
    isBusinessLoggedIn
};
