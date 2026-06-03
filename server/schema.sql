-- SQL Schema for SRFTI Grievance Redressal Portal

CREATE DATABASE IF NOT EXISTS srfti_grievance;
USE srfti_grievance;

-- Drop tables in reverse order of dependencies to avoid constraint violations
DROP TABLE IF EXISTS grievance_history;
DROP TABLE IF EXISTS grievances;
DROP TABLE IF EXISTS sgrc_members;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS appellate_officers;
DROP TABLE IF EXISTS users;

-- 1. Users Table (Complainants, Nodal Officers, Appellate, Admin)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('complainant', 'nodal_officer', 'appellate_authority', 'admin') NOT NULL,
  complainant_type ENUM('student', 'faculty', 'staff') NULL,
  phone VARCHAR(20) NULL,
  department VARCHAR(255) NULL,
  batch VARCHAR(50) NULL,
  gender ENUM('Male', 'Female', 'Other') NULL,
  category ENUM('General', 'SC', 'ST', 'OBC', 'EWS') NULL,
  registration_no VARCHAR(50) NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Appellate Officers Table
CREATE TABLE appellate_officers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complainant_type ENUM('student', 'faculty', 'staff') NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL, -- E.g. 'Ombudsman (Lokpal)' for student
  email VARCHAR(255) NOT NULL
);

-- 3. System Settings Table (Timelines, parameters)
CREATE TABLE system_settings (
  setting_key VARCHAR(255) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL
);

-- 4. Grievances Table
CREATE TABLE grievances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_id VARCHAR(20) NULL UNIQUE,
  complainant_id INT NOT NULL,
  category VARCHAR(100) NOT NULL, -- Academic, Facilities, Admin, Harassment, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  attachment_path VARCHAR(255) NULL,
  resolution_report_path VARCHAR(255) NULL,
  status ENUM('pending', 'in_progress', 'nodal_resolved', 'resolved', 'escalated', 'hearing_convened') DEFAULT 'pending',
  nodal_officer_id INT NULL,
  timeline_days INT NOT NULL, -- Captured snapshot from system settings at filing time
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (complainant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (nodal_officer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Grievance History Table (Audit Trail)
CREATE TABLE grievance_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grievance_id INT NOT NULL,
  action_by INT NOT NULL,
  action_type VARCHAR(100) NOT NULL, -- E.g., 'submitted', 'status_change', 'resolved', 'appealed'
  remarks TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE,
  FOREIGN KEY (action_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. SGRC Members Table (for landing page "Constitution of the SGRC" panel)
CREATE TABLE sgrc_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_en VARCHAR(255) NOT NULL,
  name_hi VARCHAR(255) NOT NULL,
  role_en VARCHAR(255) NOT NULL,
  role_hi VARCHAR(255) NOT NULL,
  designation_en VARCHAR(255) NULL,
  designation_hi VARCHAR(255) NULL,
  mobile VARCHAR(20) NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. GRC Staff Members Table (for landing page "Constitution of the GRC for Staff" panel)
CREATE TABLE grc_staff_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_en VARCHAR(255) NOT NULL,
  name_hi VARCHAR(255) NOT NULL,
  role_en VARCHAR(255) NOT NULL,
  role_hi VARCHAR(255) NOT NULL,
  designation_en VARCHAR(255) NULL,
  designation_hi VARCHAR(255) NULL,
  mobile VARCHAR(20) NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration script for existing databases (run after CREATE TABLE if needed)
-- ALTER TABLE sgrc_members ADD COLUMN designation_en VARCHAR(255) NULL;
-- ALTER TABLE sgrc_members ADD COLUMN designation_hi VARCHAR(255) NULL;
-- ALTER TABLE sgrc_members ADD COLUMN mobile VARCHAR(20) NULL;
-- ALTER TABLE grc_staff_members ADD COLUMN designation_en VARCHAR(255) NULL;
-- ALTER TABLE grc_staff_members ADD COLUMN designation_hi VARCHAR(255) NULL;

-- --- SEED DATA ---

-- Seed Default Timelines
INSERT INTO system_settings (setting_key, setting_value) VALUES
('student_resolution_days', '22'),
('faculty_resolution_days', '15'),
('staff_resolution_days', '30');

-- Seed Default SGRC Committee Members
INSERT INTO sgrc_members (name_en, name_hi, role_en, role_hi, designation_en, designation_hi, mobile, sort_order) VALUES
('Prof. Sudeshna Lahiri', 'प्रो. सुदेशना लाहिड़ी', 'Chairperson', 'अध्यक्ष', 'Professor', 'प्रोफेसर', '+91 98765 43210', 1),
('Prof. Sanjit Dey', 'प्रो. संजीत डे', 'Member', 'सदस्य', 'Professor', 'प्रोफेसर', '+91 98765 43211', 2),
('Prof. Siddhartha Sankar Saha', 'प्रो. सिद्धार्थ शंकर साहा', 'Member', 'सदस्य', 'Professor', 'प्रोफेसर', '+91 98765 43212', 3),
('Prof. Sandip Mondal', 'प्रो. संदीप मंडल', 'Member', 'सदस्य', 'Professor', 'प्रोफेसर', '+91 98765 43213', 4),
('Prof. Diptendu Chatterjee', 'प्रो. दीप्तेंदु चटर्जी', 'Member', 'सदस्य', 'Professor', 'प्रोफेसर', '+91 98765 43214', 5),
('Student Nominee', 'छात्र नामिती', 'Invitee Member', 'आमंत्रित सदस्य', 'Student Representative', 'छात्र प्रतिनिधि', '+91 98765 43215', 6);

-- Seed Default GRC Staff Committee Members
INSERT INTO grc_staff_members (name_en, name_hi, role_en, role_hi, designation_en, designation_hi, mobile, sort_order) VALUES
('Sri Amit Kumar', 'श्री अमित कुमार', 'Chairperson', 'अध्यक्ष', 'Senior Administrative Officer', 'सीनियर प्रशासनिक अधिकारी', '+91 98765 43220', 1),
('Smt. Priya Sharma', 'श्रीमति प्रिया शर्मा', 'Member', 'सदस्य', 'HR Manager', 'एचआर मैनेजर', '+91 98765 43221', 2),
('Shri Rajesh Singh', 'श्री राजेश सिंह', 'Member', 'सदस्य', 'Finance Officer', 'वित्त अधिकारी', '+91 98765 43222', 3),
('Smt. Sunita Devi', 'श्रीमति सुनीता देवी', 'Member', 'सदस्य', 'Security In-charge', 'सुरक्षा अधिकारी', '+91 98765 43223', 4),
('Shri Vikram Mehta', 'श्री विक्रम मेहता', 'Member', 'सदस्य', 'IT Coordinator', 'आईटी समन्वयक', '+91 98765 43224', 5);

-- Seed Sample Student User (for testing)
INSERT INTO users (name, email, password_hash, role, complainant_type, phone, department, batch, gender, category, registration_no) VALUES
('Rahul Banerjee', 'rahul@student.srfti.ac.in', '$2a$10$8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e', 'complainant', 'student', '+91-8889990001', 'Cinematography', '2023-2025', 'Male', 'General', 'SRFTI/2023/00123');

-- Seed Default Appellate Authorities (Ombudsman for students)
INSERT INTO appellate_officers (complainant_type, name, title, email) VALUES
('student', 'Prof. Ramesh Chandra', 'Ombudsman (Lokpal)', 'ombudsman@srfti.ac.in'),
('faculty', 'Dr. Debasish Ray', 'Dean (Academic Affairs)', 'dean@srfti.ac.in'),
('staff', 'Sri Anindya Guha', 'Registrar', 'registrar@srfti.ac.in');
