const express = require('express');
const crypto = require('crypto');
const twilio = require('twilio');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());
app.use(cors());

// Rate limiting for API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Twilio configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// In-memory storage (replace with your database)
const bookings = new Map();
const businessSlots = new Map();

// Initialize some sample data
businessSlots.set('123', {
  businessId: '123',
  businessName: 'Royal Hair Studio',
  services: [
    { id: 'haircut', name: 'Haircut & Style', duration: 60, price: 45 },
    { id: 'color', name: 'Hair Coloring', duration: 120, price: 85 },
    { id: 'braids', name: 'Protective Style', duration: 180, price: 120 }
  ],
  availableSlots: [
    { date: '2025-01-15', time: '09:00', available: true },
    { date: '2025-01-15', time: '10:00', available: true },
    { date: '2025-01-15', time: '14:00', available: true },
    { date: '2025-01-16', time: '09:00', available: true },
    { date: '2025-01-16', time: '11:00', available: true }
  ]
});

/**
 * Generate a unique booking token
 */
function generateBookingToken(businessId, slotDateTime, customerPhone) {
  const data = `${businessId}-${slotDateTime}-${customerPhone}-${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Create a booking link
 */
function createBookingLink(businessId, slotDateTime, serviceId, customerPhone) {
  const token = generateBookingToken(businessId, slotDateTime, customerPhone);
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/book?token=${token}&biz=${businessId}&slot=${encodeURIComponent(slotDateTime)}&service=${serviceId}`;
}

/**
 * Generate WhatsApp message with booking link
 */
function generateWhatsAppMessage(businessName, bookingLink, serviceName, slotDateTime) {
  const formattedDate = new Date(slotDateTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `Hi! 👋 

${businessName} has reserved a booking for you:

📅 *Service:* ${serviceName}
🕐 *Date & Time:* ${formattedDate}

Click the link below to confirm your appointment:
${bookingLink}

This link is valid for 24 hours. Please confirm to secure your slot! ✨`;
}

// API Routes

/**
 * Get available slots for a business
 */
app.get('/api/business/:businessId/slots', (req, res) => {
  const { businessId } = req.params;
  const business = businessSlots.get(businessId);
  
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }
  
  res.json({
    businessName: business.businessName,
    services: business.services,
    availableSlots: business.availableSlots.filter(slot => slot.available)
  });
});

/**
 * Generate booking link and WhatsApp message
 */
app.post('/api/generate-booking-link', async (req, res) => {
  try {
    const { businessId, serviceId, slotDateTime, customerPhone, customerName, sendWhatsApp = false } = req.body;
    
    // Validate required fields
    if (!businessId || !serviceId || !slotDateTime || !customerPhone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get business and service details
    const business = businessSlots.get(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    const service = business.services.find(s => s.id === serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Check if slot is still available
    const slot = business.availableSlots.find(s => 
      s.date === slotDateTime.split('T')[0] && 
      s.time === slotDateTime.split('T')[1].substring(0, 5)
    );
    
    if (!slot || !slot.available) {
      return res.status(400).json({ error: 'Slot no longer available' });
    }
    
    // Generate booking link
    const bookingLink = createBookingLink(businessId, slotDateTime, serviceId, customerPhone);
    const token = generateBookingToken(businessId, slotDateTime, customerPhone);
    
    // Store booking data
    const bookingData = {
      token,
      businessId,
      serviceId,
      slotDateTime,
      customerPhone,
      customerName: customerName || 'Customer',
      serviceName: service.name,
      businessName: business.businessName,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    bookings.set(token, bookingData);
    
    // Generate WhatsApp message
    const whatsappMessage = generateWhatsAppMessage(
      business.businessName,
      bookingLink,
      service.name,
      slotDateTime
    );
    
    // Generate WhatsApp click-to-chat link
    const whatsappLink = `https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
    
    const response = {
      success: true,
      bookingLink,
      whatsappLink,
      message: whatsappMessage,
      bookingData: {
        token,
        businessName: business.businessName,
        serviceName: service.name,
        slotDateTime,
        customerPhone,
        customerName: customerName || 'Customer'
      }
    };
    
    // Send WhatsApp message automatically if requested
    if (sendWhatsApp) {
      try {
        await sendWhatsAppMessage(customerPhone, whatsappMessage);
        response.whatsappSent = true;
      } catch (error) {
        console.error('WhatsApp sending failed:', error);
        response.whatsappSent = false;
        response.whatsappError = error.message;
      }
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Error generating booking link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send WhatsApp message using Twilio
 */
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const whatsappNumber = `whatsapp:+${cleanPhone}`;
    const fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
    
    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: whatsappNumber
    });
    
    console.log('WhatsApp message sent:', result.sid);
    return result;
  } catch (error) {
    console.error('Twilio WhatsApp error:', error);
    throw new Error(`Failed to send WhatsApp message: ${error.message}`);
  }
}

/**
 * Get booking details by token
 */
app.get('/api/booking/:token', (req, res) => {
  const { token } = req.params;
  const booking = bookings.get(token);
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  // Check if booking has expired
  if (new Date() > new Date(booking.expiresAt)) {
    return res.status(400).json({ error: 'Booking link has expired' });
  }
  
  res.json(booking);
});

/**
 * Confirm booking
 */
app.post('/api/booking/:token/confirm', async (req, res) => {
  try {
    const { token } = req.params;
    const { customerName, customerEmail, specialRequests } = req.body;
    
    const booking = bookings.get(token);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check if booking has expired
    if (new Date() > new Date(booking.expiresAt)) {
      return res.status(400).json({ error: 'Booking link has expired' });
    }
    
    // Check if already confirmed
    if (booking.status === 'confirmed') {
      return res.status(400).json({ error: 'Booking already confirmed' });
    }
    
    // Update booking status
    booking.status = 'confirmed';
    booking.confirmedAt = new Date().toISOString();
    booking.customerName = customerName || booking.customerName;
    booking.customerEmail = customerEmail;
    booking.specialRequests = specialRequests;
    
    // Mark slot as unavailable
    const business = businessSlots.get(booking.businessId);
    if (business) {
      const slot = business.availableSlots.find(s => 
        s.date === booking.slotDateTime.split('T')[0] && 
        s.time === booking.slotDateTime.split('T')[1].substring(0, 5)
      );
      if (slot) {
        slot.available = false;
      }
    }
    
    // Send confirmation WhatsApp message
    try {
      const confirmationMessage = `✅ *Booking Confirmed!*

Thank you for confirming your appointment with ${booking.businessName}.

📅 *Service:* ${booking.serviceName}
🕐 *Date & Time:* ${new Date(booking.slotDateTime).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}

We look forward to seeing you! If you need to reschedule, please contact us directly.

${booking.businessName} 💫`;
      
      await sendWhatsAppMessage(booking.customerPhone, confirmationMessage);
    } catch (error) {
      console.error('Failed to send confirmation WhatsApp:', error);
    }
    
    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      booking
    });
    
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Cancel booking
 */
app.post('/api/booking/:token/cancel', (req, res) => {
  const { token } = req.params;
  const booking = bookings.get(token);
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();
  
  // Mark slot as available again
  const business = businessSlots.get(booking.businessId);
  if (business) {
    const slot = business.availableSlots.find(s => 
      s.date === booking.slotDateTime.split('T')[0] && 
      s.time === booking.slotDateTime.split('T')[1].substring(0, 5)
    );
    if (slot) {
      slot.available = true;
    }
  }
  
  res.json({
    success: true,
    message: 'Booking cancelled successfully'
  });
});

/**
 * Get business bookings
 */
app.get('/api/business/:businessId/bookings', (req, res) => {
  const { businessId } = req.params;
  const businessBookings = Array.from(bookings.values())
    .filter(booking => booking.businessId === businessId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(businessBookings);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Booking API server running on port ${PORT}`);
  console.log('Environment variables required:');
  console.log('- TWILIO_ACCOUNT_SID');
  console.log('- TWILIO_AUTH_TOKEN');
  console.log('- TWILIO_WHATSAPP_NUMBER');
  console.log('- FRONTEND_URL');
});

module.exports = app;

