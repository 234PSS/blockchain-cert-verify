# Blockchain Certificate Verification System

A university certificate issuing and verification system with an Express/MySQL backend, React frontend, and Ethereum smart contract verification.

## Tech Stack

- Backend: Node.js, Express, Sequelize, MySQL
- Frontend: React, Vite, React Router
- Blockchain: Solidity, Truffle, Ganache, ethers.js
- Security: JWT auth, bcrypt password hashing, role-based access control
- Files: local certificate uploads and generated QR codes

## Main Features

- Student and university staff registration/login
- Admin/staff certificate issuing with document upload
- Certificate hash storage in database and blockchain
- QR code generation for public verification links
- Public certificate verification by certificate ID or QR link
- Student dashboard for viewing own certificates
- Admin/staff certificate lists and revocation
- Verification logs for public checks

## Setup

### 1. Install Dependencies

```bash
npm install
npm run client:install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Update `.env` with your MySQL credentials, JWT secret, Ganache URL, and Ganache private key.

Important variables:

```text
PORT=3000
PUBLIC_BASE_URL=http://localhost:5173
DB_HOST=localhost
DB_NAME=certificate_db
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=change_this_to_a_long_random_secret
GANACHE_URL=http://127.0.0.1:7545
PRIVATE_KEY=your_ganache_account_private_key
```

### 3. Database

Create the MySQL database:

```sql
CREATE DATABASE certificate_db;
```

The app uses Sequelize models and runs `sequelize.sync({ force: false })` on startup. The `database/schema.sql` and `migrations/` files document the same table structure for manual setup or review.

Optional seed data:

```bash
mysql -u root -p certificate_db < database/seeds.sql
```

Seed login password for all users is:

```text
Password123!
```

### 4. Blockchain

Start Ganache on port `7545`, then compile and migrate:

```bash
npm run compile
npm run migrate
```

Truffle uses `truffle-migrations/`. Deployment writes backend-readable contract files to:

```text
src/config/contract.deployment.json
src/config/CertificateRegistry.json
```

### 5. Run the App

Backend:

```bash
npm run dev
```

Frontend:

```bash
npm run client:dev
```

Open:

```text
http://localhost:5173
```

## API Summary

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

Certificates:

- `POST /api/certificates/issue` - admin/staff, multipart form with `document`
- `GET /api/certificates/verify/:certificateId` - public
- `GET /api/certificates/me` - student only
- `GET /api/certificates/student/:studentId` - admin/staff
- `PUT /api/certificates/revoke/:certificateId` - admin/staff
- `GET /api/certificates/all` - admin only

Health:

- `GET /health`

## User Roles

- `admin`: list all certificates, issue, revoke
- `university_staff`: issue/revoke for verified institution data
- `student`: view own certificates
- public user: verify certificates without login

## Testing and QA

Run backend tests:

```bash
npm test -- --runInBand
```

Build frontend:

```bash
npm run client:build
```

Lint backend:

```bash
npm run lint
```

Compile smart contract:

```bash
npm run compile
```

## Troubleshooting

- `Blockchain service is not available`: start Ganache, set `GANACHE_URL` and `PRIVATE_KEY`, then run `npm run migrate`.
- `Contract not deployed`: run `npm run compile && npm run migrate`.
- QR codes point to backend instead of frontend: set `PUBLIC_BASE_URL=http://localhost:5173`.
- Database connection fails: confirm MySQL is running and `.env` credentials match the database.
- Certificate issue fails for staff: ensure the institution is marked `is_verified`.

## Current Limitations

- Uploaded files are stored locally under `uploads/`; production deployment should use durable object storage.
- Database migrations are present as project references, but the runtime currently uses Sequelize sync.
- End-to-end browser tests are not included yet; backend API tests and frontend production build are covered.
