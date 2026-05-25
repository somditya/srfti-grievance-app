// Express Server with MySQL DB connection and SRFTI business logic

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const email = require('./emailService');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'srfti_super_jwt_secret_key';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

// Multer Storage Configuration for attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// JWT Helper Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}

// --- EMAIL HELPER ---
// Fetches related users and fires email notifications (non-blocking)
async function sendNotification({ action, grievance, remarks, actingUser }) {
  try {
    // Get complainant details
    const complainants = await db.query('SELECT id, name, email FROM users WHERE id = ?', [grievance.complainant_id]);
    const complainant = complainants[0];

    // Get nodal officer details
    let nodalOfficer = null;
    if (grievance.nodal_officer_id) {
      const nodals = await db.query('SELECT id, name, email FROM users WHERE id = ?', [grievance.nodal_officer_id]);
      nodalOfficer = nodals[0];
    }

    // Get appellate officer details
    let appellateOfficer = null;
    const appellates = await db.query('SELECT ao.name, ao.email FROM appellate_officers ao WHERE ao.complainant_type = ?', [grievance.complainant_type]);
    if (appellates.length > 0) appellateOfficer = appellates[0];

    const grievanceData = { ...grievance, lastRemarks: remarks };

    switch (action) {
      case 'submitted':
        await email.notifyGrievanceFiled(grievanceData, complainant, nodalOfficer);
        break;
      case 'in_progress':
        await email.notifyInvestigationStarted(grievanceData, complainant, nodalOfficer);
        break;
      case 'intermediate_reply':
        await email.notifyIntermediateReply(grievanceData, complainant, nodalOfficer, remarks);
        break;
      case 'resolve':
        await email.notifyResolutionSubmitted(grievanceData, complainant, nodalOfficer, remarks);
        break;
      case 'appeal':
        await email.notifyAppealFiled(grievanceData, complainant, appellateOfficer, remarks);
        break;
      case 'finalize':
        await email.notifyFinalRuling(grievanceData, complainant, appellateOfficer, remarks);
        break;
      case 'resolve_accepted':
        await email.notifyResolutionAccepted(grievanceData, complainant, nodalOfficer);
        break;
    }
  } catch (err) {
    console.error('[Email Notification Error]', err.message);
  }
}

// --- PUBLIC ROUTERS ---
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.query('SELECT * FROM system_settings');
    const config = {};
    settings.forEach(s => { config[s.setting_key] = s.setting_value; });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/appellate', async (req, res) => {
  try {
    const officers = await db.query('SELECT * FROM appellate_officers');
    res.json(officers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AUTH ROUTERS ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, complainant_type, phone } = req.body;
  
  if (!name || !email || !password || !complainant_type) {
    return res.status(400).json({ message: 'Please fill all required fields.' });
  }
  
  // Strict official domain validation
  const domainRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]*\.)?srfti\.ac\.in$/;
  if (!domainRegex.test(email)) {
    return res.status(400).json({ message: 'Registration is restricted to official email addresses (@srfti.ac.in) only.' });
  }
  
  try {
    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User with this email is already registered.' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    // Insert Complainant
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role, complainant_type, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hash, 'complainant', complainant_type, phone || null]
    );
    
    // Send registration confirmation email (non-blocking)
    email.sendEmail({
      to: email,
      subject: 'Welcome to SRFTI Grievance Portal — Registration Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Registration Confirmed</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your account has been successfully created on the SRFTI Grievance Redressal Portal.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td><td style="padding: 8px; border: 1px solid #ddd;">${email}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Sector</td><td style="padding: 8px; border: 1px solid #ddd;">${complainant_type.charAt(0).toUpperCase() + complainant_type.slice(1)}</td></tr>
          </table>
          <p>You can now log in to file and track grievances. You will receive email notifications for all updates.</p>
          <p style="color: #666; font-size: 0.85rem;">SRFTI Grievance Redressal Portal<br/>agent@ailab.srfti.ac.in</p>
        </div>
      `,
      text: `Welcome to SRFTI Grievance Portal. Your registration as ${complainant_type} is confirmed. You will receive email updates for all grievance activities.`,
    }).catch(err => console.error('[Email] Registration confirmation failed:', err.message));

    res.status(201).json({ message: 'Registration successful. Please log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter email and password.' });
  }
  
  try {
    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials. User not found.' });
    }
    
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Incorrect password.' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, complainant_type: user.complainant_type },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        complainant_type: user.complainant_type,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GRIEVANCE ROUTERS ---

// File new grievance
app.post('/api/grievances', authenticateToken, upload.single('attachment'), async (req, res) => {
  const { title, category, description } = req.body;
  const attachmentPath = req.file ? `/uploads/${req.file.filename}` : null;
  const user = req.user;
  
  if (user.role !== 'complainant') {
    return res.status(403).json({ message: 'Only complainants can file grievances.' });
  }
  
  if (!title || !category || !description) {
    return res.status(400).json({ message: 'Title, category, and description are required.' });
  }
  
  try {
    // 1. Fetch appropriate timeline for complainant type
    const key = `${user.complainant_type}_resolution_days`;
    const settings = await db.query('SELECT setting_value FROM system_settings WHERE setting_key = ?', [key]);
    const timeline = settings.length > 0 ? parseInt(settings[0].setting_value) : 30;
    
    // 2. Fetch corresponding Nodal Officer for sector
    const nodals = await db.query(
      'SELECT id FROM users WHERE role = ? AND complainant_type = ?',
      ['nodal_officer', user.complainant_type]
    );
    const nodalId = nodals.length > 0 ? nodals[0].id : null;
    
    // 3. Save Grievance
    const result = await db.query(
      'INSERT INTO grievances (complainant_id, category, title, description, attachment_path, status, nodal_officer_id, timeline_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user.id, category, title, description, attachmentPath, 'pending', nodalId, timeline]
    );
    const grievanceId = result.insertId;
    
    // 4. Log in Audit Trail
    await db.query(
      'INSERT INTO grievance_history (grievance_id, action_by, action_type, remarks) VALUES (?, ?, ?, ?)',
      [grievanceId, user.id, 'submitted', 'Grievance registered in system and routed to respective Nodal Officer.']
    );
    
    // Send email notification (non-blocking)
    const newGrievance = {
      id: grievanceId,
      complainant_id: user.id,
      category,
      title,
      description,
      attachment_path: attachmentPath,
      status: 'pending',
      nodal_officer_id: nodalId,
      timeline_days: timeline,
    };
    sendNotification({
      action: 'submitted',
      grievance: newGrievance,
      remarks: 'Grievance registered and routed to Nodal Officer.',
      actingUser: user,
    });

    res.status(201).json({ message: 'Grievance submitted successfully.', grievanceId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Grievances list based on role
app.get('/api/grievances', authenticateToken, async (req, res) => {
  const user = req.user;
  try {
    let grievances = [];
    if (user.role === 'complainant') {
      // Complainant sees only their own filings
      grievances = await db.query(
        `SELECT g.*, u.name as nodal_name, u.email as nodal_email 
         FROM grievances g 
         LEFT JOIN users u ON g.nodal_officer_id = u.id 
         WHERE g.complainant_id = ? 
         ORDER BY g.created_at DESC`,
        [user.id]
      );
    } else if (user.role === 'nodal_officer') {
      // Nodal Officer sees all grievances matching their sector (complainant_type)
      grievances = await db.query(
        `SELECT g.*, u.name as complainant_name, u.email as complainant_email, u.complainant_type 
         FROM grievances g 
         JOIN users u ON g.complainant_id = u.id 
         WHERE u.complainant_type = ? 
         ORDER BY g.created_at DESC`,
        [user.complainant_type]
      );
    } else if (user.role === 'appellate_authority') {
      // Appellate Authority sees escalated grievances matching their sector (e.g. Ombudsman -> student)
      grievances = await db.query(
        `SELECT g.*, u.name as complainant_name, u.email as complainant_email, u.complainant_type,
                n.name as nodal_name, n.email as nodal_email
         FROM grievances g 
         JOIN users u ON g.complainant_id = u.id 
         LEFT JOIN users n ON g.nodal_officer_id = n.id
         WHERE u.complainant_type = ? AND g.status = 'escalated'
         ORDER BY g.created_at DESC`,
        [user.complainant_type]
      );
    } else if (user.role === 'admin') {
      // Admin sees everything
      grievances = await db.query(
        `SELECT g.*, c.name as complainant_name, c.email as complainant_email, c.complainant_type,
                n.name as nodal_name, n.email as nodal_email
         FROM grievances g 
         JOIN users c ON g.complainant_id = c.id 
         LEFT JOIN users n ON g.nodal_officer_id = n.id 
         ORDER BY g.created_at DESC`
      );
    }
    res.json(grievances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific grievance details & audit trail
app.get('/api/grievances/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  
  try {
    const grievances = await db.query(
      `SELECT g.*, c.name as complainant_name, c.email as complainant_email, c.complainant_type, c.phone as complainant_phone,
              n.name as nodal_name, n.email as nodal_email
       FROM grievances g 
       JOIN users c ON g.complainant_id = c.id 
       LEFT JOIN users n ON g.nodal_officer_id = n.id 
       WHERE g.id = ?`,
      [id]
    );
    
    if (grievances.length === 0) {
      return res.status(404).json({ message: 'Grievance not found.' });
    }
    
    const grievance = grievances[0];
    
    // Security Access checks
    if (user.role === 'complainant' && grievance.complainant_id !== user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    if (user.role === 'nodal_officer' && grievance.complainant_type !== user.complainant_type) {
      return res.status(403).json({ message: 'Access denied to other sectors.' });
    }
    if (user.role === 'appellate_authority' && grievance.complainant_type !== user.complainant_type) {
      return res.status(403).json({ message: 'Access denied to other sectors.' });
    }
    
    // Get History audit trail
    const history = await db.query(
      `SELECT h.*, u.name as action_by_name, u.role as action_by_role 
       FROM grievance_history h 
       JOIN users u ON h.action_by = u.id 
       WHERE h.grievance_id = ? 
       ORDER BY h.created_at ASC`,
      [id]
    );
    
    res.json({ grievance, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Take action on a grievance (supports file upload for resolution reports)
app.post('/api/grievances/:id/action', authenticateToken, upload.single('resolution_report'), async (req, res) => {
  const { id } = req.params;
  const { action, remarks } = req.body; // Action: in_progress, intermediate_reply, resolve, appeal, finalize
  const user = req.user;
  const resolutionReportPath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!remarks) {
    return res.status(400).json({ message: 'Remarks are required.' });
  }

  // Require resolution report when resolving
  if (action === 'resolve' && user.role === 'nodal_officer' && !resolutionReportPath) {
    return res.status(400).json({ message: 'Resolution report attachment is required when submitting a resolution.' });
  }

  try {
    const grievances = await db.query('SELECT g.*, u.complainant_type FROM grievances g JOIN users u ON g.complainant_id = u.id WHERE g.id = ?', [id]);
    if (grievances.length === 0) return res.status(404).json({ message: 'Grievance not found.' });
    const grievance = grievances[0];

    let newStatus = grievance.status;
    let updateFields = [];
    let updateParams = [];

    if (action === 'in_progress' && user.role === 'nodal_officer') {
      newStatus = 'in_progress';
      updateFields.push('status = ?');
      updateParams.push('in_progress');
    } else if (action === 'intermediate_reply' && user.role === 'nodal_officer') {
      // Non-committal update: keep status as in_progress, no resolution report required
      newStatus = grievance.status;
    } else if (action === 'resolve' && user.role === 'nodal_officer') {
      newStatus = 'resolved';
      updateFields.push('status = ?', 'resolved_at = NOW()');
      updateParams.push('resolved');
      if (resolutionReportPath) {
        updateFields.push('resolution_report_path = ?');
        updateParams.push(resolutionReportPath);
      }
    } else if (action === 'resolve' && user.role === 'complainant' && grievance.status === 'resolved') {
      // Complainant accepting a proposed resolution — finalize and close
      newStatus = 'resolved';
      updateFields.push('status = ?', 'resolved_at = NOW()');
      updateParams.push('resolved');
    } else if (action === 'appeal' && user.role === 'complainant' && grievance.status === 'resolved') {
      newStatus = 'escalated';
      updateFields.push('status = ?');
      updateParams.push('escalated');
    } else if (action === 'finalize' && (user.role === 'appellate_authority' || user.role === 'admin')) {
      newStatus = 'resolved';
      updateFields.push('status = ?', 'resolved_at = NOW()');
      updateParams.push('resolved');
    } else {
      return res.status(400).json({ message: 'Unauthorized or invalid status transition.' });
    }

    if (updateFields.length > 0) {
      updateParams.push(id);
      await db.query(`UPDATE grievances SET ${updateFields.join(', ')} WHERE id = ?`, updateParams);
    }

    // Log history
    const historyRemarks = resolutionReportPath
      ? `${remarks} [Resolution Report: ${resolutionReportPath}]`
      : remarks;
    await db.query(
      'INSERT INTO grievance_history (grievance_id, action_by, action_type, remarks) VALUES (?, ?, ?, ?)',
      [id, user.id, action, historyRemarks]
    );

    // Send email notification (non-blocking)
    // When complainant accepts resolution, use special action for correct email template
    const emailAction = (action === 'resolve' && user.role === 'complainant') ? 'resolve_accepted' : action;
    sendNotification({ action: emailAction, grievance, remarks: historyRemarks, actingUser: user });

    res.json({ message: 'Grievance status updated successfully.', status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN SYSTEM & MIS ROUTERS ---

// Get Users list for admin
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden.' });
  try {
    const list = await db.query(
      "SELECT id, name, email, role, complainant_type, phone, created_at FROM users WHERE role IN ('nodal_officer', 'appellate_authority')"
    );
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Update administrative users (Nodal Officers, Appellate Authorities)
app.post('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden.' });
  const { name, email, password, role, complainant_type, phone, appellate_title } = req.body;
  
  if (!name || !email || !role || !complainant_type) {
    return res.status(400).json({ message: 'Name, email, role, and complainant type/sector are required.' });
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = password ? await bcrypt.hash(password, salt) : '$2a$10$tZ20bZz98p/eK.K7jUf2FuyXF41F5uT5kG70D.f/M38R7hK0oW0e.'; // default hash of admin123
    
    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      // Update existing
      if (password) {
        await db.query(
          'UPDATE users SET name = ?, role = ?, complainant_type = ?, phone = ?, password_hash = ? WHERE email = ?',
          [name, role, complainant_type, phone || null, hash, email]
        );
      } else {
        await db.query(
          'UPDATE users SET name = ?, role = ?, complainant_type = ?, phone = ? WHERE email = ?',
          [name, role, complainant_type, phone || null, email]
        );
      }
    } else {
      // Create new
      await db.query(
        'INSERT INTO users (name, email, password_hash, role, complainant_type, phone) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, hash, role, complainant_type, phone || null]
      );
    }
    
    // If it's an appellate authority, sync with appellate_officers configuration table
    if (role === 'appellate_authority') {
      const existingAppellate = await db.query('SELECT id FROM appellate_officers WHERE complainant_type = ?', [complainant_type]);
      const title = appellate_title || (complainant_type === 'student' ? 'Ombudsman (Lokpal)' : 'Appellate Authority');
      if (existingAppellate.length > 0) {
        await db.query(
          'UPDATE appellate_officers SET name = ?, title = ?, email = ? WHERE complainant_type = ?',
          [name, title, email, complainant_type]
        );
      } else {
        await db.query(
          'INSERT INTO appellate_officers (complainant_type, name, title, email) VALUES (?, ?, ?, ?)',
          [complainant_type, name, title, email]
        );
      }
    }
    
    res.json({ message: 'Officer settings configured successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update timeline configurations
app.put('/api/admin/settings', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden.' });
  const { student_resolution_days, faculty_resolution_days, staff_resolution_days } = req.body;
  
  try {
    if (student_resolution_days) {
      await db.query("UPDATE system_settings SET setting_value = ? WHERE setting_key = 'student_resolution_days'", [student_resolution_days]);
    }
    if (faculty_resolution_days) {
      await db.query("UPDATE system_settings SET setting_value = ? WHERE setting_key = 'faculty_resolution_days'", [faculty_resolution_days]);
    }
    if (staff_resolution_days) {
      await db.query("UPDATE system_settings SET setting_value = ? WHERE setting_key = 'staff_resolution_days'", [staff_resolution_days]);
    }
    res.json({ message: 'System resolution timelines updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate MIS Analytics & Reports
app.get('/api/admin/reports', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden.' });
  
  try {
    // 1. Overall stats
    const totalCount = await db.query('SELECT COUNT(*) as count FROM grievances');
    const pendingCount = await db.query("SELECT COUNT(*) as count FROM grievances WHERE status = 'pending'");
    const progressCount = await db.query("SELECT COUNT(*) as count FROM grievances WHERE status = 'in_progress'");
    const resolvedCount = await db.query("SELECT COUNT(*) as count FROM grievances WHERE status = 'resolved'");
    const escalatedCount = await db.query("SELECT COUNT(*) as count FROM grievances WHERE status = 'escalated'");
    
    // 2. Sector wise distribution (Student, Faculty, Staff)
    const sectorStats = await db.query(
      `SELECT u.complainant_type, 
              COUNT(g.id) as total,
              SUM(CASE WHEN g.status = 'resolved' THEN 1 ELSE 0 END) as resolved,
              SUM(CASE WHEN g.status != 'resolved' THEN 1 ELSE 0 END) as pending
       FROM grievances g
       JOIN users u ON g.complainant_id = u.id
       GROUP BY u.complainant_type`
    );
    
    // 3. Category wise distribution
    const categoryStats = await db.query(
      `SELECT category, COUNT(*) as count 
       FROM grievances 
       GROUP BY category`
    );
    
    // 4. Average resolution time (in days)
    const avgSpeed = await db.query(
      `SELECT AVG(TIMESTAMPDIFF(DAY, created_at, resolved_at)) as avg_days 
       FROM grievances 
       WHERE resolved_at IS NOT NULL`
    );
    
    res.json({
      summary: {
        total: totalCount[0].count,
        pending: pendingCount[0].count,
        in_progress: progressCount[0].count,
        resolved: resolvedCount[0].count,
        escalated: escalatedCount[0].count
      },
      sectorStats,
      categoryStats,
      averageResolutionDays: avgSpeed[0].avg_days ? parseFloat(avgSpeed[0].avg_days).toFixed(1) : 'N/A'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EMAIL NOTIFICATION SIMULATOR ROUTERS ---
app.get('/api/reminders/nodal', authenticateToken, async (req, res) => {
  // Fetches SLA warnings and triggers email alerts for urgent/overdue cases
  try {
    const pendingGrievances = await db.query(
      `SELECT g.id, g.title, g.created_at, g.timeline_days, g.nodal_officer_id,
              u.complainant_type, u.name as complainant_name,
              DATEDIFF(NOW(), g.created_at) as days_elapsed
       FROM grievances g
       JOIN users u ON g.complainant_id = u.id
       WHERE g.status != 'resolved'`
    );

    const logs = [];
    for (const g of pendingGrievances) {
      const remaining = g.timeline_days - g.days_elapsed;
      const isOverdue = remaining < 0;

      let priority = 'low';
      let message = `Daily reminder: Grievance #${g.id} ("${g.title}") is pending. ${remaining} days remaining.`;

      if (remaining <= 3 && remaining >= 0) {
        priority = 'high';
        message = `URGENT S.O.S: Grievance #${g.id} submitted by ${g.complainant_name} is nearing its timeline. Only ${remaining} days left to resolve!`;
      } else if (isOverdue) {
        priority = 'critical';
        message = `ESC SLA BREACH: Grievance #${g.id} is overdue by ${Math.abs(remaining)} days! The case is eligible for direct escalation to the Ombudsman.`;
      }

      // Send SLA email for high/critical cases (non-blocking)
      if ((priority === 'high' || priority === 'critical') && g.nodal_officer_id) {
        try {
          const nodals = await db.query('SELECT id, name, email FROM users WHERE id = ?', [g.nodal_officer_id]);
          if (nodals.length > 0) {
            email.notifySlaWarning(
              { id: g.id, title: g.title },
              nodals[0],
              g.complainant_name,
              remaining,
              isOverdue
            );
          }
        } catch (e) {
          console.error('[SLA Email Error]', e.message);
        }
      }

      logs.push({
        id: g.id,
        grievanceId: g.id,
        category: g.complainant_type,
        priority,
        message,
        timestamp: new Date().toISOString()
      });
    }

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SEEDING & START ROUTINE ---
async function startServer() {
  // 1. Establish database connection
  await db.connectWithRetry();
  
  // 2. Auto-seed core roles if table is empty
  try {
    const userCountResult = await db.query('SELECT COUNT(*) as count FROM users');
    const userCount = userCountResult[0].count;
    
    if (userCount === 0) {
      console.log('[Seeding] Users table is empty. Scaffolding administrative accounts...');
      
      const salt = await bcrypt.genSalt(10);
      const adminHash = await bcrypt.hash('admin123', salt);
      const nodalHash = await bcrypt.hash('nodal123', salt);
      const appellateHash = await bcrypt.hash('appellate123', salt);
      const studentHash = await bcrypt.hash('student123', salt);
      
      // Admin
      await db.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ('System Administrator', 'admin@srfti.ac.in', ? , 'admin')",
        [adminHash]
      );
      
      // Nodal Officers
      await db.query(
        "INSERT INTO users (name, email, password_hash, role, complainant_type, phone) VALUES ('Dr. Pritha Sen (Student Nodal)', 'student_nodal@srfti.ac.in', ?, 'nodal_officer', 'student', '+91-3324329323')",
        [nodalHash]
      );
      await db.query(
        "INSERT INTO users (name, email, password_hash, role, complainant_type, phone) VALUES ('Prof. S. Das (Faculty Nodal)', 'faculty_nodal@srfti.ac.in', ?, 'nodal_officer', 'faculty', '+91-3324329324')",
        [nodalHash]
      );
      await db.query(
        "INSERT INTO users (name, email, password_hash, role, complainant_type, phone) VALUES ('Sri. M. K. Roy (Staff Nodal)', 'staff_nodal@srfti.ac.in', ?, 'nodal_officer', 'staff', '+91-3324329325')",
        [nodalHash]
      );
      
      // Appellate Authority (Ombudsman)
      await db.query(
        "INSERT INTO users (name, email, password_hash, role, complainant_type, phone) VALUES ('Prof. Ramesh Chandra', 'ombudsman@srfti.ac.in', ?, 'appellate_authority', 'student', '+91-9830098300')",
        [appellateHash]
      );
      // Faculty Appellate Authority (Dean)
      await db.query(
        "INSERT INTO users (name, email, password_hash, role, complainant_type, phone) VALUES ('Dr. Debasish Ray', 'dean@srfti.ac.in', ?, 'appellate_authority', 'faculty', '+91-9830098301')",
        [appellateHash]
      );
      // Staff Appellate Authority (Registrar)
      await db.query(
        "INSERT INTO users (name, email, password_hash, role, complainant_type, phone) VALUES ('Sri Anindya Guha', 'registrar@srfti.ac.in', ?, 'appellate_authority', 'staff', '+91-9830098302')",
        [appellateHash]
      );
      
      // Sample Complainant
      await db.query(
        "INSERT INTO users (name, email, password_hash, role, complainant_type, phone) VALUES ('Rahul Banerjee', 'rahul@student.srfti.ac.in', ?, 'complainant', 'student', '+91-8889990001')",
        [studentHash]
      );
      
      console.log('[Seeding] Seeding admin and officer accounts completed successfully!');
    }
  } catch (err) {
    console.error('[Seeding] Auto-seeding encountered an error:', err.message);
  }
  
  // 3. Verify SMTP connection
  email.verifySmtpConnection();

  // 4. Start listener
  app.listen(PORT, () => {
    console.log(`[Express] Server running on port ${PORT}`);
    console.log(`[Email] Transactional emails configured via agent@ailab.srfti.ac.in (Google Workspace SMTP)`);
  });
}

startServer();
