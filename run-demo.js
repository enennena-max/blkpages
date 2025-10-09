#!/usr/bin/env node

/**
 * BlkPages Loyalty Demo Runner
 * 
 * This script runs the complete loyalty demo seeder and provides
 * a summary of all created demo data.
 * 
 * IMPORTANT: This is for demo/sandbox use only!
 */

const LoyaltyDemoSeeder = require('./backend/demo-loyalty-seeder.js');

async function runDemo() {
    console.log('🚀 Starting BlkPages Loyalty Demo...');
    console.log('⚠️  IMPORTANT: This is for demo/sandbox use only!');
    console.log('');
    
    try {
        const seeder = new LoyaltyDemoSeeder();
        const summary = await seeder.run();
        
        console.log('\n🎉 DEMO SEEDING COMPLETED SUCCESSFULLY!');
        console.log('\n📊 SUMMARY:');
        console.log(`✅ Businesses created: ${summary.businesses_created}`);
        console.log(`✅ Customers created: ${summary.customers_created}`);
        console.log(`✅ Bookings created: ${summary.bookings_created}`);
        console.log(`✅ Vouchers created: ${summary.vouchers_created}`);
        console.log(`✅ Loyalty programmes created: ${summary.loyalty_programmes_created}`);
        console.log(`✅ Loyalty progress records created: ${summary.loyalty_progress_created}`);
        
        console.log('\n🎫 SAMPLE VOUCHER CODES:');
        summary.vouchers_list.slice(0, 10).forEach((voucher, index) => {
            console.log(`${index + 1}. ${voucher.code} - ${voucher.business} - ${voucher.customer} - ${voucher.reward}`);
        });
        
        console.log('\n🔗 IMPORTANT LINKS:');
        console.log(`📊 Admin Demo UI: file://${summary.admin_ui_path}`);
        console.log(`📥 CSV Export: file://${summary.csv_path}`);
        console.log(`🧹 Cleanup Function: file://${summary.cleanup_path}`);
        console.log(`🛒 Demo Checkout: file://${__dirname}/demo/business/checkout.html`);
        
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Open the Admin Demo UI to view all generated vouchers');
        console.log('2. Download the CSV export for analysis');
        console.log('3. Test promo code redemption on the demo checkout page');
        console.log('4. Run cleanup when done: node backend/demo-cleanup.js');
        
        console.log('\n⚠️  REMEMBER:');
        console.log('- All data is marked with demo=true flag');
        console.log('- Use demo_cleanup() to remove all demo data');
        console.log('- This should NEVER be run in production!');
        
        return summary;
        
    } catch (error) {
        console.error('\n❌ DEMO SEEDING FAILED:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the demo
if (require.main === module) {
    runDemo();
}

module.exports = { runDemo };
