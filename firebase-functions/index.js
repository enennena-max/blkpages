const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();
const stripe = new Stripe(functions.config().stripe.secret, { apiVersion: "2024-06-20" });

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
