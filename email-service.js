/**
 * BlkPages Email Service with Handlebars Templates
 * Handles transactional vs marketing email sending with GDPR compliance
 */

const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// ===============================================
// 📧 Email Template Service
// ===============================================

class EmailService {
  constructor() {
    this.masterTemplate = null;
    this.partials = new Map();
    this.baseUrl = process.env.PUBLIC_BASE_URL || 'https://blkpages.co.uk';
    this.loadTemplates();
  }

  loadTemplates() {
    try {
      // Load master template
      const masterPath = path.join(__dirname, 'emails', 'master-loyalty-template.hbs');
      const masterSource = fs.readFileSync(masterPath, 'utf8');
      this.masterTemplate = handlebars.compile(masterSource);

      // Load partials
      const partialsDir = path.join(__dirname, 'emails', 'partials');
      const partialFiles = fs.readdirSync(partialsDir);
      
      partialFiles.forEach(file => {
        if (file.endsWith('.hbs')) {
          const partialName = file.replace('.hbs', '');
          const partialPath = path.join(partialsDir, file);
          const partialSource = fs.readFileSync(partialPath, 'utf8');
          this.partials.set(partialName, handlebars.compile(partialSource));
        }
      });

      console.log(`✅ Loaded ${this.partials.size} email partials`);
    } catch (error) {
      console.error('❌ Error loading email templates:', error);
    }
  }

  /**
   * Render email with Handlebars templates
   */
  renderEmail(user, subject, bodyTemplateName, data = {}) {
    if (!this.masterTemplate) {
      throw new Error('Master template not loaded');
    }

    const bodyTemplate = this.partials.get(bodyTemplateName);
    if (!bodyTemplate) {
      throw new Error(`Body template '${bodyTemplateName}' not found`);
    }

    // Merge user data with template data
    const templateData = {
      ...user,
      ...data,
      subject,
      logo_url: `${this.baseUrl}/assets/logo-email.png`,
      dashboard_url: `${this.baseUrl}/dashboard/loyalty`,
      settings_url: `${this.baseUrl}/settings`,
      unsubscribe_url: user.unsubscribe_token 
        ? `${this.baseUrl}/u/unsub?token=${encodeURIComponent(user.unsubscribe_token)}`
        : `${this.baseUrl}/settings/unsubscribe`
    };

    // Render body partial
    const body_html = bodyTemplate(templateData);

    // Render master template
    const html = this.masterTemplate({
      ...templateData,
      body_html
    });

    return html;
  }

  /**
   * Send email using configured transport
   */
  async sendEmail(to, subject, html, options = {}) {
    // This is a mock implementation
    // Replace with your actual email service (SendGrid, Nodemailer, etc.)
    console.log(`📧 Email sent to ${to}: ${subject}`);
    console.log(`📄 HTML length: ${html.length} characters`);
    
    // In production, use your email service:
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      service: 'SendGrid',
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASS
      }
    });

    await transporter.sendMail({
      from: 'BlkPages <noreply@blkpages.co.uk>',
      to,
      subject,
      html,
      ...options
    });
    */
  }
}

// ===============================================
// 🎯 Loyalty Email Functions
// ===============================================

/**
 * Send loyalty email with proper template and GDPR compliance
 */
async function sendLoyaltyEmail(user, subject, bodyTemplateName, data = {}, emailService) {
  if (!user || !user.email) {
    console.warn('No user or email provided');
    return;
  }

  // Check marketing opt-in for marketing emails
  const isMarketing = ['referral-promo', 'expiry-warning'].includes(bodyTemplateName);
  if (isMarketing && !user.marketing_opt_in) {
    console.log(`❌ ${user.email} opted out of marketing – email skipped`);
    return;
  }

  try {
    // Render email with Handlebars
    const html = emailService.renderEmail(user, subject, bodyTemplateName, data);
    
    // Send email
    await emailService.sendEmail(user.email, subject, html, {
      headers: isMarketing && user.unsubscribe_token ? {
        'List-Unsubscribe': `<${emailService.baseUrl}/u/unsub?token=${encodeURIComponent(user.unsubscribe_token)}>`
      } : undefined
    });

    console.log(`✅ Sent ${isMarketing ? 'marketing' : 'transactional'} email to ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${user.email}:`, error);
  }
}

/**
 * Send booking completion email
 */
async function sendBookingCompleteEmail(user, businessName, pointsEarned, emailService) {
  await sendLoyaltyEmail(
    user,
    'Booking Complete - BlkPoints Earned! 🎉',
    'booking-pending',
    { business_name: businessName, points_earned: pointsEarned },
    emailService
  );
}

/**
 * Send points confirmed email
 */
async function sendPointsConfirmedEmail(user, pointsEarned, emailService) {
  await sendLoyaltyEmail(
    user,
    'BlkPoints Confirmed! ✅',
    'points-confirmed',
    { points_earned: pointsEarned },
    emailService
  );
}

/**
 * Send referral confirmed email
 */
async function sendReferralConfirmedEmail(user, emailService) {
  await sendLoyaltyEmail(
    user,
    'Referral Bonus Earned! 🎁',
    'referral-confirmed',
    {},
    emailService
  );
}

/**
 * Send referral promo email (marketing)
 */
async function sendReferralPromoEmail(user, referralCode, emailService) {
  await sendLoyaltyEmail(
    user,
    'Earn More BlkPoints! 💛',
    'referral-promo',
    { referral_code: referralCode },
    emailService
  );
}

/**
 * Send expiry warning email (marketing)
 */
async function sendExpiryWarningEmail(user, pointsExpiring, expiryDate, emailService) {
  await sendLoyaltyEmail(
    user,
    'BlkPoints Expiring Soon! ⏰',
    'expiry-warning',
    { points_expiring: pointsExpiring, expiry_date: expiryDate },
    emailService
  );
}

module.exports = {
  EmailService,
  sendLoyaltyEmail,
  sendBookingCompleteEmail,
  sendPointsConfirmedEmail,
  sendReferralConfirmedEmail,
  sendReferralPromoEmail,
  sendExpiryWarningEmail
};
