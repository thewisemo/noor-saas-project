# Noor SaaS – Dev Notes

## Apps & Folders
- `backend-nestjs/` – NestJS 10 API, websockets, OTP auth, WhatsApp webhook handlers, multi-tenant core.
- `frontend-nextjs/` – Next.js 14 dashboard + customer-service UI. Uses `/front-api` routes plus `NEXT_PUBLIC_API_URL` for HTTP and Socket.IO for realtime.
- `android-driver-app/` – Kotlin app that streams foreground location updates via Socket.IO every 10s.
- `android-preparer-app/` – Kotlin barcode scanner that hits `/api/products/alternatives/:barcode`.
- `shared/` – Reusable TypeScript helpers/constants shared between projects.
- `docs/` – Product docs (`INSTALL_GUIDE.md`, `API.md`, `DB_SCHEMA.md`, etc.).
- `infra/` – Server automation (`pm2` ecosystem template, nginx config).
- `ecosystem.config.js` – PM2 definition that starts `noor-backend` (`node dist/main.js`) and `noor-web` (`next start`).

## Data & API Flow
- Backend listens on `PORT` (default `3001`) and serves all REST routes under `/api/*` (`main.ts` sets `app.setGlobalPrefix('api')`).
- Frontend calls the backend by default via `NEXT_PUBLIC_API_URL` (defaults to `https://noor.ghithak.com.sa/api`). For browser-safe calls it now exposes `/front-api/super/tenants` which proxies to `/api/tenants` using either `API_BASE_URL` or `NEXT_PUBLIC_API_URL`.
- Websockets:
  - `/orders` namespace broadcasts `SOCKET_EVENTS.NEW_ORDER` and `ORDER_STATUS_CHANGE`.
  - `/service` namespace pushes `SOCKET_EVENTS.CONVERSATION_UPDATE`.
  - `/location` namespace streams `SOCKET_EVENTS.DRIVER_LOCATION_UPDATE`.
- Health check: `GET /api/health` → `{ ok: true, service: 'noor-api' }`.

## Local Development
### Backend (`backend-nestjs`)
```bash
cp env.example .env           # add DB URL + API keys (local-safe values only)
npm install
npm run build
npm run start:dev             # or npm run start:prod after build
```
- Build uses `tsc -p tsconfig.build.json`. Only files under `src/` compile; `ormconfig.ts`, tests, and specs are excluded.
- PM2: `pm2 start ecosystem.config.js --only noor-backend` (runs `dist/main.js` with `NODE_ENV=production`).

### Frontend (`frontend-nextjs`)
```bash
cp env.example .env.local     # define NEXT_PUBLIC_API_URL + API_BASE_URL
npm install
npm run dev                   # port 3000
npm run build && npm start    # production preview
```
- `NEXT_PUBLIC_API_URL` should point to the backend HTTP base (include `/api`).
- `API_BASE_URL` (server-only) is used by `/front-api/*` routes to proxy requests without exposing secrets.
- PM2: `pm2 start ecosystem.config.js --only noor-web` (runs `next start -p 3000`).

### Android
- Driver app: open `android-driver-app` in Android Studio → sync Gradle → run `DriverLocationService`.
- Preparer app: open `android-preparer-app` → configure backend base in `BuildConfig` before building.

## Auth & Tenancy Flow
- Super admin seed (TypeORM migration `1710000001000-create-super-admin-seed.ts`):
  - Email: `admin@noor.system`
  - Password: `superadmin123`
- Login steps:
  1. Run backend + frontend locally.
  2. POST `/api/auth/login` (or use the login page) with the seed credentials → store JWT in `localStorage` (`token`).
  3. Visit `/super/tenants` to manage tenants via the new `/front-api/super/tenants` proxy.
- Creating tenants:
  - Use the UI to create/patch/delete tenants; payloads support `name`, `slug`, `domain`, `whatsappPhoneNumberId`, and `isActive`.
  - There is no pre-seeded “GHITHAK” tenant; create one manually through the super admin screen or via `POST /api/tenants`.
- Tenant admins authenticate with the same `/api/auth/login` endpoint but receive JWTs scoped to their tenant. After login they can access `/admin` and `/service`.

## Basic HTTP Reference
- `GET /api/tenants` – list tenants (super admin only).
- `POST /api/tenants` – create tenant (supports optional `domain`, `whatsappPhoneNumberId`, `isActive`).
- `PATCH /api/tenants/:id` – update tenant.
- `DELETE /api/tenants/:id` – delete tenant.
- `GET /api/tenants/check?slug=...` – slug availability.
- `/front-api/super/tenants` mirrors the same contract for the frontend.

## Final Summary
### Backend Fixes
- Added typed DTOs for tenant create/update, wired validation, and returned camel-cased `isActive` responses.
- Hardened `tsconfig.build.json` to compile only `src/**`, exclude `ormconfig.ts`, and keep `npm run build` deterministic.
- Completed `SOCKET_EVENTS` definitions so all gateways compile and emit consistent event names.

### Frontend Fixes
- Introduced `/front-api/super/tenants` (and `[tenantId]`) Next.js route handlers that proxy to the backend with error handling.
- Updated the super admin tenants page to consume the new proxy routes with proper Authorization headers.
- Documented environment variables (`API_BASE_URL`, `NEXT_PUBLIC_API_URL`) and dev workflows.

### Remaining TODOs / Nice-to-haves
- Add automated tests (unit + e2e) for tenants CRUD and websocket flows.
- Extend `/front-api` proxy pattern to other admin calls for uniform CORS handling.
- Move Android base URLs into build flavors to simplify environment switching.

