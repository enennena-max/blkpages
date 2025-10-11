/**
 * BlkPages Analytics Server
 * 
 * Required Environment Variables:
 * - MONGO_URI: MongoDB connection string (e.g., mongodb://localhost:27017/blkpages)
 * 
 * How to run:
 * 1. npm install express mongodb cors dotenv
 * 2. node server.js
 * 
 * Default port: 5000
 * 
 * API Endpoints:
 * - POST /api/record-event: Record analytics events
 * - GET /api/analytics?businessId=XYZ: Get analytics stats
 */

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Make io globally available
global.io = io;

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/blkpages';

// JWT Token utilities
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

function generateDashboardToken(businessId) {
    return jwt.sign(
        { businessId, type: 'dashboardAccess' },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function verifyDashboardToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

// Email utilities
const emailTransporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendBusinessWelcomeEmail(business, dashboardLink) {
    try {
        const templatePath = path.resolve('email-templates', 'businessWelcome.ejs');
        const html = await ejs.renderFile(templatePath, {
            businessName: business.name,
            businessEmail: business.email,
            dashboardLink,
            appUrl: process.env.APP_UI_BASE_URL || 'https://blkpages.co.uk'
        });
        
        const text = `
Welcome to BlkPages, ${business.name}!

Your business is now live on BlkPages.

You can manage bookings, services, and analytics here:
${dashboardLink}

Thanks for joining BlkPages!
        `;

        await emailTransporter.sendMail({
            from: process.env.SMTP_FROM || '"BlkPages" <no-reply@blkpages.co.uk>',
            to: business.email,
            subject: 'Welcome to BlkPages!',
            html,
            text
        });
        
        console.log('Welcome email sent to:', business.email);
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw error;
    }
}

async function sendCustomerWelcomeEmail(customer) {
    try {
        // Get local businesses for customer's area
        const localBusinesses = await db
            .collection('businesses')
            .find({ 
                borough: customer.borough, 
                isPublished: true,
                status: 'active'
            })
            .limit(5)
            .project({ name: 1, category: 1, town: 1, slug: 1, _id: 1 })
            .toArray();

        // Add profile URLs
        const appUrl = process.env.APP_UI_BASE_URL || 'https://blkpages.co.uk';
        localBusinesses.forEach(b => {
            b.profileUrl = `${appUrl}/business/${b.slug || b._id}`;
        });

        // Generate browse link
        const browseLink = `${appUrl}/search?borough=${encodeURIComponent(customer.borough)}`;

        const templatePath = path.resolve('email-templates', 'customerWelcome.ejs');
        const html = await ejs.renderFile(templatePath, {
            customerName: customer.name,
            customerEmail: customer.email,
            localBusinesses,
            browseLink,
            appUrl
        });
        
        const text = `
Welcome to BlkPages, ${customer.name}!

BlkPages connects you to Black-owned businesses in your area.

Here are a few new businesses near you:
${localBusinesses.map(b => `• ${b.name} — ${b.category}, ${b.town}\n  Profile: ${b.profileUrl}`).join('\n')}

When you're ready, browse more businesses here:
${browseLink}

Thanks for joining BlkPages!
        `;

        await emailTransporter.sendMail({
            from: process.env.SMTP_FROM || '"BlkPages" <no-reply@blkpages.co.uk>',
            to: customer.email,
            subject: 'Welcome to BlkPages! Discover Local Black-Owned Businesses',
            html,
            text
        });
        
        console.log('Customer welcome email sent to:', customer.email);
    } catch (error) {
        console.error('Error sending customer welcome email:', error);
        throw error;
    }
}

// Image processing utilities
const ROOT = process.env.UPLOAD_ROOT || path.resolve('uploads/businesses');
const SIZES = { thumb: 200, small: 480, medium: 960, large: 1600 };
const FORMATS = ['webp', 'avif', 'jpg'];

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function filePaths(businessId, hash, variant = 'original', ext = 'jpg') {
  const base = path.join(ROOT, businessId, variant);
  const filename = `${hash}.${ext}`;
  const rel = `/uploads/businesses/${businessId}/${variant}/${filename}`;
  return {
    abs: path.join(base, filename),
    rel,
    base,
    filename
  };
}

function detectExt(mimetype) {
  const ext = path.extname(mimetype).slice(1);
  return ext === 'jpeg' ? 'jpg' : ext;
}

async function generateDerivatives({ businessId, hash, originalBuffer }) {
  const variants = {};
  const lqip = { dataUri: null };
  
  // Generate LQIP (Low Quality Image Placeholder)
  const lqipBuffer = await sharp(originalBuffer)
    .resize(20, 20, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 20 })
    .toBuffer();
  lqip.dataUri = `data:image/jpeg;base64,${lqipBuffer.toString('base64')}`;
  
  // Generate variants for each size
  for (const [sizeName, width] of Object.entries(SIZES)) {
    variants[sizeName] = {};
    
    for (const format of FORMATS) {
      const { abs, rel, base } = filePaths(businessId, hash, sizeName, format);
      await ensureDir(base);
      
      let pipeline = sharp(originalBuffer)
        .resize(width, null, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .rotate() // Auto-rotate based on EXIF
        .strip(); // Remove EXIF data
      
      if (format === 'webp') {
        pipeline = pipeline.webp({ quality: 85, effort: 6 });
      } else if (format === 'avif') {
        pipeline = pipeline.avif({ quality: 80, effort: 4 });
      } else {
        pipeline = pipeline.jpeg({ quality: 85, progressive: true });
      }
      
      await pipeline.toFile(abs);
      variants[sizeName][format] = rel;
    }
  }
  
  return { variants, lqip };
}

async function deleteImageFiles({ businessId, hash }) {
  const variants = ['original', 'thumb', 'small', 'medium', 'large'];
  const formats = ['jpg', 'webp', 'avif'];
  
  for (const variant of variants) {
    for (const format of formats) {
      try {
        const { abs } = filePaths(businessId, hash, variant, format);
        await fs.unlink(abs);
      } catch (err) {
        // File might not exist, ignore
      }
    }
  }
}

// Multer configuration for file uploads
const memStorage = multer.memoryStorage();
const upload = multer({
  storage: memStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(jpeg|png|webp|avif)/.test(file.mimetype);
    cb(ok ? null : new Error('Unsupported image type'), ok);
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads', {
  etag: true,
  maxAge: '365d',
  immutable: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// MongoDB connection
let db;
let client;

async function connectToMongoDB() {
    try {
        client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db('blkpages');
        
        // Create indexes for performance
        await db.collection('business_analytics').createIndex({ businessId: 1, metricType: 1, timestamp: 1 });
        await db.collection('business_analytics').createIndex({ businessId: 1, timestamp: 1 });
        await db.collection('business_bookings').createIndex({ businessId: 1, startISO: 1, status: 1 });
        await db.collection('business_integrations').createIndex({ businessId: 1 });
        await db.collection('business_photos').createIndex({ businessId: 1, order: 1 });
        await db.collection('business_photos').createIndex({ businessId: 1, createdAt: 1 });
        await db.collection('business_services').createIndex({ businessId: 1, active: 1, featured: 1, published: 1 });
        await db.collection('business_services').createIndex({ businessId: 1, order: 1 });
        
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Initialize database connection
connectToMongoDB();

// Utility function to get UTC date boundaries
function getUTCDateBoundaries() {
    const now = new Date();
    
    // Start of today UTC
    const startOfTodayUTC = new Date(Date.UTC(
        now.getUTCFullYear(), 
        now.getUTCMonth(), 
        now.getUTCDate(), 
        0, 0, 0, 0
    ));
    
    // Start of this month UTC
    const startOfThisMonthUTC = new Date(Date.UTC(
        now.getUTCFullYear(), 
        now.getUTCMonth(), 
        1, 0, 0, 0, 0
    ));
    
    // Start of last month UTC
    const startOfLastMonthUTC = new Date(Date.UTC(
        now.getUTCFullYear(), 
        now.getUTCMonth() - 1, 
        1, 0, 0, 0, 0
    ));
    
    // End of last month UTC
    const endOfLastMonthUTC = new Date(Date.UTC(
        now.getUTCFullYear(), 
        now.getUTCMonth(), 
        0, 23, 59, 59, 999
    ));
    
    return {
        startOfTodayUTC,
        startOfThisMonthUTC,
        startOfLastMonthUTC,
        endOfLastMonthUTC
    };
}

// Valid metric types
const VALID_METRIC_TYPES = [
    'profileView',
    'searchImpression', 
    'contactClick',
    'enquiryReceived'
];

/**
 * POST /api/record-event
 * Record an analytics event with optional visitor context
 */
app.post('/api/record-event', async (req, res) => {
    try {
        const { businessId, metricType, borough, deviceType } = req.body;
        
        // Validate required fields
        if (!businessId || !metricType) {
            return res.status(400).json({ 
                success: false, 
                error: 'businessId and metricType are required' 
            });
        }
        
        // Validate metricType
        if (!VALID_METRIC_TYPES.includes(metricType)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid metricType. Must be one of: ${VALID_METRIC_TYPES.join(', ')}` 
            });
        }
        
        // Validate deviceType if provided
        if (deviceType && !['mobile', 'desktop'].includes(deviceType)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid deviceType. Must be "mobile" or "desktop"' 
            });
        }
        
        // Insert event with server timestamp and optional visitor context
        const event = {
            businessId,
            metricType,
            timestamp: new Date(),
            ...(borough && { borough }),
            ...(deviceType && { deviceType })
        };
        
        await db.collection('business_analytics').insertOne(event);
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error recording event:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

/**
 * GET /api/analytics?businessId=XYZ
 * Get analytics statistics for a business
 */
app.get('/api/analytics', async (req, res) => {
    try {
        const { businessId } = req.query;
        
        // Validate businessId
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'businessId query parameter is required' 
            });
        }
        
        const { 
            startOfTodayUTC, 
            startOfThisMonthUTC, 
            startOfLastMonthUTC, 
            endOfLastMonthUTC 
        } = getUTCDateBoundaries();
        
        const results = {};
        
        // Calculate stats for each metric type
        for (const metricType of VALID_METRIC_TYPES) {
            const baseQuery = { businessId, metricType };
            
            // Total count
            const total = await db.collection('business_analytics').countDocuments(baseQuery);
            
            // Today count
            const today = await db.collection('business_analytics').countDocuments({
                ...baseQuery,
                timestamp: { $gte: startOfThisMonthUTC }
            });
            
            // This month count
            const thisMonth = await db.collection('business_analytics').countDocuments({
                ...baseQuery,
                timestamp: { $gte: startOfThisMonthUTC }
            });
            
            // Last month count
            const lastMonth = await db.collection('business_analytics').countDocuments({
                ...baseQuery,
                timestamp: { 
                    $gte: startOfLastMonthUTC, 
                    $lte: endOfLastMonthUTC 
                }
            });
            
            // Calculate growth rate (avoid division by zero)
            const growthRate = lastMonth > 0 ? 
                ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
            
            results[metricType] = {
                total,
                today,
                growthRate: Math.round(growthRate * 10) / 10 // Round to 1 decimal
            };
        }
        
        res.json(results);
        
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(503).json({ 
            success: false, 
            error: 'Database unavailable' 
        });
    }
});

/**
 * GET /api/audience-insights?businessId=XYZ&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Get audience insights and visitor analytics for a business with date range filtering
 */
app.get('/api/audience-insights', async (req, res) => {
    try {
        const { businessId, from, to, period = 'weekly' } = req.query;
        
        // Validate businessId
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'businessId query parameter is required' 
            });
        }
        
        // Calculate date range based on parameters
        const now = new Date();
        let startDate, endDate;
        
        if (from && to) {
            // Custom date range
            startDate = new Date(from);
            endDate = new Date(to);
            
            // Validate dates
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid date format. Use YYYY-MM-DD' 
                });
            }
            
            if (startDate > endDate) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Start date cannot be after end date' 
                });
            }
        } else {
            // Use period-based calculation
            switch (period) {
                case 'weekly':
                    startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                    break;
                case 'monthly':
                    startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                    break;
                default:
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Invalid period. Must be "weekly" or "monthly"' 
                    });
            }
            endDate = now;
        }
        
        // Base match criteria for all aggregations
        const baseMatch = {
            businessId, 
            metricType: 'profileView', 
            timestamp: { $gte: startDate, $lte: endDate }
        };
        
        // (A) Top Visitor Areas by Borough
        const topBoroughs = await db.collection('business_analytics').aggregate([
            { 
                $match: { 
                    ...baseMatch,
                    borough: { $exists: true, $ne: null }
                } 
            },
            { 
                $group: { 
                    _id: "$borough", 
                    count: { $sum: 1 } 
                } 
            },
            { 
                $sort: { count: -1 } 
            },
            { 
                $limit: 5 
            }
        ]).toArray();
        
        // (B) Device Usage (mobile vs desktop)
        const deviceUsage = await db.collection('business_analytics').aggregate([
            { 
                $match: { 
                    ...baseMatch,
                    deviceType: { $exists: true, $ne: null }
                } 
            },
            { 
                $group: { 
                    _id: "$deviceType", 
                    count: { $sum: 1 } 
                } 
            }
        ]).toArray();
        
        // (C) Most Active Days & Times
        const activePeriods = await db.collection('business_analytics').aggregate([
            { 
                $match: baseMatch
            },
            { 
                $project: {
                    dayOfWeek: { $dayOfWeek: "$timestamp" },
                    hour: { $hour: "$timestamp" }
                }
            },
            { 
                $group: {
                    _id: { dayOfWeek: "$dayOfWeek", hour: "$hour" },
                    count: { $sum: 1 }
                }
            },
            { 
                $sort: { count: -1 } 
            },
            { 
                $limit: 5 
            }
        ]).toArray();
        
        // Format response
        const response = {
            topBoroughs: topBoroughs.map(item => ({
                borough: item._id,
                count: item.count
            })),
            deviceUsage: {
                mobile: deviceUsage.find(item => item._id === 'mobile')?.count || 0,
                desktop: deviceUsage.find(item => item._id === 'desktop')?.count || 0
            },
            activePeriods: activePeriods.map(item => ({
                dayOfWeek: item._id.dayOfWeek,
                hour: item._id.hour,
                count: item.count
            }))
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Error fetching audience insights:', error);
        res.status(503).json({ 
            success: false, 
            error: 'Database unavailable' 
        });
    }
});

/**
 * GET /api/search-impressions?businessId=XYZ&days=30
 * Get search impressions analytics for a business
 */
app.get('/api/search-impressions', async (req, res) => {
    try {
        const { businessId, days = 30 } = req.query;
        
        // Validate businessId
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId' 
            });
        }
        
        // Calculate date boundaries
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const date30DaysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const date60DaysAgo = new Date(now.getTime() - (days * 2) * 24 * 60 * 60 * 1000);
        
        // Total and today
        const totalImpressions = await db.collection('business_analytics').countDocuments({ 
            businessId, 
            metricType: 'searchImpression' 
        });
        
        const todayImpressions = await db.collection('business_analytics').countDocuments({
            businessId,
            metricType: 'searchImpression',
            timestamp: { $gte: startOfToday },
        });
        
        // Growth Rate
        const thisPeriod = await db.collection('business_analytics').countDocuments({
            businessId,
            metricType: 'searchImpression',
            timestamp: { $gte: date30DaysAgo },
        });
        
        const prevPeriod = await db.collection('business_analytics').countDocuments({
            businessId,
            metricType: 'searchImpression',
            timestamp: { $gte: date60DaysAgo, $lt: date30DaysAgo },
        });
        
        const growthRate = prevPeriod > 0 ? ((thisPeriod - prevPeriod) / prevPeriod) * 100 : 0;
        
        // Clicks
        const clicksFromImpressions = await db.collection('business_analytics').countDocuments({
            businessId,
            metricType: 'profileClick',
            timestamp: { $gte: date30DaysAgo },
        });
        
        const conversionRate = thisPeriod > 0 ? (clicksFromImpressions / thisPeriod) * 100 : 0;
        
        // Trend for past 30 days
        const trendData = await db.collection('business_analytics').aggregate([
            {
                $match: {
                    businessId,
                    metricType: 'searchImpression',
                    timestamp: { $gte: date30DaysAgo },
                },
            },
            {
                $group: {
                    _id: {
                        y: { $year: "$timestamp" },
                        m: { $month: "$timestamp" },
                        d: { $dayOfMonth: "$timestamp" },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
        ]).toArray();
        
        const trend = trendData.map(d => ({
            date: `${d._id.y}-${String(d._id.m).padStart(2, '0')}-${String(d._id.d).padStart(2, '0')}`,
            impressions: d.count,
        }));
        
        const response = {
            totalImpressions,
            todayImpressions,
            growthRate: parseFloat(growthRate.toFixed(1)),
            conversionRate: parseFloat(conversionRate.toFixed(1)),
            trend
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Error fetching search impressions:', error);
        res.status(503).json({ 
            success: false, 
            error: 'Database unavailable' 
        });
    }
});

/**
 * GET /api/contact-clicks?businessId=XYZ&days=30
 * Get contact clicks analytics for a business
 */
app.get('/api/contact-clicks', async (req, res) => {
    try {
        const { businessId, days = 30 } = req.query;
        
        // Validate businessId
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId' 
            });
        }
        
        // Calculate date boundaries
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const date30DaysAgo = new Date(now.getTime() - days * 86400000);
        const date60DaysAgo = new Date(now.getTime() - days * 2 * 86400000);
        
        // Total and today's contact clicks
        const totalClicks = await db.collection('business_analytics').countDocuments({ 
            businessId, 
            metricType: 'contactClick' 
        });
        
        const todaysClicks = await db.collection('business_analytics').countDocuments({
            businessId, 
            metricType: 'contactClick', 
            timestamp: { $gte: startOfToday }
        });
        
        // Growth Rate calculation
        const thisPeriod = await db.collection('business_analytics').countDocuments({
            businessId, 
            metricType: 'contactClick', 
            timestamp: { $gte: date30DaysAgo }
        });
        
        const prevPeriod = await db.collection('business_analytics').countDocuments({
            businessId, 
            metricType: 'contactClick',
            timestamp: { $gte: date60DaysAgo, $lt: date30DaysAgo }
        });
        
        const growthRate = prevPeriod > 0 ? ((thisPeriod - prevPeriod) / prevPeriod) * 100 : 0;
        
        // 30-day trend data
        const trendData = await db.collection('business_analytics').aggregate([
            { 
                $match: { 
                    businessId, 
                    metricType: 'contactClick', 
                    timestamp: { $gte: date30DaysAgo } 
                } 
            },
            { 
                $group: {
                    _id: {
                        y: { $year: "$timestamp" },
                        m: { $month: "$timestamp" },
                        d: { $dayOfMonth: "$timestamp" }
                    },
                    count: { $sum: 1 }
                }
            },
            { 
                $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } 
            }
        ]).toArray();
        
        const trend = trendData.map(d => ({
            date: `${d._id.y}-${String(d._id.m).padStart(2, '0')}-${String(d._id.d).padStart(2, '0')}`,
            clicks: d.count
        }));
        
        // Optional cross-metric conversion rate if searchImpression data exists
        const impressions = await db.collection('business_analytics').countDocuments({
            businessId, 
            metricType: 'searchImpression', 
            timestamp: { $gte: date30DaysAgo }
        });
        
        const conversionRate = impressions > 0 ? (thisPeriod / impressions) * 100 : 0;
        
        const response = {
            totalClicks,
            todaysClicks,
            growthRate: parseFloat(growthRate.toFixed(1)),
            conversionRate: parseFloat(conversionRate.toFixed(1)),
            trend
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Error fetching contact clicks:', error);
        res.status(503).json({ 
            success: false, 
            error: 'Database unavailable' 
        });
    }
});

/**
 * GET /api/contact-engagement?businessId=XYZ&days=30
 * Get contact engagement analytics for a business
 */
app.get('/api/contact-engagement', async (req, res) => {
    try {
        const { businessId, days = 30 } = req.query;
        
        // Validate businessId
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId' 
            });
        }
        
        // Calculate date boundaries
        const now = new Date();
        const date30DaysAgo = new Date(now.getTime() - days * 86400000);
        
        // TREND DATA (all contact clicks)
        const trendData = await db.collection('business_analytics').aggregate([
            { 
                $match: { 
                    businessId, 
                    metricType: 'contactClick', 
                    timestamp: { $gte: date30DaysAgo } 
                } 
            },
            { 
                $group: {
                    _id: {
                        y: { $year: "$timestamp" },
                        m: { $month: "$timestamp" },
                        d: { $dayOfMonth: "$timestamp" }
                    },
                    total: { $sum: 1 }
                }
            },
            { 
                $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } 
            }
        ]).toArray();
        
        const trend = trendData.map(t => ({
            date: `${t._id.y}-${String(t._id.m).padStart(2, '0')}-${String(t._id.d).padStart(2, '0')}`,
            total: t.total
        }));
        
        // BREAKDOWN: phone, email, form, directions
        const breakdownData = await db.collection('business_analytics').aggregate([
            { 
                $match: { 
                    businessId, 
                    metricType: 'contactClick', 
                    timestamp: { $gte: date30DaysAgo } 
                } 
            },
            { 
                $group: { 
                    _id: "$contactType", 
                    count: { $sum: 1 } 
                } 
            }
        ]).toArray();
        
        const breakdown = {
            phone: breakdownData.find(b => b._id === 'phone')?.count || 0,
            email: breakdownData.find(b => b._id === 'email')?.count || 0,
            form: breakdownData.find(b => b._id === 'form')?.count || 0,
            directions: breakdownData.find(b => b._id === 'directions')?.count || 0,
        };
        
        // CONVERSION ANALYSIS
        const outcomes = await db.collection('business_analytics').aggregate([
            { 
                $match: { 
                    businessId, 
                    metricType: 'contactClick', 
                    timestamp: { $gte: date30DaysAgo } 
                } 
            },
            { 
                $group: { 
                    _id: "$outcomeType", 
                    count: { $sum: 1 } 
                } 
            }
        ]).toArray();
        
        const conversions = {
            bookings: outcomes.find(o => o._id === 'booking')?.count || 0,
            enquiries: outcomes.find(o => o._id === 'enquiry')?.count || 0,
            visits: outcomes.find(o => o._id === 'visit')?.count || 0,
        };
        
        const totalPositiveOutcomes = conversions.bookings + conversions.enquiries + conversions.visits;
        const totalClicks = Object.values(breakdown).reduce((a, b) => a + b, 0);
        const positiveRate = totalClicks > 0 ? (totalPositiveOutcomes / totalClicks) * 100 : 0;
        
        const response = {
            trend,
            breakdown,
            conversions,
            totalPositiveOutcomes,
            positiveRate: parseFloat(positiveRate.toFixed(1))
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Error fetching contact engagement:', error);
        res.status(503).json({ 
            success: false, 
            error: 'Database unavailable' 
        });
    }
});

/**
 * GET /api/enquiries-analytics?businessId=XYZ&days=30
 * Get enquiries analytics for a business
 */
app.get('/api/enquiries-analytics', async (req, res) => {
    try {
        const { businessId, days = 30 } = req.query;
        
        // Validate businessId
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId' 
            });
        }
        
        // Calculate UTC boundaries
        const now = new Date();
        const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const startOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
        const startOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
        const endOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
        const date30DaysAgo = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
        
        // Total enquiries (all time)
        const totalEnquiries = await db.collection('business_enquiries').countDocuments({
            businessId,
            metricType: 'enquiry'
        });
        
        // Enquiries in last 24 hours
        const enquiriesLast24h = await db.collection('business_enquiries').countDocuments({
            businessId,
            metricType: 'enquiry',
            createdAt: { $gte: startOfToday }
        });
        
        // Growth rate (this month vs last month)
        const thisMonthEnquiries = await db.collection('business_enquiries').countDocuments({
            businessId,
            metricType: 'enquiry',
            createdAt: { $gte: startOfThisMonth }
        });
        
        const lastMonthEnquiries = await db.collection('business_enquiries').countDocuments({
            businessId,
            metricType: 'enquiry',
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        });
        
        const growthRate = lastMonthEnquiries > 0 ? ((thisMonthEnquiries - lastMonthEnquiries) / lastMonthEnquiries) * 100 : 0;
        
        // Average response time
        const responseTimeData = await db.collection('business_enquiries').aggregate([
            {
                $match: {
                    businessId,
                    metricType: 'enquiry',
                    responseTimeMinutes: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: null,
                    avgResponseTime: { $avg: '$responseTimeMinutes' }
                }
            }
        ]).toArray();
        
        const averageResponseMinutes = responseTimeData.length > 0 ? responseTimeData[0].avgResponseTime : 0;
        
        // 30-day trend data
        const trendData = await db.collection('business_enquiries').aggregate([
            {
                $match: {
                    businessId,
                    metricType: 'enquiry',
                    createdAt: { $gte: date30DaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    enquiries: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]).toArray();
        
        const trend = trendData.map(t => ({
            date: `${t._id.year}-${String(t._id.month).padStart(2, '0')}-${String(t._id.day).padStart(2, '0')}`,
            enquiries: t.enquiries
        }));
        
        // Enquiry type breakdown
        const typeBreakdownData = await db.collection('business_enquiries').aggregate([
            {
                $match: {
                    businessId,
                    metricType: 'enquiry',
                    createdAt: { $gte: date30DaysAgo }
                }
            },
            {
                $group: {
                    _id: '$enquiryType',
                    count: { $sum: 1 }
                }
            }
        ]).toArray();
        
        const typeBreakdown = {
            booking: typeBreakdownData.find(t => t._id === 'booking')?.count || 0,
            question: typeBreakdownData.find(t => t._id === 'question')?.count || 0,
            information: typeBreakdownData.find(t => t._id === 'information')?.count || 0,
            feedback: typeBreakdownData.find(t => t._id === 'feedback')?.count || 0
        };
        
        // Response time performance buckets
        const responsePerformanceData = await db.collection('business_enquiries').aggregate([
            {
                $match: {
                    businessId,
                    metricType: 'enquiry',
                    responseTimeMinutes: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $lte: ['$responseTimeMinutes', 15] },
                            'fast',
                            {
                                $cond: [
                                    { $lte: ['$responseTimeMinutes', 60] },
                                    'moderate',
                                    'slow'
                                ]
                            }
                        ]
                    },
                    count: { $sum: 1 }
                }
            }
        ]).toArray();
        
        const responsePerformance = {
            fast: responsePerformanceData.find(r => r._id === 'fast')?.count || 0,
            moderate: responsePerformanceData.find(r => r._id === 'moderate')?.count || 0,
            slow: responsePerformanceData.find(r => r._id === 'slow')?.count || 0
        };
        
        const response = {
            totalEnquiries,
            enquiriesLast24h,
            growthRate: parseFloat(growthRate.toFixed(1)),
            averageResponseMinutes: parseFloat(averageResponseMinutes.toFixed(1)),
            trend,
            typeBreakdown,
            responsePerformance
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Error fetching enquiries analytics:', error);
        res.status(503).json({ 
            success: false, 
            error: 'Database unavailable' 
        });
    }
});

/**
 * POST /api/record-enquiry
 * Record a new enquiry
 */
app.post('/api/record-enquiry', async (req, res) => {
    try {
        const { businessId, enquiryType } = req.body;
        
        if (!businessId || !enquiryType) {
            return res.status(400).json({ 
                success: false, 
                error: 'businessId and enquiryType are required' 
            });
        }
        
        const doc = {
            businessId,
            metricType: 'enquiry',
            enquiryType,
            createdAt: new Date(),
            firstResponseAt: null,
            responseTimeMinutes: null
        };
        
        const { insertedId } = await db.collection('business_enquiries').insertOne(doc);
        
        res.json({ 
            success: true, 
            id: insertedId.toString() 
        });
        
    } catch (error) {
        console.error('Error recording enquiry:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to record enquiry' 
        });
    }
});

/**
 * PATCH /api/enquiry-first-response
 * Record first response timestamp and compute response time
 */
app.patch('/api/enquiry-first-response', async (req, res) => {
    try {
        const { enquiryId } = req.body;
        
        if (!enquiryId) {
            return res.status(400).json({ 
                success: false, 
                error: 'enquiryId is required' 
            });
        }
        
        const firstResponseAt = new Date();
        
        // Get the enquiry to calculate response time
        const enquiry = await db.collection('business_enquiries').findOne({ _id: new ObjectId(enquiryId) });
        
        if (!enquiry) {
            return res.status(404).json({ 
                success: false, 
                error: 'Enquiry not found' 
            });
        }
        
        const responseTimeMinutes = Math.round((firstResponseAt - enquiry.createdAt) / (1000 * 60));
        
        await db.collection('business_enquiries').updateOne(
            { _id: new ObjectId(enquiryId) },
            {
                $set: {
                    firstResponseAt,
                    responseTimeMinutes
                }
            }
        );
        
        res.json({ 
            success: true, 
            responseTimeMinutes 
        });
        
    } catch (error) {
        console.error('Error recording first response:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to record first response' 
        });
    }
});

/**
 * GET /api/bookings/summary?businessId=XYZ
 * Get booking summary metrics for a business
 */
app.get('/api/bookings/summary', async (req, res) => {
    try {
        const { businessId } = req.query;
        
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId' 
            });
        }
        
        const now = new Date();
        const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
        const startOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
        
        // Today's bookings (confirmed or pending)
        const todaysCount = await db.collection('business_bookings').countDocuments({
            businessId,
            status: { $in: ['confirmed', 'pending'] },
            startISO: { $gte: startOfToday.toISOString(), $lte: endOfToday.toISOString() }
        });
        
        // Total bookings
        const totalCount = await db.collection('business_bookings').countDocuments({
            businessId
        });
        
        // Completion rate (completed vs total in last 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const completedCount = await db.collection('business_bookings').countDocuments({
            businessId,
            status: 'completed',
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        const totalRecentCount = await db.collection('business_bookings').countDocuments({
            businessId,
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        const completionRate = totalRecentCount > 0 ? (completedCount / totalRecentCount) * 100 : 0;
        
        // Monthly revenue
        const monthlyRevenueData = await db.collection('business_bookings').aggregate([
            {
                $match: {
                    businessId,
                    status: 'completed',
                    confirmedAt: { $gte: startOfThisMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$priceGBP' }
                }
            }
        ]).toArray();
        
        const monthlyRevenue = monthlyRevenueData.length > 0 ? monthlyRevenueData[0].totalRevenue : 0;
        
        const response = {
            todaysCount,
            totalCount,
            completionRate: parseFloat(completionRate.toFixed(1)),
            monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2))
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Error fetching booking summary:', error);
        res.status(503).json({ 
            success: false, 
            error: 'Database unavailable' 
        });
    }
});

/**
 * GET /api/bookings/list?businessId=XYZ&status=<pending|confirmed|completed|cancelled>
 * Get bookings filtered by status
 */
app.get('/api/bookings/list', async (req, res) => {
    try {
        const { businessId, status } = req.query;
        
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId' 
            });
        }
        
        const matchQuery = { businessId };
        if (status && status !== 'all') {
            matchQuery.status = status;
        }
        
        const bookings = await db.collection('business_bookings')
            .find(matchQuery)
            .sort({ startISO: 1 })
            .toArray();
        
        res.json(bookings);
        
    } catch (error) {
        console.error('Error fetching bookings list:', error);
        res.status(503).json({ 
            success: false, 
            error: 'Database unavailable' 
        });
    }
});

/**
 * GET /api/bookings/calendar?businessId=XYZ&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Get bookings in date range
 */
app.get('/api/bookings/calendar', async (req, res) => {
    try {
        const { businessId, from, to } = req.query;
        
        if (!businessId || !from || !to) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId, from, or to parameters' 
            });
        }
        
        const startDate = new Date(from + 'T00:00:00.000Z');
        const endDate = new Date(to + 'T23:59:59.999Z');
        
        const bookings = await db.collection('business_bookings')
            .find({
                businessId,
                startISO: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
            })
            .sort({ startISO: 1 })
            .toArray();
        
        res.json(bookings);
        
    } catch (error) {
        console.error('Error fetching calendar bookings:', error);
        res.status(503).json({ 
            success: false, 
            error: 'Database unavailable' 
        });
    }
});

/**
 * GET /api/bookings/services?businessId=XYZ
 * Get active services for a business
 */
app.get('/api/bookings/services', async (req, res) => {
    try {
        const { businessId } = req.query;
        
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId' 
            });
        }
        
        const services = await db.collection('business_services')
            .find({ businessId, active: true })
            .sort({ name: 1 })
            .toArray();
        
        res.json(services);
        
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(503).json({ 
            success: false, 
            error: 'Database unavailable' 
        });
    }
});

/**
 * GET /api/bookings/availability?businessId=XYZ&fromDate&toDate
 * Get available time slots
 */
app.get('/api/bookings/availability', async (req, res) => {
    try {
        const { businessId, fromDate, toDate } = req.query;
        
        if (!businessId || !fromDate || !toDate) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId, fromDate, or toDate parameters' 
            });
        }
        
        // Get business availability template
        const availability = await db.collection('business_availability').findOne({ businessId });
        
        if (!availability) {
            return res.json({ slots: [] });
        }
        
        // Generate available slots for the date range
        const slots = [];
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
            const daySlots = availability.weekly[dayOfWeek] || [];
            
            // Check for overrides
            const dateStr = date.toISOString().split('T')[0];
            const override = availability.overrides?.find(o => o.date === dateStr);
            
            const dayAvailability = override ? override.slots : daySlots;
            
            dayAvailability.forEach(slot => {
                slots.push({
                    date: dateStr,
                    start: slot.start,
                    end: slot.end
                });
            });
        }
        
        res.json({ slots });
        
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(503).json({ 
            success: false, 
            error: 'Database unavailable' 
        });
    }
});

/**
 * POST /api/bookings/create
 * Create a new booking
 */
app.post('/api/bookings/create', async (req, res) => {
    try {
        const { businessId, serviceId, customer, startISO, notes } = req.body;
        
        if (!businessId || !serviceId || !customer || !startISO) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }
        
        // Get service details
        const service = await db.collection('business_services').findOne({ 
            _id: new ObjectId(serviceId), 
            businessId, 
            active: true 
        });
        
        if (!service) {
            return res.status(404).json({ 
                success: false, 
                error: 'Service not found' 
            });
        }
        
        // Calculate end time
        const startTime = new Date(startISO);
        const endTime = new Date(startTime.getTime() + (service.durationMinutes * 60 * 1000));
        const endISO = endTime.toISOString();
        
        // Check for conflicts
        const conflictingBooking = await db.collection('business_bookings').findOne({
            businessId,
            status: { $in: ['pending', 'confirmed'] },
            $or: [
                {
                    startISO: { $lt: endISO },
                    endISO: { $gt: startISO }
                }
            ]
        });
        
        if (conflictingBooking) {
            return res.status(409).json({ 
                success: false, 
                error: 'Time slot is already booked' 
            });
        }
        
        // Create booking
        const booking = {
            businessId,
            serviceId,
            customer,
            startISO,
            endISO,
            status: 'pending',
            createdAt: new Date(),
            confirmedAt: null,
            priceGBP: service.priceGBP,
            notes: notes || null,
            source: 'manual'
        };
        
        const { insertedId } = await db.collection('business_bookings').insertOne(booking);
        
        // Get business integration settings
        const business = await db.collection('business_integrations').findOne({ businessId });
        
        // Sync to Google Calendar if configured
        if (business?.google?.access_token) {
            try {
                const eventId = await createGoogleEvent(business, booking);
                await db.collection('business_bookings').updateOne(
                    { _id: insertedId },
                    { $set: { googleEventId: eventId } }
                );
                console.log('Google Calendar event created:', eventId);
            } catch (err) {
                console.error('Google Calendar sync error:', err);
            }
        }
        
        // Send confirmation email if configured
        if (booking.customer.email && business?.emailSettings?.enabled) {
            try {
                await sendEmail({
                    to: booking.customer.email,
                    subject: 'Booking Confirmation - BlkPages',
                    html: `
                        <h2>Booking Confirmed</h2>
                        <p>Hi ${booking.customer.name},</p>
                        <p>Your appointment has been confirmed for <strong>${new Date(booking.startISO).toLocaleString()}</strong>.</p>
                        <p><strong>Service:</strong> ${service.name}</p>
                        <p><strong>Duration:</strong> ${service.durationMinutes} minutes</p>
                        <p><strong>Price:</strong> £${service.priceGBP}</p>
                        ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
                        <p>We look forward to seeing you!</p>
                        <p>Best regards,<br>${business.name || 'BlkPages'}</p>
                    `
                });
                
                // Mark as email notified
                await db.collection('business_bookings').updateOne(
                    { _id: insertedId },
                    { $set: { customerEmailNotified: true } }
                );
            } catch (err) {
                console.error('Email sending error:', err);
            }
        }
        
        res.json({ 
            success: true, 
            booking: { ...booking, _id: insertedId }
        });
        
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create booking' 
        });
    }
});

/**
 * PATCH /api/bookings/confirm
 * Confirm a booking
 */
app.patch('/api/bookings/confirm', async (req, res) => {
    try {
        const { bookingId } = req.body;
        
        if (!bookingId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing bookingId' 
            });
        }
        
        const result = await db.collection('business_bookings').updateOne(
            { _id: new ObjectId(bookingId) },
            {
                $set: {
                    status: 'confirmed',
                    confirmedAt: new Date()
                }
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Booking not found' 
            });
        }
        
        // Get booking and business details for Google Calendar sync
        const booking = await db.collection('business_bookings').findOne({ _id: new ObjectId(bookingId) });
        const business = await db.collection('business_integrations').findOne({ businessId: booking.businessId });
        
        // Sync to Google Calendar if not already synced
        if (business?.google?.access_token && !booking.googleEventId) {
            try {
                const eventId = await createGoogleEvent(business, booking);
                await db.collection('business_bookings').updateOne(
                    { _id: new ObjectId(bookingId) },
                    { $set: { googleEventId: eventId } }
                );
                console.log('Google Calendar event created for confirmed booking:', eventId);
            } catch (err) {
                console.error('Google Calendar sync error:', err);
            }
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error confirming booking:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to confirm booking' 
        });
    }
});

/**
 * PATCH /api/bookings/cancel
 * Cancel a booking
 */
app.patch('/api/bookings/cancel', async (req, res) => {
    try {
        const { bookingId, cancelReason } = req.body;
        
        if (!bookingId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing bookingId' 
            });
        }
        
        const result = await db.collection('business_bookings').updateOne(
            { _id: new ObjectId(bookingId) },
            {
                $set: {
                    status: 'cancelled',
                    cancelReason: cancelReason || null
                }
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Booking not found' 
            });
        }
        
        // Get booking and business details
        const booking = await db.collection('business_bookings').findOne({ _id: new ObjectId(bookingId) });
        const business = await db.collection('business_integrations').findOne({ businessId: booking.businessId });
        
        // Delete from Google Calendar if synced
        if (booking.googleEventId && business?.google?.access_token) {
            try {
                await deleteGoogleEvent(business, booking.googleEventId);
                console.log('Google Calendar event deleted:', booking.googleEventId);
            } catch (err) {
                console.error('Google Calendar deletion error:', err);
            }
        }
        
        // Send cancellation email if configured
        if (booking.customer.email && business?.emailSettings?.enabled) {
            try {
                await sendEmail({
                    to: booking.customer.email,
                    subject: 'Booking Cancelled - BlkPages',
                    html: `
                        <h2>Booking Cancelled</h2>
                        <p>Hi ${booking.customer.name},</p>
                        <p>Your booking scheduled for <strong>${new Date(booking.startISO).toLocaleString()}</strong> has been cancelled.</p>
                        ${cancelReason ? `<p><strong>Reason:</strong> ${cancelReason}</p>` : ''}
                        <p>If you have any questions, please contact us.</p>
                        <p>Best regards,<br>${business.name || 'BlkPages'}</p>
                    `
                });
            } catch (err) {
                console.error('Cancellation email error:', err);
            }
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to cancel booking' 
        });
    }
});

// Google Calendar and Email Utility Functions
async function createGoogleEvent(business, booking) {
    try {
        const oAuth2 = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        
        oAuth2.setCredentials({
            access_token: business.google.access_token,
            refresh_token: business.google.refresh_token
        });
        
        const calendar = google.calendar({ version: 'v3', auth: oAuth2 });
        
        const event = {
            summary: `${booking.customer.name} - ${booking.serviceName || 'Appointment'}`,
            description: booking.notes || '',
            start: { 
                dateTime: booking.startISO,
                timeZone: 'UTC'
            },
            end: { 
                dateTime: booking.endISO,
                timeZone: 'UTC'
            },
            attendees: [
                {
                    email: booking.customer.email,
                    displayName: booking.customer.name
                }
            ]
        };
        
        const { data } = await calendar.events.insert({
            calendarId: business.google.calendar_id || 'primary',
            requestBody: event
        });
        
        return data.id;
    } catch (error) {
        console.error('Google Calendar event creation error:', error);
        throw error;
    }
}

async function deleteGoogleEvent(business, eventId) {
    try {
        const oAuth2 = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        
        oAuth2.setCredentials({
            access_token: business.google.access_token,
            refresh_token: business.google.refresh_token
        });
        
        const calendar = google.calendar({ version: 'v3', auth: oAuth2 });
        
        await calendar.events.delete({
            calendarId: business.google.calendar_id || 'primary',
            eventId
        });
    } catch (error) {
        console.error('Google Calendar event deletion error:', error);
        throw error;
    }
}

async function sendEmail({ to, subject, html }) {
    if (!process.env.SMTP_HOST) {
        console.log('SMTP not configured, skipping email:', subject);
        return;
    }
    
    try {
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"BlkPages" <no-reply@blkpages.co.uk>',
            to,
            subject,
            html
        });
        
        console.log('Email sent successfully to:', to);
    } catch (error) {
        console.error('Email sending error:', error);
        throw error;
    }
}

// Reminder cron job
function startReminderCron() {
    cron.schedule('0 * * * *', async () => {
        try {
            const now = new Date();
            const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const in1h = new Date(now.getTime() + 60 * 60 * 1000);

            // Find bookings that need reminders
            const bookings = await db.collection('business_bookings').find({
                status: 'confirmed',
                startISO: { $gte: now.toISOString(), $lte: in24h.toISOString() },
                customerEmailNotified: { $ne: true }
            }).toArray();

            for (const booking of bookings) {
                const business = await db.collection('business_integrations').findOne({ businessId: booking.businessId });
                if (!business?.emailSettings?.enabled || !booking.customer.email) continue;

                const timeToStart = new Date(booking.startISO) - now;
                const is24hReminder = timeToStart <= 24 * 60 * 60 * 1000 && timeToStart > 23 * 60 * 60 * 1000;
                const is1hReminder = timeToStart <= 60 * 60 * 1000 && timeToStart > 59 * 60 * 1000;

                if (is24hReminder || is1hReminder) {
                    const subject = is1hReminder ? 'Reminder: Your booking starts soon' : 'Upcoming Booking Reminder';
                    const timeText = is1hReminder ? '1 hour' : '24 hours';
                    
                    await sendEmail({
                        to: booking.customer.email,
                        subject,
                        html: `
                            <h2>Booking Reminder</h2>
                            <p>Hi ${booking.customer.name},</p>
                            <p>This is a friendly reminder that your appointment with ${business.name || 'us'} is scheduled in ${timeText}.</p>
                            <p><strong>Date & Time:</strong> ${new Date(booking.startISO).toLocaleString()}</p>
                            <p>Please arrive on time for your appointment.</p>
                            <p>Best regards,<br>${business.name || 'BlkPages'}</p>
                        `
                    });

                    // Mark as notified
                    await db.collection('business_bookings').updateOne(
                        { _id: booking._id },
                        { $set: { customerEmailNotified: true } }
                    );
                }
            }
        } catch (error) {
            console.error('Reminder cron job error:', error);
        }
    });
    
    console.log('Reminder cron job started');
}

/**
 * GET /api/integrations?businessId=XYZ
 * Get business integration settings
 */
app.get('/api/integrations', async (req, res) => {
    try {
        const { businessId } = req.query;
        
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId' 
            });
        }
        
        const integration = await db.collection('business_integrations').findOne({ businessId });
        
        if (!integration) {
            return res.json({
                google: null,
                emailSettings: { enabled: false, fromAddress: '' }
            });
        }
        
        // Don't return sensitive tokens
        const safeIntegration = {
            google: integration.google ? {
                calendar_id: integration.google.calendar_id,
                connected: !!integration.google.access_token
            } : null,
            emailSettings: integration.emailSettings || { enabled: false, fromAddress: '' }
        };
        
        res.json(safeIntegration);
        
    } catch (error) {
        console.error('Error fetching integrations:', error);
        res.status(503).json({ 
            success: false, 
            error: 'Database unavailable' 
        });
    }
});

/**
 * POST /api/integrations
 * Update business integration settings
 */
app.post('/api/integrations', async (req, res) => {
    try {
        const { businessId, google, emailSettings } = req.body;
        
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId' 
            });
        }
        
        const updateData = {};
        
        if (google) {
            updateData.google = google;
        }
        
        if (emailSettings) {
            updateData.emailSettings = emailSettings;
        }
        
        await db.collection('business_integrations').updateOne(
            { businessId },
            { $set: updateData },
            { upsert: true }
        );
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error updating integrations:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update integrations' 
        });
    }
});

/**
 * GET /api/photos?businessId=XYZ
 * Get photos for a business
 */
app.get('/api/photos', async (req, res) => {
    try {
        const { businessId } = req.query;
        
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId' 
            });
        }
        
        const photos = await db.collection('business_photos')
            .find({ businessId })
            .sort({ order: 1, createdAt: 1 })
            .toArray();
        
        res.json(photos);
        
    } catch (error) {
        console.error('Error fetching photos:', error);
        res.status(503).json({ 
            success: false, 
            error: 'Database unavailable' 
        });
    }
});

/**
 * POST /api/photos/upload
 * Upload photos for a business
 */
app.post('/api/photos/upload', upload.array('photos'), async (req, res) => {
    try {
        const { businessId, caption } = req.body;
        
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId' 
            });
        }
        
        if (!req.files?.length) {
            return res.status(400).json({ 
                success: false, 
                error: 'No files uploaded' 
            });
        }
        
        const uploadedPhotos = [];
        
        // Get current max order for this business
        const maxOrderResult = await db.collection('business_photos')
            .findOne({ businessId }, { sort: { order: -1 } });
        let nextOrder = (maxOrderResult?.order || -1) + 1;
        
        for (const file of req.files) {
            try {
                // Generate hash and file paths
                const hash = await sha256(file.buffer);
                const ext = detectExt(file.mimetype);
                
                // Check if photo already exists
                const existing = await db.collection('business_photos').findOne({ 
                    businessId, 
                    hash 
                });
                
                if (existing) {
                    console.log('Photo already exists, skipping:', hash);
                    continue;
                }
                
                // Write original file
                const { abs: originalPath, rel: originalUrl } = filePaths(businessId, hash, 'original', ext);
                await ensureDir(path.dirname(originalPath));
                await fs.writeFile(originalPath, file.buffer);
                
                // Generate optimized derivatives
                const { variants, lqip } = await generateDerivatives({
                    businessId,
                    hash,
                    originalBuffer: file.buffer
                });
                
                // Get image dimensions
                const metadata = await sharp(file.buffer).metadata();
                
                // Create photo record
                const photo = {
                    businessId,
                    hash,
                    filename: file.originalname,
                    url: originalUrl,
                    caption: caption || null,
                    order: nextOrder++,
                    createdAt: new Date(),
                    original: {
                        type: ext,
                        width: metadata.width,
                        height: metadata.height,
                        size: file.size
                    },
                    variants,
                    lqip
                };
                
                const { insertedId } = await db.collection('business_photos').insertOne(photo);
                uploadedPhotos.push({ ...photo, _id: insertedId });
                
            } catch (fileError) {
                console.error('Error processing file:', file.originalname, fileError);
                // Continue with other files
            }
        }
        
        res.json({
            success: true,
            uploaded: uploadedPhotos.length,
            photos: uploadedPhotos
        });
        
    } catch (error) {
        console.error('Error uploading photos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to upload photos' 
        });
    }
});

/**
 * DELETE /api/photos/:photoId
 * Delete a photo
 */
app.delete('/api/photos/:photoId', async (req, res) => {
    try {
        const { photoId } = req.params;
        
        if (!photoId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing photoId' 
            });
        }
        
        // Get photo details
        const photo = await db.collection('business_photos').findOne({ 
            _id: new ObjectId(photoId) 
        });
        
        if (!photo) {
            return res.status(404).json({ 
                success: false, 
                error: 'Photo not found' 
            });
        }
        
        // Delete files from storage
        await deleteImageFiles({
            businessId: photo.businessId,
            hash: photo.hash
        });
        
        // Delete from database
        await db.collection('business_photos').deleteOne({ 
            _id: new ObjectId(photoId) 
        });
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete photo' 
        });
    }
});

/**
 * PATCH /api/photos/reorder
 * Reorder photos
 */
app.patch('/api/photos/reorder', async (req, res) => {
    try {
        const { updates } = req.body;
        
        if (!Array.isArray(updates)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Updates must be an array' 
            });
        }
        
        // Update each photo's order
        for (const update of updates) {
            await db.collection('business_photos').updateOne(
                { _id: new ObjectId(update.photoId) },
                { $set: { order: update.order } }
            );
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error reordering photos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to reorder photos' 
        });
    }
});

/**
 * POST /api/photos/backfill
 * Backfill existing photos with optimized variants
 */
app.post('/api/photos/backfill', async (req, res) => {
    try {
        const { businessId } = req.body;
        
        const query = businessId ? { businessId } : {};
        const photos = await db.collection('business_photos').find(query).toArray();
        const updated = [];
        
        for (const photo of photos) {
            try {
                // Skip if already has variants
                if (photo.variants?.small?.webp && photo.lqip?.dataUri) {
                    continue;
                }
                
                // Read original file
                const { abs } = filePaths(photo.businessId, photo.hash, 'original', photo.original?.type || 'jpg');
                const buffer = await fs.readFile(abs);
                
                // Generate derivatives
                const { variants, lqip } = await generateDerivatives({
                    businessId: photo.businessId,
                    hash: photo.hash,
                    originalBuffer: buffer
                });
                
                // Update database
                await db.collection('business_photos').updateOne(
                    { _id: photo._id },
                    { $set: { variants, lqip } }
                );
                
                updated.push(photo._id.toString());
                
            } catch (photoError) {
                console.error('Error backfilling photo:', photo._id, photoError);
            }
        }
        
        res.json({ 
            success: true, 
            updated: updated.length,
            photoIds: updated
        });
        
    } catch (error) {
        console.error('Error backfilling photos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to backfill photos' 
        });
    }
});

/**
 * GET /api/auth/verify-dashboard-token?token=XYZ
 * Verify JWT dashboard access token
 */
app.get('/api/auth/verify-dashboard-token', (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing token' 
            });
        }
        
        const decoded = verifyDashboardToken(token);
        
        if (!decoded) {
            return res.json({ 
                success: false, 
                valid: false, 
                error: 'Invalid or expired token' 
            });
        }
        
        res.json({ 
            success: true, 
            valid: true, 
            businessId: decoded.businessId,
            type: decoded.type
        });
        
    } catch (error) {
        console.error('Error verifying dashboard token:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Token verification failed' 
        });
    }
});

/**
 * POST /api/business/register
 * Register new business and send welcome email
 */
app.post('/api/business/register', async (req, res) => {
    try {
        const { 
            businessName, 
            businessEmail, 
            businessPhone, 
            businessAddress, 
            businessCategory, 
            selectedPackage, 
            paymentDetails 
        } = req.body;
        
        if (!businessName || !businessEmail) {
            return res.status(400).json({ 
                success: false, 
                error: 'Business name and email are required' 
            });
        }
        
        // Create business record
        const business = {
            name: businessName,
            email: businessEmail,
            phone: businessPhone,
            address: businessAddress,
            category: businessCategory,
            package: selectedPackage,
            paymentDetails: paymentDetails,
            createdAt: new Date(),
            status: 'active'
        };
        
        const { insertedId } = await db.collection('businesses').insertOne(business);
        const businessId = insertedId.toString();
        
        // Generate dashboard access token
        const dashboardToken = generateDashboardToken(businessId);
        const dashboardLink = `${process.env.APP_UI_BASE_URL || 'https://blkpages.co.uk'}/dashboard/${businessId}?token=${dashboardToken}`;
        
        // Send welcome email
        try {
            await sendBusinessWelcomeEmail(business, dashboardLink);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Don't fail the registration if email fails
        }
        
        res.json({ 
            success: true, 
            businessId,
            dashboardLink,
            message: 'Business registered successfully. Welcome email sent!'
        });
        
    } catch (error) {
        console.error('Error registering business:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to register business' 
        });
    }
});

/**
 * POST /api/customer/register
 * Register new customer and send welcome email with local business recommendations
 */
app.post('/api/customer/register', async (req, res) => {
    try {
        const { 
            customerName, 
            customerEmail, 
            customerPhone, 
            borough, 
            preferences 
        } = req.body;
        
        if (!customerName || !customerEmail || !borough) {
            return res.status(400).json({ 
                success: false, 
                error: 'Customer name, email, and borough are required' 
            });
        }
        
        // Create customer record
        const customer = {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            borough: borough,
            preferences: preferences || {},
            createdAt: new Date(),
            status: 'active'
        };
        
        const { insertedId } = await db.collection('customers').insertOne(customer);
        const customerId = insertedId.toString();
        
        // Send welcome email with local business recommendations
        try {
            await sendCustomerWelcomeEmail(customer);
        } catch (emailError) {
            console.error('Failed to send customer welcome email:', emailError);
            // Don't fail the registration if email fails
        }
        
        res.json({ 
            success: true, 
            customerId,
            message: 'Customer registered successfully. Welcome email with local business recommendations sent!'
        });
        
    } catch (error) {
        console.error('Error registering customer:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to register customer' 
        });
    }
});

/**
 * GET /api/services/summary?businessId=XYZ
 * Get service statistics for a business
 */
app.get('/api/services/summary', async (req, res) => {
    try {
        const { businessId } = req.query;
        
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId' 
            });
        }
        
        const [total, active, featured, visible, avgResult] = await Promise.all([
            db.collection('business_services').countDocuments({ businessId }),
            db.collection('business_services').countDocuments({ businessId, active: true }),
            db.collection('business_services').countDocuments({ businessId, featured: true }),
            db.collection('business_services').countDocuments({ businessId, active: true, published: true }),
            db.collection('business_services').aggregate([
                { $match: { businessId, active: true, priceGBP: { $ne: null } } },
                { $group: { _id: null, avg: { $avg: "$priceGBP" } } }
            ]).toArray()
        ]);
        
        const averagePrice = avgResult[0]?.avg ?? 0;
        
        res.json({
            success: true,
            total,
            active,
            featured,
            averagePrice: Math.round(averagePrice * 100) / 100,
            visible
        });
        
    } catch (error) {
        console.error('Error fetching service summary:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch service summary' 
        });
    }
});

/**
 * GET /api/services/list?businessId=XYZ
 * Get all services for a business
 */
app.get('/api/services/list', async (req, res) => {
    try {
        const { businessId } = req.query;
        
        if (!businessId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId' 
            });
        }
        
        const services = await db.collection('business_services')
            .find({ businessId })
            .sort({ order: 1, createdAt: -1 })
            .toArray();
        
        res.json(services);
        
    } catch (error) {
        console.error('Error fetching services list:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch services list' 
        });
    }
});

/**
 * POST /api/services/create
 * Create a new service
 */
app.post('/api/services/create', async (req, res) => {
    try {
        const { 
            businessId, 
            name, 
            description = '', 
            category = '', 
            durationMinutes, 
            priceGBP, 
            active = true, 
            featured = false, 
            published = true 
        } = req.body;
        
        if (!businessId || !name || !durationMinutes || priceGBP == null) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }
        
        // Get the highest order for this business
        const topService = await db.collection('business_services')
            .findOne({ businessId }, { sort: { order: -1 } });
        const order = (topService?.order ?? -1) + 1;
        
        const service = {
            businessId,
            name,
            description,
            category,
            durationMinutes: Number(durationMinutes),
            priceGBP: Number(priceGBP),
            active: !!active,
            featured: !!featured,
            published: !!published,
            order,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const { insertedId } = await db.collection('business_services').insertOne(service);
        
        res.json({
            success: true,
            service: { ...service, _id: insertedId }
        });
        
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create service' 
        });
    }
});

/**
 * PATCH /api/services/update
 * Update a service
 */
app.patch('/api/services/update', async (req, res) => {
    try {
        const { serviceId, ...patch } = req.body;
        
        if (!serviceId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing serviceId' 
            });
        }
        
        // Convert numeric fields
        if (patch.durationMinutes != null) patch.durationMinutes = Number(patch.durationMinutes);
        if (patch.priceGBP != null) patch.priceGBP = Number(patch.priceGBP);
        
        patch.updatedAt = new Date();
        
        await db.collection('business_services').updateOne(
            { _id: new ObjectId(serviceId) }, 
            { $set: patch }
        );
        
        const updatedService = await db.collection('business_services').findOne({ 
            _id: new ObjectId(serviceId) 
        });
        
        res.json({
            success: true,
            service: updatedService
        });
        
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update service' 
        });
    }
});

/**
 * PATCH /api/services/bulk-update
 * Bulk update multiple services
 */
app.patch('/api/services/bulk-update', async (req, res) => {
    try {
        const { businessId, serviceIds = [], patch = {} } = req.body;
        
        if (!businessId || !serviceIds.length) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId or serviceIds' 
            });
        }
        
        const updateFields = {};
        if (patch.durationMinutes != null) updateFields.durationMinutes = Number(patch.durationMinutes);
        if (patch.priceGBP != null) updateFields.priceGBP = Number(patch.priceGBP);
        
        ['active', 'featured', 'published', 'category', 'name', 'description'].forEach(field => {
            if (patch[field] != null) updateFields[field] = patch[field];
        });
        
        updateFields.updatedAt = new Date();
        
        await db.collection('business_services').updateMany(
            { businessId, _id: { $in: serviceIds.map(id => new ObjectId(id)) } },
            { $set: updateFields }
        );
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error bulk updating services:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to bulk update services' 
        });
    }
});

/**
 * PATCH /api/services/reorder
 * Reorder services
 */
app.patch('/api/services/reorder', async (req, res) => {
    try {
        const { businessId, updates = [] } = req.body;
        
        if (!businessId || !updates.length) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing businessId or updates' 
            });
        }
        
        const operations = updates.map(update => 
            db.collection('business_services').updateOne(
                { businessId, _id: new ObjectId(update.serviceId) },
                { $set: { order: Number(update.order), updatedAt: new Date() } }
            )
        );
        
        await Promise.all(operations);
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error reordering services:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to reorder services' 
        });
    }
});

/**
 * DELETE /api/services/delete?serviceId=ABC
 * Delete a service
 */
app.delete('/api/services/delete', async (req, res) => {
    try {
        const { serviceId } = req.query;
        
        if (!serviceId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing serviceId' 
            });
        }
        
        await db.collection('business_services').deleteOne({ 
            _id: new ObjectId(serviceId) 
        });
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete service' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: db ? 'connected' : 'disconnected'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
    });
});

// ==================== REVIEW MANAGEMENT API ====================

// MongoDB indexes for reviews
db.collection('business_reviews').createIndex({ businessId: 1, createdAt: -1 });
db.collection('business_reviews').createIndex({ businessId: 1, rating: 1 });

// ==================== PAYOUT MANAGEMENT API ====================

// MongoDB indexes for payouts
db.collection('business_payouts').createIndex({ businessId: 1, createdAt: -1 });
db.collection('business_payouts').createIndex({ businessId: 1, status: 1 });
db.collection('business_payouts').createIndex({ businessId: 1, date: -1 });

// ==================== SERVICES MANAGEMENT API ====================

// MongoDB indexes for services
db.collection('business_services').createIndex({ businessId: 1, status: 1 });
db.collection('business_services').createIndex({ businessId: 1, category: 1 });
db.collection('business_services').createIndex({ businessId: 1, last_updated: -1 });

// ==================== BUSINESS SETTINGS API ====================

// MongoDB indexes for business settings
db.collection('business_settings').createIndex({ businessId: 1 }, { unique: true });
db.collection('business_settings').createIndex({ businessId: 1, last_updated: -1 });

// Get review statistics for a business
app.get('/api/businesses/:businessId/review-stats', async (req, res) => {
    try {
        const { businessId } = req.params;
        
        const stats = await db.collection('business_reviews').aggregate([
            { $match: { businessId } },
            {
                $group: {
                    _id: null,
                    average_rating: { $avg: '$rating' },
                    total_reviews: { $sum: 1 },
                    positive_reviews: {
                        $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] }
                    }
                }
            }
        ]).toArray();

        // Get reviews this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const reviewsThisMonth = await db.collection('business_reviews').countDocuments({
            businessId,
            createdAt: { $gte: startOfMonth }
        });

        const result = stats[0] || {
            average_rating: 0,
            total_reviews: 0,
            positive_reviews: 0
        };

        const positive_percentage = result.total_reviews > 0 
            ? Math.round((result.positive_reviews / result.total_reviews) * 100)
            : 0;

        res.json({
            average_rating: Math.round(result.average_rating * 10) / 10,
            total_reviews: result.total_reviews,
            reviews_this_month: reviewsThisMonth,
            positive_percentage
        });
    } catch (error) {
        console.error('Error fetching review stats:', error);
        res.status(500).json({ error: 'Failed to fetch review stats' });
    }
});

// Get all reviews for a business
app.get('/api/businesses/:businessId/reviews', async (req, res) => {
    try {
        const { businessId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        const skip = (page - 1) * limit;
        
        const reviews = await db.collection('business_reviews')
            .find({ businessId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        // Format reviews for frontend
        const formattedReviews = reviews.map(review => ({
            id: review._id.toString(),
            reviewer_name: review.reviewerName,
            rating: review.rating,
            text: review.text,
            date: review.createdAt.toISOString(),
            reply: review.reply || null,
            reply_date: review.replyDate ? review.replyDate.toISOString() : null
        }));

        res.json({ reviews: formattedReviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Add a reply to a review
app.post('/api/reviews/:reviewId/reply', async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { reply } = req.body;
        
        if (!reply || reply.trim().length === 0) {
            return res.status(400).json({ error: 'Reply text is required' });
        }

        const result = await db.collection('business_reviews').updateOne(
            { _id: new ObjectId(reviewId) },
            { 
                $set: { 
                    reply: reply.trim(),
                    replyDate: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({ error: 'Failed to add reply' });
    }
});

// Create a new review (for testing/demo purposes)
app.post('/api/businesses/:businessId/reviews', async (req, res) => {
    try {
        const { businessId } = req.params;
        const { reviewerName, rating, text } = req.body;
        
        if (!reviewerName || !rating || !text) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const review = {
            businessId,
            reviewerName: reviewerName.trim(),
            rating: parseInt(rating),
            text: text.trim(),
            createdAt: new Date(),
            reply: null,
            replyDate: null
        };

        const result = await db.collection('business_reviews').insertOne(review);
        
        // Emit WebSocket event for real-time updates
        if (global.io) {
            global.io.to(`business_${businessId}`).emit('new_review', {
                id: result.insertedId.toString(),
                ...review
            });
        }

        res.json({ 
            success: true, 
            reviewId: result.insertedId.toString() 
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
});

// Get payout statistics for a business
app.get('/api/businesses/:businessId/payout-stats', async (req, res) => {
    try {
        const { businessId } = req.params;
        
        const stats = await db.collection('business_payouts').aggregate([
            { $match: { businessId } },
            {
                $group: {
                    _id: null,
                    total_earnings: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, '$amount', 0] } },
                    pending_payouts: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
                    completed_payouts: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                    last_payout_date: { $max: { $cond: [{ $eq: ['$status', 'Completed'] }, '$date', null] } }
                }
            }
        ]).toArray();

        const result = stats[0] || {
            total_earnings: 0,
            pending_payouts: 0,
            completed_payouts: 0,
            last_payout_date: null
        };

        res.json({
            total_earnings: Math.round(result.total_earnings * 100) / 100,
            pending_payouts: result.pending_payouts,
            completed_payouts: result.completed_payouts,
            last_payout_date: result.last_payout_date
        });
    } catch (error) {
        console.error('Error fetching payout stats:', error);
        res.status(500).json({ error: 'Failed to fetch payout stats' });
    }
});

// Get all payouts for a business
app.get('/api/businesses/:businessId/payouts', async (req, res) => {
    try {
        const { businessId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        const skip = (page - 1) * limit;
        
        const payouts = await db.collection('business_payouts')
            .find({ businessId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        // Format payouts for frontend
        const formattedPayouts = payouts.map(payout => ({
            id: payout._id.toString(),
            date: payout.date.toISOString(),
            amount: payout.amount,
            status: payout.status,
            method: payout.method,
            reference: payout.reference
        }));

        res.json(formattedPayouts);
    } catch (error) {
        console.error('Error fetching payouts:', error);
        res.status(500).json({ error: 'Failed to fetch payouts' });
    }
});

// Create a new payout (for testing/demo purposes)
app.post('/api/businesses/:businessId/payouts', async (req, res) => {
    try {
        const { businessId } = req.params;
        const { amount, method, reference } = req.body;
        
        if (!amount || !method) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const payout = {
            businessId,
            amount: parseFloat(amount),
            method: method.trim(),
            reference: reference ? reference.trim() : `TRX${Date.now()}`,
            status: 'Pending',
            date: new Date(),
            createdAt: new Date()
        };

        const result = await db.collection('business_payouts').insertOne(payout);
        
        // Emit WebSocket event for real-time updates
        if (global.io) {
            global.io.to(`business_${businessId}`).emit('new_payout', {
                id: result.insertedId.toString(),
                ...payout
            });
        }

        res.json({ 
            success: true, 
            payoutId: result.insertedId.toString() 
        });
    } catch (error) {
        console.error('Error creating payout:', error);
        res.status(500).json({ error: 'Failed to create payout' });
    }
});

// Update payout status (for testing/demo purposes)
app.patch('/api/payouts/:payoutId/status', async (req, res) => {
    try {
        const { payoutId } = req.params;
        const { status } = req.body;
        
        if (!status || !['Pending', 'Completed', 'Failed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await db.collection('business_payouts').updateOne(
            { _id: new ObjectId(payoutId) },
            { 
                $set: { 
                    status: status,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Payout not found' });
        }

        // Emit WebSocket event for real-time updates
        if (global.io) {
            const payout = await db.collection('business_payouts').findOne({ _id: new ObjectId(payoutId) });
            if (payout) {
                global.io.to(`business_${payout.businessId}`).emit('payout_updated', {
                    id: payoutId,
                    status: status,
                    payout: payout
                });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating payout status:', error);
        res.status(500).json({ error: 'Failed to update payout status' });
    }
});

// Get service statistics for a business
app.get('/api/businesses/:businessId/service-stats', async (req, res) => {
    try {
        const { businessId } = req.params;
        
        const stats = await db.collection('business_services').aggregate([
            { $match: { businessId } },
            {
                $group: {
                    _id: null,
                    active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending Approval'] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
                    archived: { $sum: { $cond: [{ $eq: ['$status', 'Archived'] }, 1, 0] } }
                }
            }
        ]).toArray();

        const result = stats[0] || {
            active: 0,
            pending: 0,
            rejected: 0,
            archived: 0
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching service stats:', error);
        res.status(500).json({ error: 'Failed to fetch service stats' });
    }
});

// Get all services for a business
app.get('/api/businesses/:businessId/services', async (req, res) => {
    try {
        const { businessId } = req.params;
        const { status } = req.query;
        
        const filter = { businessId };
        if (status) {
            filter.status = status;
        }
        
        const services = await db.collection('business_services')
            .find(filter)
            .sort({ last_updated: -1 })
            .toArray();

        // Format services for frontend
        const formattedServices = services.map(service => ({
            id: service._id.toString(),
            name: service.name,
            category: service.category,
            price: service.price,
            duration: service.duration,
            status: service.status,
            last_updated: service.last_updated.toISOString(),
            description: service.description || '',
            image_url: service.image_url || null
        }));

        res.json(formattedServices);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// Create a new service
app.post('/api/services', async (req, res) => {
    try {
        const { businessId, name, category, price, duration, description, image_url } = req.body;
        
        if (!businessId || !name || !category || !price || !duration) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const service = {
            businessId,
            name: name.trim(),
            category: category.trim(),
            price: parseFloat(price),
            duration: duration.trim(),
            description: description ? description.trim() : '',
            image_url: image_url || null,
            status: 'Pending Approval',
            created_at: new Date(),
            last_updated: new Date()
        };

        const result = await db.collection('business_services').insertOne(service);
        
        // Emit WebSocket event for real-time updates
        if (global.io) {
            global.io.to(`business_${businessId}`).emit('new_service', {
                id: result.insertedId.toString(),
                ...service
            });
        }

        res.json({ 
            success: true, 
            serviceId: result.insertedId.toString() 
        });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

// Update a service
app.patch('/api/services/:serviceId', async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { name, category, price, duration, description, image_url, status } = req.body;
        
        const updateFields = {
            last_updated: new Date()
        };
        
        if (name !== undefined) updateFields.name = name.trim();
        if (category !== undefined) updateFields.category = category.trim();
        if (price !== undefined) updateFields.price = parseFloat(price);
        if (duration !== undefined) updateFields.duration = duration.trim();
        if (description !== undefined) updateFields.description = description.trim();
        if (image_url !== undefined) updateFields.image_url = image_url;
        if (status !== undefined) updateFields.status = status;

        const result = await db.collection('business_services').updateOne(
            { _id: new ObjectId(serviceId) },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        // Emit WebSocket event for real-time updates
        if (global.io) {
            const service = await db.collection('business_services').findOne({ _id: new ObjectId(serviceId) });
            if (service) {
                global.io.to(`business_${service.businessId}`).emit('service_updated', {
                    id: serviceId,
                    service: {
                        id: serviceId,
                        name: service.name,
                        category: service.category,
                        price: service.price,
                        duration: service.duration,
                        status: service.status,
                        last_updated: service.last_updated.toISOString(),
                        description: service.description || '',
                        image_url: service.image_url || null
                    }
                });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

// Delete a service
app.delete('/api/services/:serviceId', async (req, res) => {
    try {
        const { serviceId } = req.params;
        
        const service = await db.collection('business_services').findOne({ _id: new ObjectId(serviceId) });
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        await db.collection('business_services').deleteOne({ _id: new ObjectId(serviceId) });
        
        // Emit WebSocket event for real-time updates
        if (global.io) {
            global.io.to(`business_${service.businessId}`).emit('service_deleted', {
                id: serviceId,
                businessId: service.businessId
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

// Get business settings
app.get('/api/businesses/:businessId/settings', async (req, res) => {
    try {
        const { businessId } = req.params;
        
        const settings = await db.collection('business_settings').findOne({ businessId });
        
        if (!settings) {
            // Return default settings if none exist
            const defaultSettings = {
                business_name: '',
                description: '',
                email: '',
                phone: '',
                address: '',
                opening_hours: '',
                instagram: '',
                facebook: '',
                website: '',
                package_type: 'Free'
            };
            
            return res.json(defaultSettings);
        }

        // Format settings for frontend
        const formattedSettings = {
            business_name: settings.business_name || '',
            description: settings.description || '',
            email: settings.email || '',
            phone: settings.phone || '',
            address: settings.address || '',
            opening_hours: settings.opening_hours || '',
            instagram: settings.instagram || '',
            facebook: settings.facebook || '',
            website: settings.website || '',
            package_type: settings.package_type || 'Free'
        };

        res.json(formattedSettings);
    } catch (error) {
        console.error('Error fetching business settings:', error);
        res.status(500).json({ error: 'Failed to fetch business settings' });
    }
});

// Update business settings
app.patch('/api/businesses/:businessId/settings', async (req, res) => {
    try {
        const { businessId } = req.params;
        const {
            business_name,
            description,
            email,
            phone,
            address,
            opening_hours,
            instagram,
            facebook,
            website
        } = req.body;
        
        // Validate required fields
        if (!business_name || !email || !phone) {
            return res.status(400).json({ 
                error: 'Missing required fields: business_name, email, and phone are required' 
            });
        }

        const updateData = {
            businessId,
            business_name: business_name.trim(),
            description: description ? description.trim() : '',
            email: email.trim(),
            phone: phone.trim(),
            address: address ? address.trim() : '',
            opening_hours: opening_hours ? opening_hours.trim() : '',
            instagram: instagram ? instagram.trim() : '',
            facebook: facebook ? facebook.trim() : '',
            website: website ? website.trim() : '',
            package_type: 'Free', // Default to Free package
            last_updated: new Date()
        };

        // Use upsert to create or update settings
        const result = await db.collection('business_settings').updateOne(
            { businessId },
            { $set: updateData },
            { upsert: true }
        );

        // Emit WebSocket event for real-time updates
        if (global.io) {
            global.io.to(`business_${businessId}`).emit('settings_updated', {
                businessId,
                settings: updateData
            });
        }

        res.json({ 
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating business settings:', error);
        res.status(500).json({ error: 'Failed to update business settings' });
    }
});

// ========================================
// STARTER PACKAGE DASHBOARD ENDPOINTS
// ========================================

// Get review stats for Starter Package
app.get('/api/businesses/:business_id/review-stats', async (req, res) => {
    try {
        const { business_id } = req.params;
        res.json({
            business_id,
            average_rating: 4.4,
            total_reviews: 27,
            recent_reviews: [
                {
                    reviewer_name: "Naomi Johnson",
                    rating: 5,
                    comment: "Brilliant service, quick and professional.",
                    date: "2025-10-09T14:32:00Z",
                },
                {
                    reviewer_name: "Tayo Smith",
                    rating: 4,
                    comment: "Clean shop, friendly staff.",
                    date: "2025-10-07T10:11:00Z",
                },
            ],
        });
    } catch (error) {
        console.error('Error fetching review stats:', error);
        res.status(500).json({ error: 'Failed to fetch review stats' });
    }
});

// Get profile views stats for Starter Package
app.get('/api/businesses/:business_id/profile-views-stats', async (req, res) => {
    try {
        const { business_id } = req.params;
        res.json({
            business_id,
            total_views: 428,
            views_this_month: 76,
            views_last_month: 65,
        });
    } catch (error) {
        console.error('Error fetching profile views stats:', error);
        res.status(500).json({ error: 'Failed to fetch profile views stats' });
    }
});

// Get booking stats for Starter Package
app.get('/api/businesses/:business_id/booking-stats', async (req, res) => {
    try {
        const { business_id } = req.params;
        res.json({
            business_id,
            total_bookings: 35,
            bookings_this_month: 8,
            recent_bookings: [
                {
                    id: "bk_001",
                    customer_name: "Sarah Thompson",
                    service: "Haircut",
                    date: "2025-10-10T13:00:00Z",
                    status: "Completed",
                },
                {
                    id: "bk_002",
                    customer_name: "Jordan Miles",
                    service: "Beard Trim",
                    date: "2025-10-09T15:30:00Z",
                    status: "Pending",
                },
            ],
        });
    } catch (error) {
        console.error('Error fetching booking stats:', error);
        res.status(500).json({ error: 'Failed to fetch booking stats' });
    }
});

// Get business profile for Starter Package
app.get('/api/businesses/:business_id/profile', async (req, res) => {
    try {
        const { business_id } = req.params;
        res.json({
            business_id,
            business_name: "Royal Hair Studio",
            category: "Barbering",
            description: "Professional barber studio specialising in modern cuts.",
            contact_email: "info@royalhair.co.uk",
            phone_number: "020 1234 5678",
            address: "123 Lewisham High Street, London SE13",
            opening_hours: "Mon–Sat: 9:00 – 18:00",
            social_links: {
                instagram: "@royalhairstudio",
                facebook: "",
                website: "",
            },
        });
    } catch (error) {
        console.error('Error fetching business profile:', error);
        res.status(500).json({ error: 'Failed to fetch business profile' });
    }
});

// Update business profile for Starter Package
app.patch('/api/businesses/:business_id/profile', async (req, res) => {
    try {
        const { business_id } = req.params;
        const updatedData = req.body;
        res.json({
            success: true,
            business_id,
            updated: updatedData,
        });
    } catch (error) {
        console.error('Error updating business profile:', error);
        res.status(500).json({ error: 'Failed to update business profile' });
    }
});

// Get basic settings for Starter Package
app.get('/api/businesses/:business_id/settings-basic', async (req, res) => {
    try {
        const { business_id } = req.params;
        res.json({
            business_id,
            notifications_enabled: true,
            allow_public_reviews: true,
            booking_cancellation_policy: "24-hour notice required",
        });
    } catch (error) {
        console.error('Error fetching basic settings:', error);
        res.status(500).json({ error: 'Failed to fetch basic settings' });
    }
});

// Update basic settings for Starter Package
app.patch('/api/businesses/:business_id/settings-basic', async (req, res) => {
    try {
        const { business_id } = req.params;
        const updated = req.body;
        res.json({
            success: true,
            business_id,
            updated,
        });
    } catch (error) {
        console.error('Error updating basic settings:', error);
        res.status(500).json({ error: 'Failed to update basic settings' });
    }
});

// Get basic analytics for Starter Package
app.get('/api/businesses/:business_id/analytics/basic', async (req, res) => {
    try {
        const { business_id } = req.params;
        res.json({
            business_id,
            total_visits: 428,
            bookings_this_month: 8,
            average_rating: 4.4,
            conversion_rate: 12.6,
        });
    } catch (error) {
        console.error('Error fetching basic analytics:', error);
        res.status(500).json({ error: 'Failed to fetch basic analytics' });
    }
});

// Get plan info for Starter Package
app.get('/api/businesses/:business_id/plan-info', async (req, res) => {
    try {
        const { business_id } = req.params;
        res.json({
            business_id,
            plan: "Starter",
            upgrade_available: true,
            next_tier: "Professional",
            message: "Upgrade to unlock advanced analytics, loyalty rewards, and team management.",
        });
    } catch (error) {
        console.error('Error fetching plan info:', error);
        res.status(500).json({ error: 'Failed to fetch plan info' });
    }
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle business room joining
    socket.on('join_business', (data) => {
        const { businessId } = data;
        socket.join(`business_${businessId}`);
        console.log(`Client ${socket.id} joined business room: business_${businessId}`);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`BlkPages Analytics Server running on port ${PORT}`);
    console.log(`MongoDB URI: ${MONGO_URI}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
    
    // Start reminder cron job
    startReminderCron();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    if (client) {
        await client.close();
    }
    process.exit(0);
});

module.exports = app;
