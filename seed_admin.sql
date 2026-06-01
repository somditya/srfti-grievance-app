INSERT INTO users (name, email, password_hash, role, complainant_type, email_verified) VALUES
('System Administrator', 'admin@srfti.ac.in', '$2a$10$8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e', 'admin', NULL, 1),
('Student Nodal Officer', 'student_nodal@srfti.ac.in', '$2a$10$8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e', 'nodal_officer', 'student', 1),
('Ombudsman', 'ombudsman@srfti.ac.in', '$2a$10$8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e', 'appellate_authority', 'student', 1),
('Faculty Nodal Officer', 'faculty_nodal@srfti.ac.in', '$2a$10$8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e', 'nodal_officer', 'faculty', 1),
('Dean Academic', 'dean@srfti.ac.in', '$2a$10$8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e', 'appellate_authority', 'faculty', 1),
('Staff Nodal Officer', 'staff_nodal@srfti.ac.in', '$2a$10$8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e', 'nodal_officer', 'staff', 1),
('Registrar', 'registrar@srfti.ac.in', '$2a$10$8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e', 'appellate_authority', 'staff', 1);