const nodemailer = require('nodemailer');

let cachedTransporter = null;

/**
 * Initializes and caches a nodemailer transporter
 */
/**
 * Initializes and caches a nodemailer transporter
 */
async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  // Option 1: Custom SMTP configuration via environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const port = Number(process.env.SMTP_PORT) || 587;
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 8000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
    console.log('[EmailService] Using configured SMTP server:', process.env.SMTP_HOST);
    return cachedTransporter;
  }

  // Option 2: Gmail service (using Gmail address + 16-char App Password)
  const rawGmailPass = process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const gmailPass = rawGmailPass ? rawGmailPass.replace(/\s+/g, '') : '';
  if (process.env.GMAIL_USER && gmailPass) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL port 465 avoids ISP blocks on port 587
      auth: {
        user: process.env.GMAIL_USER.trim(),
        pass: gmailPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 8000,
      socketTimeout: 15000,
    });
    console.log('[EmailService] Using Gmail SSL transport for:', process.env.GMAIL_USER);
    return cachedTransporter;
  }

  // Option 3: Immediate safe simulated transporter when unconfigured
  // IMPORTANT: Do NOT attempt connecting to remote ethereal servers on port 587,
  // which causes TCP timeouts, connection refused, and 502 Bad Gateway.
  cachedTransporter = {
    sendMail: async (mailOptions) => {
      console.log(`[EmailService - Unconfigured] Real SMTP not set. Target: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
      return {
        messageId: 'simulated-' + Date.now(),
        simulated: true,
        notConfigured: true,
      };
    },
  };
  return cachedTransporter;
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
  const collegeName = process.env.COLLEGE_NAME || 'NSCET - Nadar Saraswathi College of Engineering & Technology';

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
  const collegeName = process.env.COLLEGE_NAME || 'NSCET - Nadar Saraswathi College of Engineering & Technology';

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
 * Send email via EmailJS REST API (HTTPS port 443 - zero SMTP port blocking)
 */
async function sendViaEmailJS({
  toEmail,
  toName,
  subject,
  message,
  templateParams = {},
}) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return {
      success: false,
      notConfigured: true,
      error: 'EmailJS credentials not configured in server/.env (EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY)',
    };
  }

  const payload = {
    service_id: serviceId.trim(),
    template_id: templateId.trim(),
    user_id: publicKey.trim(),
    template_params: {
      to_email: toEmail,
      email: toEmail,
      to_name: toName || toEmail,
      name: toName || toEmail,
      subject: subject,
      title: subject,
      reply_to: process.env.GMAIL_USER || 'dev2111moi@gmail.com',
      message: message,
      ...templateParams,
    },
  };

  if (privateKey && privateKey.trim()) {
    payload.accessToken = privateKey.trim();
  }

  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resText = await res.text();
    if (res.ok) {
      console.log(`[EmailJS] Email dispatched successfully to ${toEmail}`);
      return {
        success: true,
        service: 'EmailJS',
        recipient: toEmail,
      };
    } else {
      console.error(`[EmailJS] HTTP error ${res.status}:`, resText);
      const friendlyError = resText.includes('non-browser')
        ? 'EmailJS API access from non-browser environments is disabled. Please enable "Allow EmailJS API for non-browser applications" at https://dashboard.emailjs.com/admin/account/security'
        : (resText || `HTTP ${res.status}`);
      return {
        success: false,
        error: friendlyError,
        recipient: toEmail,
      };
    }
  } catch (err) {
    console.error(`[EmailJS] Fetch failure:`, err.message);
    return {
      success: false,
      error: err.message,
      recipient: toEmail,
    };
  }
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
  const subject =
    customSubject ||
    `Congratulations! Shortlisted for ${roundName} - ${drive.companyName} Recruitment`;

  let emailJsError = null;
  // 1. If EmailJS is configured, use it first (HTTPS port 443 bypasses local network SMTP blocks)
  if (process.env.EMAILJS_SERVICE_ID && (process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID)) {
    const emailJsRes = await sendViaEmailJS({
      toEmail: student.email,
      toName: student.name,
      subject,
      message: `You have been shortlisted for ${roundName} at ${drive.companyName}. Date: ${formatEmailDate(scheduledDate)}, Venue: ${venue || 'Campus'}, Instructions: ${instructions || 'None'}.`,
      templateParams: {
        company_name: drive.companyName,
        round_name: roundName,
        round_number: roundNumber,
        scheduled_date: formatEmailDate(scheduledDate),
        venue: venue || 'Campus / Online',
        instructions: instructions || 'Please report on time with formal attire and college ID.',
        custom_message: customMessage || '',
        student_roll: student.rollNumber || '',
        student_dept: student.department || '',
      },
    });

    if (emailJsRes.success) {
      return emailJsRes;
    }
    emailJsError = emailJsRes.error;
    console.warn('[EmailService] EmailJS send attempt failed, trying fallback:', emailJsRes.error);
  }

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

    if (info.notConfigured || info.simulated) {
      return {
        success: false,
        notConfigured: true,
        recipient: student.email,
        error: emailJsError || 'Email credentials not fully configured',
        message: emailJsError || 'Email credentials not configured in server/.env',
      };
    }

    return {
      success: true,
      messageId: info.messageId,
      recipient: student.email,
    };
  } catch (error) {
    const isNetworkBlocked = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || (error.message && error.message.includes('ECONNREFUSED'));
    console.warn(`[EmailService] SMTP dispatch note for ${student.email}:`, error.message);
    const failureMsg = emailJsError || (isNetworkBlocked
      ? 'Local network blocks SMTP port 465/587. Please enable "Allow EmailJS API for non-browser applications" at https://dashboard.emailjs.com/admin/account/security'
      : error.message);
    return {
      success: false,
      networkBlocked: isNetworkBlocked,
      recipient: student.email,
      error: failureMsg,
      message: failureMsg,
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
  const subject =
    customSubject ||
    `🎉 Congratulations! You have been selected at ${drive.companyName} (₹${pkg || drive.package} LPA)`;

  let emailJsError = null;
  // 1. If EmailJS is configured, use it first (HTTPS port 443 bypasses local network SMTP blocks)
  if (process.env.EMAILJS_SERVICE_ID && (process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID)) {
    const emailJsRes = await sendViaEmailJS({
      toEmail: student.email,
      toName: student.name,
      subject,
      message: `Congratulations! You have been selected at ${drive.companyName} as ${role || drive.role} with a package of ₹${pkg || drive.package} LPA!`,
      templateParams: {
        company_name: drive.companyName,
        round_name: 'Final Selection / Offer',
        role: role || drive.role,
        package: pkg || drive.package,
        scheduled_date: 'Placement Milestone',
        venue: 'Campus Placement Office',
        instructions: 'Please report to the placement office with required original documents.',
        custom_message: customMessage || '',
        student_roll: student.rollNumber || '',
        student_dept: student.department || '',
      },
    });

    if (emailJsRes.success) {
      return emailJsRes;
    }
    emailJsError = emailJsRes.error;
    console.warn('[EmailService] EmailJS send attempt failed, trying fallback:', emailJsRes.error);
  }

  try {
    const transporter = await getTransporter();
    const fromAddress = process.env.EMAIL_FROM || (process.env.GMAIL_USER ? `"Placement Cell" <${process.env.GMAIL_USER}>` : '"Placement Cell" <placements@skcet.ac.in>');

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

    if (info.notConfigured || info.simulated) {
      return {
        success: false,
        notConfigured: true,
        recipient: student.email,
        error: emailJsError || 'Email credentials not fully configured',
        message: emailJsError || 'Offer notification not delivered: Email credentials not configured.',
      };
    }

    return {
      success: true,
      messageId: info.messageId,
      recipient: student.email,
    };
  } catch (error) {
    const isNetworkBlocked = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || (error.message && error.message.includes('ECONNREFUSED'));
    console.warn(`[EmailService] SMTP dispatch note for ${student.email}:`, error.message);
    const failureMsg = emailJsError || (isNetworkBlocked
      ? 'Local network blocks SMTP port 465/587. Please enable "Allow EmailJS API for non-browser applications" at https://dashboard.emailjs.com/admin/account/security'
      : error.message);
    return {
      success: false,
      networkBlocked: isNetworkBlocked,
      recipient: student.email,
      error: failureMsg,
      message: failureMsg,
    };
  }
}

/**
 * Reset transporter cache so new environment variables take effect
 */
function resetTransporter() {
  cachedTransporter = null;
  console.log('[EmailService] Transporter cache cleared');
}

/**
 * Send verification test email to verify credentials
 */
async function sendTestEmail(recipientEmail) {
  try {
    // 1. Check EmailJS first
    if (process.env.EMAILJS_SERVICE_ID && (process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID)) {
      const emailJsRes = await sendViaEmailJS({
        toEmail: recipientEmail,
        toName: 'Placement Administrator',
        subject: '✅ Placement Portal Email Verification Test (EmailJS Active)',
        message: 'This is a live confirmation email sent via EmailJS HTTPS API (port 443). Real candidate emails are operational!',
      });
      return emailJsRes;
    }

    const hasConfig = Boolean(
      (process.env.GMAIL_USER && (process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD)) ||
      (process.env.SMTP_HOST && process.env.SMTP_USER)
    );
    if (!hasConfig) {
      return {
        success: false,
        error: 'Please enter a valid Gmail address & App Password, or EmailJS credentials.',
      };
    }

    const transporter = await getTransporter();
    const fromAddress = process.env.EMAIL_FROM || (process.env.GMAIL_USER ? `"Placement Cell" <${process.env.GMAIL_USER}>` : '"Placement Cell" <placements@skcet.ac.in>');
    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipientEmail,
      subject: '✅ Placement Portal Email Verification Test',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 28px; background: #f8fafc; color: #1e293b; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #059669; margin-top: 0; font-size: 20px;">✅ Email Service Active!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            This is a live confirmation email sent from your Campus Placement Management System.
          </p>
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #065f46; margin: 16px 0;">
            Real emails are now operational! Candidate invitations and placement offers will reach actual student inboxes.
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin: 20px 0 0 0;">
            Sent by Campus Placement Portal
          </p>
        </div>
      `,
    });

    if (info.notConfigured) {
      return {
        success: false,
        error: 'Gmail/SMTP credentials not active. Please enter your credentials and try again.',
      };
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    console.error('[EmailService] Test email failed:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = {
  getTransporter,
  resetTransporter,
  sendTestEmail,
  sendRoundShortlistEmail,
  sendFinalSelectionEmail,
  buildRoundShortlistHtml,
  buildFinalSelectionHtml,
};
