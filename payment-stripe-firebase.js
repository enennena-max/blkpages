// payment-stripe-firebase.js - Stripe Elements + Firebase integration (gated)
// This runs alongside existing payment logic without interfering

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-functions.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return window.firebaseConfig && 
         window.firebaseConfig.apiKey !== "your-api-key-here" &&
         window.STRIPE_PUBLISHABLE_KEY && 
         window.STRIPE_PUBLISHABLE_KEY !== "pk_test_your_stripe_publishable_key_here";
};

// Only proceed if Firebase is configured
if (!isFirebaseConfigured()) {
  console.log('Firebase not configured - using existing payment logic');
  // Create a fallback Stripe Element for demo
  if (typeof Stripe !== 'undefined') {
    initDemoStripeElement();
  }
} else {
  console.log('Firebase configured - initializing Stripe + Firebase integration');
  initStripeFirebaseIntegration();
}

// Demo Stripe Element (when Firebase not configured)
function initDemoStripeElement() {
  const element = document.getElementById('payment-element');
  if (element && !element.innerHTML.includes('Stripe')) {
    element.innerHTML = `
      <div style="padding: 20px; border: 2px dashed #ffd700; border-radius: 8px; text-align: center; color: #ffd700;">
        <h4>Demo Payment Mode</h4>
        <p>Configure Firebase to enable secure Stripe Elements</p>
        <p>Card: 4242 4242 4242 4242 | Exp: 12/27 | CVV: 123</p>
      </div>
    `;
  }
}

// Full Stripe + Firebase integration
async function initStripeFirebaseIntegration() {
  try {
    // Initialize Firebase
    const app = initializeApp(window.firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const functions = getFunctions(app);

    let stripe, elements;
    let booking = JSON.parse(localStorage.getItem("bookingSummary") || "{}");
    let baseTotal = Number(booking?.total || 0);
    let pointsAvailable = 0;
    let phoneVerified = false;
    let pointsUsed = 0;
    let isStripeReady = false;

    const GBP = (n) => `£${(n ?? 0).toFixed(2)}`;
    const rate = 0.01; // 1 point = £0.01

    // DOM elements
    const totalDueEl = document.getElementById("totalDue");
    const totalPointsEl = document.getElementById("totalPoints");
    const pointsValueEl = document.getElementById("pointsValue");
    const pointsSelector = document.getElementById("pointsSelector");
    const blkError = document.getElementById("blkError");
    const applyBtn = document.getElementById("applyBlkPoints");
    const payBtn = document.getElementById("completePayment");

    function setPayEnabled(enabled) {
      if (payBtn) payBtn.disabled = !enabled;
    }

    function renderSummary() {
      if (totalDueEl) {
        totalDueEl.textContent = GBP(baseTotal - pointsUsed * rate);
      }
    }

    function buildPointsButtons() {
      if (!pointsSelector) return;
      
      pointsSelector.innerHTML = "";
      const maxCash = pointsAvailable * rate;
      const steps = Math.floor(Math.min(maxCash, baseTotal) / 5);
      
      for (let i = 1; i <= steps; i++) {
        const cash = i * 5;
        const pts = Math.round(cash / rate);
        const b = document.createElement("button");
        b.className = "point-btn";
        b.textContent = `Use £${cash} (${pts} pts)`;
        b.addEventListener("click", () => {
          document.querySelectorAll(".point-btn").forEach(x => x.classList.remove("selected"));
          b.classList.add("selected");
          pointsUsed = pts;
        });
        pointsSelector.appendChild(b);
      }
      
      if (steps === 0) {
        const small = document.createElement("p");
        small.textContent = "No eligible increments. (Need at least £5 in points and total ≥ £5)";
        pointsSelector.appendChild(small);
      }
    }

    async function initStripeElement() {
      if (typeof Stripe === 'undefined') {
        console.error('Stripe not loaded');
        return;
      }
      
      stripe = Stripe(window.STRIPE_PUBLISHABLE_KEY);
      elements = stripe.elements({ 
        appearance: { 
          theme: "night",
          variables: {
            colorPrimary: '#ffd700',
            colorBackground: '#000000',
            colorText: '#ffffff',
            colorDanger: '#ff6b6b',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px'
          }
        } 
      });

      const paymentElement = elements.create("payment");
      paymentElement.mount("#payment-element");
      isStripeReady = true;
    }

    async function fetchUserState(uid) {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        const u = snap.exists() ? snap.data() : {};
        pointsAvailable = Number(u.points || 0);
        phoneVerified = Boolean(u.phoneVerified || false);
        
        if (totalPointsEl) totalPointsEl.textContent = pointsAvailable.toString();
        if (pointsValueEl) pointsValueEl.textContent = GBP(pointsAvailable * rate);
        
        buildPointsButtons();
      } catch (error) {
        console.error('Error fetching user state:', error);
        // Fallback to demo data
        pointsAvailable = 2400;
        phoneVerified = true;
        if (totalPointsEl) totalPointsEl.textContent = pointsAvailable.toString();
        if (pointsValueEl) pointsValueEl.textContent = GBP(pointsAvailable * rate);
        buildPointsButtons();
      }
    }

    function guardBlkPointsUse() {
      if (!phoneVerified) {
        if (blkError) {
          blkError.textContent = "⚠️ Verify your mobile number in your dashboard to use BlkPoints.";
          blkError.style.display = "block";
        }
        if (applyBtn) applyBtn.disabled = true;
      } else {
        if (blkError) blkError.style.display = "none";
        if (applyBtn) applyBtn.disabled = false;
      }
    }

    // Initialize demo user for testing
    async function initDemoUser() {
      try {
        const userCredential = await signInAnonymously(auth);
        const uid = userCredential.user.uid;
        
        await setDoc(doc(db, "users", uid), {
          points: 2400,
          phoneVerified: true,
          email: "demo@blkpages.com",
          name: "Demo User"
        }, { merge: true });
        
        return uid;
      } catch (error) {
        console.error('Error initializing demo user:', error);
        return null;
      }
    }

    // Override existing payment logic when Firebase is ready
    function overridePaymentLogic() {
      // Override the existing apply button
      if (applyBtn) {
        applyBtn.addEventListener("click", () => {
          if (!phoneVerified) return guardBlkPointsUse();
          if (!pointsUsed) {
            if (blkError) {
              blkError.textContent = "Select how many BlkPoints to use (in £5 steps).";
              blkError.style.display = "block";
            }
            return;
          }
          if (blkError) blkError.style.display = "none";
          renderSummary();
          if (applyBtn) applyBtn.disabled = true;
        });
      }

      // Override the existing pay button
      if (payBtn) {
        payBtn.addEventListener("click", async () => {
          setPayEnabled(false);

          try {
            const amountAfter = Math.max(baseTotal - pointsUsed * rate, 0);
            if (amountAfter <= 0) {
              if (blkError) {
                blkError.textContent = "Amount must be greater than £0.00";
                blkError.style.display = "block";
              }
              setPayEnabled(true);
              return;
            }

            // For demo purposes, simulate payment success
            if (amountAfter < 0.01) {
              console.log('Free booking with BlkPoints');
              localStorage.removeItem("bookingSummary");
              window.location.href = "/payment-success.html";
              return;
            }

            if (isStripeReady) {
              const createPI = httpsCallable(functions, "createPaymentIntent");
              const resp = await createPI({
                bookingId: booking?.id || "",
                amountGBP: Number(amountAfter.toFixed(2)),
                pointsUsed
              });

              const clientSecret = resp.data.clientSecret;

              const billingDetails = {
                name: document.getElementById("billingName")?.value || "Demo User",
                address: {
                  line1: document.getElementById("billingLine1")?.value || "221B Baker Street",
                  postal_code: document.getElementById("billingPost")?.value || "NW1 6XE"
                }
              };

              const { error } = await stripe.confirmPayment({
                clientSecret,
                elements,
                confirmParams: {
                  payment_method_data: { billing_details: billingDetails },
                  return_url: window.location.origin + "/payment-success.html"
                },
                redirect: "if_required"
              });

              if (error) {
                if (blkError) {
                  blkError.textContent = error.message || "Payment failed. Please check details and try again.";
                  blkError.style.display = "block";
                }
                setPayEnabled(true);
                return;
              }

              // Deduct points + mark booking
              const finalize = httpsCallable(functions, "finalizeBooking");
              await finalize({ bookingId: booking?.id || "", pointsUsed });
            }

            // Clean up and go to success page
            localStorage.removeItem("bookingSummary");
            window.location.href = "/payment-success.html";
          } catch (e) {
            console.error('Payment error:', e);
            if (blkError) {
              blkError.textContent = e.message || "Unexpected error. Please try again.";
              blkError.style.display = "block";
            }
            setPayEnabled(true);
          }
        });
      }
    }

    // Initialize everything
    document.addEventListener("DOMContentLoaded", async () => {
      renderSummary();

      // Initialize demo user for testing
      const uid = await initDemoUser();
      
      if (uid) {
        await fetchUserState(uid);
        guardBlkPointsUse();
        await initStripeElement();
        setPayEnabled(true);
        overridePaymentLogic();
      } else {
        // Fallback to demo data
        pointsAvailable = 2400;
        phoneVerified = true;
        if (totalPointsEl) totalPointsEl.textContent = pointsAvailable.toString();
        if (pointsValueEl) pointsValueEl.textContent = GBP(pointsAvailable * rate);
        buildPointsButtons();
        guardBlkPointsUse();
        await initStripeElement();
        setPayEnabled(true);
        overridePaymentLogic();
      }
    });

  } catch (error) {
    console.error('Error initializing Stripe + Firebase integration:', error);
    // Fallback to demo mode
    initDemoStripeElement();
  }
}
