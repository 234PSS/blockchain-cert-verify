# Database Schema Documentation

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌────────────┐
│   users     │──────▶│   students   │──────▶│certificates │
└─────────────┘       └──────────────┘       └────────────┘
       │                      │                     │
       │                      │                     │
       ▼                      ▼                     ▼
  (user_id)              (student_id)       (certificate_id)
                           │    │              │    │
                           │    │              │    │
                           ▼    ▼              ▼    ▼
┌─────────────┐       ┌──────────────┐       ┌────────────┐
│institutions │◀──────│    courses   │◀──────│ verification│
└─────────────┘       └──────────────┘       │    logs    │
                                              └────────────┘
                                                   │
                                                   ▼
                                           (certificate_id)
```

## Table Descriptions

### 1. users
**Purpose:** Central authentication table for all system users

| Column | Type | Description |
|--------|------|-------------|
| user_id | INT (PK) | Unique user identifier |
| name | VARCHAR(100) | Full name of user |
| email | VARCHAR(100) | Unique email for login |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| role | ENUM | 'admin', 'university_staff', or 'student' |
| wallet_address | VARCHAR(42) | Ethereum wallet for signing |

### 2. institutions
**Purpose:** Store verified university/institution information

| Column | Type | Description |
|--------|------|-------------|
| institution_id | INT (PK) | Unique institution identifier |
| name | VARCHAR(200) | Official institution name |
| address | TEXT | Physical address |
| contact_email | VARCHAR(100) | Official contact email |
| wallet_address | VARCHAR(42) | Authorized to issue certificates |
| is_verified | BOOLEAN | Admin-approved status |

### 3. students
**Purpose:** Student academic records (extends users)

| Column | Type | Description |
|--------|------|-------------|
| student_id | INT (PK) | Unique student identifier |
| user_id | INT (FK) | Link to users table |
| student_number | VARCHAR(50) | University student ID |
| enrollment_date | DATE | Start date |
| graduation_date | DATE | Graduation date (nullable) |

### 4. courses
**Purpose:** Academic course catalog

| Column | Type | Description |
|--------|------|-------------|
| course_id | INT (PK) | Unique course identifier |
| course_code | VARCHAR(20) | Unique course code (e.g., CS101) |
| course_name | VARCHAR(100) | Full course name |
| credits | INT | Credit hours |
| institution_id | INT (FK) | Offering institution |

### 5. certificates
**Purpose:** Main certificate records with blockchain references

| Column | Type | Description |
|--------|------|-------------|
| certificate_id | INT (PK) | Unique certificate identifier |
| student_id | INT (FK) | Certificate recipient |
| course_id | INT (FK) | Course completed |
| institution_id | INT (FK) | Issuing institution |
| certificate_hash | VARCHAR(66) | SHA256 hash for integrity |
| blockchain_tx_hash | VARCHAR(66) | Transaction ID on chain |
| is_revoked | BOOLEAN | Revocation status |

### 6. verification_logs
**Purpose:** Audit trail for all verifications

| Column | Type | Description |
|--------|------|-------------|
| log_id | INT (PK) | Log entry identifier |
| certificate_id | INT (FK) | Certificate checked |
| verifier_wallet_address | VARCHAR(42) | Who verified |
| verification_status | ENUM | 'valid', 'invalid', 'revoked', 'not_found' |
| blockchain_verification | BOOLEAN | True if on-chain check performed |

### 7. blockchain_transactions
**Purpose:** Track all blockchain interactions

| Column | Type | Description |
|--------|------|-------------|
| tx_id | INT (PK) | Transaction record |
| transaction_hash | VARCHAR(66) | Blockchain transaction hash |
| function_name | VARCHAR(100) | Called function (e.g., issueCertificate) |
| status | ENUM | 'pending', 'success', 'failed' |
| gas_used | BIGINT | Gas consumed |

## Key Relationships

1. **users → students** (1:1 optional) - A user can be a student
2. **institutions → courses** (1:N) - Institutions offer multiple courses
3. **students → certificates** (1:N) - Students receive multiple certificates
4. **courses → certificates** (1:N) - Courses have multiple certificates
5. **certificates → verification_logs** (1:N) - Each certificate has many verifications

## Cardinalities

- One admin/university_staff can issue many certificates
- One student can have many certificates
- One course can have many certificates
- Each certificate is verified many times
- Each institution can offer many courses