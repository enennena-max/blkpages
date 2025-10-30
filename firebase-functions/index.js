const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();
const stripe = new Stripe(functions.config().stripe.secret, { apiVersion: "2024-06-20" });
const nodemailer = require("nodemailer");
const { Parser } = require("json2csv");

/**
 * Create a PaymentIntent for the amount AFTER points.
 * Callable from client.
 * data: { bookingId, amountGBP, pointsUsed, currency="gbp" }
 */
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in required");
  const uid = context.auth.uid;

  const { bookingId, amountGBP, pointsUsed = 0, currency = "gbp" } = data;
  if (typeof amountGBP !== "number" || amountGBP <= 0) {
    throw new functions.https.HttpsError("invalid-argument", "amountGBP must be > 0");
  }

  // Optional server-side checks
  const userDoc = await db.collection("users").doc(uid).get();
  const user = userDoc.data() || {};
  const availablePoints = user.points || 0;
  if (pointsUsed > availablePoints) {
    throw new functions.https.HttpsError("failed-precondition", "Insufficient points");
  }

  const amountInPence = Math.round(amountGBP * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInPence,
    currency,
    automatic_payment_methods: { enabled: true },
    metadata: {
      uid,
      bookingId: bookingId || "",
      pointsUsed: String(pointsUsed)
    }
  });

  return { clientSecret: paymentIntent.client_secret };
});

/**
 * Finalize: deduct points, mark booking paid.
 * data: { bookingId, pointsUsed }
 */
exports.finalizeBooking = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in required");
  const uid = context.auth.uid;
  const { bookingId, pointsUsed = 0 } = data;

  const userRef = db.collection("users").doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const current = snap.exists ? snap.data() : {};
    const have = current.points || 0;
    if (pointsUsed > have) throw new functions.https.HttpsError("failed-precondition", "Insufficient points");
    tx.update(userRef, { points: have - pointsUsed });
    if (bookingId) {
      const bRef = db.collection("bookings").doc(bookingId);
      tx.set(bRef, { status: "paid", pointsUsed, paidAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
  });

  return { ok: true };
});

/**
 * Get user's BlkPoints balance and verification status
 */
exports.getUserBlkPoints = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in required");
  const uid = context.auth.uid;

  const userDoc = await db.collection("users").doc(uid).get();
  const user = userDoc.exists ? userDoc.data() : {};
  
  return {
    points: user.points || 0,
    phoneVerified: user.phoneVerified || false
  };
});

/**
 * Verify phone number (for testing - in production, use Firebase Auth phone verification)
 */
exports.verifyPhone = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in required");
  const uid = context.auth.uid;
  const { phoneNumber } = data;

  // In production, verify the phone number with Firebase Auth
  // For demo purposes, we'll just mark it as verified
  await db.collection("users").doc(uid).set({
    phoneVerified: true,
    phoneNumber: phoneNumber,
    verifiedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { success: true, message: "Phone number verified successfully" };
});

// =====================
// Weekly Alerts CSV Email
// =====================
const emailUser = (functions.config().email && functions.config().email.user) || null;
const emailPass = (functions.config().email && functions.config().email.pass) || null;
let mailer = null;
if (emailUser && emailPass) {
  mailer = nodemailer.createTransport({
    service: "gmail",
    auth: { user: emailUser, pass: emailPass }
  });

// =====================
// Monthly CSV Emails (Alerts + Performance for last 30 days)
// =====================
exports.sendMonthlyAlertsReport = functions.pubsub
  .schedule("0 9 1 * *")
  .timeZone("Etc/UTC")
  .onRun(async () => {
    if (!mailer) { console.log("Mailer not configured; skipping monthly alerts email."); return null; }
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);
    const start = new Date(end.getTime() - 29*24*60*60*1000);
    const snap = await db.collection("adminAlerts").where("timestamp", ">=", start).where("timestamp", "<=", end).get();
    const rows = snap.docs.map(d => {
      const a = d.data() || {};
      const time = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp || Date.now());
      return { Type: a.type || '', Message: a.message || '', Time: time.toISOString(), Status: a.read ? "Read" : "Unread" };
    });
    const csv = new Parser().parse(rows);
    await mailer.sendMail({
      from: `BlkPages Alerts <${emailUser}>`,
      to: "admin@blkpages.com, finance@blkpages.com",
      subject: `Monthly Alerts Report – ${now.toISOString().split("T")[0]}`,
      text: "Attached: alerts from the last 30 days.",
      attachments: [{ filename: `alerts_${now.toISOString().split("T")[0]}.csv`, content: csv }]
    });
    console.log("✅ Monthly Alerts CSV emailed.");
    return null;
  });

exports.sendMonthlyPerformanceReport = functions.pubsub
  .schedule("0 9 1 * *")
  .timeZone("Etc/UTC")
  .onRun(async () => {
    if (!mailer) { console.log("Mailer not configured; skipping monthly performance email."); return null; }
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);
    const start = new Date(end.getTime() - 29*24*60*60*1000);
    const snap = await db.collection("bookings").where("createdAt", ">=", start).where("createdAt", "<=", end).get();
    const byDay = new Map();
    snap.docs.forEach(d => {
      const b = d.data() || {};
      const ts = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt || Date.now());
      const key = ts.toISOString().slice(0,10);
      if (!byDay.has(key)) byDay.set(key, { Date: key, Bookings: 0, Revenue: 0 });
      const row = byDay.get(key);
      row.Bookings += 1;
      row.Revenue = Math.round(((row.Revenue || 0) + Number(b.amountPaid || 0)) * 100) / 100;
    });
    const rows = Array.from(byDay.values()).sort((a,b)=> a.Date.localeCompare(b.Date));
    const csv = new Parser().parse(rows);
    await mailer.sendMail({
      from: `BlkPages Reports <${emailUser}>`,
      to: "admin@blkpages.com, finance@blkpages.com",
      subject: `Monthly Performance (Bookings & Revenue) – ${now.toISOString().split("T")[0]}`,
      text: "Attached: daily bookings & revenue for the last 30 days.",
      attachments: [{ filename: `performance_${now.toISOString().split("T")[0]}.csv`, content: csv }]
    });
    console.log("✅ Monthly Performance CSV emailed.");
    return null;
  });

// =====================
// Callable: Send both reports now (last 30 days)
// =====================
exports.sendReportsNow = functions.https.onCall(async (data, context) => {
  if (!mailer) {
    throw new functions.https.HttpsError('failed-precondition', 'Mailer not configured');
  }
  try {
    // --- Admin Auth Check ---
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to call this function.');
    }
    const uid = context.auth.uid;
    const adminDoc = await db.collection('admins').doc(uid).get();
    if (!adminDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'You do not have permission to trigger reports.');
    }
    console.log(`Manual report triggered by admin UID: ${uid}`);

    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);
    const start = new Date(end.getTime() - 29*24*60*60*1000);

    // Alerts
    const aSnap = await db.collection('adminAlerts').where('timestamp', '>=', start).where('timestamp', '<=', end).get();
    const aRows = aSnap.docs.map(d => {
      const a = d.data() || {};
      const time = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp || Date.now());
      return { Type: a.type || '', Message: a.message || '', Time: time.toISOString(), Status: a.read ? 'Read' : 'Unread' };
    });
    const aCsv = new Parser().parse(aRows);

    // Performance (bookings)
    const bSnap = await db.collection('bookings').where('createdAt', '>=', start).where('createdAt', '<=', end).get();
    const byDay = new Map();
    bSnap.docs.forEach(d => {
      const b = d.data() || {};
      const ts = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt || Date.now());
      const key = ts.toISOString().slice(0,10);
      if (!byDay.has(key)) byDay.set(key, { Date: key, Bookings: 0, Revenue: 0 });
      const row = byDay.get(key);
      row.Bookings += 1;
      row.Revenue = Math.round(((row.Revenue || 0) + Number(b.amountPaid || 0)) * 100) / 100;
    });
    const pRows = Array.from(byDay.values()).sort((a,b)=> a.Date.localeCompare(b.Date));
    const pCsv = new Parser().parse(pRows);

    await mailer.sendMail({
      from: `BlkPages Reports <${emailUser}>`,
      to: "admin@blkpages.com, finance@blkpages.com",
      subject: `BlkPages Reports – Manual Trigger ${now.toISOString().split('T')[0]}`,
      text: 'Attached: Alerts + Performance CSVs for the past 30 days.',
      attachments: [
        { filename: `alerts_${now.toISOString().split('T')[0]}.csv`, content: aCsv },
        { filename: `performance_${now.toISOString().split('T')[0]}.csv`, content: pCsv }
      ]
    });
    return { success: true, message: 'Reports sent successfully!' };
  } catch (e) {
    console.error('sendReportsNow error', e);
    throw new functions.https.HttpsError('internal', 'Report generation failed');
  }
});
}

exports.sendWeeklyAlertsReport = functions.pubsub
  .schedule("every monday 09:00")
  .timeZone("Etc/UTC")
  .onRun(async () => {
    if (!mailer) {
      console.log("Mailer not configured; skipping weekly alerts email.");
      return null;
    }
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const snap = await db.collection("adminAlerts").where("timestamp", ">=", oneWeekAgo).get();
    const rows = snap.docs.map(d => {
      const a = d.data() || {};
      const time = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp || Date.now());
      return {
        Type: a.type || '',
        Message: a.message || '',
        Time: time.toISOString(),
        Status: a.read ? "Read" : "Unread"
      };
    });
    if (!rows.length) {
      console.log("No alerts this week – skipping email.");
      return null;
    }
    const csv = new Parser().parse(rows);
    await mailer.sendMail({
      from: `BlkPages Alerts <${emailUser}>`,
      to: "admin@blkpages.com",
      subject: `BlkPages Weekly Alerts – ${now.toISOString().split("T")[0]}`,
      text: "Attached is your weekly alert summary.",
      attachments: [{ filename: `BlkPages_Alerts_${now.toISOString().split("T")[0]}.csv`, content: csv }]
    });
    console.log("✅ Weekly CSV email sent.");
    return null;
  });
