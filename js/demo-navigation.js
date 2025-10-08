/**
 * Demo Navigation System
 * Provides consistent navigation across all demo pages
 */

class DemoNavigation {
    constructor() {
        this.init();
    }

    init() {
        this.createNavigationBar();
        this.setupEventListeners();
    }

    createNavigationBar() {
        const navHTML = `
            <div id="demoNavigation" class="demo-nav">
                <div class="demo-nav-container">
                    <div class="demo-nav-brand">
                        <a href="demo-hub.html" class="nav-logo">
                            <i class="fas fa-home"></i>
                            <span>Demo Hub</span>
                        </a>
                    </div>
                    
                    <div class="demo-nav-menu">
                        <div class="nav-dropdown">
                            <button class="nav-dropdown-toggle">
                                <i class="fas fa-credit-card"></i>
                                <span>Payment Systems</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="nav-dropdown-content">
                                <a href="payment-timeout-demo.html">
                                    <i class="fas fa-clock"></i>
                                    <span>Session Timeout</span>
                                </a>
                                <a href="payment-error-demo.html">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <span>Error Handling</span>
                                </a>
                            </div>
                        </div>
                        
                        <div class="nav-dropdown">
                            <button class="nav-dropdown-toggle">
                                <i class="fas fa-receipt"></i>
                                <span>Receipts & Payouts</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="nav-dropdown-content">
                                <a href="stripe-receipts-demo.html">
                                    <i class="fas fa-receipt"></i>
                                    <span>Stripe Receipts</span>
                                </a>
                                <a href="payout-flow-demo.html">
                                    <i class="fas fa-money-bill-wave"></i>
                                    <span>Payout Flow</span>
                                </a>
                            </div>
                        </div>
                        
                        <div class="nav-dropdown">
                            <button class="nav-dropdown-toggle">
                                <i class="fas fa-undo"></i>
                                <span>Refunds</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="nav-dropdown-content">
                                <a href="refund-flow-demo.html">
                                    <i class="fas fa-undo"></i>
                                    <span>Refund Flow</span>
                                </a>
                            </div>
                        </div>
                        
                        <div class="nav-dropdown">
                            <button class="nav-dropdown-toggle">
                                <i class="fas fa-chart-line"></i>
                                <span>Dashboards</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="nav-dropdown-content">
                                <a href="business-dashboard.html">
                                    <i class="fas fa-chart-line"></i>
                                    <span>Main Dashboard</span>
                                </a>
                                <a href="business-dashboard-receipts.html">
                                    <i class="fas fa-receipt"></i>
                                    <span>Receipts Dashboard</span>
                                </a>
                                <a href="business-dashboard-payouts.html">
                                    <i class="fas fa-money-bill-wave"></i>
                                    <span>Payouts Dashboard</span>
                                </a>
                                <a href="business-dashboard-errors.html">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <span>Error Dashboard</span>
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="demo-nav-actions">
                        <a href="index.html" class="nav-action">
                            <i class="fas fa-globe"></i>
                            <span>Main Site</span>
                        </a>
                        <button class="nav-toggle" onclick="demoNavigation.toggleMobileMenu()">
                            <i class="fas fa-bars"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add navigation to the top of the page
        document.body.insertAdjacentHTML('afterbegin', navHTML);
    }

    setupEventListeners() {
        // Handle dropdown toggles
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-dropdown-toggle')) {
                e.preventDefault();
                this.toggleDropdown(e.target.closest('.nav-dropdown'));
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-dropdown')) {
                this.closeAllDropdowns();
            }
        });
    }

    toggleDropdown(dropdown) {
        const isOpen = dropdown.classList.contains('open');
        
        // Close all other dropdowns
        this.closeAllDropdowns();
        
        if (!isOpen) {
            dropdown.classList.add('open');
        }
    }

    closeAllDropdowns() {
        document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    }

    toggleMobileMenu() {
        const nav = document.getElementById('demoNavigation');
        nav.classList.toggle('mobile-open');
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.demoNavigation = new DemoNavigation();
});

// Export for manual initialization
window.DemoNavigation = DemoNavigation;
