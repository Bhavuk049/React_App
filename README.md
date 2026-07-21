# UniqPick

E-commerce platform: storefront + admin panel (web), backend API, with a mobile POS app planned later.

## Structure

```
Apis/                   Backend — Node, Express, Prisma, PostgreSQL
WebApp/react_Learn/      Frontend — React, Vite, Tailwind CSS
```

The two are fully independent projects (separate package.json, separate dev servers). The web app talks to the API only over HTTP.

## Stack

- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL
- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router
- **Auth**: JWT (access + refresh tokens)

## Prerequisites (one-time setup)

Already done on this machine — listed here for a fresh machine setup.

```bash
# Install PostgreSQL
brew install postgresql@16

# Start Postgres and set it to auto-start at login
brew services start postgresql@16

# Create the app database and role
psql -d postgres -c "CREATE ROLE uniqpick WITH LOGIN PASSWORD 'uniqpick_dev_pw' CREATEDB;"
psql -d postgres -c "CREATE DATABASE uniqpick OWNER uniqpick;"

# Install dependencies
cd Apis && npm install
cd ../WebApp/react_Learn && npm install

# Run migrations and seed sample data (from Apis/)
cd ../../Apis
npx prisma migrate dev
npm run db:seed
```

`.env` files (`Apis/.env`, `WebApp/react_Learn/.env`) are already configured for local dev and are gitignored. Copy from `.env.example` in each folder if missing.

## Starting development (every time)

### 1. PostgreSQL

Check if it's running:
```bash
brew services list | grep postgresql
```

If it's not running:
```bash
brew services start postgresql@16
```

To stop it (rarely needed — leave it running normally):
```bash
brew services stop postgresql@16
```

Useful Postgres commands:
```bash
# Connect to the app database
psql -d uniqpick -U uniqpick

# List databases
psql -d postgres -c "\l"

# List tables in uniqpick
psql -d uniqpick -c "\dt"

# Quick row counts
psql -d uniqpick -c "SELECT * FROM products LIMIT 10;"
```

### 2. Backend API

```bash
cd Apis
npm run dev
```
Runs at `http://localhost:4000`. Health check: `curl http://localhost:4000/health`

Other useful commands (run from `Apis/`):
```bash
npx prisma studio        # Browser-based DB viewer at localhost:5555
npx prisma migrate dev   # Apply schema changes after editing prisma/schema.prisma
npm run db:seed          # Re-seed sample categories/products/admin user
```

### 3. Frontend (web app)

```bash
cd WebApp/react_Learn
npm run dev
```
Runs at `http://localhost:5173`.

Run the API and web app in **separate terminal tabs** — both need to stay running at once.

## Test login

- **Admin**: `admin@uniqpick.com` / `Admin@12345` → redirects to `/admin`
- Or register a new account at `/register` (defaults to a regular customer role)

## Inspecting the database with a GUI

DBeaver Community is installed (`/Applications/DBeaver.app`). Connection details:

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `uniqpick` |
| Username | `uniqpick` |
| Password | `uniqpick_dev_pw` |

Note: this is a PostgreSQL database — MySQL Workbench cannot connect to it.
