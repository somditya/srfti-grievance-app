// Email Notification Service — Google Workspace SMTP (agent@ailab.srfti.ac.in)
// All transactional emails are sent via Google Workspace SMTP from agent@ailab.srfti.ac.in

const nodemailer = require('nodemailer');

const FROM_EMAIL = process.env.SMTP_USER || 'agent@ailab.srfti.ac.in';
const FROM_NAME = 'SRFTI Grievance Portal';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: FROM_EMAIL,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });
  }
  return transporter;
}

async function verifySmtpConnection() {
  try {
    await getTransporter().verify();
    console.log('[Email] Google Workspace SMTP connection verified — ready to send.');
    return true;
  } catch (err) {
    console.error('[Email] SMTP connection failed:', err.message);
    console.error('[Email] Emails will be skipped until SMTP is reconfigured.');
    return false;
  }
}

async function sendEmail({ to, subject, html, text }) {
  if (!FROM_EMAIL || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP credentials not configured. Skipping email send.');
    return { skipped: true };
  }

  try {
    const info = await getTransporter().sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`[Email] Sent to ${to}: ${subject} (id: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

function grievanceLink(grievanceId) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl}/#/dashboard`;
}

// Generate a reusable email footer
function emailFooter() {
  return `
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0;" />
    <p style="color: #6b7280; font-size: 0.8rem;">
      This is an automated notification from the SRFTI Grievance Redressal Portal.<br />
      Sender: agent@ailab.srfti.ac.in | Satyajit Ray Film & Television Institute<br />
      Do not reply directly to this email. Log in to the portal for any responses.
    </p>
  `;
}

async function notifyGrievanceFiled(grievance, complainant, nodalOfficer) {
  // Confirmation to complainant
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.case_id} Filed Successfully — SRFTI`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Grievance Registration Confirmed</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>Your grievance has been successfully registered and assigned to the Nodal Officer.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.case_id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Category</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.category}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nodal Officer</td><td style="padding: 8px; border: 1px solid #ddd;">${nodalOfficer ? nodalOfficer.name : 'Pending Assignment'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Timeline</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.timeline_days} days</td></tr>
        </table>
        <p>You will receive email updates as your case progresses.</p>
        ${emailFooter()}
      </div>
    `,
    text: `Grievance #${grievance.case_id} "${grievance.title}" filed. Nodal Officer: ${nodalOfficer ? nodalOfficer.name : 'Pending'}. Timeline: ${grievance.timeline_days} days.`,
  });

  // Notification to nodal officer
  if (nodalOfficer && nodalOfficer.email) {
    await sendEmail({
      to: nodalOfficer.email,
      subject: `New Grievance #${grievance.case_id} Assigned — Action Required`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #b45309;">New Grievance Assigned</h2>
          <p>Dear <strong>${nodalOfficer.name}</strong>,</p>
          <p>A new grievance has been assigned to your sector. Please review and acknowledge.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.case_id}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Complainant</td><td style="padding: 8px; border: 1px solid #ddd;">${complainant.name}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Timeline</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.timeline_days} days</td></tr>
          </table>
          ${emailFooter()}
        </div>
      `,
      text: `New Grievance #${grievance.case_id} "${grievance.title}" from ${complainant.name}. Timeline: ${grievance.timeline_days} days.`,
    });
  }
}

async function notifyInvestigationStarted(grievance, complainant, nodalOfficer) {
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.case_id} — Investigation Started`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Investigation Underway</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>The Nodal Officer has started investigation on your grievance.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.case_id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nodal Officer</td><td style="padding: 8px; border: 1px solid #ddd;">${nodalOfficer ? nodalOfficer.name : 'Nodal Officer'}</td></tr>
        </table>
        <p><em>Remarks:</em> "${grievance.lastRemarks || 'Investigation has been initiated.'}"</p>
        ${emailFooter()}
      </div>
    `,
    text: `Grievance #${grievance.case_id} investigation started by ${nodalOfficer ? nodalOfficer.name : 'Nodal Officer'}.`,
  });
}

async function notifyIntermediateReply(grievance, complainant, nodalOfficer, remarks) {
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.case_id} — Update from Nodal Officer`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #b45309;">Update on Your Grievance</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>The Nodal Officer has sent an update on your grievance:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.case_id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nodal Officer</td><td style="padding: 8px; border: 1px solid #ddd;">${nodalOfficer ? nodalOfficer.name : 'Nodal Officer'}</td></tr>
        </table>
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; margin: 1rem 0;">
          <p style="margin: 0; font-style: italic;">"${remarks}"</p>
        </div>
        ${emailFooter()}
      </div>
    `,
    text: `Grievance #${grievance.case_id} update from ${nodalOfficer ? nodalOfficer.name : 'Nodal Officer'}: "${remarks}"`,
  });
}

async function notifyResolutionSubmitted(grievance, complainant, nodalOfficer, remarks) {
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.case_id} — Resolution Submitted for Your Review`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Resolution Submitted — Action Required</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>The Nodal Officer has submitted a resolution for your grievance. Please review and respond.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.case_id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nodal Officer</td><td style="padding: 8px; border: 1px solid #ddd;">${nodalOfficer ? nodalOfficer.name : 'Nodal Officer'}</td></tr>
        </table>
        <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 1rem; margin: 1rem 0;">
          <p style="margin: 0; font-style: italic;">"${remarks}"</p>
        </div>
        <p><strong>Please log in to the portal to accept or appeal the resolution.</strong></p>
        ${emailFooter()}
      </div>
    `,
    text: `Grievance #${grievance.case_id} resolution submitted by ${nodalOfficer ? nodalOfficer.name : 'Nodal Officer'}. Please log in to accept or appeal. Remarks: "${remarks}"`,
  });
}

async function notifyAppealFiled(grievance, complainant, appellateOfficer, remarks) {
  // Notify appellate authority
  if (appellateOfficer && appellateOfficer.email) {
    await sendEmail({
      to: appellateOfficer.email,
      subject: `Appeal Filed — Grievance #${grievance.case_id} Escalated`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Appeal Filed — Escalated Case</h2>
          <p>Dear <strong>${appellateOfficer.name}</strong>,</p>
          <p>A grievance has been escalated to your tribunal by the complainant.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.case_id}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Complainant</td><td style="padding: 8px; border: 1px solid #ddd;">${complainant.name}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Appeal Reason</td><td style="padding: 8px; border: 1px solid #ddd;">${remarks || 'Resolution rejected by complainant'}</td></tr>
          </table>
          <p><strong>Please log in to convene a hearing.</strong></p>
          ${emailFooter()}
        </div>
      `,
      text: `Appeal filed for Grievance #${grievance.case_id} by ${complainant.name}. Reason: ${remarks || 'Resolution rejected'}.`,
    });
  }

  // Confirmation to complainant
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.case_id} — Appeal Filed Successfully`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Appeal Filed Successfully</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>Your appeal has been filed and the case has been escalated to the Appellate Authority.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.case_id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Appellate Authority</td><td style="padding: 8px; border: 1px solid #ddd;">${appellateOfficer ? appellateOfficer.name : 'Pending'}</td></tr>
        </table>
        ${emailFooter()}
      </div>
    `,
    text: `Appeal filed for Grievance #${grievance.case_id}. Escalated to ${appellateOfficer ? appellateOfficer.name : 'Appellate Authority'}.`,
  });
}

async function notifyFinalRuling(grievance, complainant, appellateOfficer, remarks) {
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.case_id} — Final Ruling Issued`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Final Binding Ruling Issued</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>The Appellate Authority has issued a final binding ruling on your grievance. This case is now closed.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.case_id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Appellate Authority</td><td style="padding: 8px; border: 1px solid #ddd;">${appellateOfficer ? appellateOfficer.name : 'Appellate Authority'}</td></tr>
        </table>
        <div style="background: #eff6ff; border-left: 4px solid #1e40af; padding: 1rem; margin: 1rem 0;">
          <p style="margin: 0; font-style: italic;">"${remarks}"</p>
        </div>
        ${emailFooter()}
      </div>
    `,
    text: `Final ruling for Grievance #${grievance.case_id}: "${remarks}"`,
  });
}

async function notifyResolutionAccepted(grievance, complainant, nodalOfficer) {
  // Confirmation to complainant
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.case_id} — Resolution Accepted, Case Closed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Case Resolved & Closed</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>You have accepted the resolution. This case is now closed.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.case_id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
        </table>
        ${emailFooter()}
      </div>
    `,
    text: `Grievance #${grievance.case_id} resolution accepted. Case closed.`,
  });

  // Notify nodal officer
  if (nodalOfficer && nodalOfficer.email) {
    await sendEmail({
      to: nodalOfficer.email,
      subject: `Grievance #${grievance.case_id} — Resolution Accepted by Complainant`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Resolution Accepted</h2>
          <p>Dear <strong>${nodalOfficer.name}</strong>,</p>
          <p>The complainant has accepted your resolution for Grievance #${grievance.case_id}. Case closed.</p>
          ${emailFooter()}
        </div>
      `,
      text: `Grievance #${grievance.case_id} resolution accepted by ${complainant.name}. Case closed.`,
    });
  }
}

async function notifySlaWarning(grievance, nodalOfficer, complainantName, daysRemaining, isOverdue) {
  if (!nodalOfficer || !nodalOfficer.email) return;

  const urgency = isOverdue ? 'OVERDUE' : 'URGENT';
  const color = isOverdue ? '#dc2626' : '#b45309';

  await sendEmail({
    to: nodalOfficer.email,
    subject: `[${urgency}] Grievance #${grievance.case_id} — SLA ${isOverdue ? 'Breached' : 'Warning'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${color};">SLA ${isOverdue ? 'Breached' : 'Warning'}</h2>
        <p>Dear <strong>${nodalOfficer.name}</strong>,</p>
        <p>Grievance #${grievance.case_id} is ${isOverdue ? 'overdue' : 'nearing its timeline'}.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.case_id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Complainant</td><td style="padding: 8px; border: 1px solid #ddd;">${complainantName || 'Complainant'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status</td><td style="padding: 8px; border: 1px solid #ddd; color: ${color}; font-weight: bold;">${isOverdue ? 'Breached by ' + Math.abs(daysRemaining) + ' days' : daysRemaining + ' days remaining'}</td></tr>
        </table>
        <p><strong>Please take immediate action.</strong></p>
        ${emailFooter()}
      </div>
    `,
    text: 'SLA ' + (isOverdue ? 'BREACHED' : 'WARNING') + ': Grievance #' + grievance.case_id + ' "' + grievance.title + '". ' + (isOverdue ? 'Overdue by ' + Math.abs(daysRemaining) + ' days' : daysRemaining + ' days remaining') + '.',
  });
}

async function notifyHearingConvened(grievance, complainant, remarks) {
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.case_id} — Hearing Convened by Appellate Authority`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Appellate Hearing Convened</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>The Appellate Authority has convened a hearing for your escalated grievance.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.case_id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
        </table>
        <div style="background: #ede9fe; border-left: 4px solid #7c3aed; padding: 1rem; margin: 1rem 0;">
          <p style="margin: 0; font-style: italic;">"${remarks}"</p>
        </div>
        <p>You may be requested to provide additional information or attend the hearing as scheduled by the Appellate Authority.</p>
        ${emailFooter()}
      </div>
    `,
    text: `Appellate hearing convened for Grievance #${grievance.case_id}. Remarks: "${remarks}"`,
  });
}

module.exports = {
  sendEmail,
  verifySmtpConnection,
  notifyGrievanceFiled,
  notifyInvestigationStarted,
  notifyIntermediateReply,
  notifyResolutionSubmitted,
  notifyAppealFiled,
  notifyFinalRuling,
  notifyResolutionAccepted,
  notifySlaWarning,
  notifyHearingConvened,
};
