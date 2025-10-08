/**
 * Suppress Tailwind CSS CDN Production Warning
 * This script suppresses the console warning about using CDN Tailwind CSS in production
 */

(function() {
    // Store original console.warn
    const originalWarn = console.warn;
    
    // Override console.warn to filter out Tailwind CDN warning
    console.warn = function(...args) {
        const message = args.join(' ');
        
        // Check if this is the Tailwind CDN warning
        if (message.includes('cdn.tailwindcss.com should not be used in production')) {
            // Suppress this specific warning
            return;
        }
        
        // Allow all other warnings to pass through
        originalWarn.apply(console, args);
    };
    
    // Also suppress the warning that might appear in different formats
    const originalError = console.error;
    console.error = function(...args) {
        const message = args.join(' ');
        
        if (message.includes('cdn.tailwindcss.com should not be used in production')) {
            return;
        }
        
        originalError.apply(console, args);
    };
})();

// Add a comment in console about production setup
console.log('%c🚀 BlkPages - Development Mode', 'color: #ff6b6b; font-weight: bold; font-size: 14px;');
console.log('%cFor production deployment, consider:', 'color: #9c27b0; font-size: 12px;');
console.log('%c1. Install Tailwind CSS: npm install tailwindcss', 'color: #2196f3; font-size: 11px;');
console.log('%c2. Build CSS: npx tailwindcss -i ./css/tailwind.css -o ./css/output.css --minify', 'color: #2196f3; font-size: 11px;');
console.log('%c3. Replace CDN with local CSS file', 'color: #2196f3; font-size: 11px;');


