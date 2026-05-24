// Email Notification Service — Google Workspace SMTP (agent@ailab.srfti.ac.in)

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP credentials not configured. Skipping email send.');
    return { skipped: true };
  }

  try {
    const info = await getTransporter().sendMail({
      from: `"SRFTI Grievance Portal" <${process.env.SMTP_USER}>`,
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

async function notifyGrievanceFiled(grievance, complainant, nodalOfficer) {
  // Confirmation to complainant
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.id} Filed Successfully — SRFTI`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Grievance Registration Confirmed</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>Your grievance has been successfully registered and assigned to the Nodal Officer.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Category</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.category}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nodal Officer</td><td style="padding: 8px; border: 1px solid #ddd;">${nodalOfficer ? nodalOfficer.name : 'Pending Assignment'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Timeline</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.timeline_days} days</td></tr>
        </table>
        <p>You will receive email updates as your case progresses.</p>
        <p style="color: #666; font-size: 0.85rem;">SRFTI Grievance Redressal Portal</p>
      </div>
    `,
    text: `Grievance #${grievance.id} "${grievance.title}" filed. Nodal Officer: ${nodalOfficer ? nodalOfficer.name : 'Pending'}. Timeline: ${grievance.timeline_days} days.`,
  });

  // Notification to nodal officer
  if (nodalOfficer && nodalOfficer.email) {
    await sendEmail({
      to: nodalOfficer.email,
      subject: `New Grievance #${grievance.id} Assigned — Action Required`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #b45309;">New Grievance Assigned</h2>
          <p>Dear <strong>${nodalOfficer.name}</strong>,</p>
          <p>A new grievance has been assigned to your sector. Please review and acknowledge.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.id}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Complainant</td><td style="padding: 8px; border: 1px solid #ddd;">${complainant.name}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Timeline</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.timeline_days} days</td></tr>
          </table>
          <p style="color: #666; font-size: 0.85rem;">SRFTI Grievance Redressal Portal</p>
        </div>
      `,
      text: `New Grievance #${grievance.id} "${grievance.title}" from ${complainant.name}. Timeline: ${grievance.timeline_days} days.`,
    });
  }
}

async function notifyInvestigationStarted(grievance, complainant, nodalOfficer) {
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.id} — Investigation Started`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Investigation Underway</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>The Nodal Officer has started investigation on your grievance.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nodal Officer</td><td style="padding: 8px; border: 1px solid #ddd;">${nodalOfficer ? nodalOfficer.name : 'Nodal Officer'}</td></tr>
        </table>
        <p><em>Remarks:</em> "${grievance.lastRemarks || 'Investigation has been initiated.'}"</p>
        <p style="color: #666; font-size: 0.85rem;">SRFTI Grievance Redressal Portal</p>
      </div>
    `,
    text: `Grievance #${grievance.id} investigation started by ${nodalOfficer ? nodalOfficer.name : 'Nodal Officer'}.`,
  });
}

async function notifyIntermediateReply(grievance, complainant, nodalOfficer, remarks) {
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.id} — Update from Nodal Officer`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #b45309;">Update on Your Grievance</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>The Nodal Officer has sent an update on your grievance:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nodal Officer</td><td style="padding: 8px; border: 1px solid #ddd;">${nodalOfficer ? nodalOfficer.name : 'Nodal Officer'}</td></tr>
        </table>
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; margin: 1rem 0;">
          <p style="margin: 0; font-style: italic;">"${remarks}"</p>
        </div>
        <p style="color: #666; font-size: 0.85rem;">SRFTI Grievance Redressal Portal</p>
      </div>
    `,
    text: `Grievance #${grievance.id} update from ${nodalOfficer ? nodalOfficer.name : 'Nodal Officer'}: "${remarks}"`,
  });
}

async function notifyResolutionSubmitted(grievance, complainant, nodalOfficer, remarks) {
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.id} — Resolution Submitted for Your Review`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Resolution Submitted — Action Required</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>The Nodal Officer has submitted a resolution for your grievance. Please review and respond.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nodal Officer</td><td style="padding: 8px; border: 1px solid #ddd;">${nodalOfficer ? nodalOfficer.name : 'Nodal Officer'}</td></tr>
        </table>
        <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 1rem; margin: 1rem 0;">
          <p style="margin: 0; font-style: italic;">"${remarks}"</p>
        </div>
        <p><strong>Please log in to the portal to accept or appeal the resolution.</strong></p>
        <p style="color: #666; font-size: 0.85rem;">SRFTI Grievance Redressal Portal</p>
      </div>
    `,
    text: `Grievance #${grievance.id} resolution submitted by ${nodalOfficer ? nodalOfficer.name : 'Nodal Officer'}. Please log in to accept or appeal. Remarks: "${remarks}"`,
  });
}

async function notifyAppealFiled(grievance, complainant, appellateOfficer, remarks) {
  // Notify appellate authority
  if (appellateOfficer && appellateOfficer.email) {
    await sendEmail({
      to: appellateOfficer.email,
      subject: `Appeal Filed — Grievance #${grievance.id} Escalated`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Appeal Filed — Escalated Case</h2>
          <p>Dear <strong>${appellateOfficer.name}</strong>,</p>
          <p>A grievance has been escalated to your tribunal by the complainant.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.id}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Complainant</td><td style="padding: 8px; border: 1px solid #ddd;">${complainant.name}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Appeal Reason</td><td style="padding: 8px; border: 1px solid #ddd;">${remarks || 'Resolution rejected by complainant'}</td></tr>
          </table>
          <p><strong>Please log in to convene a hearing.</strong></p>
          <p style="color: #666; font-size: 0.85rem;">SRFTI Grievance Redressal Portal</p>
        </div>
      `,
      text: `Appeal filed for Grievance #${grievance.id} by ${complainant.name}. Reason: ${remarks || 'Resolution rejected'}.`,
    });
  }

  // Confirmation to complainant
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.id} — Appeal Filed Successfully`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Appeal Filed Successfully</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>Your appeal has been filed and the case has been escalated to the Appellate Authority.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Appellate Authority</td><td style="padding: 8px; border: 1px solid #ddd;">${appellateOfficer ? appellateOfficer.name : 'Pending'}</td></tr>
        </table>
        <p style="color: #666; font-size: 0.85rem;">SRFTI Grievance Redressal Portal</p>
      </div>
    `,
    text: `Appeal filed for Grievance #${grievance.id}. Escalated to ${appellateOfficer ? appellateOfficer.name : 'Appellate Authority'}.`,
  });
}

async function notifyFinalRuling(grievance, complainant, appellateOfficer, remarks) {
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.id} — Final Ruling Issued`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Final Binding Ruling Issued</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>The Appellate Authority has issued a final binding ruling on your grievance. This case is now closed.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Appellate Authority</td><td style="padding: 8px; border: 1px solid #ddd;">${appellateOfficer ? appellateOfficer.name : 'Appellate Authority'}</td></tr>
        </table>
        <div style="background: #eff6ff; border-left: 4px solid #1e40af; padding: 1rem; margin: 1rem 0;">
          <p style="margin: 0; font-style: italic;">"${remarks}"</p>
        </div>
        <p style="color: #666; font-size: 0.85rem;">SRFTI Grievance Redressal Portal</p>
      </div>
    `,
    text: `Final ruling for Grievance #${grievance.id}: "${remarks}"`,
  });
}

async function notifyResolutionAccepted(grievance, complainant, nodalOfficer) {
  // Confirmation to complainant
  await sendEmail({
    to: complainant.email,
    subject: `Grievance #${grievance.id} — Resolution Accepted, Case Closed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Case Resolved & Closed</h2>
        <p>Dear <strong>${complainant.name}</strong>,</p>
        <p>You have accepted the resolution. This case is now closed.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
        </table>
        <p style="color: #666; font-size: 0.85rem;">SRFTI Grievance Redressal Portal</p>
      </div>
    `,
    text: `Grievance #${grievance.id} resolution accepted. Case closed.`,
  });

  // Notify nodal officer
  if (nodalOfficer && nodalOfficer.email) {
    await sendEmail({
      to: nodalOfficer.email,
      subject: `Grievance #${grievance.id} — Resolution Accepted by Complainant`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Resolution Accepted</h2>
          <p>Dear <strong>${nodalOfficer.name}</strong>,</p>
          <p>The complainant has accepted your resolution for Grievance #${grievance.id}. Case closed.</p>
          <p style="color: #666; font-size: 0.85rem;">SRFTI Grievance Redressal Portal</p>
        </div>
      `,
      text: `Grievance #${grievance.id} resolution accepted by ${complainant.name}. Case closed.`,
    });
  }
}

async function notifySlaWarning(grievance, nodalOfficer, daysRemaining, isOverdue) {
  if (!nodalOfficer || !nodalOfficer.email) return;

  const urgency = isOverdue ? 'OVERDUE' : 'URGENT';
  const color = isOverdue ? '#dc2626' : '#b45309';

  await sendEmail({
    to: nodalOfficer.email,
    subject: `[${urgency}] Grievance #${grievance.id} — SLA ${isOverdue ? 'Breached' : 'Warning'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${color};">SLA ${isOverdue ? 'Breached' : 'Warning'}</h2>
        <p>Dear <strong>${nodalOfficer.name}</strong>,</p>
        <p>Grievance #${grievance.id} is ${isOverdue ? 'overdue' : 'nearing its timeline'}.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Case ID</td><td style="padding: 8px; border: 1px solid #ddd;">#${grievance.id}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${grievance.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Complainant</td><td style="padding: 8px; border: 1px solid #ddd;">${grievant.complainant_name || 'Complainant'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status</td><td style="padding: 8px; border: 1px solid #ddd; color: ${color}; font-weight: bold;">${isOverdue ? `Breached by ${Math.abs(daysRemaining)} days` : `${daysRemaining} days remaining`}</td></tr>
        </table>
        <p><strong>Please take immediate action.</strong></p>
        <p style="color: #666; font-size: 0.85rem;">SRFTI Grievance Redressal Portal</p>
      </div>
    `,
    text: `SLA ${isOverdue ? 'BREACHED' : 'WARNING'}: Grievance #${grievance.id} "${grievance.title}". ${isOverdue ? `Overdue by ${Math.abs(daysRemaining)} days` : `${daysRemaining} days remaining`}.`,
  });
}

module.exports = {
  sendEmail,
  notifyGrievanceFiled,
  notifyInvestigationStarted,
  notifyIntermediateReply,
  notifyResolutionSubmitted,
  notifyAppealFiled,
  notifyFinalRuling,
  notifyResolutionAccepted,
  notifySlaWarning,
};
