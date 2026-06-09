# Certificate Verification — Frontend

React + Vite admin portal for the blockchain certificate verification system.

## Setup

```bash
npm install
cp .env.example .env
```

## Development

Start the backend API on port 3000, then:

```bash
npm run dev
```

The dev server runs at http://localhost:5173 and proxies `/api` and `/uploads` to the backend.

Set `PUBLIC_BASE_URL=http://localhost:5173` in the backend `.env` so QR codes link to the verification UI.

## Routes

| Path | Access | Description |
|------|--------|-------------|
| `/login` | Public | Sign in |
| `/register` | Public | Create account |
| `/verify` | Public | Certificate ID lookup |
| `/verify/:id` | Public | Verification result (QR destination) |
| `/admin` | Admin | Dashboard |
| `/certificates` | Admin | List & revoke |
| `/issue` | Admin, Staff | Issue certificate |
| `/staff` | Staff | Student lookup & revoke |
| `/student` | Student | Own certificates |
