/**
 * Server Configuration for Business Profile Routes
 * Handles /business/{businessSlug} route pattern
 */

const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static('.'));

// Handle /business/{businessSlug} routes
app.get('/business/:businessSlug', (req, res) => {
    const businessSlug = req.params.businessSlug;
    
    // Serve the business profile page with the business slug
    res.sendFile(path.join(__dirname, 'business-profile-new.html'));
});

// Handle root and other routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, 'search.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Business profiles available at: http://localhost:${PORT}/business/{businessSlug}`);
});

module.exports = app;
