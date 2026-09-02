/**
 * utils/sendEmail.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Brevo Transactional Email Service
 * ─────────────────────────────────────────────────────────────
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/FyTxa7MaOOkC2qXelS2kzj?s=cl&p=a&mlu=4'

/**
 * Send transactional email via Brevo REST API
 */
const sendBrevoEmail = async ({ toEmail, toName, subject, htmlContent }) => {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.warn('[Brevo Email] Missing BREVO_API_KEY in environment variables. Email skipped.')
    return { success: false, message: 'Missing Brevo API Key' }
  }

  const senderEmail = process.env.BREVO_FROM_EMAIL || 'Sanagoyal32@gmail.com'
  const senderName = process.env.BREVO_FROM_NAME || 'ADVMEN Technologies'

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail, name: toName || toEmail }],
        subject,
        htmlContent,
      }),
    })

    const resData = await response.json()

    if (response.ok) {
      console.log(`[Brevo Email Sent] Successfully sent "${subject}" to ${toEmail}. MessageID: ${resData.messageId}`)
      return { success: true, messageId: resData.messageId }
    } else {
      console.error(`[Brevo Email Failed] API Error for ${toEmail}:`, resData)
      return { success: false, error: resData }
    }
  } catch (err) {
    console.error(`[Brevo Email Error] Exception while sending email to ${toEmail}:`, err)
    return { success: false, error: err.message }
  }
}

/**
 * Helper to build email templates
 */
const getEmailWrapper = (title, bodyHtml) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f111a; margin: 0; padding: 20px; color: #e2e8f0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #161824; border: 1px solid #2d3748; border-top: 4px solid #f97316; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { padding: 24px; text-align: center; border-bottom: 1px solid #2d3748; background: #1a1d2e; }
        .brand { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; }
        .brand span { color: #f97316; }
        .content { padding: 32px 24px; line-height: 1.6; color: #cbd5e1; }
        .h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
        .box { background-color: #1e2230; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #e2e8f0; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff !important; font-weight: bold; text-decoration: none; border-radius: 10px; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; margin-top: 12px; }
        .footer { padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #2d3748; background: #0f111a; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">ADV<span>MEN</span> Technologies</div>
        </div>
        <div class="content">
          ${bodyHtml}
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ADVMEN Technologies. All rights reserved.<br>
          Direct Contact: <a href="mailto:info@advmen.com" style="color: #f97316; text-decoration: none;">info@advmen.com</a> | <a href="tel:+918375008009" style="color: #f97316; text-decoration: none;">+91 83750 08009</a><br>
          Building Next-Gen Tech Solutions & Empowering Talent.
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Send Application Received Email to Candidate
 */
const sendApplicationConfirmationEmail = async (application) => {
  const isIntern = (application.jobType || '').toLowerCase().includes('intern') ||
                   (application.jobTitle || '').toLowerCase().includes('intern')

  const title = `Application Confirmation: ${application.jobTitle}`
  const body = `
    <h2 class="h1">Application Received Successfully!</h2>
    <p>Dear <strong>${application.name}</strong>,</p>
    <p>Thank you for applying for the <strong>${application.jobTitle}</strong> position (${application.jobType || 'Full-Time'}) at <strong>ADVMEN Technologies</strong>.</p>
    
    <div class="box">
      <strong>Application Overview:</strong><br>
      • <strong>Candidate Name:</strong> ${application.name}<br>
      • <strong>Applied Role:</strong> ${application.jobTitle}<br>
      • <strong>Department:</strong> ${application.jobDepartment || 'Engineering'}<br>
      • <strong>Candidate Phone:</strong> ${application.phone}<br>
      • <strong>HR Support Email:</strong> info@advmen.com<br>
      • <strong>HR Support Phone:</strong> +91 83750 08009<br>
      • <strong>Current Status:</strong> Pending HR Review
    </div>

    ${isIntern ? `
      <div class="box" style="border-color: #10b981; background-color: rgba(16, 185, 129, 0.08);">
        <strong style="color: #34d399;">🎓 Official Intern Candidate WhatsApp Group</strong><br>
        <p style="margin: 8px 0; font-size: 12px; color: #cbd5e1;">Please join our official WhatsApp group for instant onboarding updates, mentor interactions, and project announcements:</p>
        <a href="${WHATSAPP_GROUP_LINK}" target="_blank" class="btn">Join Official WhatsApp Group Now</a>
      </div>
    ` : ''}

    <p>Our talent acquisition team is evaluating your application. You will receive further updates as your application progresses through our hiring pipeline.</p>
    
    <p>Best Regards,<br><strong>Talent Acquisition Team</strong><br>ADVMEN Technologies</p>
  `

  return sendBrevoEmail({
    toEmail: application.email,
    toName: application.name,
    subject: `Application Received — ${application.jobTitle} | ADVMEN Technologies`,
    htmlContent: getEmailWrapper(title, body),
  })
}

/**
 * Send Application Status Update Email (Reviewed, Shortlisted, Rejected)
 */
const sendStatusUpdateEmail = async (application, newStatus) => {
  let subject = `Application Update: ${newStatus} — ${application.jobTitle} | ADVMEN`
  let statusHeader = ''
  let statusBody = ''

  if (newStatus === 'Reviewed') {
    statusHeader = 'Your Application is Under Review'
    statusBody = `
      <p>Dear <strong>${application.name}</strong>,</p>
      <p>We are writing to inform you that your application for <strong>${application.jobTitle}</strong> is currently being <strong>reviewed</strong> by our technical hiring panel.</p>
      <div class="box">
        • <strong>Position:</strong> ${application.jobTitle}<br>
        • <strong>Status:</strong> Under Technical Evaluation<br>
        • <strong>HR Contact:</strong> info@advmen.com | +91 83750 08009
      </div>
      <p>If your profile matches our key requirements, our HR team will contact you shortly regarding the next step.</p>
    `
  } else if (newStatus === 'Shortlisted') {
    subject = `🎉 Congratulations! You are Shortlisted for ${application.jobTitle} | ADVMEN`
    statusHeader = 'Congratulations! You Have Been Shortlisted'
    statusBody = `
      <p>Dear <strong>${application.name}</strong>,</p>
      <p>Great news! We are delighted to inform you that your application for <strong>${application.jobTitle}</strong> has been <strong>Shortlisted</strong> by our recruitment committee!</p>
      
      <div class="box" style="border-color: #f97316;">
        <strong style="color: #f97316; font-size: 14px;">Next Steps & Direct HR Contact Details:</strong><br><br>
        • <strong>Applied Position:</strong> ${application.jobTitle} (${application.jobType || 'Full-Time'})<br>
        • <strong>Candidate Phone:</strong> ${application.phone}<br>
        • <strong>Official HR Email:</strong> <a href="mailto:info@advmen.com" style="color: #38bdf8; font-weight: bold; text-decoration: underline;">info@advmen.com</a><br>
        • <strong>Official HR Phone / WhatsApp:</strong> <a href="tel:+918375008009" style="color: #34d399; font-weight: bold; text-decoration: underline;">+91 83750 08009</a>
      </div>
      
      <p>Our HR and technical hiring team will reach out to you shortly via Phone/WhatsApp or Email to schedule your interview round.</p>
      <p>If you have any urgent queries regarding your interview schedule, feel free to contact us directly at <strong>+91 83750 08009</strong> or email <strong>info@advmen.com</strong>.</p>
    `
  } else if (newStatus === 'Rejected') {
    subject = `Application Update — ${application.jobTitle} | ADVMEN Technologies`
    statusHeader = 'Application Update'
    statusBody = `
      <p>Dear <strong>${application.name}</strong>,</p>
      <p>Thank you for your interest in joining <strong>ADVMEN Technologies</strong> and for taking the time to apply for <strong>${application.jobTitle}</strong>.</p>
      <p>After careful evaluation of all applications, we regret to inform you that we will not be proceeding further with your profile for this specific role at this time.</p>
      <div class="box">
        We were impressed by your background and will retain your resume in our talent database for upcoming opportunities that align with your experience.
      </div>
      <p>For any future inquiries, you can reach out to us at <strong>info@advmen.com</strong> or <strong>+91 83750 08009</strong>.</p>
      <p>We wish you every success in your career endeavors.</p>
    `
  } else {
    statusHeader = `Application Status Updated to ${newStatus}`
    statusBody = `
      <p>Dear <strong>${application.name}</strong>,</p>
      <p>Your application status for <strong>${application.jobTitle}</strong> has been updated to: <strong>${newStatus}</strong>.</p>
    `
  }

  const contentHtml = `
    <h2 class="h1">${statusHeader}</h2>
    ${statusBody}
    <p>Best Regards,<br><strong>Hiring Team</strong><br>ADVMEN Technologies</p>
  `

  return sendBrevoEmail({
    toEmail: application.email,
    toName: application.name,
    subject,
    htmlContent: getEmailWrapper(statusHeader, contentHtml),
  })
}

/**
 * Send Newsletter Welcome Email via Brevo
 */
const sendNewsletterWelcomeEmail = async (toEmail) => {
  const title = 'Welcome to ADVMEN Briefings'
  const body = `
    <h2 class="h1">Welcome to ADVMEN Briefings!</h2>
    <p>Thank you for subscribing to <strong>ADVMEN Technologies</strong> briefings and updates.</p>
    <div class="box">
      You will now receive exclusive insights on enterprise software development, digital strategy, AI integration, and technological innovations directly in your inbox.
    </div>
    <p>If you ever have any questions or would like to discuss a project, feel free to reach out to us at <a href="mailto:info@advmen.com" style="color: #f97316;">info@advmen.com</a> or call <strong>+91 83750 08009</strong>.</p>
    <p>Best Regards,<br><strong>ADVMEN Team</strong><br>ADVMEN Technologies Pvt. Ltd.</p>
  `

  return sendBrevoEmail({
    toEmail,
    toName: toEmail.split('@')[0],
    subject: 'Welcome to ADVMEN Briefings & Tech Updates! 🚀',
    htmlContent: getEmailWrapper(title, body),
  })
}

/**
 * Send Contact Form Submission Confirmation Email & Admin Notification
 */
const sendContactInquiryEmail = async ({ name, email, subject: msgSubject, message, phone, budget, timeline, industry, projectType, goals }) => {
  const title = 'Inquiry Received — ADVMEN Technologies'
  const clientBody = `
    <h2 class="h1">Thank You for Reaching Out!</h2>
    <p>Dear <strong>${name}</strong>,</p>
    <p>Thank you for contacting <strong>ADVMEN Technologies</strong>. We have received your inquiry and our client success team will review your project details and get back to you within 24 hours.</p>
    <div class="box">
      <strong>Submitted Inquiry Details:</strong><br>
      • <strong>Name:</strong> ${name}<br>
      • <strong>Email:</strong> ${email}<br>
      ${phone ? `• <strong>Phone:</strong> ${phone}<br>` : ''}
      ${msgSubject ? `• <strong>Subject:</strong> ${msgSubject}<br>` : ''}
      ${budget ? `• <strong>Budget Range:</strong> ${budget}<br>` : ''}
      ${timeline ? `• <strong>Timeline:</strong> ${timeline}<br>` : ''}
      ${industry ? `• <strong>Industry:</strong> ${industry}<br>` : ''}
      ${projectType ? `• <strong>Project Type:</strong> ${projectType}<br>` : ''}
      ${goals ? `• <strong>Goals:</strong> ${goals}<br>` : ''}
      • <strong>Message:</strong> ${message}
    </div>
    <p>For urgent inquiries, feel free to call or WhatsApp us at <strong>+91 83750 08009</strong> or email <strong>info@advmen.com</strong>.</p>
    <p>Best Regards,<br><strong>Client Success Team</strong><br>ADVMEN Technologies</p>
  `

  const adminBody = `
    <h2 class="h1">🚀 New Contact Inquiry Received</h2>
    <div class="box" style="border-color: #f97316;">
      <strong style="color: #f97316; font-size: 14px;">Inquiry Details:</strong><br><br>
      • <strong>Client Name:</strong> ${name}<br>
      • <strong>Client Email:</strong> ${email}<br>
      • <strong>Phone:</strong> ${phone || 'Not provided'}<br>
      • <strong>Subject:</strong> ${msgSubject || 'General Inquiry'}<br>
      • <strong>Budget:</strong> ${budget || 'Not specified'}<br>
      • <strong>Timeline:</strong> ${timeline || 'Not specified'}<br>
      • <strong>Industry:</strong> ${industry || 'Not specified'}<br>
      • <strong>Project Type:</strong> ${projectType || 'Not specified'}<br>
      • <strong>Goals:</strong> ${goals || 'Not specified'}<br><br>
      • <strong>Message:</strong><br>${message}
    </div>
  `

  // Send confirmation email to client
  sendBrevoEmail({
    toEmail: email,
    toName: name,
    subject: `Thank you for contacting ADVMEN Technologies`,
    htmlContent: getEmailWrapper(title, clientBody),
  })

  // Send alert to admin
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'info@advmen.com'
  return sendBrevoEmail({
    toEmail: adminEmail,
    toName: 'ADVMEN Admin',
    subject: `New Contact Inquiry from ${name}`,
    htmlContent: getEmailWrapper('New Contact Form Submission', adminBody),
  })
}

module.exports = {
  sendBrevoEmail,
  sendApplicationConfirmationEmail,
  sendStatusUpdateEmail,
  sendNewsletterWelcomeEmail,
  sendContactInquiryEmail,
}
