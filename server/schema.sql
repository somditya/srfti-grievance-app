-- SQL Schema for SRFTI Grievance Redressal Portal

CREATE DATABASE IF NOT EXISTS srfti_grievance;
USE srfti_grievance;

-- Drop tables in reverse order of dependencies to avoid constraint violations
DROP TABLE IF EXISTS grievance_history;
DROP TABLE IF EXISTS grievances;
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
  complainant_id INT NOT NULL,
  category VARCHAR(100) NOT NULL, -- Academic, Facilities, Admin, Harassment, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  attachment_path VARCHAR(255) NULL,
  resolution_report_path VARCHAR(255) NULL,
  status ENUM('pending', 'in_progress', 'resolved', 'escalated') DEFAULT 'pending',
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

-- --- SEED DATA ---

-- Seed Default Timelines
INSERT INTO system_settings (setting_key, setting_value) VALUES 
('student_resolution_days', '22'),
('faculty_resolution_days', '15'),
('staff_resolution_days', '30');

-- Seed Default Appellate Authorities (Ombudsman for students)
INSERT INTO appellate_officers (complainant_type, name, title, email) VALUES
('student', 'Prof. Ramesh Chandra', 'Ombudsman (Lokpal)', 'ombudsman@srfti.ac.in'),
('faculty', 'Dr. Debasish Ray', 'Dean (Academic Affairs)', 'dean@srfti.ac.in'),
('staff', 'Sri Anindya Guha', 'Registrar', 'registrar@srfti.ac.in');
