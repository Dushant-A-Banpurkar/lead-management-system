# Leadflow — Lead Management System

A responsive lead-management workspace built for the Swan Digital Solutions full-stack assessment. Users can create an account, manage their own prospect pipeline, schedule follow-ups, and see lead activity by status.

## Features

- Email/password registration and login with bcrypt password hashing and signed JWTs.
- Owner-scoped, authenticated lead CRUD.
- Lead details: name, email, phone, company, service interest, status, follow-up date, notes, and timestamps.
- Dashboard totals and status visualization.
- Search by name, email, or phone; filter by status and creation date; sort and paginate results.
- CSV export with spreadsheet-formula injection protection.
- Per-lead activity history and a recent activity API.
- Admin and sales roles: sales users own their leads; admins can view, assign, and manage the team pipeline.
- Optional daily Resend email digests for due and overdue follow-ups.
- Docker Compose for the frontend, API, and MongoDB; focused backend unit tests.
- Responsive dashboard and lead table, client/server validation, loading, empty, and error states.
- MongoDB persistence through Mongoose.

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, Axios, React Hook Form, Zod, Recharts, Lucide, and date-fns.
- **Backend:** Node.js, Express 4, TypeScript, MongoDB/Mongoose, JWT, bcryptjs, and Zod.

## Backend structure

```text
backend/src/
  config/         Environment validation and MongoDB connection
  controllers/    Authentication and lead request handlers
  middleware/     JWT authentication and centralized error handling
  models/         Mongoose User and Lead models
  routes/         Express route declarations
  types/          Express request type extensions
  utils/          Token creation and Zod request schemas
  app.ts          Express app and middleware registration
  server.ts       Database connection and HTTP startup
```

## Local setup

Requirements: Node.js 20+, npm, and a running MongoDB instance (local or MongoDB Atlas).

1. Configure the API:

   ```powershell
   cd backend
   Copy-Item .env.example .env
   npm install
   ```

   Set `MONGODB_URI` and replace `JWT_SECRET` with a private random value of at least 32 characters.

2. Start the backend:

   ```powershell
   npm run dev
   ```

   The API listens on `http://localhost:4000`. Check `http://localhost:4000/api/health`.

3. Configure and start the frontend in a second terminal:

   ```powershell
   cd frontend
   Copy-Item .env.example .env
   npm install
   npm run dev
   ```

   Open the Vite URL (normally `http://localhost:5173`) and register an account. `VITE_API_URL` defaults to `http://localhost:4000/api`.

4. (Optional) Promote an existing account to admin:

   ```powershell
   cd backend
   npm run admin:promote -- admin@company.com
   ```

   Registration always creates a sales account; there is no public admin self-registration.

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port; defaults to `4000`. |
| `MONGODB_URI` | Yes | MongoDB connection string. |
| `JWT_SECRET` | Yes | Private signing secret, minimum 32 characters. |
| `JWT_EXPIRES_IN` | No | Token lifetime; defaults to `7d`. |
| `CLIENT_URL` | No | Allowed frontend origin; defaults to `http://localhost:5173`. |
| `RESEND_API_KEY` | No | Resend API key. Enables scheduled reminders when used with `REMINDER_FROM_EMAIL`. |
| `REMINDER_FROM_EMAIL` | No | Sender address verified with Resend. Must be configured with `RESEND_API_KEY`. |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | API base URL; defaults to `http://localhost:4000/api`. |

Never commit `.env` files or production credentials. Example files contain placeholders only.

## API

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Description |
|---|---|---:|---|
| `GET` | `/health` | No | API and database health. |
| `POST` | `/auth/register` | No | Register `{ name, email, password }`; returns token and user. |
| `POST` | `/auth/login` | No | Login `{ email, password }`; returns token and user. |
| `GET` | `/auth/me` | Yes | Return the current user profile. |
| `GET` | `/leads/stats` | Yes | Lead total and counts by status for the current user. |
| `GET` | `/leads` | Yes | List/filter leads. Query: `search`, `status`, `from`, `to`, `ownerId` (admin), `page`, `limit`, `sortBy`, `order`. |
| `POST` | `/leads` | Yes | Create a lead. |
| `PATCH` | `/leads/:id` | Yes | Update a lead. |
| `DELETE` | `/leads/:id` | Yes | Delete a lead. |
| `GET` | `/leads/export.csv` | Yes | Export matching leads using the list filters. |
| `GET` | `/leads/activity` | Yes | Return up to 100 recent activity events for the current user (or all for admins). |
| `GET` | `/leads/:id/activity` | Yes | View a lead’s history. |
| `GET` | `/users/sales` | Admin | List sales users available for assignment. |

Lead statuses are `New`, `Contacted`, `Qualified`, `Converted`, and `Lost`. Date filters apply to lead creation dates; `followUpDate` is a separately stored lead field. List responses include `{ leads, pagination: { page, limit, total, pages } }`. Validation errors return `400`, unauthenticated requests `401`, missing resources `404`, duplicate accounts `409`, and unexpected errors `500`.

The OpenAPI definition is in [`backend/openapi.yaml`](backend/openapi.yaml). CSV exports include all rows matching filters, not just the current page; cells are quoted and spreadsheet formula prefixes are neutralized. Admin accounts are promoted manually after registration using the command above. Admins may assign leads to sales users, while sales users can only read and change leads assigned to them.

### Resend follow-up reminders

When both Resend environment variables are configured, the API checks every 15 minutes and sends each user one daily digest of leads due today or overdue (UTC). Converted and lost leads are excluded. MongoDB records a unique delivery per user/day so multiple API instances do not send duplicate digests. If Resend is not configured, the reminder scheduler stays disabled. Resend requires a sender address/domain verified for your account; the free tier’s sending limits and recipient restrictions apply.

### Docker

Copy `.env.example` to `.env` and set a strong `JWT_SECRET` (at least 32 characters). Add `RESEND_API_KEY` and `REMINDER_FROM_EMAIL` there only if enabling reminders, then run:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

The frontend is served at `http://localhost:8080`, the API at `http://localhost:4000`, and MongoDB data persists in the `mongo-data` volume. The Compose setup is intended for local evaluation; configure HTTPS, secret management, network restrictions, and production backups before public deployment.

### Automated tests

```powershell
cd backend
npm test
```

The backend tests cover CSV escaping/formula-safety and sales/admin lead scoping.

## Database

Mongoose creates the `users` and `leads` collections. Users store a bcrypt hash, never a plaintext password. Each lead references its owner; lead reads, updates, deletes, and dashboard aggregates are scoped to the authenticated user. Set `MONGODB_URI` to a local database or an Atlas cluster.

## Deployment

The frontend and API are independent deployables. A typical deployment uses MongoDB Atlas, the backend on Render/Railway, and the frontend on Vercel/Netlify:

1. Set backend environment variables in the API host, including the Atlas `MONGODB_URI`, a generated `JWT_SECRET`, and `CLIENT_URL` equal to the deployed frontend origin.
2. Build the backend with `cd backend && npm install && npm run build`; run it with `npm start`.
3. Set frontend `VITE_API_URL` to the deployed API base URL ending in `/api`.
4. Build the frontend with `cd frontend && npm install && npm run build`; deploy the generated `frontend/dist` directory.
5. Configure the frontend host to serve `index.html` for client-side routes. Confirm `/api/health`, register a test account, then remove it if not needed.

Live URLs and demo credentials are intentionally omitted until an application is deployed; do not publish real credentials in this repository.
