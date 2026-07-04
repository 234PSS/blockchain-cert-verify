# Blockchain Certificate Verification System

A university certificate issuing and verification system with an Express/MySQL backend, React frontend, and Ethereum smart contract verification.

## Tech Stack

- Backend: Node.js, Express, Sequelize, MySQL
- Frontend: React, Vite + Next.js 14 (shadcn/ui, Tailwind CSS, recharts, ethers.js)
- Blockchain: Solidity 0.8.19, Truffle, Ganache, ethers.js, OpenZeppelin (UUPS, AccessControl, Pausable, MerkleProof)
- Privacy: Zero-knowledge proofs (Circom + snarkjs), Merkle tree commitments, selective disclosure, nullifier replay protection
- Security: JWT auth, bcrypt, role-based access control, helmet

## Features

- Full certificate lifecycle: issue (single/batch), revoke (single/batch), verify
- Multi-tenant issuer management with per-issuer Merkle roots
- Privacy-preserving verification via salted commitments and Merkle inclusion proofs
- Selective disclosure — reveal only specific certificate fields
- UUPS upgradeable smart contract with circuit breaker (pausable)
- 60+ security audit tests covering reentrancy, front-running, gas limits, nullifier double-spend

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Frontend   │────▶│   Backend    │────▶│  Blockchain  │
│ (Next.js)   │     │  (Express)   │     │  (Ganache)   │
│ :3001       │     │  :3000       │     │  :7545       │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
                           ▼
                     ┌──────────┐
                     │  MySQL   │
                     │ :3307    │
                     └──────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- MySQL 8.0
- Ganache (installed via npm)
- Docker (optional, for containerized setup)

### 1. Install Dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your MySQL credentials, JWT secret, Ganache URL
```

### 3. Start Services

#### Option A: Full Stack (local)

```bash
# Terminal 1: Ganache
make ganache-start

# Terminal 2: Deploy contracts
make deploy

# Terminal 3: Backend
npm run dev

# Terminal 4: Frontend (Next.js)
make frontend-dev

# Or all at once:
bash scripts/start.sh
```

#### Option B: Docker Compose

```bash
make docker-build
make docker-up
```

Open:
- Frontend (Next.js): http://localhost:3001
- Backend API: http://localhost:3000
- Old Vite frontend: http://localhost:5173 (optional)

### 4. Seed Database (optional)

```bash
mysql -u root -p certificate_db < database/seeds.sql
```

Default login password: `Password123!`

## Available Make Commands

| Command | Description |
|---------|-------------|
| `make setup` | Install all dependencies |
| `make compile` | Compile Solidity contracts |
| `make deploy` | Deploy contracts to local Ganache |
| `make test-contracts` | Run Truffle contract tests |
| `make test-backend` | Run Jest backend tests |
| `make test` | Run all tests |
| `make frontend-dev` | Start Next.js dev server |
| `make frontend-build` | Build Next.js for production |
| `make frontend-start` | Start Next.js production server |
| `make start-full` | Start full stack (Ganache + Backend + Frontend) |
| `make docker-build` | Build Docker images |
| `make docker-up` | Start Docker Compose services |
| `make docker-down` | Stop Docker services |
| `make lint` | Run all linters |
| `make security` | Run Slither/Mythril analysis |

## Smart Contract

Deployed as UUPS upgradeable proxy at:
- **Proxy**: `0xAaDFCf881B0f342B7DF079ee62C52a5238eDBDe1` (Ganache)
- **Network**: development (chain ID 1337)
- **Admin**: `0xdb1979153258128FECEbf5d755A87F95BD4b8B81`

Functions: issue (single/batch), revoke (single/batch), verify on-chain, Merkle proof verify, nullifier consume, issuer management, pause/unpause.

## API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get user profile |
| GET | `/health` | Health check with blockchain status |
| POST | `/api/certificates/issue` | Issue certificate (single) |
| POST | `/api/certificates/issue/batch` | Issue certificates (batch) |
| POST | `/api/certificates/revoke/:id` | Revoke certificate |
| POST | `/api/certificates/revoke/batch` | Revoke certificates (batch) |
| GET | `/api/certificates/verify/:id` | Verify certificate on-chain |
| POST | `/api/certificates/merkle/root` | Update Merkle root |
| POST | `/api/certificates/merkle/verify` | Verify via Merkle proof |
| POST | `/api/certificates/privacy/commitment` | Generate salted commitment |
| POST | `/api/certificates/privacy/tree` | Build certificate Merkle tree |
| POST | `/api/certificates/privacy/selective-disclosure` | Generate selective disclosure proof |
| POST | `/api/certificates/privacy/verify-proof` | Verify privacy proof |
| POST | `/api/certificates/nullifier/consume` | Consume nullifier |
| POST | `/api/certificates/nullifier/verify` | Verify with nullifier |
| POST | `/api/certificates/issuer/register` | Register issuer |
| GET | `/api/certificates/issuer/:address` | Get issuer info |
| GET | `/api/certificates/issuers` | List all issuers |
| PUT | `/api/certificates/issuer/:address/status` | Update issuer status |
| POST | `/api/certificates/pause` | Pause contract |
| POST | `/api/certificates/unpause` | Unpause contract |
| GET | `/api/certificates/status` | Contract status |
| GET | `/api/certificates/all` | List all certificates (admin) |

## Testing

### Contract Tests (52 tests)
```bash
make test-contracts
```

### Backend Tests (7 tests)
```bash
make test-backend
```

### Security Audit Tests (60+ tests)
```bash
npx truffle test test/SecurityAudit.test.js --network development
```

### All Tests
```bash
make test
```

## User Roles

- **admin**: Full access — issue, revoke, manage issuers, pause contract
- **university_staff**: Issue/revoke for their institution
- **student**: View own certificates
- **public**: Verify certificates without login

## Troubleshooting

- `Blockchain service is not available`: Start Ganache (`make ganache-start`), then run `make deploy`
- `Contract not deployed`: Run `make deploy`
- Database connection fails: Confirm MySQL is running and `.env` credentials match
- Frontend can't connect to blockchain: Update `frontend/.env.local` with correct contract address and RPC URL

## Project Structure

```
.
├── contracts/              # Solidity smart contracts
│   ├── CertificateRegistryV2.sol  # Main upgradeable contract
│   ├── CertificateRegistry.sol    # V1 (legacy)
│   └── Imports.sol                # Proxy import for tests
├── circuits/               # Zero-knowledge circuits
│   └── certMembership.circom
├── frontend/               # Next.js 14 frontend (new)
│   └── src/
│       ├── app/            # App Router pages
│       ├── components/     # UI + feature components
│       ├── hooks/          # React hooks
│       └── lib/            # Contract ABI + ethers integration
├── client/                 # Vite React frontend (legacy)
├── src/                    # Express backend
│   ├── config/             # Contract deployment ABI
│   ├── controllers/        # Route handlers
│   ├── crypto/             # Merkle tree, commitment, selective disclosure
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── services/           # Blockchain + proof services
│   └── validators/         # Request validation
├── test/                   # Truffle contract tests
├── tests/                  # Jest backend tests
├── scripts/                # CLI tools + start script
├── migrations/             # Database migration files
├── truffle-migrations/     # Truffle deployment migrations
├── docker-compose.yml      # Docker Compose setup
├── Dockerfile.backend      # Backend Dockerfile
└── Makefile                # Build/test/deploy commands
```
