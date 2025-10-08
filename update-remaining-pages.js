#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files that need the warning suppression script
const filesToUpdate = [
    'customer-login.html',
    'beauty-businesses.html',
    'blog.html',
    'barber-businesses.html',
    'nail-businesses.html',
    'hair-businesses.html',
    'customer-register.html',
    'offers.html',
    'demo-business-starter.html',
    'demo-business-free.html',
    'why-list-with-us.html',
    'coming-soon.html',
    'backend-test.html'
];

function updateFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if file uses Tailwind CDN
        if (content.includes('cdn.tailwindcss.com')) {
            // Add warning suppression script after Tailwind CDN
            content = content.replace(
                /<script src="https:\/\/cdn\.tailwindcss\.com[^"]*"><\/script>/g,
                '<script src="https://cdn.tailwindcss.com"></script>\n    <script src="js/suppress-tailwind-warning.js"></script>'
            );
            
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated ${filePath}`);
        } else {
            console.log(`⚠️  ${filePath} doesn't use Tailwind CDN`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
    }
}

console.log('🔄 Adding Tailwind warning suppression to remaining pages...\n');

filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        updateFile(filePath);
    } else {
        console.log(`⚠️  File not found: ${file}`);
    }
});

console.log('\n✅ All files updated successfully!');
console.log('\n📝 The Tailwind CDN warning will now be suppressed.');
console.log('For production deployment, consider using the local CSS build instead.');


