/**
 * Utility function to extract businessId from URL parameters
 * 
 * @returns {string} The businessId from URL search params, or empty string if not found
 */
export function getBusinessIdFromURL() {
    try {
        const url = new URL(window.location.href);
        return url.searchParams.get('businessId') || '';
    } catch (error) {
        console.error('Error parsing URL:', error);
        return '';
    }
}

/**
 * Alternative implementation using URLSearchParams directly
 * 
 * @returns {string} The businessId from URL search params, or empty string if not found
 */
export function getBusinessIdFromURLAlternative() {
    try {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.get('businessId') || '';
    } catch (error) {
        console.error('Error parsing URL search params:', error);
        return '';
    }
}

/**
 * Get businessId with fallback to default value
 * 
 * @param {string} defaultValue - Default value if businessId not found in URL
 * @returns {string} The businessId from URL or the default value
 */
export function getBusinessIdFromURLWithDefault(defaultValue = 'default-business') {
    const businessId = getBusinessIdFromURL();
    return businessId || defaultValue;
}
