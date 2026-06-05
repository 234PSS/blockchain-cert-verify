-- Development seed data
-- Login password for all seeded users: Password123!

INSERT INTO Users (user_id, name, email, password_hash, role, wallet_address, created_at, updated_at) VALUES
(1, 'Admin User', 'admin@blockcert.edu', '$2a$10$uB.I4Gy/kLDmHPhPTFZAzu9DdoN.a.gmmMK4p88tpZQKbZc5ZwFte', 'admin', '0x1234567890123456789012345678901234567890', NOW(), NOW()),
(2, 'Registrar Smith', 'registrar@stateuniv.edu', '$2a$10$uB.I4Gy/kLDmHPhPTFZAzu9DdoN.a.gmmMK4p88tpZQKbZc5ZwFte', 'university_staff', '0xabcdef1234567890abcdef1234567890abcdef12', NOW(), NOW()),
(3, 'John Doe', 'john.doe@student.edu', '$2a$10$uB.I4Gy/kLDmHPhPTFZAzu9DdoN.a.gmmMK4p88tpZQKbZc5ZwFte', 'student', '0x9876543210987654321098765432109876543210', NOW(), NOW());

INSERT INTO Institutions (
    institution_id, name, address, contact_email, wallet_address, is_verified,
    verification_date, created_at, updated_at
) VALUES
(1, 'State University', '123 University Ave, Dhaka', 'admin@stateuniv.edu', '0xabcdef1234567890abcdef1234567890abcdef12', TRUE, NOW(), NOW(), NOW());

INSERT INTO Students (
    student_id, user_id, student_number, enrollment_date, graduation_date,
    department, degree_program, created_at, updated_at
) VALUES
(1, 3, 'STU2024001', '2020-09-01', '2024-06-30', 'Computer Science', 'Bachelor of Science', NOW(), NOW());

INSERT INTO Courses (course_id, course_code, course_name, credits, institution_id, created_at) VALUES
(1, 'CS401', 'Blockchain Development', 3, 1, NOW());

INSERT INTO Certificates (
    certificate_id, student_id, course_id, institution_id, certificate_hash,
    blockchain_tx_hash, blockchain_certificate_id, grade, remarks,
    document_path, document_original_name, document_mime_type, document_hash,
    qr_code_path, created_at, updated_at
) VALUES
(1, 1, 1, 1,
 'f2a7b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef1234',
 '0x1111111111111111111111111111111111111111111111111111111111111111',
 '0x2222222222222222222222222222222222222222222222222222222222222222',
 'A', 'Seed certificate for local verification demos',
 'certificates/sample-certificate.pdf', 'sample-certificate.pdf', 'application/pdf',
 '3333333333333333333333333333333333333333333333333333333333333333',
 'qr/cert-1.png', NOW(), NOW());

INSERT INTO VerificationLogs (
    certificate_id, verifier_ip, verification_status, verification_timestamp,
    blockchain_verification
) VALUES
(1, '127.0.0.1', 'valid', NOW(), TRUE);
