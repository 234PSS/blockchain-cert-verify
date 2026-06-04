-- Users Table: Base user accounts for all roles (admin, university_staff, student)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'university_staff', 'student') NOT NULL,
    wallet_address VARCHAR(42) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Institutions Table: University/institution details
CREATE TABLE institutions (
    institution_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    contact_email VARCHAR(100),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students Table: Student-specific information
CREATE TABLE students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    student_number VARCHAR(50) UNIQUE NOT NULL,
    enrollment_date DATE NOT NULL,
    graduation_date DATE,
    department VARCHAR(100),
    degree_program VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Courses Table: Academic courses offered
CREATE TABLE courses (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credits INT,
    institution_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(institution_id)
);

-- Certificates Table: Academic certificates with blockchain references
CREATE TABLE certificates (
    certificate_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    institution_id INT NOT NULL,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    certificate_hash VARCHAR(66) NOT NULL, -- SHA256 hash
    blockchain_tx_hash VARCHAR(66) UNIQUE, -- Transaction hash on blockchain
    blockchain_certificate_id VARCHAR(66), -- Certificate ID stored on blockchain
    grade VARCHAR(10),
    remarks TEXT,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    revoked_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (institution_id) REFERENCES institutions(institution_id)
);

-- Verification Logs Table: Record of all certificate verification attempts
CREATE TABLE verification_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    certificate_id INT,
    verifier_wallet_address VARCHAR(42),
    verifier_ip VARCHAR(45),
    verification_status ENUM('valid', 'invalid', 'revoked', 'not_found') NOT NULL,
    verification_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blockchain_verification BOOLEAN,
    error_message TEXT,
    FOREIGN KEY (certificate_id) REFERENCES certificates(certificate_id)
);

-- Blockchain Transactions Table: Store blockchain transaction metadata
CREATE TABLE blockchain_transactions (
    tx_id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    function_name VARCHAR(100) NOT NULL,
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    gas_used BIGINT,
    gas_price BIGINT,
    block_number INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);

-- API Keys Table: For external system access
CREATE TABLE api_keys (
    key_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
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