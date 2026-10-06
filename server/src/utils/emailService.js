const nodemailer = require('nodemailer');

let cachedTransporter = null;

/**
 * Initializes and caches a nodemailer transporter
 */
async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  // Option 1: Custom SMTP configuration via environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('[EmailService] Using configured SMTP server:', process.env.SMTP_HOST);
    return cachedTransporter;
  }

  // Option 2: Gmail service
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
    console.log('[EmailService] Using Gmail transport for:', process.env.GMAIL_USER);
    return cachedTransporter;
  }

  // Option 3: Fallback to Ethereal Test Account (generates real preview URLs)
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[EmailService] Created Ethereal test account:', testAccount.user);
    return cachedTransporter;
  } catch (err) {
    console.warn('[EmailService] Fallback to simulated delivery due to:', err.message);
    return {
      sendMail: async (mailOptions) => {
        console.log(`[EmailService - Simulated] To: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
        return { messageId: 'simulated-' + Date.now(), simulated: true };
      },
    };
  }
}

/**
 * Format date for email display
 */
function formatEmailDate(dateStr) {
  if (!dateStr) return 'To be announced shortly';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Build HTML template for round shortlist / invitation
 */
function buildRoundShortlistHtml({
  student,
  drive,
  roundName,
  roundNumber,
  scheduledDate,
  venue,
  instructions,
  customMessage,
}) {
  const formattedDate = formatEmailDate(scheduledDate);
  const collegeName = process.env.COLLEGE_NAME || 'Sri Krishna College of Engineering & Technology';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Shortlisted for ${roundName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #38bdf8; }
    .header p { margin: 0; font-size: 13px; opacity: 0.85; color: #cbd5e1; }
    .content { padding: 30px 28px; }
    .badge-congrats { display: inline-block; background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; }
    .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 13px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #64748b; font-weight: 600; }
    .detail-value { color: #0f172a; font-weight: 700; text-align: right; }
    .instructions-box { background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; color: #92400e; }
    .instructions-box strong { display: block; margin-bottom: 4px; font-size: 13px; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
    .cta-btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${collegeName}</h1>
      <p>Department of Training & Placement • Recruitment Cell</p>
    </div>
    <div class="content">
      <div class="badge-congrats">🎉 Congratulations! Shortlisted for ${roundName}</div>
      <h2 class="greeting">Dear ${student.name} (${student.rollNumber}),</h2>
      <p class="message">
        We are thrilled to inform you that based on your performance, you have been shortlisted for 
        <strong>${roundName}</strong> with <strong>${drive.companyName}</strong> for the role of <strong>${drive.role}</strong>.
      </p>

      ${customMessage ? `<p style="font-size: 14px; line-height: 1.6; color: #1e293b; background: #eff6ff; padding: 12px 16px; border-radius: 8px; border: 1px solid #bfdbfe;">${customMessage.replace(/\n/g, '<br/>')}</p>` : ''}

      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">🏢 Company:</span>
          <span class="detail-value">${drive.companyName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">💼 Role / Designation:</span>
          <span class="detail-value">${drive.role}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">💰 CTC Package:</span>
          <span class="detail-value">₹${drive.package} LPA</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🎯 Assessment Stage:</span>
          <span class="detail-value" style="color: #2563eb;">${roundName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📅 Date & Time:</span>
          <span class="detail-value" style="color: #059669;">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📍 Venue / Mode:</span>
          <span class="detail-value">${venue || 'College Lab / Online Link'}</span>
        </div>
      </div>

      ${instructions ? `
      <div class="instructions-box">
        <strong>⚠️ Important Instructions for Candidates:</strong>
        <div>${instructions.replace(/\n/g, '<br/>')}</div>
      </div>
      ` : `
      <div class="instructions-box">
        <strong>⚠️ General Instructions:</strong>
        Please report 15 minutes before the scheduled time with your College ID card, formal attire, and 2 updated printed resumes.
      </div>
      `}

      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        Wishing you the very best for the upcoming round. Give it your best shot!
      </p>

      <p style="margin-top: 24px; font-size: 13px; color: #334155; line-height: 1.4;">
        Warm regards,<br/>
        <strong>Placement & Training Cell</strong><br/>
        ${collegeName}
      </p>
    </div>
    <div class="footer">
      This is an automated notification from the Campus Placement Management System.<br/>
      For queries, reach out to your departmental placement coordinator.
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Build HTML template for Final Offer / Selection
 */
function buildFinalSelectionHtml({
  student,
  drive,
  role,
  package: pkg,
  customMessage,
}) {
  const collegeName = process.env.COLLEGE_NAME || 'Sri Krishna College of Engineering & Technology';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Congratulations! Placement Offer</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.12); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 800; color: #fef08a; letter-spacing: 0.5px; }
    .header p { margin: 0; font-size: 13px; opacity: 0.9; color: #d1fae5; }
    .content { padding: 30px 28px; }
    .banner { background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
    .banner-title { font-size: 18px; font-weight: 800; color: #15803d; margin-bottom: 6px; }
    .banner-sub { font-size: 14px; color: #166534; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; }
    .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 13px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #64748b; font-weight: 600; }
    .detail-value { color: #0f172a; font-weight: 700; text-align: right; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🏆 YOU ARE PLACED!</h1>
      <p>${collegeName} • Placement & Training Cell</p>
    </div>
    <div class="content">
      <div class="banner">
        <div class="banner-title">🌟 Congratulations, ${student.name}! 🌟</div>
        <div class="banner-sub">You have successfully secured an offer from <strong>${drive.companyName}</strong></div>
      </div>

      <h2 class="greeting">Dear ${student.name} (${student.rollNumber}),</h2>
      <p class="message">
        On behalf of the Management, Principal, Faculty, and Placement Cell, we extend our heartiest congratulations to you!
        Your dedicated preparation and stellar performance throughout the recruitment rounds have paid off.
      </p>

      ${customMessage ? `<p style="font-size: 14px; line-height: 1.6; color: #1e293b; background: #eff6ff; padding: 12px 16px; border-radius: 8px; border: 1px solid #bfdbfe;">${customMessage.replace(/\n/g, '<br/>')}</p>` : ''}

      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">🏢 Selected Company:</span>
          <span class="detail-value" style="font-size: 15px; color: #0f172a;">${drive.companyName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">💼 Offered Role:</span>
          <span class="detail-value">${role || drive.role}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">💰 Offered Package:</span>
          <span class="detail-value" style="color: #059669; font-size: 16px;">₹${pkg || drive.package} LPA</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🎓 Department:</span>
          <span class="detail-value">${student.department} (${student.batch})</span>
        </div>
      </div>

      <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 6px; font-size: 13px; color: #065f46; margin-bottom: 24px;">
        <strong>🎉 Next Steps:</strong>
        Your placement record has been officially updated in the College CRM. The HR team from ${drive.companyName} will coordinate regarding the formal Letter of Intent (LOI) / Offer Letter.
      </div>

      <p style="margin-top: 24px; font-size: 13px; color: #334155; line-height: 1.4;">
        We are exceedingly proud of your milestone achievement!<br/><br/>
        Warm regards,<br/>
        <strong>Placement & Training Cell</strong><br/>
        ${collegeName}
      </p>
    </div>
    <div class="footer">
      Official Placement Offer Notification • ${collegeName}
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send round shortlist email to a single candidate
 */
async function sendRoundShortlistEmail({
  student,
  drive,
  roundName,
  roundNumber,
  scheduledDate,
  venue,
  instructions,
  customSubject,
  customMessage,
}) {
  try {
    const transporter = await getTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"Placement Cell" <placements@skcet.ac.in>';
    const subject =
      customSubject ||
      `Congratulations! Shortlisted for ${roundName} - ${drive.companyName} Recruitment`;

    const html = buildRoundShortlistHtml({
      student,
      drive,
      roundName,
      roundNumber,
      scheduledDate,
      venue,
      instructions,
      customMessage,
    });

    const info = await transporter.sendMail({
      from: fromAddress,
      to: student.email,
      subject,
      html,
    });

    let previewUrl = null;
    if (nodemailer.getTestMessageUrl) {
      previewUrl = nodemailer.getTestMessageUrl(info);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
      recipient: student.email,
    };
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${student.email}:`, error.message);
    return {
      success: false,
      error: error.message,
      recipient: student.email,
    };
  }
}

/**
 * Send final placement offer congratulations email
 */
async function sendFinalSelectionEmail({
  student,
  drive,
  role,
  package: pkg,
  customSubject,
  customMessage,
}) {
  try {
    const transporter = await getTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"Placement Cell" <placements@skcet.ac.in>';
    const subject =
      customSubject ||
      `🎉 Congratulations! You have been selected at ${drive.companyName} (₹${pkg || drive.package} LPA)`;

    const html = buildFinalSelectionHtml({
      student,
      drive,
      role,
      package: pkg,
      customMessage,
    });

    const info = await transporter.sendMail({
      from: fromAddress,
      to: student.email,
      subject,
      html,
    });

    let previewUrl = null;
    if (nodemailer.getTestMessageUrl) {
      previewUrl = nodemailer.getTestMessageUrl(info);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
      recipient: student.email,
    };
  } catch (error) {
    console.error(`[EmailService] Failed to send final selection email to ${student.email}:`, error.message);
    return {
      success: false,
      error: error.message,
      recipient: student.email,
    };
  }
}

module.exports = {
  getTransporter,
  sendRoundShortlistEmail,
  sendFinalSelectionEmail,
  buildRoundShortlistHtml,
  buildFinalSelectionHtml,
};
