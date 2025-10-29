// Enhanced URL parameter support for plan detection
function getCurrentBusinessPlanWithURL() {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const planFromUrl = urlParams.get('plan');
    
    if (planFromUrl) {
        // Map URL parameters to plan names
        const planMapping = {
            'free': 'free',
            'starter': 'starter', 
            'pro': 'professional',
            'professional': 'professional',
            'premium': 'professional'
        };
        console.log('Plan from URL:', planFromUrl, '->', planMapping[planFromUrl.toLowerCase()]);
        return planMapping[planFromUrl.toLowerCase()] || 'free';
    }
    
    // Fallback to original function
    return getCurrentBusinessPlan();
}

// Override the original function to use URL parameters
const originalGetCurrentBusinessPlan = getCurrentBusinessPlan;
getCurrentBusinessPlan = getCurrentBusinessPlanWithURL;

console.log('URL plan support loaded. Current plan:', getCurrentBusinessPlan());

