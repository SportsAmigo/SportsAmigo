const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const RESEND_TEST_EMAIL = process.env.RESEND_TEST_EMAIL;
const RESEND_ALLOW_SANDBOX_REDIRECT = process.env.RESEND_ALLOW_SANDBOX_REDIRECT === 'true';

const isSandboxSender = (fromEmail) => String(fromEmail).toLowerCase().includes('onboarding@resend.dev');

/**
 * Shared Resend email sender.
 * Throws on API errors so calling routes can return proper 500 responses.
 */
const sendEmail = async ({ toEmail, subject, html, text }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  if (!DEFAULT_FROM_EMAIL) {
    throw new Error('RESEND_FROM_EMAIL is not configured');
  }

  let recipient = toEmail;

  if (isSandboxSender(DEFAULT_FROM_EMAIL) && toEmail !== RESEND_TEST_EMAIL) {
    if (RESEND_ALLOW_SANDBOX_REDIRECT && RESEND_TEST_EMAIL) {
      recipient = RESEND_TEST_EMAIL;
      console.warn(`Resend sandbox redirect active. Intended recipient ${toEmail} redirected to ${RESEND_TEST_EMAIL}.`);
    } else {
      throw new Error(
        'Resend sandbox restriction: onboarding@resend.dev can only send to RESEND_TEST_EMAIL. ' +
        'Set RESEND_TEST_EMAIL to your account email, enable RESEND_ALLOW_SANDBOX_REDIRECT=true for testing, ' +
        'or verify a domain at resend.com/domains and use RESEND_FROM_EMAIL from that domain.'
      );
    }
  }

  const { data, error } = await resend.emails.send({
    from: DEFAULT_FROM_EMAIL,
    to: [recipient],
    subject,
    html,
    text
  });

  if (error) {
    throw new Error(error.message || 'Resend API error');
  }

  return data;
};

/**
 * Common HTML template structure for all emails
 * @param {string} userName - User's name
 * @param {string} mainContentHtml 
 * @param {string} headerColor1 
 * @param {string} headerColor2 
 * @param {string} headerIcon 
 * @param {string} headerText 
 * @param {string} headerAccentColor 
 * @returns {string} 
 */
const buildEmailHtml = (userName, mainContentHtml, headerColor1, headerColor2, headerIcon, headerText, headerAccentColor) => {
  
  const primaryColor = headerColor1;
  const accentColor = headerAccentColor || headerColor2;
  const secondaryBg = '#f4f7f6';
  const textColor = '#333333';
  const lightTextColor = '#666666';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${headerText}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: ${secondaryBg};">

      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table class="container" width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              
              <!-- Header -->
              <tr>
                <td class="header" style="background: linear-gradient(135deg, ${headerColor1} 0%, ${headerColor2} 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${headerIcon} ${headerText}</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td class="content" style="padding: 30px; color: ${textColor};">
                  <h2 style="margin-top: 0; margin-bottom: 20px; font-size: 22px; color: ${primaryColor};">Hello ${userName},</h2>
                  
                  ${mainContentHtml}

                  <p style="margin-top: 30px;">Best regards,<br><strong style="color: ${primaryColor};">Team SportsAmigo</strong></p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td class="footer" style="text-align: center; padding: 20px 30px; color: ${lightTextColor}; font-size: 12px; border-top: 1px solid #eeeeee;">
                  <p style="margin: 0 0 5px 0;">© 2025 SportsAmigo. All rights reserved.</p>
                  <p style="margin: 0; font-size: 11px;">This is an automated message, please do not reply.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
};


/**
 * Send OTP email for signup verification
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} userName - User's name
 * @returns {Promise}
 */
const sendOTPEmail = async (toEmail, otp, userName = 'User') => {
  try {
    const mainContent = `
      <p style="margin: 0 0 15px 0;">Thank you for signing up with SportsAmigo! To complete your registration, please verify your email address.</p>
      
      <div class="otp-box" style="background: white; border: 2px dashed #667eea; padding: 25px; text-align: center; margin: 25px 0; border-radius: 10px;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">Your verification code is:</p>
        <div class="otp-code" style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin-bottom: 5px;">${otp}</div>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">Valid for 10 minutes</p>
      </div>

      <p style="margin-bottom: 20px;">Enter this code on the signup page to verify your email and activate your account.</p>

      <div class="warning" style="background: #e6f7ff; border-left: 4px solid #4da6ff; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong style="color: #4da6ff;">⚠️ Security Notice:</strong> Never share this OTP with anyone. SportsAmigo will never ask for your OTP via phone or email.
      </div>
    `;

    const htmlBody = buildEmailHtml(
      userName,
      mainContent,
      '#667eea', // Header Color 1 (Blue)
      '#764ba2', // Header Color 2 (Purple)
      '🏆',
      'Verify Your Email',
      '#667eea' // Accent Color
    );


    const data = await sendEmail({
      toEmail,
      subject: 'Verify Your Email - SportsAmigo',
      html: htmlBody,
      text: `Hello ${userName},\n\nYour SportsAmigo verification code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nTeam SportsAmigo`
    });

    console.log('OTP email sent successfully. ID:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

/**
 * Send password reset OTP email
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} userName - User's name
 * @returns {Promise}
 */
const sendPasswordResetOTPEmail = async (toEmail, otp, userName = 'User') => {
  try {
    const mainContent = `
      <p style="margin: 0 0 15px 0;">We received a request to reset your SportsAmigo account password.</p>
      
      <div class="otp-box" style="background: white; border: 2px dashed #f5576c; padding: 25px; text-align: center; margin: 25px 0; border-radius: 10px;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">Your password reset code is:</p>
        <div class="otp-code" style="font-size: 36px; font-weight: bold; color: #f5576c; letter-spacing: 5px; margin-bottom: 5px;">${otp}</div>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">Valid for 10 minutes</p>
      </div>

      <p style="margin-bottom: 20px;">Enter this code on the password reset page to proceed with changing your password.</p>

      <div class="warning" style="background: #fff0f0; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong style="color: #dc3545;">⚠️ Important:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure. Your password will not be changed unless you complete the reset process.
      </div>

      <p style="margin-top: 20px;">For security reasons, this code will expire in 10 minutes.</p>
    `;

    const htmlBody = buildEmailHtml(
      userName,
      mainContent,
      '#f093fb', // Header Color 1 (Pink)
      '#f5576c', // Header Color 2 (Red/Orange)
      '🔐',
      'Password Reset Request',
      '#f5576c' // Accent Color
    );

    const data = await sendEmail({
      toEmail,
      subject: 'Password Reset Request - SportsAmigo',
      html: htmlBody,
      text: `Hello ${userName},\n\nYour SportsAmigo password reset code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request a password reset, please ignore this email.\n\nBest regards,\nTeam SportsAmigo`
    });

    console.log('Password reset OTP email sent successfully. ID:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Send welcome email after successful verification
 * @param {string} toEmail - Recipient email address
 * @param {string} userName - User's name
 * @param {string} userRole - User's role (player, organizer, manager)
 * @returns {Promise}
 */
const sendWelcomeEmail = async (toEmail, userName, userRole) => {
  try {
    const mainContent = `
      <p style="margin: 0 0 15px 0;">Your email has been successfully verified! Welcome to the SportsAmigo community.</p>
      <p style="margin-bottom: 20px;">As a <strong style="color: #667eea; text-transform: capitalize;">${userRole}</strong>, you now have access to all features of our platform.</p>
      <p>Get started by exploring your dashboard and connecting with other sports enthusiasts!</p>
      
      <table border="0" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
        <tr>
          <td align="center" style="border-radius: 6px;" bgcolor="#667eea">
            <a href="[LINK_TO_DASHBOARD]" target="_blank" style="font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 6px; padding: 12px 20px; border: 1px solid #667eea; display: inline-block; font-weight: bold;">
              Go to My Dashboard
            </a>
          </td>
        </tr>
      </table>
      <p style="font-size: 12px; color: #999; margin-top: 10px;">(Please replace [LINK_TO_DASHBOARD] with the actual URL)</p>
    `;

    const htmlBody = buildEmailHtml(
      userName,
      mainContent,
      '#667eea', // Header Color 1 (Blue)
      '#764ba2', // Header Color 2 (Purple)
      '🎉',
      'Welcome to SportsAmigo!',
      '#667eea' // Accent Color
    );

    const data = await sendEmail({
      toEmail,
      subject: 'Welcome to SportsAmigo! 🎉',
      html: htmlBody,
      text: `Hello ${userName},\n\nYour email is verified! Welcome to SportsAmigo. Your role: ${userRole}. Get started now!\n\nBest regards,\nTeam SportsAmigo`
    });

    console.log('Welcome email sent successfully. ID:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email, just log it
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetOTPEmail,
  sendWelcomeEmail
};