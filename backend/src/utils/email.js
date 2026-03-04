const nodemailer = require('nodemailer');

/**
 * Email utility using STRATO SMTP.
 * 
 * Uses the STRATO mailbox to send all transactional emails.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Log in to STRATO → Email management
 * 2. Create a mailbox (e.g. noreply@myhelper.me) or use webmaster@myhelper.me
 * 3. Set the mailbox password
 * 4. Add these to your backend .env file:
 *    SMTP_HOST=smtp.strato.de
 *    SMTP_PORT=465
 *    SMTP_USER=noreply@myhelper.me
 *    SMTP_PASS=your-mailbox-password
 *    EMAIL_FROM=noreply@myhelper.me
 */

// Create reusable transporter using STRATO SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.strato.de',
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: true, // true for port 465 (SSL)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });
};

/**
 * Generate a 6-digit verification code
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send email verification code
 * All emails in German as requested.
 * 
 * @param {string} to - Recipient email
 * @param {string} firstName - User's first name
 * @param {string} code - 6-digit verification code
 */
const sendVerificationEmail = async (to, firstName, code) => {
  const transporter = createTransporter();

  // Development mode: override recipient to avoid Resend testing restrictions
  const isDevelopment = process.env.NODE_ENV === 'development';
  const recipient = isDevelopment ? 'artzymeri2001@gmail.com' : to;
  
  if (isDevelopment && to !== recipient) {
    console.log(`🔧 [DEV MODE] Redirecting email from ${to} to ${recipient}`);
  }

  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">MyHelper</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">Pflegeplattform</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 32px;">
                  <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
                    Hallo ${firstName},
                  </h2>
                  <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                    Vielen Dank für Ihre Registrierung bei MyHelper. Bitte verwenden Sie den folgenden Code, um Ihre E-Mail-Adresse zu bestätigen:
                  </p>
                  <!-- Code Box -->
                  <div style="background-color: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                    <p style="color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; margin: 0 0 8px 0;">
                      Ihr Bestätigungscode
                    </p>
                    <p style="color: #111827; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0;">
                      ${code}
                    </p>
                  </div>
                  <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0;">
                    Dieser Code ist <strong>10 Minuten</strong> gültig.
                  </p>
                  <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0;">
                    Falls Sie diese Registrierung nicht angefordert haben, können Sie diese E-Mail ignorieren.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} MyHelper. Alle Rechte vorbehalten.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `MyHelper <${process.env.EMAIL_FROM}>`,
    to: recipient,
    subject: 'MyHelper – Ihr Bestätigungscode',
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Verification email sent to ${recipient} (messageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send verification email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send resend verification code email
 * 
 * @param {string} to - Recipient email
 * @param {string} firstName - User's first name
 * @param {string} code - 6-digit verification code
 */
const sendResendVerificationEmail = async (to, firstName, code) => {
  // Uses the same template as the initial verification
  return sendVerificationEmail(to, firstName, code);
};

/**
 * Send welcome email after successful email verification.
 * All emails in German.
 * 
 * @param {string} to - Recipient email
 * @param {string} firstName - User's first name
 */
const sendWelcomeEmail = async (to, firstName) => {
  const transporter = createTransporter();

  const isDevelopment = process.env.NODE_ENV === 'development';
  const recipient = isDevelopment ? 'artzymeri2001@gmail.com' : to;

  if (isDevelopment && to !== recipient) {
    console.log(`🔧 [DEV MODE] Redirecting email from ${to} to ${recipient}`);
  }

  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">MyHelper</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">Pflegeplattform</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 32px;">
                  <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
                    Willkommen, ${firstName}! 🎉
                  </h2>
                  <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                    Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Ihr Konto ist jetzt aktiv und Sie können alle Funktionen von MyHelper nutzen.
                  </p>
                  <!-- Welcome Box -->
                  <div style="background-color: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; padding: 24px; margin: 0 0 24px 0;">
                    <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">
                      Was Sie jetzt tun können:
                    </p>
                    <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li>Vervollständigen Sie Ihr Profil</li>
                      <li>Durchsuchen Sie verfügbare Profile</li>
                      <li>Starten Sie Unterhaltungen</li>
                      <li>Kontaktieren Sie unseren Support bei Fragen</li>
                    </ul>
                  </div>
                  <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0;">
                    Bei Fragen oder Problemen steht Ihnen unser Support-Team jederzeit zur Verfügung.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} MyHelper. Alle Rechte vorbehalten.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `MyHelper <${process.env.EMAIL_FROM}>`,
    to: recipient,
    subject: 'Willkommen bei MyHelper! 🎉',
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Welcome email sent to ${recipient} (messageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send email when a support ticket has been closed.
 * Sent to the care_giver or care_recipient who opened the ticket.
 * All emails in German.
 * 
 * @param {string} to - Recipient email
 * @param {string} firstName - User's first name
 * @param {number} ticketId - The ticket ID
 */
const sendTicketClosedEmail = async (to, firstName, ticketId) => {
  const transporter = createTransporter();

  const isDevelopment = process.env.NODE_ENV === 'development';
  const recipient = isDevelopment ? 'artzymeri2001@gmail.com' : to;

  if (isDevelopment && to !== recipient) {
    console.log(`🔧 [DEV MODE] Redirecting email from ${to} to ${recipient}`);
  }

  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">MyHelper</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">Pflegeplattform</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 32px;">
                  <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
                    Hallo ${firstName},
                  </h2>
                  <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                    Ihr Support-Ticket <strong>#${ticketId}</strong> wurde geschlossen.
                  </p>
                  <!-- Info Box -->
                  <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                    <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
                      Ticket #${ticketId}
                    </p>
                    <p style="color: #15803d; font-size: 16px; font-weight: 700; margin: 0;">
                      ✅ Geschlossen
                    </p>
                  </div>
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
                    Wir hoffen, dass Ihr Anliegen zu Ihrer Zufriedenheit gelöst wurde. Falls Sie weitere Hilfe benötigen, können Sie jederzeit ein neues Support-Ticket erstellen.
                  </p>
                  <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0;">
                    Vielen Dank, dass Sie MyHelper nutzen.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} MyHelper. Alle Rechte vorbehalten.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `MyHelper <${process.env.EMAIL_FROM}>`,
    to: recipient,
    subject: `MyHelper – Ihr Support-Ticket #${ticketId} wurde geschlossen`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Ticket closed email sent to ${recipient} (messageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send ticket closed email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send email when a support ticket is assigned to a support staff member by an admin.
 * Sent to the support employee.
 * All emails in German.
 * 
 * @param {string} to - Support staff email
 * @param {string} staffFirstName - Support staff first name
 * @param {number} ticketId - The ticket ID
 * @param {string} userName - Name of the user who opened the ticket
 */
const sendTicketAssignedEmail = async (to, staffFirstName, ticketId, userName) => {
  const transporter = createTransporter();

  const isDevelopment = process.env.NODE_ENV === 'development';
  const recipient = isDevelopment ? 'artzymeri2001@gmail.com' : to;

  if (isDevelopment && to !== recipient) {
    console.log(`🔧 [DEV MODE] Redirecting email from ${to} to ${recipient}`);
  }

  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">MyHelper</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">Pflegeplattform</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 32px;">
                  <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
                    Hallo ${staffFirstName},
                  </h2>
                  <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                    Ein Administrator hat Ihnen ein neues Support-Ticket zugewiesen.
                  </p>
                  <!-- Ticket Info Box -->
                  <div style="background-color: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; padding: 24px; margin: 0 0 24px 0;">
                    <p style="color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; margin: 0 0 12px 0;">
                      Ticket-Details
                    </p>
                    <table cellpadding="0" cellspacing="0" style="width: 100%;">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 4px 0;">Ticket-Nr.:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 4px 0; text-align: right;">#${ticketId}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 4px 0;">Benutzer:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 4px 0; text-align: right;">${userName}</td>
                      </tr>
                    </table>
                  </div>
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
                    Bitte melden Sie sich bei der Plattform an, um das Ticket zu bearbeiten und dem Benutzer zu antworten.
                  </p>
                  <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0;">
                    Bei Fragen wenden Sie sich an Ihren Administrator.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} MyHelper. Alle Rechte vorbehalten.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `MyHelper <${process.env.EMAIL_FROM}>`,
    to: recipient,
    subject: `MyHelper – Neues Support-Ticket #${ticketId} zugewiesen`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Ticket assigned email sent to ${recipient} (messageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send ticket assigned email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset code email.
 * All emails in German.
 * 
 * @param {string} to - Recipient email
 * @param {string} firstName - User's first name
 * @param {string} code - 6-digit reset code
 */
const sendPasswordResetEmail = async (to, firstName, code) => {
  const transporter = createTransporter();

  const isDevelopment = process.env.NODE_ENV === 'development';
  const recipient = isDevelopment ? 'artzymeri2001@gmail.com' : to;

  if (isDevelopment && to !== recipient) {
    console.log(`🔧 [DEV MODE] Redirecting email from ${to} to ${recipient}`);
  }

  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">MyHelper</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">Pflegeplattform</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 32px;">
                  <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
                    Hallo ${firstName},
                  </h2>
                  <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                    Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten. Verwenden Sie den folgenden Code, um Ihr Passwort zurückzusetzen:
                  </p>
                  <!-- Code Box -->
                  <div style="background-color: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                    <p style="color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; margin: 0 0 8px 0;">
                      Ihr Zurücksetzungscode
                    </p>
                    <p style="color: #111827; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0;">
                      ${code}
                    </p>
                  </div>
                  <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0;">
                    Dieser Code ist <strong>10 Minuten</strong> gültig.
                  </p>
                  <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0;">
                    Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. Ihr Passwort bleibt unverändert.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} MyHelper. Alle Rechte vorbehalten.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `MyHelper <${process.env.EMAIL_FROM}>`,
    to: recipient,
    subject: 'MyHelper – Passwort zurücksetzen',
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to ${recipient} (messageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send trial expiring email.
 * Sent to caregivers whose trial is about to expire.
 * All emails in German.
 * 
 * @param {string} to - Recipient email
 * @param {string} firstName - User's first name
 * @param {number} daysLeft - Days remaining (1 or 2)
 */
const sendTrialExpiringEmail = async (to, firstName, daysLeft) => {
  const transporter = createTransporter();

  const isDevelopment = process.env.NODE_ENV === 'development';
  const recipient = isDevelopment ? 'artzymeri2001@gmail.com' : to;

  if (isDevelopment && to !== recipient) {
    console.log(`🔧 [DEV MODE] Redirecting email from ${to} to ${recipient}`);
  }

  const dayText = daysLeft === 1 ? 'morgen' : `in ${daysLeft} Tagen`;
  const urgencyColor = daysLeft === 1 ? '#ef4444' : '#f59e0b';
  const urgencyBg = daysLeft === 1 ? '#fef2f2' : '#fffbeb';

  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">MyHelper</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">Pflegeplattform</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 32px;">
                  <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
                    Hallo ${firstName},
                  </h2>
                  <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                    Ihre kostenlose Testphase bei MyHelper läuft <strong>${dayText}</strong> ab.
                  </p>
                  <!-- Alert Box -->
                  <div style="background-color: ${urgencyBg}; border: 2px solid ${urgencyColor}; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                    <p style="color: ${urgencyColor}; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">
                      ⏰ Noch ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tage'} übrig
                    </p>
                    <p style="color: #6b7280; font-size: 13px; margin: 0;">
                      Wählen Sie einen Plan, um weiterhin alle Funktionen von MyHelper nutzen zu können.
                    </p>
                  </div>
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
                    Um Ihren Zugang nicht zu verlieren, melden Sie sich bitte an und wählen Sie einen unserer Abonnement-Pläne:
                  </p>
                  <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0 0 24px 0; padding-left: 20px;">
                    <li><strong>Monatlich:</strong> 8,99 €/Monat</li>
                    <li><strong>Jährlich:</strong> 86,30 €/Jahr (20% Rabatt)</li>
                  </ul>
                  <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0;">
                    Bei Fragen steht Ihnen unser Support-Team jederzeit zur Verfügung.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} MyHelper. Alle Rechte vorbehalten.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `MyHelper <${process.env.EMAIL_FROM}>`,
    to: recipient,
    subject: `MyHelper – Ihre Testphase endet ${dayText}!`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Trial expiring email (${daysLeft}d) sent to ${recipient} (messageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send trial expiring email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendResendVerificationEmail,
  sendWelcomeEmail,
  sendTicketClosedEmail,
  sendTicketAssignedEmail,
  sendPasswordResetEmail,
  sendTrialExpiringEmail,
};
