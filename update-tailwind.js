#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files that use CDN Tailwind CSS
const filesToUpdate = [
    'search-results.html',
    'customer-login.html',
    'beauty-businesses.html',
    'blog.html',
    'barber-businesses.html',
    'nail-businesses.html',
    'hair-businesses.html',
    'customer-register.html',
    'offers.html',
    'business-profile.html',
    'demo-business-starter.html',
    'demo-business-free.html',
    'why-list-with-us.html',
    'coming-soon.html',
    'backend-test.html'
];

function updateFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace CDN Tailwind CSS with production CSS
        content = content.replace(
            /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/g,
            '<link rel="stylesheet" href="css/output.css">'
        );
        
        // Remove Tailwind config scripts
        content = content.replace(
            /<script>\s*tailwind\.config\s*=\s*\{[\s\S]*?\}\s*<\/script>/g,
            ''
        );
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated ${filePath}`);
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
    }
}

console.log('🔄 Updating Tailwind CSS from CDN to production build...\n');

filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        updateFile(filePath);
    } else {
        console.log(`⚠️  File not found: ${file}`);
    }
});

console.log('\n✅ All files updated successfully!');
console.log('\n📝 Next steps:');
console.log('1. Install Tailwind CSS: npm install');
console.log('2. Build CSS: npm run build-css-prod');
console.log('3. Test the pages to ensure styling works correctly');


