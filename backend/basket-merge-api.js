/**
 * Basket Merge API
 * Handles merging of pending baskets with user's saved baskets
 */

// Database structure simulation
const Customers_Basket = new Map();
const Customer_Profile = new Map();

/**
 * Initialize demo data
 */
function initializeDemoData() {
    // Demo customer profiles
    Customer_Profile.set('customer_1', {
        id: 'customer_1',
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@example.com',
        phone: '07123456789',
        postcode: 'SW1A 1AA',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
    
    Customer_Profile.set('customer_2', {
        id: 'customer_2',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@example.com',
        phone: '07987654321',
        postcode: 'M1 1AA',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
    
    // Demo existing baskets
    Customers_Basket.set('customer_1', {
        id: 'basket_1',
        customer_id: 'customer_1',
        business_id: 'biz_001',
        items: [
            {
                service_id: 'service_1',
                service_name: 'Hair Cut',
                price: 25.00,
                duration: '30 minutes',
                quantity: 1,
                added_at: Date.now() - 86400000 // 1 day ago
            }
        ],
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString()
    });
}

// Initialize demo data
initializeDemoData();

/**
 * Basket Merge API Handler
 * POST /api/basket/merge
 */
async function handleBasketMerge(request) {
    try {
        console.log('Basket merge request received:', request);
        
        const { user_id, basket_items } = request.body;
        
        if (!user_id) {
            return {
                status: 400,
                body: {
                    success: false,
                    error: 'User ID is required'
                }
            };
        }
        
        if (!basket_items || !Array.isArray(basket_items)) {
            return {
                status: 400,
                body: {
                    success: false,
                    error: 'Basket items array is required'
                }
            };
        }
        
        // Validate basket items
        const validationResult = validateBasketItems(basket_items);
        if (!validationResult.valid) {
            return {
                status: 400,
                body: {
                    success: false,
                    error: validationResult.error
                }
            };
        }
        
        // Merge baskets
        const mergedBasket = await mergeBasket(user_id, basket_items);
        
        return {
            status: 200,
            body: {
                success: true,
                basket: mergedBasket,
                message: 'Basket merged successfully'
            }
        };
        
    } catch (error) {
        console.error('Error in basket merge:', error);
        return {
            status: 500,
            body: {
                success: false,
                error: 'Internal server error'
            }
        };
    }
}

/**
 * Validate basket items
 * @param {Array} basketItems - Basket items to validate
 * @returns {Object} Validation result
 */
function validateBasketItems(basketItems) {
    for (const item of basketItems) {
        if (!item.service_id) {
            return { valid: false, error: 'Service ID is required for all items' };
        }
        if (!item.service_name) {
            return { valid: false, error: 'Service name is required for all items' };
        }
        if (typeof item.price !== 'number' || item.price < 0) {
            return { valid: false, error: 'Valid price is required for all items' };
        }
        if (typeof item.quantity !== 'number' || item.quantity < 1) {
            return { valid: false, error: 'Valid quantity is required for all items' };
        }
        if (!item.business_id) {
            return { valid: false, error: 'Business ID is required for all items' };
        }
    }
    
    return { valid: true };
}

/**
 * Merge basket items with existing user basket
 * @param {string} userId - User ID
 * @param {Array} newBasketItems - New basket items to merge
 * @returns {Object} Merged basket
 */
async function mergeBasket(userId, newBasketItems) {
    console.log('Merging basket for user:', userId);
    
    // Get existing basket
    const existingBasket = getExistingBasket(userId);
    
    // Merge items
    const mergedItems = [...existingBasket.items];
    
    for (const newItem of newBasketItems) {
        const existingIndex = mergedItems.findIndex(item => 
            item.service_id === newItem.service_id && 
            item.business_id === newItem.business_id
        );
        
        if (existingIndex >= 0) {
            // Update quantity for existing item
            mergedItems[existingIndex].quantity += newItem.quantity;
            mergedItems[existingIndex].updated_at = new Date().toISOString();
        } else {
            // Add new item
            mergedItems.push({
                ...newItem,
                added_at: newItem.added_at || Date.now(),
                updated_at: new Date().toISOString()
            });
        }
    }
    
    // Create merged basket
    const mergedBasket = {
        id: existingBasket.id || `basket_${Date.now()}`,
        customer_id: userId,
        business_id: newBasketItems[0]?.business_id || existingBasket.business_id,
        items: mergedItems,
        updated_at: new Date().toISOString(),
        created_at: existingBasket.created_at || new Date().toISOString()
    };
    
    // Save merged basket
    saveBasket(userId, mergedBasket);
    
    console.log('Basket merged successfully:', mergedBasket);
    return mergedBasket;
}

/**
 * Get existing basket for user
 * @param {string} userId - User ID
 * @returns {Object} Existing basket
 */
function getExistingBasket(userId) {
    const basket = Customers_Basket.get(userId);
    return basket || {
        id: null,
        customer_id: userId,
        business_id: null,
        items: [],
        updated_at: null,
        created_at: null
    };
}

/**
 * Save basket for user
 * @param {string} userId - User ID
 * @param {Object} basket - Basket to save
 */
function saveBasket(userId, basket) {
    Customers_Basket.set(userId, basket);
    console.log('Basket saved for user:', userId);
}

/**
 * Get current basket for user
 * GET /api/basket/current
 */
async function handleGetCurrentBasket(request) {
    try {
        const { user_id } = request.query;
        
        if (!user_id) {
            return {
                status: 400,
                body: {
                    success: false,
                    error: 'User ID is required'
                }
            };
        }
        
        const basket = getExistingBasket(user_id);
        
        return {
            status: 200,
            body: {
                success: true,
                basket: basket
            }
        };
        
    } catch (error) {
        console.error('Error getting current basket:', error);
        return {
            status: 500,
            body: {
                success: false,
                error: 'Internal server error'
            }
        };
    }
}

/**
 * Get customer profile
 * GET /api/customers/me
 */
async function handleGetCustomerProfile(request) {
    try {
        const { user_id } = request.query;
        
        if (!user_id) {
            return {
                status: 400,
                body: {
                    success: false,
                    error: 'User ID is required'
                }
            };
        }
        
        const profile = Customer_Profile.get(user_id);
        
        if (!profile) {
            return {
                status: 404,
                body: {
                    success: false,
                    error: 'Customer profile not found'
                }
            };
        }
        
        return {
            status: 200,
            body: {
                success: true,
                profile: profile
            }
        };
        
    } catch (error) {
        console.error('Error getting customer profile:', error);
        return {
            status: 500,
            body: {
                success: false,
                error: 'Internal server error'
            }
        };
    }
}

/**
 * Update customer profile
 * PUT /api/customers/me
 */
async function handleUpdateCustomerProfile(request) {
    try {
        const { user_id, profile_data } = request.body;
        
        if (!user_id) {
            return {
                status: 400,
                body: {
                    success: false,
                    error: 'User ID is required'
                }
            };
        }
        
        if (!profile_data) {
            return {
                status: 400,
                body: {
                    success: false,
                    error: 'Profile data is required'
                }
            };
        }
        
        // Get existing profile
        const existingProfile = Customer_Profile.get(user_id) || {
            id: user_id,
            created_at: new Date().toISOString()
        };
        
        // Update profile
        const updatedProfile = {
            ...existingProfile,
            ...profile_data,
            updated_at: new Date().toISOString()
        };
        
        // Save profile
        Customer_Profile.set(user_id, updatedProfile);
        
        return {
            status: 200,
            body: {
                success: true,
                profile: updatedProfile,
                message: 'Profile updated successfully'
            }
        };
        
    } catch (error) {
        console.error('Error updating customer profile:', error);
        return {
            status: 500,
            body: {
                success: false,
                error: 'Internal server error'
            }
        };
    }
}

/**
 * Clear basket for user
 * DELETE /api/basket/clear
 */
async function handleClearBasket(request) {
    try {
        const { user_id } = request.query;
        
        if (!user_id) {
            return {
                status: 400,
                body: {
                    success: false,
                    error: 'User ID is required'
                }
            };
        }
        
        // Clear basket
        const emptyBasket = {
            id: `basket_${Date.now()}`,
            customer_id: user_id,
            business_id: null,
            items: [],
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        
        saveBasket(user_id, emptyBasket);
        
        return {
            status: 200,
            body: {
                success: true,
                basket: emptyBasket,
                message: 'Basket cleared successfully'
            }
        };
        
    } catch (error) {
        console.error('Error clearing basket:', error);
        return {
            status: 500,
            body: {
                success: false,
                error: 'Internal server error'
            }
        };
    }
}

/**
 * API Router
 */
const basketAPI = {
    // Basket operations
    'POST /api/basket/merge': handleBasketMerge,
    'GET /api/basket/current': handleGetCurrentBasket,
    'DELETE /api/basket/clear': handleClearBasket,
    
    // Customer profile operations
    'GET /api/customers/me': handleGetCustomerProfile,
    'PUT /api/customers/me': handleUpdateCustomerProfile
};

/**
 * Handle API request
 * @param {string} method - HTTP method
 * @param {string} path - API path
 * @param {Object} request - Request object
 * @returns {Object} Response object
 */
async function handleAPIRequest(method, path, request) {
    const key = `${method} ${path}`;
    const handler = basketAPI[key];
    
    if (!handler) {
        return {
            status: 404,
            body: {
                success: false,
                error: 'API endpoint not found'
            }
        };
    }
    
    return await handler(request);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleAPIRequest,
        handleBasketMerge,
        handleGetCurrentBasket,
        handleGetCustomerProfile,
        handleUpdateCustomerProfile,
        handleClearBasket,
        mergeBasket,
        getExistingBasket,
        saveBasket,
        Customers_Basket,
        Customer_Profile
    };
} else {
    window.BasketAPI = {
        handleAPIRequest,
        handleBasketMerge,
        handleGetCurrentBasket,
        handleGetCustomerProfile,
        handleUpdateCustomerProfile,
        handleClearBasket,
        mergeBasket,
        getExistingBasket,
        saveBasket,
        Customers_Basket,
        Customer_Profile
    };
}

console.log('Basket Merge API loaded');
