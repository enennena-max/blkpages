/**
 * BlkPages Analytics Tracking Snippets
 * 
 * These are the JavaScript snippets that should be integrated into your existing pages
 * to track analytics events. Each snippet is fire-and-forget and won't block the UI.
 */

// ==================== CONFIGURATION ====================
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// ==================== UTILITY FUNCTIONS ====================

/**
 * Debounce function to prevent duplicate events within the same render tick
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Fire-and-forget analytics tracking
 */
async function trackEvent(businessId, metricType) {
    try {
        await fetch(`${API_BASE_URL}/api/record-event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId, metricType })
        });
    } catch (error) {
        console.error('Analytics tracking error:', error);
        // Silently fail - don't block UI
    }
}

/**
 * Fire-and-forget analytics tracking with visitor context
 */
async function trackEventWithContext(businessId, metricType, visitorContext = {}) {
    try {
        const payload = { businessId, metricType };
        
        // Add optional visitor context fields
        if (visitorContext.borough) {
            payload.borough = visitorContext.borough;
        }
        if (visitorContext.deviceType) {
            payload.deviceType = visitorContext.deviceType;
        }
        
        await fetch(`${API_BASE_URL}/api/record-event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error('Analytics tracking error:', error);
        // Silently fail - don't block UI
    }
}

// ==================== TRACKING SNIPPETS ====================

/**
 * 1. Record Profile View - Add to business profile page load
 * 
 * Usage: Add this to your business profile page component or script
 */
export function trackProfileView(businessId, visitorContext = {}) {
    // Debounced to prevent duplicate tracking on rapid page loads
    const debouncedTrack = debounce(trackEventWithContext, 1000);
    debouncedTrack(businessId, 'profileView', visitorContext);
}

// Example usage in React component:
/*
import { trackProfileView } from './analytics-tracking-snippets';

function BusinessProfile({ businessId }) {
    useEffect(() => {
        // Detect device type
        const deviceType = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop';
        
        // Get user location (you would implement this based on your needs)
        const borough = getUserBorough(); // Your location detection logic
        
        // Track with visitor context
        trackProfileView(businessId, { 
            borough, 
            deviceType 
        });
    }, [businessId]);
    
    return <div>Business Profile Content</div>;
}
*/

// Example usage in vanilla JavaScript:
/*
// Add to business profile page
document.addEventListener('DOMContentLoaded', function() {
    const businessId = 'your-business-id'; // Get from URL or data attribute
    
    // Detect device type
    const deviceType = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop';
    
    // Get user location (you would implement this based on your needs)
    const borough = getUserBorough(); // Your location detection logic
    
    // Track with visitor context
    trackProfileView(businessId, { 
        borough, 
        deviceType 
    });
});
*/

/**
 * 2. Record Search Impression - Add when rendering search result items
 * 
 * Usage: Call this for each business that appears in search results
 */
export function trackSearchImpression(businessId) {
    // Debounced to prevent duplicate tracking for the same business in one search
    const debouncedTrack = debounce(trackEvent, 500);
    debouncedTrack(businessId, 'searchImpression');
}

// Example usage in search results:
/*
// In your search results component
function SearchResults({ businesses }) {
    return (
        <div>
            {businesses.map(business => (
                <div key={business.id} onLoad={() => trackSearchImpression(business.id)}>
                    <h3>{business.name}</h3>
                    {/* Business details */}
                </div>
            ))}
        </div>
    );
}
*/

// Example usage in vanilla JavaScript:
/*
// Add to search results page
function renderSearchResults(businesses) {
    businesses.forEach(business => {
        // Render business card
        trackSearchImpression(business.id);
    });
}
*/

/**
 * 3. Record Contact Click - Add to "Call" and "Message" buttons
 * 
 * Usage: Add onClick handlers to contact buttons
 */
export function trackContactClick(businessId) {
    trackEvent(businessId, 'contactClick');
}

// Example usage in React:
/*
function ContactButtons({ businessId }) {
    const handleCallClick = () => {
        trackContactClick(businessId);
        // Your call logic here
        window.location.href = `tel:${business.phone}`;
    };
    
    const handleMessageClick = () => {
        trackContactClick(businessId);
        // Your message logic here
        openMessageModal();
    };
    
    return (
        <div>
            <button onClick={handleCallClick}>Call Now</button>
            <button onClick={handleMessageClick}>Send Message</button>
        </div>
    );
}
*/

// Example usage in vanilla JavaScript:
/*
// Add to contact buttons
document.getElementById('callButton').addEventListener('click', function() {
    trackContactClick('your-business-id');
    // Your call logic here
});

document.getElementById('messageButton').addEventListener('click', function() {
    trackContactClick('your-business-id');
    // Your message logic here
});
*/

/**
 * 4. Record Enquiry Received - Add to successful form submissions
 * 
 * Usage: Call this when enquiry form is successfully submitted
 */
export function trackEnquiryReceived(businessId) {
    trackEvent(businessId, 'enquiryReceived');
}

// Example usage in React:
/*
function EnquiryForm({ businessId }) {
    const handleSubmit = async (formData) => {
        try {
            // Submit enquiry
            await submitEnquiry(formData);
            
            // Track successful enquiry
            trackEnquiryReceived(businessId);
            
            // Show success message
            showSuccessMessage();
        } catch (error) {
            showErrorMessage(error);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            {/* Form fields */}
            <button type="submit">Send Enquiry</button>
        </form>
    );
}
*/

// Example usage in vanilla JavaScript:
/*
// Add to enquiry form submission
document.getElementById('enquiryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        // Submit form data
        const response = await fetch('/api/enquiries', {
            method: 'POST',
            body: new FormData(this)
        });
        
        if (response.ok) {
            trackEnquiryReceived('your-business-id');
            showSuccessMessage();
        }
    } catch (error) {
        showErrorMessage(error);
    }
});
*/

// ==================== INTEGRATION EXAMPLES ====================

/**
 * Complete integration example for a business profile page
 */
export function setupBusinessProfileTracking(businessId) {
    // Track profile view on page load
    trackProfileView(businessId);
    
    // Track contact clicks
    const callButton = document.getElementById('callButton');
    const messageButton = document.getElementById('messageButton');
    
    if (callButton) {
        callButton.addEventListener('click', () => trackContactClick(businessId));
    }
    
    if (messageButton) {
        messageButton.addEventListener('click', () => trackContactClick(businessId));
    }
    
    // Track enquiry form submission
    const enquiryForm = document.getElementById('enquiryForm');
    if (enquiryForm) {
        enquiryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Your form submission logic here
            trackEnquiryReceived(businessId);
        });
    }
}

/**
 * Complete integration example for search results page
 */
export function setupSearchResultsTracking(businesses) {
    // Track search impressions for each business
    businesses.forEach(business => {
        trackSearchImpression(business.id);
    });
}

// ==================== USAGE INSTRUCTIONS ====================

/*
INTEGRATION STEPS:

1. Copy the tracking snippets to your project
2. Import the functions you need:
   import { trackProfileView, trackContactClick, trackEnquiryReceived } from './analytics-tracking-snippets';

3. Add tracking to your pages:
   - Business Profile: Call trackProfileView() on page load
   - Search Results: Call trackSearchImpression() for each business shown
   - Contact Buttons: Call trackContactClick() on click
   - Enquiry Forms: Call trackEnquiryReceived() on successful submission

4. Configure API_BASE_URL if your frontend and backend are on different origins

5. Test the integration by checking the analytics dashboard

EXAMPLE COMPLETE INTEGRATION:

// In your main app or business profile page
import { trackProfileView, trackContactClick, trackEnquiryReceived } from './analytics-tracking-snippets';

// Get business ID from URL or props
const businessId = getBusinessIdFromURL() || 'default-business';

// Track profile view
useEffect(() => {
    trackProfileView(businessId);
}, [businessId]);

// Track contact clicks
const handleCallClick = () => {
    trackContactClick(businessId);
    // Your call logic
};

const handleEnquirySubmit = () => {
    trackEnquiryReceived(businessId);
    // Your enquiry logic
};
*/
