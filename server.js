import express from "express";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
app.use(cors());
app.use(express.json());

// ===== SOCKET.IO SETUP =====
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// When a user connects
io.on('connection', (socket) => {
  socket.on('register', ({ customerId }) => {
    if (customerId) socket.join(`cust:${customerId}`);
  });
});

// helper so you can emit updates easily from anywhere
function emitToCustomer(customerId, event, payload) {
  if (!customerId) return;
  io.to(`cust:${customerId}`).emit(event, payload);
}

app.set('emitToCustomer', emitToCustomer);

app.post("/bookings/new", async (req, res) => {
  try {
    const { business, services, total, date, time, customerEmail, isNewCustomer } = req.body;

    const businessStripeAccountId = await getBusinessStripeAccount(business);
    const totalInPence = Math.round(Number(total) * 100);
    const commission = isNewCustomer ? Math.round(totalInPence * 0.1) : 0;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalInPence,
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
      application_fee_amount: commission,
      transfer_data: {
        destination: businessStripeAccountId,
      },
      metadata: {
        business,
        customerEmail,
        isNewCustomer,
        date,
        time,
        services: services.map(s => s.name).join(", "),
      },
    });

    const bookingRecord = {
      bookingId: "BKP-" + Date.now(),
      business,
      services,
      total,
      date,
      time,
      customerEmail,
      isNewCustomer,
      commission: commission / 100,
      payoutToBusiness: (totalInPence - commission) / 100,
      stripePaymentIntent: paymentIntent.id,
    };

    console.log("Booking saved:", bookingRecord);
    if (bookingRecord.isNewCustomer) {
      console.log("🎉 NEW CUSTOMER BOOKING - Commission: £" + bookingRecord.commission.toFixed(2));
    }
    await notifyBusinessByEmail(business, bookingRecord);

    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Booking creation error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

async function notifyBusinessByEmail(business, booking) {
  const businessEmail = await getBusinessEmail(business);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  
  const subject = booking.isNewCustomer 
    ? "🎉 NEW CUSTOMER Booking via BlkPages" 
    : "New Customer Booking via BlkPages";
    
  const newCustomerSection = booking.isNewCustomer ? `
    <div style="background:#FFD700;color:#111;padding:12px;border-radius:8px;margin:12px 0;">
      <h3 style="margin:0;color:#111;">🎉 NEW CUSTOMER ALERT!</h3>
      <p style="margin:4px 0 0;color:#111;">This is their first booking through BlkPages. Consider offering a special welcome discount or service!</p>
    </div>
  ` : "";
  
  const commissionInfo = booking.isNewCustomer 
    ? `<p style="color:#FFD700;font-weight:bold;">10% BlkPages commission applied (£${booking.commission.toFixed(2)})</p>`
    : "<p>Returning customer — no commission applied.</p>";
  
  const mailOptions = {
    from: "no-reply@blkpages.co.uk",
    to: businessEmail,
    subject: subject,
    html: `
      <h2>New Booking Received</h2>
      ${newCustomerSection}
      <p><strong>Customer:</strong> ${booking.customerEmail}</p>
      <p><strong>Services:</strong> ${booking.services.map(s => s.name).join(", ")}</p>
      <p><strong>Date:</strong> ${booking.date}</p>
      <p><strong>Time:</strong> ${booking.time}</p>
      <p><strong>Total:</strong> £${booking.total}</p>
      ${commissionInfo}
      <p><strong>Your Payout:</strong> £${booking.payoutToBusiness.toFixed(2)}</p>
      <p>Payment Intent: ${booking.stripePaymentIntent}</p>
    `,
  };
  await transporter.sendMail(mailOptions);
  console.log("Email sent to", businessEmail);
}

async function getBusinessStripeAccount(businessSlug) {
  // Replace with real DB lookup later
  return "acct_1Nz123456789"; // demo placeholder
}

async function getBusinessEmail(businessSlug) {
  return "owner@" + businessSlug + ".co.uk";
}

server.listen(4000, () => console.log("✅ BlkPages backend running on http://localhost:4000"));