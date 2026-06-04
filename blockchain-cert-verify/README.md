# Blockchain Certificate Verification System

A decentralized university certificate verification system using Ethereum blockchain.

## Prerequisites
- Node.js (v16+)
- MySQL Server
- Ganache (CLI or GUI)
- Truffle Suite

## Project Structure
```
├── contracts/           # Solidity smart contracts
├── scripts/             # Deployment scripts
├── migrations/          # Database migrations
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── models/          # Sequelize models
│   ├── routes/          # Express routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── dtos/            # Data transfer objects
├── test/                # Test files
└── artifacts/           # Compiled contracts
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Update `.env` with your database and Ganache credentials.

### 3. Start Ganache
```bash
ganache-cli
# or use Ganache GUI on port 7545
```

### 4. Run Migrations
```bash
truffle migrate --network development
```

### 5. Start Server
```bash
npm run dev
```

## API Endpoints

### Auth
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login user
- GET `/api/auth/profile` - Get user profile

### Certificates
- POST `/api/certificates/issue` - Issue certificate (university/admin only)
- GET `/api/certificates/verify/:id` - Verify certificate
- GET `/api/certificates/student/:studentId` - Get student certificates
- PUT `/api/certificates/revoke/:id` - Revoke certificate
- GET `/api/certificates/all` - List all certificates

## Smart Contract Functions
- `issueCertificate()` - Issue a new certificate
- `verifyCertificate()` - Verify certificate authenticity
- `revokeCertificate()` - Revoke a certificate
- `getCertificate()` - Get certificate details
- `authorizeUniversity()` - Authorize university to issue certificates