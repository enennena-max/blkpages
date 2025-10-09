/**
 * BlkPages Loyalty Demo Seeder
 * 
 * IMPORTANT SAFEGUARDS:
 * - DO NOT run in production
 * - Creates demo-only records with demo=true flag
 * - Prefixes all demo data with "DEMO_"
 * - Provides cleanup functionality
 * - Includes comprehensive logging
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class LoyaltyDemoSeeder {
    constructor() {
        this.environment = process.env.NODE_ENV || 'development';
        this.demoPrefix = 'DEMO_';
        this.demoFlag = true;
        this.createdRecords = {
            businesses: [],
            customers: [],
            bookings: [],
            vouchers: [],
            loyaltyProgrammes: [],
            loyaltyProgress: []
        };
        this.logs = [];
    }

    /**
     * STEP 1: Environment Check
     */
    checkEnvironment() {
        this.log('🔍 Checking environment...');
        
        if (this.environment === 'production') {
            throw new Error('❌ SAFETY ABORT: This script cannot run in production environment!');
        }
        
        this.log(`✅ Environment check passed: ${this.environment}`);
        return true;
    }

    /**
     * STEP 2: Schema Check & Demo Table Creation
     */
    async checkSchema() {
        this.log('🔍 Checking database schema...');
        
        // In a real implementation, this would check actual database tables
        // For demo purposes, we'll use localStorage to simulate database operations
        
        const requiredTables = [
            'LoyaltyProgrammes',
            'LoyaltyProgress', 
            'RewardVouchers',
            'Bookings',
            'Businesses',
            'Customers'
        ];
        
        // Initialize demo tables in localStorage
        requiredTables.forEach(table => {
            const existingData = JSON.parse(localStorage.getItem(`demo_${table}`) || '[]');
            if (existingData.length === 0) {
                localStorage.setItem(`demo_${table}`, JSON.stringify([]));
                this.log(`✅ Created demo table: demo_${table}`);
            } else {
                this.log(`✅ Demo table exists: demo_${table}`);
            }
        });
        
        return true;
    }

    /**
     * STEP 3: Create Demo Businesses
     */
    async createDemoBusinesses() {
        this.log('🏢 Creating demo businesses...');
        
        const businesses = [
            {
                id: this.generateId(),
                name: 'DEMO_GlowHair',
                email: 'demo_glow@blkpages.test',
                timezone: 'Europe/London',
                plan: 'Professional',
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            },
            {
                id: this.generateId(),
                name: 'DEMO_ZenSpa',
                email: 'demo_zen@blkpages.test',
                timezone: 'Europe/London',
                plan: 'Starter',
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            },
            {
                id: this.generateId(),
                name: 'DEMO_CityNails',
                email: 'demo_city@blkpages.test',
                timezone: 'Europe/London',
                plan: 'Starter',
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            },
            {
                id: this.generateId(),
                name: 'DEMO_FreshCuts',
                email: 'demo_fresh@blkpages.test',
                timezone: 'Europe/London',
                plan: 'Professional',
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            },
            {
                id: this.generateId(),
                name: 'DEMO_LuxeBrow',
                email: 'demo_luxe@blkpages.test',
                timezone: 'Europe/London',
                plan: 'FreeGrowth',
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            }
        ];

        // Save to demo businesses table
        localStorage.setItem('demo_Businesses', JSON.stringify(businesses));
        this.createdRecords.businesses = businesses;
        
        this.log(`✅ Created ${businesses.length} demo businesses`);
        return businesses;
    }

    /**
     * STEP 4: Create Demo Customers
     */
    async createDemoCustomers() {
        this.log('👥 Creating demo customers...');
        
        const customers = [
            { id: this.generateId(), first_name: 'DemoAlice', email: 'demo_customer1@blkpages.test', demo: this.demoFlag, created_at: new Date().toISOString() },
            { id: this.generateId(), first_name: 'DemoBen', email: 'demo_customer2@blkpages.test', demo: this.demoFlag, created_at: new Date().toISOString() },
            { id: this.generateId(), first_name: 'DemoCara', email: 'demo_customer3@blkpages.test', demo: this.demoFlag, created_at: new Date().toISOString() },
            { id: this.generateId(), first_name: 'DemoDan', email: 'demo_customer4@blkpages.test', demo: this.demoFlag, created_at: new Date().toISOString() },
            { id: this.generateId(), first_name: 'DemoEve', email: 'demo_customer5@blkpages.test', demo: this.demoFlag, created_at: new Date().toISOString() },
            { id: this.generateId(), first_name: 'DemoFred', email: 'demo_customer6@blkpages.test', demo: this.demoFlag, created_at: new Date().toISOString() },
            { id: this.generateId(), first_name: 'DemoGina', email: 'demo_customer7@blkpages.test', demo: this.demoFlag, created_at: new Date().toISOString() },
            { id: this.generateId(), first_name: 'DemoHugo', email: 'demo_customer8@blkpages.test', demo: this.demoFlag, created_at: new Date().toISOString() }
        ];

        localStorage.setItem('demo_Customers', JSON.stringify(customers));
        this.createdRecords.customers = customers;
        
        this.log(`✅ Created ${customers.length} demo customers`);
        return customers;
    }

    /**
     * STEP 5: Create Loyalty Programmes
     */
    async createLoyaltyProgrammes(businesses) {
        this.log('🎯 Creating loyalty programmes...');
        
        const programmes = [
            {
                id: this.generateId(),
                business_id: businesses[0].id, // GlowHair
                type: 'Visits',
                threshold: 5,
                reward_type: 'Free Service',
                reward_value: 'Blow Dry',
                expiry_days: 30,
                active: true,
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            },
            {
                id: this.generateId(),
                business_id: businesses[1].id, // ZenSpa
                type: 'Spend',
                threshold: 200.00,
                reward_type: 'Credit',
                reward_value: '20.00',
                expiry_days: 60,
                active: true,
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            },
            {
                id: this.generateId(),
                business_id: businesses[2].id, // CityNails
                type: 'Visits',
                threshold: 3,
                reward_type: 'Discount',
                reward_value: '20',
                expiry_days: 14,
                active: true,
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            },
            {
                id: this.generateId(),
                business_id: businesses[3].id, // FreshCuts
                type: 'Time',
                threshold: 4,
                reward_type: 'Free Service',
                reward_value: 'Express Cut',
                expiry_days: 45,
                active: true,
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            },
            {
                id: this.generateId(),
                business_id: businesses[4].id, // LuxeBrow
                type: 'Visits',
                threshold: 5,
                reward_type: 'Free Service',
                reward_value: 'Brow Wax',
                expiry_days: 30,
                active: true,
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            }
        ];

        localStorage.setItem('demo_LoyaltyProgrammes', JSON.stringify(programmes));
        this.createdRecords.loyaltyProgrammes = programmes;
        
        this.log(`✅ Created ${programmes.length} loyalty programmes`);
        return programmes;
    }

    /**
     * STEP 6: Seed Bookings to Trigger Progress
     */
    async seedBookings(businesses, customers) {
        this.log('📅 Seeding demo bookings...');
        
        const bookings = [];
        const now = new Date();
        
        // GlowHair: Customer1 -> 5 completed bookings (should unlock voucher)
        for (let i = 0; i < 5; i++) {
            bookings.push({
                id: this.generateId(),
                customer_id: customers[0].id,
                business_id: businesses[0].id,
                service: 'Hair Styling',
                amount: 45.00,
                status: 'Completed',
                completed_at: new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000)).toISOString(),
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            });
        }
        
        // ZenSpa: Customer2 -> bookings totalling £210 in spend (should unlock voucher)
        bookings.push({
            id: this.generateId(),
            customer_id: customers[1].id,
            business_id: businesses[1].id,
            service: 'Full Body Massage',
            amount: 210.00,
            status: 'Completed',
            completed_at: new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)).toISOString(),
            demo: this.demoFlag,
            created_at: new Date().toISOString()
        });
        
        // CityNails: Customer3 -> 2 completed bookings (not yet unlocked)
        for (let i = 0; i < 2; i++) {
            bookings.push({
                id: this.generateId(),
                customer_id: customers[2].id,
                business_id: businesses[2].id,
                service: 'Manicure',
                amount: 25.00,
                status: 'Completed',
                completed_at: new Date(now.getTime() - (i * 14 * 24 * 60 * 60 * 1000)).toISOString(),
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            });
        }
        
        // CityNails: Customer4 -> 3 completed bookings (unlocked)
        for (let i = 0; i < 3; i++) {
            bookings.push({
                id: this.generateId(),
                customer_id: customers[3].id,
                business_id: businesses[2].id,
                service: 'Pedicure',
                amount: 30.00,
                status: 'Completed',
                completed_at: new Date(now.getTime() - (i * 10 * 24 * 60 * 60 * 1000)).toISOString(),
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            });
        }
        
        // FreshCuts: Customer5 -> 4 bookings within 60 days (unlocked)
        for (let i = 0; i < 4; i++) {
            bookings.push({
                id: this.generateId(),
                customer_id: customers[4].id,
                business_id: businesses[3].id,
                service: 'Haircut',
                amount: 35.00,
                status: 'Completed',
                completed_at: new Date(now.getTime() - (i * 15 * 24 * 60 * 60 * 1000)).toISOString(),
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            });
        }
        
        // LuxeBrow: Customer6 -> 5 bookings (unlocked)
        for (let i = 0; i < 5; i++) {
            bookings.push({
                id: this.generateId(),
                customer_id: customers[5].id,
                business_id: businesses[4].id,
                service: 'Brow Shaping',
                amount: 20.00,
                status: 'Completed',
                completed_at: new Date(now.getTime() - (i * 8 * 24 * 60 * 60 * 1000)).toISOString(),
                demo: this.demoFlag,
                created_at: new Date().toISOString()
            });
        }

        localStorage.setItem('demo_Bookings', JSON.stringify(bookings));
        this.createdRecords.bookings = bookings;
        
        this.log(`✅ Created ${bookings.length} demo bookings`);
        return bookings;
    }

    /**
     * STEP 7: Generate Vouchers
     */
    async generateVouchers(businesses, customers, programmes) {
        this.log('🎫 Generating reward vouchers...');
        
        const vouchers = [];
        const loyaltyProgress = [];
        
        // Process each business's completed bookings
        for (const business of businesses) {
            const businessBookings = this.createdRecords.bookings.filter(b => b.business_id === business.id && b.status === 'Completed');
            const programme = programmes.find(p => p.business_id === business.id);
            
            if (!programme) continue;
            
            // Group bookings by customer
            const customerBookings = {};
            businessBookings.forEach(booking => {
                if (!customerBookings[booking.customer_id]) {
                    customerBookings[booking.customer_id] = [];
                }
                customerBookings[booking.customer_id].push(booking);
            });
            
            // Process each customer's progress
            for (const [customerId, bookings] of Object.entries(customerBookings)) {
                const customer = customers.find(c => c.id === customerId);
                if (!customer) continue;
                
                // Calculate progress based on programme type
                let currentProgress = 0;
                if (programme.type === 'Visits') {
                    currentProgress = bookings.length;
                } else if (programme.type === 'Spend') {
                    currentProgress = bookings.reduce((sum, b) => sum + b.amount, 0);
                } else if (programme.type === 'Time') {
                    // For time-based, check if visits are within the time window
                    const timeWindow = 60; // days
                    const cutoffDate = new Date(Date.now() - (timeWindow * 24 * 60 * 60 * 1000));
                    const recentBookings = bookings.filter(b => new Date(b.completed_at) > cutoffDate);
                    currentProgress = recentBookings.length;
                }
                
                // Create or update loyalty progress
                const progressId = this.generateId();
                const progress = {
                    id: progressId,
                    customer_id: customerId,
                    business_id: business.id,
                    total_visits: programme.type === 'Visits' ? currentProgress : bookings.length,
                    total_spend: bookings.reduce((sum, b) => sum + b.amount, 0),
                    last_visit: bookings[bookings.length - 1].completed_at,
                    reward_unlocked: currentProgress >= programme.threshold,
                    reward_redeemed: false,
                    reward_voucher_id: null,
                    demo: this.demoFlag,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                loyaltyProgress.push(progress);
                
                // Generate voucher if threshold met
                if (currentProgress >= programme.threshold) {
                    const voucherCode = this.generateVoucherCode();
                    const expiryDate = new Date(Date.now() + (programme.expiry_days * 24 * 60 * 60 * 1000));
                    
                    const voucher = {
                        id: this.generateId(),
                        code: voucherCode,
                        customer_id: customerId,
                        business_id: business.id,
                        reward_type: programme.reward_type,
                        reward_value: programme.reward_value,
                        expires_at: expiryDate.toISOString(),
                        used: false,
                        expired: false,
                        demo: this.demoFlag,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    
                    vouchers.push(voucher);
                    
                    // Update progress with voucher ID
                    progress.reward_voucher_id = voucher.id;
                }
            }
        }
        
        // Save to localStorage
        localStorage.setItem('demo_RewardVouchers', JSON.stringify(vouchers));
        localStorage.setItem('demo_LoyaltyProgress', JSON.stringify(loyaltyProgress));
        
        this.createdRecords.vouchers = vouchers;
        this.createdRecords.loyaltyProgress = loyaltyProgress;
        
        this.log(`✅ Generated ${vouchers.length} reward vouchers`);
        this.log(`✅ Created ${loyaltyProgress.length} loyalty progress records`);
        
        return { vouchers, loyaltyProgress };
    }

    /**
     * STEP 8: Create Admin Demo UI
     */
    async createAdminDemoUI() {
        this.log('🖥️ Creating admin demo UI...');
        
        const adminHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loyalty Demo Admin - BlkPages</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #FF3CAC, #784BA0); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #FF3CAC; }
        .stat-number { font-size: 24px; font-weight: bold; color: #FF3CAC; }
        .stat-label { color: #666; font-size: 14px; }
        .actions { margin-bottom: 20px; }
        .btn { background: #FF3CAC; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px; }
        .btn:hover { background: #e91e63; }
        .btn-secondary { background: #6c757d; }
        .btn-secondary:hover { background: #5a6268; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .status-issued { background: #fff3cd; color: #856404; }
        .status-redeemed { background: #d4edda; color: #155724; }
        .status-expired { background: #f8d7da; color: #721c24; }
        .export-section { background: #e9ecef; padding: 15px; border-radius: 6px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Loyalty Demo Admin Panel</h1>
            <p>Manage and monitor demo loyalty rewards system</p>
        </div>
        
        <div class="stats" id="statsContainer">
            <!-- Stats will be loaded here -->
        </div>
        
        <div class="actions">
            <button class="btn" onclick="downloadCSV()">📥 Download CSV</button>
            <button class="btn btn-secondary" onclick="regenerateVouchers()">🔄 Re-run Generation</button>
            <button class="btn btn-secondary" onclick="cleanupDemo()">🗑️ Cleanup Demo Data</button>
        </div>
        
        <div class="export-section">
            <h3>📊 Demo Vouchers Export</h3>
            <p>Export all demo reward vouchers to CSV format for analysis.</p>
            <p><strong>File:</strong> <span id="csvPath">/exports/loyalty_demo_vouchers_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.csv</span></p>
        </div>
        
        <table id="vouchersTable">
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Business</th>
                    <th>Customer</th>
                    <th>Reward Type</th>
                    <th>Reward Value</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th>Redeemed On</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody id="vouchersTableBody">
                <!-- Vouchers will be loaded here -->
            </tbody>
        </table>
    </div>

    <script>
        // Load demo data from localStorage
        function loadDemoData() {
            const vouchers = JSON.parse(localStorage.getItem('demo_RewardVouchers') || '[]');
            const businesses = JSON.parse(localStorage.getItem('demo_Businesses') || '[]');
            const customers = JSON.parse(localStorage.getItem('demo_Customers') || '[]');
            
            // Update stats
            const statsContainer = document.getElementById('statsContainer');
            const totalVouchers = vouchers.length;
            const redeemedVouchers = vouchers.filter(v => v.used).length;
            const expiredVouchers = vouchers.filter(v => v.expired).length;
            const activeVouchers = totalVouchers - redeemedVouchers - expiredVouchers;
            
            statsContainer.innerHTML = \`
                <div class="stat-card">
                    <div class="stat-number">\${totalVouchers}</div>
                    <div class="stat-label">Total Vouchers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${redeemedVouchers}</div>
                    <div class="stat-label">Redeemed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${expiredVouchers}</div>
                    <div class="stat-label">Expired</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${activeVouchers}</div>
                    <div class="stat-label">Active</div>
                </div>
            \`;
            
            // Update vouchers table
            const tableBody = document.getElementById('vouchersTableBody');
            tableBody.innerHTML = vouchers.map(voucher => {
                const business = businesses.find(b => b.id === voucher.business_id);
                const customer = customers.find(c => c.id === voucher.customer_id);
                
                let statusClass = 'status-issued';
                let statusText = 'Issued';
                
                if (voucher.used) {
                    statusClass = 'status-redeemed';
                    statusText = 'Redeemed';
                } else if (voucher.expired) {
                    statusClass = 'status-expired';
                    statusText = 'Expired';
                }
                
                return \`
                    <tr>
                        <td><strong>\${voucher.code}</strong></td>
                        <td>\${business ? business.name : 'Unknown'}</td>
                        <td>\${customer ? customer.first_name : 'Unknown'}</td>
                        <td>\${voucher.reward_type}</td>
                        <td>\${voucher.reward_value}</td>
                        <td>\${new Date(voucher.expires_at).toLocaleDateString()}</td>
                        <td><span class="status-badge \${statusClass}">\${statusText}</span></td>
                        <td>\${voucher.used_at ? new Date(voucher.used_at).toLocaleDateString() : '-'}</td>
                        <td>\${new Date(voucher.created_at).toLocaleDateString()}</td>
                    </tr>
                \`;
            }).join('');
        }
        
        function downloadCSV() {
            const vouchers = JSON.parse(localStorage.getItem('demo_RewardVouchers') || '[]');
            const businesses = JSON.parse(localStorage.getItem('demo_Businesses') || '[]');
            const customers = JSON.parse(localStorage.getItem('demo_Customers') || '[]');
            
            const csvContent = [
                'code,business_name,customer_name,reward_type,reward_value,expiry_date,redeemed,redeemed_on,expired,created_at'
            ].concat(
                vouchers.map(voucher => {
                    const business = businesses.find(b => b.id === voucher.business_id);
                    const customer = customers.find(c => c.id === voucher.customer_id);
                    
                    return [
                        voucher.code,
                        business ? business.name : 'Unknown',
                        customer ? customer.first_name : 'Unknown',
                        voucher.reward_type,
                        voucher.reward_value,
                        voucher.expires_at,
                        voucher.used ? 'true' : 'false',
                        voucher.used_at || '',
                        voucher.expired ? 'true' : 'false',
                        voucher.created_at
                    ].join(',');
                })
            ).join('\\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`loyalty_demo_vouchers_\${new Date().toISOString().slice(0,10).replace(/-/g,'')}.csv\`;
            a.click();
            window.URL.revokeObjectURL(url);
        }
        
        function regenerateVouchers() {
            if (confirm('This will regenerate all vouchers. Continue?')) {
                alert('Voucher regeneration would be implemented here in a real system.');
                loadDemoData();
            }
        }
        
        function cleanupDemo() {
            if (confirm('This will delete all demo data. Are you sure?')) {
                const demoKeys = ['demo_Businesses', 'demo_Customers', 'demo_Bookings', 'demo_LoyaltyProgrammes', 'demo_LoyaltyProgress', 'demo_RewardVouchers'];
                demoKeys.forEach(key => localStorage.removeItem(key));
                alert('Demo data cleaned up successfully!');
                loadDemoData();
            }
        }
        
        // Load data on page load
        document.addEventListener('DOMContentLoaded', loadDemoData);
    </script>
</body>
</html>`;
        
        // Save admin UI to file
        const adminPath = '/Users/nnenaene/Desktop/blkpages/admin/demo/loyalty.html';
        const adminDir = path.dirname(adminPath);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(adminDir)) {
            fs.mkdirSync(adminDir, { recursive: true });
        }
        
        fs.writeFileSync(adminPath, adminHTML);
        this.log(`✅ Created admin demo UI at: ${adminPath}`);
        
        return adminPath;
    }

    /**
     * STEP 9: Generate CSV Export
     */
    async generateCSVExport() {
        this.log('📊 Generating CSV export...');
        
        const vouchers = this.createdRecords.vouchers;
        const businesses = this.createdRecords.businesses;
        const customers = this.createdRecords.customers;
        
        const csvContent = [
            'code,business_name,customer_name,reward_type,reward_value,expiry_date,redeemed,redeemed_on,expired,created_at'
        ].concat(
            vouchers.map(voucher => {
                const business = businesses.find(b => b.id === voucher.business_id);
                const customer = customers.find(c => c.id === voucher.customer_id);
                
                return [
                    voucher.code,
                    business ? business.name : 'Unknown',
                    customer ? customer.first_name : 'Unknown',
                    voucher.reward_type,
                    voucher.reward_value,
                    voucher.expires_at,
                    voucher.used ? 'true' : 'false',
                    voucher.used_at || '',
                    voucher.expired ? 'true' : 'false',
                    voucher.created_at
                ].join(',');
            })
        ).join('\n');
        
        const fileName = `loyalty_demo_vouchers_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.csv`;
        const csvPath = `/Users/nnenaene/Desktop/blkpages/exports/${fileName}`;
        const exportsDir = path.dirname(csvPath);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }
        
        fs.writeFileSync(csvPath, csvContent);
        this.log(`✅ Generated CSV export: ${csvPath}`);
        
        return csvPath;
    }

    /**
     * STEP 10: Demo Cleanup Function
     */
    async demoCleanup() {
        this.log('🧹 Demo cleanup function created...');
        
        const cleanupFunction = `
/**
 * Demo Cleanup Function
 * Removes all demo data created by the loyalty seeder
 */
function demoCleanup() {
    console.log('🧹 Starting demo cleanup...');
    
    const demoKeys = [
        'demo_Businesses',
        'demo_Customers', 
        'demo_Bookings',
        'demo_LoyaltyProgrammes',
        'demo_LoyaltyProgress',
        'demo_RewardVouchers'
    ];
    
    let cleanedCount = 0;
    demoKeys.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            cleanedCount++;
            console.log(\`✅ Removed \${key}\`);
        }
    });
    
    console.log(\`🧹 Demo cleanup completed. Removed \${cleanedCount} demo datasets.\`);
    return { cleaned: cleanedCount, keys: demoKeys };
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { demoCleanup };
}
`;
        
        const cleanupPath = '/Users/nnenaene/Desktop/blkpages/backend/demo-cleanup.js';
        fs.writeFileSync(cleanupPath, cleanupFunction);
        this.log(`✅ Created demo cleanup function: ${cleanupPath}`);
        
        return cleanupPath;
    }

    /**
     * Helper Methods
     */
    generateId() {
        return crypto.randomUUID();
    }

    generateVoucherCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'BP-';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        this.logs.push(logMessage);
    }

    /**
     * Main execution method
     */
    async run() {
        try {
            this.log('🚀 Starting Loyalty Demo Seeder...');
            
            // Step 1: Environment Check
            this.checkEnvironment();
            
            // Step 2: Schema Check
            await this.checkSchema();
            
            // Step 3: Create Demo Businesses
            const businesses = await this.createDemoBusinesses();
            
            // Step 4: Create Demo Customers
            const customers = await this.createDemoCustomers();
            
            // Step 5: Create Loyalty Programmes
            const programmes = await this.createLoyaltyProgrammes(businesses);
            
            // Step 6: Seed Bookings
            await this.seedBookings(businesses, customers);
            
            // Step 7: Generate Vouchers
            const { vouchers, loyaltyProgress } = await this.generateVouchers(businesses, customers, programmes);
            
            // Step 8: Create Admin Demo UI
            const adminPath = await this.createAdminDemoUI();
            
            // Step 9: Generate CSV Export
            const csvPath = await this.generateCSVExport();
            
            // Step 10: Create Cleanup Function
            const cleanupPath = await this.demoCleanup();
            
            // Generate summary
            const summary = {
                success: true,
                environment: this.environment,
                businesses_created: businesses.length,
                customers_created: customers.length,
                bookings_created: this.createdRecords.bookings.length,
                vouchers_created: vouchers.length,
                loyalty_programmes_created: programmes.length,
                loyalty_progress_created: loyaltyProgress.length,
                vouchers_list: vouchers.slice(0, 20).map(v => ({
                    code: v.code,
                    business: businesses.find(b => b.id === v.business_id)?.name,
                    customer: customers.find(c => c.id === v.customer_id)?.first_name,
                    reward: `${v.reward_type}: ${v.reward_value}`,
                    expiry: v.expires_at,
                    redeemed: v.used
                })),
                csv_path: csvPath,
                admin_ui_path: adminPath,
                cleanup_path: cleanupPath,
                logs: this.logs
            };
            
            this.log('✅ Demo seeding completed successfully!');
            this.log(`📊 Summary: ${JSON.stringify(summary, null, 2)}`);
            
            return summary;
            
        } catch (error) {
            this.log(`❌ Demo seeding failed: ${error.message}`);
            throw error;
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoyaltyDemoSeeder;
}

// Run if called directly
if (require.main === module) {
    const seeder = new LoyaltyDemoSeeder();
    seeder.run().then(summary => {
        console.log('\n🎉 DEMO SEEDING COMPLETED SUCCESSFULLY!');
        console.log('\n📋 SUMMARY:');
        console.log(JSON.stringify(summary, null, 2));
        console.log('\n🔗 LINKS:');
        console.log(`Admin Demo UI: file://${summary.admin_ui_path}`);
        console.log(`CSV Export: file://${summary.csv_path}`);
        console.log(`Cleanup Function: file://${summary.cleanup_path}`);
    }).catch(error => {
        console.error('\n❌ DEMO SEEDING FAILED:', error.message);
        process.exit(1);
    });
}
