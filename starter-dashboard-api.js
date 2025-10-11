// starter-dashboard-api.js
// Backend API stubs for the BlkPages Starter Package Business Dashboard

import express from "express";
const router = express.Router();

/* -------------------------------------------
   1️⃣ Review Stats
------------------------------------------- */
router.get("/api/businesses/:business_id/review-stats", (req, res) => {
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
});

/* -------------------------------------------
   2️⃣ Profile Views
------------------------------------------- */
router.get("/api/businesses/:business_id/profile-views-stats", (req, res) => {
  const { business_id } = req.params;
  res.json({
    business_id,
    total_views: 428,
    views_this_month: 76,
    views_last_month: 65,
  });
});

/* -------------------------------------------
   3️⃣ Booking Stats
------------------------------------------- */
router.get("/api/businesses/:business_id/booking-stats", (req, res) => {
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
});

/* -------------------------------------------
   4️⃣ Business Profile (Editable)
------------------------------------------- */
router.get("/api/businesses/:business_id/profile", (req, res) => {
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
});

router.patch("/api/businesses/:business_id/profile", (req, res) => {
  const { business_id } = req.params;
  const updatedData = req.body;
  // Pretend we save the data
  res.json({
    success: true,
    business_id,
    updated: updatedData,
  });
});

/* -------------------------------------------
   5️⃣ Basic Settings
------------------------------------------- */
router.get("/api/businesses/:business_id/settings-basic", (req, res) => {
  const { business_id } = req.params;
  res.json({
    business_id,
    notifications_enabled: true,
    allow_public_reviews: true,
    booking_cancellation_policy: "24-hour notice required",
  });
});

router.patch("/api/businesses/:business_id/settings-basic", (req, res) => {
  const { business_id } = req.params;
  const updated = req.body;
  res.json({
    success: true,
    business_id,
    updated,
  });
});

/* -------------------------------------------
   6️⃣ Basic Analytics
------------------------------------------- */
router.get("/api/businesses/:business_id/analytics/basic", (req, res) => {
  const { business_id } = req.params;
  res.json({
    business_id,
    total_visits: 428,
    bookings_this_month: 8,
    average_rating: 4.4,
    conversion_rate: 12.6,
  });
});

/* -------------------------------------------
   7️⃣ Manage Plan / Upgrade Info
------------------------------------------- */
router.get("/api/businesses/:business_id/plan-info", (req, res) => {
  const { business_id } = req.params;
  res.json({
    business_id,
    plan: "Starter",
    upgrade_available: true,
    next_tier: "Professional",
    message: "Upgrade to unlock advanced analytics, loyalty rewards, and team management.",
  });
});

/* -------------------------------------------
   Export Router
------------------------------------------- */
export default router;
