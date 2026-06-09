-- Users Table: Base user accounts for all roles (admin, university_staff, student)
CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY,
-- Blockchain Certificate Verification System schema
-- Matches the Sequelize models and migrations in this repository.

CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'university_staff', 'student') NOT NULL DEFAULT 'student',
    wallet_address VARCHAR(42) UNIQUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE Institutions (
    institution_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    contact_email VARCHAR(100),
    wallet_address VARCHAR(42) UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

-- Students Table: Student-specific information
CREATE TABLE students (
    student_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE,
CREATE TABLE Students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    student_number VARCHAR(50) UNIQUE NOT NULL,
    enrollment_date DATE NOT NULL,
    graduation_date DATE,
    department VARCHAR(100),
    degree_program VARCHAR(100),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT students_user_fk FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Courses (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credits INT,
    institution_id INT,
    created_at DATETIME NOT NULL,
    CONSTRAINT courses_institution_fk FOREIGN KEY (institution_id) REFERENCES Institutions(institution_id)
);

-- Certificates Table: Academic certificates with blockchain references
CREATE TABLE certificates (
    certificate_id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
CREATE TABLE Certificates (
    certificate_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    institution_id INT NOT NULL,
    certificate_hash VARCHAR(66) NOT NULL,
    blockchain_tx_hash VARCHAR(66) UNIQUE,
    blockchain_certificate_id VARCHAR(66),
    grade VARCHAR(10),
    remarks TEXT,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at DATETIME,
    revoked_reason TEXT,
    document_path VARCHAR(255),
    document_original_name VARCHAR(255),
    document_mime_type VARCHAR(100),
    document_hash VARCHAR(64),
    qr_code_path VARCHAR(255),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT certificates_student_fk FOREIGN KEY (student_id) REFERENCES Students(student_id),
    CONSTRAINT certificates_course_fk FOREIGN KEY (course_id) REFERENCES Courses(course_id),
    CONSTRAINT certificates_institution_fk FOREIGN KEY (institution_id) REFERENCES Institutions(institution_id)
);

CREATE TABLE VerificationLogs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    certificate_id VARCHAR(36),
    verifier_wallet_address VARCHAR(42),
    verifier_ip VARCHAR(45),
    verification_status ENUM('valid', 'invalid', 'revoked', 'not_found') NOT NULL,
    verification_timestamp DATETIME NOT NULL,
    blockchain_verification BOOLEAN,
    error_message TEXT,
    CONSTRAINT verification_logs_certificate_fk FOREIGN KEY (certificate_id) REFERENCES Certificates(certificate_id)
);

CREATE TABLE BlockchainTransactions (
    tx_id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    function_name VARCHAR(100) NOT NULL,
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    gas_used BIGINT,
    gas_price BIGINT,
    block_number INT,
    created_at DATETIME NOT NULL,
    completed_at DATETIME
);

-- API Keys Table: For external system access
CREATE TABLE api_keys (
    key_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36),
    api_key VARCHAR(64) UNIQUE NOT NULL,
    key_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Indexes for performance
CREATE INDEX idx_certificates_student_id ON certificates(student_id);
CREATE INDEX idx_certificates_hash ON certificates(certificate_hash);
CREATE INDEX idx_certificates_blockchain_id ON certificates(blockchain_certificate_id);
CREATE INDEX idx_verification_logs_timestamp ON verification_logs(verification_timestamp);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_student_number ON students(student_number);
CREATE INDEX idx_certificates_student_id ON Certificates(student_id);
CREATE INDEX idx_certificates_hash ON Certificates(certificate_hash);
CREATE INDEX idx_certificates_blockchain_id ON Certificates(blockchain_certificate_id);
CREATE INDEX idx_verification_logs_timestamp ON VerificationLogs(verification_timestamp);
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_students_student_number ON Students(student_number);
