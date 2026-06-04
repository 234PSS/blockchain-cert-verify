-- Visual ER Diagram using Graphviz DOT format (can be rendered with tools like dbdiagram.io)

-- Entities:
-- users: user_id (PK), name, email, password_hash, role, wallet_address
-- institutions: institution_id (PK), name, address, contact_email, wallet_address, is_verified
-- students: student_id (PK), user_id (FK), student_number, enrollment_date, graduation_date, department
-- courses: course_id (PK), course_code, course_name, credits, institution_id (FK)
-- certificates: certificate_id (PK), student_id (FK), course_id (FK), institution_id (FK), certificate_hash, blockchain_tx_hash, is_revoked
-- verification_logs: log_id (PK), certificate_id (FK), verifier_wallet_address, verification_status, verification_timestamp
-- blockchain_transactions: tx_id (PK), transaction_hash, contract_address, function_name, status, gas_used
-- api_keys: key_id (PK), user_id (FK), api_key, is_active, expires_at

-- Relationships:
-- users.user_id ───< students.user_id (One-to-One)
-- institutions.institution_id ───< courses.institution_id (One-to-Many)
-- students.student_id ───< certificates.student_id (One-to-Many)
-- courses.course_id ───< certificates.course_id (One-to-Many)
-- certificates.certificate_id ───< verification_logs.certificate_id (One-to-Many)
-- users.user_id ───< api_keys.user_id (One-to-Many)