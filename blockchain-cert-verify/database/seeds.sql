-- Initial seed data for Blockchain Certificate Verification System

-- Create admin user
INSERT INTO users (name, email, password_hash, role, wallet_address) VALUES
('Admin User', 'admin@blockcert.edu', '$2a$10$hashedpassword', 'admin', '0x1234567890123456789012345678901234567890');

-- Create test institution
INSERT INTO institutions (name, address, contact_email, wallet_address, is_verified) VALUES
('State University', '123 University Ave, City', 'admin@stateuniv.edu', '0xabcdef1234567890abcdef1234567890abcdef12', TRUE, NOW());

-- Create university staff user
INSERT INTO users (name, email, password_hash, role, wallet_address) VALUES
('Registrar Smith', 'registrar@stateuniv.edu', '$2a$10$hashedpassword', 'university_staff', '0xabcdef1234567890abcdef1234567890abcdef12');

-- Create test student
INSERT INTO users (name, email, password_hash, role, wallet_address) VALUES
('John Doe', 'john.doe@student.edu', '$2a$10$hashedpassword', 'student', '0x9876543210987654321098765432109876543210');

-- Link student
INSERT INTO students (user_id, student_number, enrollment_date, department, degree_program) VALUES
(3, 'STU2024001', '2020-09-01', 'Computer Science', 'Bachelor of Science');

-- Create test course
INSERT INTO courses (course_code, course_name, credits, institution_id) VALUES
('CS401', 'Blockchain Development', 3, 1);

-- Create sample certificate
INSERT INTO certificates (
    student_id, course_id, institution_id, 
    certificate_hash, blockchain_tx_hash, blockchain_certificate_id, grade
) VALUES
(1, 1, 1, 
 '0xabc123def456...', '0x987xyz...', '0xcert123...', 'A');