// BLKPAGES Business Management System
class BusinessManager {
    constructor() {
        this.storageKey = 'blkpages_businesses';
        this.init();
    }
    
    init() {
        // Always initialize with demo businesses for testing
        console.log('Initializing business manager...');
        this.initializeDemoBusinesses();
        const businesses = this.getBusinesses();
        console.log('Business manager initialized with', businesses.length, 'businesses');
        console.log('Business names:', businesses.map(b => b.name));
    }
    
    // Get all businesses from localStorage
    getBusinesses() {
        try {
            const businesses = localStorage.getItem(this.storageKey);
            return businesses ? JSON.parse(businesses) : [];
        } catch (error) {
            console.error('Error loading businesses:', error);
            return [];
        }
    }
    
    // Save businesses to localStorage
    saveBusinesses(businesses) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(businesses));
            return true;
        } catch (error) {
            console.error('Error saving businesses:', error);
            return false;
        }
    }
    
    // Add a new business
    addBusiness(businessData) {
        const businesses = this.getBusinesses();
        
        // Generate unique ID
        const businessId = 'business_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Create business object
        const newBusiness = {
            id: businessId,
            name: businessData.businessName,
            category: businessData.category,
            description: businessData.description,
            phone: businessData.phone,
            email: businessData.email,
            website: businessData.website || '',
            address: businessData.address,
            city: businessData.city,
            state: businessData.state,
            zipCode: businessData.zipCode,
            serviceArea: businessData.serviceArea || '',
            location: `${businessData.address}, ${businessData.city}, ${businessData.state} ${businessData.zipCode}`,
            hoursStart: businessData.hoursStart || '',
            hoursEnd: businessData.hoursEnd || '',
            daysOpen: businessData.daysOpen || [],
            cancellationPolicy: businessData.cancellationPolicy,
            customPolicyText: businessData.customPolicyText || '',
            bookingNotes: businessData.bookingNotes || '',
            paymentModel: businessData.paymentModel,
            depositPercentage: businessData.depositPercentage || '',
            ownerName: businessData.ownerName,
            subscription: businessData.selectedTier || 'free',
            loyaltyAddon: businessData.loyaltyAddonSelected || false,
            // Default values for new businesses
            rating: 0,
            reviews: 0,
            image: this.getDefaultImage(businessData.category),
            hasPhoto: false,
            hasBooking: businessData.selectedTier !== 'free',
            featured: businessData.selectedTier === 'professional',
            dateCreated: new Date().toISOString(),
            status: 'active'
        };
        
        businesses.push(newBusiness);
        
        if (this.saveBusinesses(businesses)) {
            console.log('Business added successfully:', newBusiness.name);
            return newBusiness;
        } else {
            console.error('Failed to save business');
            return null;
        }
    }
    
    // Get default image based on category
    getDefaultImage(category) {
        const defaultImages = {
            'hairdresser': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=250&fit=crop&crop=center',
            'barber': 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=250&fit=crop&crop=center',
            'beauty': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=250&fit=crop&crop=center',
            'nail': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=250&fit=crop&crop=center'
        };
        return defaultImages[category] || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=250&fit=crop&crop=center';
    }
    
    // Search businesses by category and location
    searchBusinesses(filters = {}) {
        const businesses = this.getBusinesses();
        
        return businesses.filter(business => {
            // Category filter
            if (filters.category && business.category !== filters.category) {
                return false;
            }
            
            // Location filter
            if (filters.location) {
                const locationMatch = business.location.toLowerCase().includes(filters.location.toLowerCase()) ||
                                    business.city.toLowerCase().includes(filters.location.toLowerCase()) ||
                                    business.state.toLowerCase().includes(filters.location.toLowerCase());
                if (!locationMatch) {
                    return false;
                }
            }
            
            // Business name filter
            if (filters.businessName) {
                const nameMatch = business.name.toLowerCase().includes(filters.businessName.toLowerCase());
                if (!nameMatch) {
                    return false;
                }
            }
            
            // Rating filter
            if (filters.minRating && business.rating < filters.minRating) {
                return false;
            }
            
            // Status filter (only show active businesses)
            if (business.status !== 'active') {
                return false;
            }
            
            return true;
        });
    }
    
    // Get business by ID
    getBusinessById(id) {
        const businesses = this.getBusinesses();
        return businesses.find(business => business.id === id);
    }
    
    // Initialize with demo businesses
    initializeDemoBusinesses() {
        const demoBusinesses = [
            // Professional Tier Businesses (3)
            { 
                id: 'demo_1',
                name: "Royal Hair Studio", 
                category: "hairdresser", 
                rating: 4.9, 
                reviews: 127,
                location: "123 Main Street, London", 
                image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=250&fit=crop&crop=center",
                subscription: "professional",
                hasPhoto: true,
                hasBooking: true,
                featured: true,
                description: "Premium hair styling and cutting services with advanced booking system",
                phone: "+44 20 1234 5678",
                email: "info@royalhair.com",
                address: "123 Main Street",
                city: "London",
                state: "Greater London",
                zipCode: "SW1A 1AA",
                dateCreated: new Date().toISOString(),
                status: 'active'
            },
            { 
                id: 'demo_2',
                name: "Elite Barber Shop", 
                category: "barber", 
                rating: 4.8, 
                reviews: 89,
                location: "456 High Street, London", 
                image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=250&fit=crop&crop=center",
                subscription: "professional",
                hasPhoto: true,
                hasBooking: true,
                featured: true,
                description: "Traditional and modern barbering services with full payment integration",
                phone: "+44 20 2345 6789",
                email: "hello@elitebarber.com",
                address: "456 High Street",
                city: "London",
                state: "Greater London",
                zipCode: "E1 6AN",
                dateCreated: new Date().toISOString(),
                status: 'active'
            },
            { 
                id: 'demo_3',
                name: "Glamour Beauty", 
                category: "beauty", 
                rating: 4.7, 
                reviews: 156,
                location: "789 Queen Street, London", 
                image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=250&fit=crop&crop=center",
                subscription: "professional",
                hasPhoto: true,
                hasBooking: true,
                featured: true,
                description: "Full-service beauty salon and spa treatments with business insights",
                phone: "+44 20 3456 7890",
                email: "book@glamourbeauty.com",
                address: "789 Queen Street",
                city: "London",
                state: "Greater London",
                zipCode: "W1D 3BS",
                dateCreated: new Date().toISOString(),
                status: 'active'
            },
            
            // Starter Tier Businesses (3)
            { 
                id: 'demo_4',
                name: "Style Studio", 
                category: "hairdresser", 
                rating: 4.5, 
                reviews: 45,
                location: "321 Style Avenue, London",
                image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=250&fit=crop&crop=center",
                subscription: "starter",
                hasPhoto: true,
                hasBooking: true,
                featured: false,
                description: "Modern hair styling with basic booking system",
                phone: "+44 20 4567 8901",
                email: "info@stylestudio.com",
                address: "321 Style Avenue",
                city: "London",
                state: "Greater London",
                zipCode: "SW3 4AB",
                dateCreated: new Date().toISOString(),
                status: 'active'
            },
            { 
                id: 'demo_5',
                name: "Classic Cuts", 
                category: "barber", 
                rating: 4.3, 
                reviews: 32,
                location: "654 Barber Lane, London",
                image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=250&fit=crop&crop=center",
                subscription: "starter",
                hasPhoto: true,
                hasBooking: true,
                featured: false,
                description: "Traditional barbering with enhanced profile visibility",
                phone: "+44 20 5678 9012",
                email: "book@classiccuts.com",
                address: "654 Barber Lane",
                city: "London",
                state: "Greater London",
                zipCode: "E2 5CD",
                dateCreated: new Date().toISOString(),
                status: 'active'
            },
            { 
                id: 'demo_6',
                name: "Beauty Haven", 
                category: "beauty", 
                rating: 4.4, 
                reviews: 67,
                location: "987 Beauty Road, London",
                image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=250&fit=crop&crop=center",
                subscription: "starter",
                hasPhoto: true,
                hasBooking: true,
                featured: false,
                description: "Beauty treatments with photo gallery and customer reviews",
                phone: "+44 20 6789 0123",
                email: "hello@beautyhaven.com",
                address: "987 Beauty Road",
                city: "London",
                state: "Greater London",
                zipCode: "W4 6EF",
                dateCreated: new Date().toISOString(),
                status: 'active'
            },
            
            // Basic/Free Tier Businesses (2)
            { 
                id: 'demo_7',
                name: "Perfect Nails", 
                category: "nail", 
                rating: 0,
                reviews: 0,
                location: "321 Beauty Lane, London",
                image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=250&fit=crop&crop=center",
                subscription: "free",
                hasPhoto: false,
                hasBooking: false,
                featured: false,
                description: "Professional nail care and manicure services",
                phone: "+44 20 7654 3210",
                email: "info@perfectnails.com",
                address: "321 Beauty Lane",
                city: "London",
                state: "Greater London",
                zipCode: "NW1 6XE",
                dateCreated: new Date().toISOString(),
                status: 'active'
            },
            { 
                id: 'demo_8',
                name: "Quick Cuts", 
                category: "barber", 
                rating: 0,
                reviews: 0,
                location: "555 Quick Street, London",
                image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=250&fit=crop&crop=center",
                subscription: "free",
                hasPhoto: false,
                hasBooking: false,
                featured: false,
                description: "Fast and affordable haircuts",
                phone: "+44 20 8765 4321",
                email: "contact@quickcuts.com",
                address: "555 Quick Street",
                city: "London",
                state: "Greater London",
                zipCode: "SE1 7GH",
                dateCreated: new Date().toISOString(),
                status: 'active'
            }
        ];
        
        this.saveBusinesses(demoBusinesses);
        console.log('8 demo businesses initialized with different tiers');
        
        // Force refresh the page if we're on search-results
        if (typeof window !== 'undefined' && window.location.pathname.includes('search-results')) {
            setTimeout(() => {
                if (typeof window.initializeSearch === 'function') {
                    window.initializeSearch();
                }
            }, 100);
        }
    }
    
    // Get businesses by category
    getBusinessesByCategory(category) {
        return this.searchBusinesses({ category });
    }
    
    // Get businesses by location
    getBusinessesByLocation(location) {
        return this.searchBusinesses({ location });
    }
    
    // Get featured businesses
    getFeaturedBusinesses() {
        const businesses = this.getBusinesses();
        return businesses.filter(business => business.featured && business.status === 'active');
    }
    
    // Get recent businesses (newly registered)
    getRecentBusinesses(limit = 5) {
        const businesses = this.getBusinesses();
        return businesses
            .filter(business => business.status === 'active')
            .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
            .slice(0, limit);
    }
}

// Initialize global business manager
window.businessManager = new BusinessManager();
