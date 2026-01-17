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

## Branding & Assets
- Global product constants live in `frontend-nextjs/src/config/branding.ts` (`PRODUCT_NAME`, `productTagline`, and logo paths). Import these instead of hard-coding strings such as “Noor • GHITHAK”.
- SVG logo placeholders are stored in `frontend-nextjs/public/brand/noor-logo-dark.svg` and `.../noor-logo-light.svg`. Replace those files with the final artwork when ready; components will pick them up automatically.
- Shared layout components (`DashboardHeader`, `AdminShell`, login hero, etc.) consume the branding config so updating the logos or tagline happens in one place.

## Local Development
### Backend (`backend-nestjs`)
```bash
cp env.example .env           # add DB URL + API keys (local-safe values only)
npm install
npm run build
npm run migration:run         # apply new TypeORM migrations (production uses TYPEORM_SYNC=false)
npm run start:dev             # or npm run start:prod after build
```
- **Production update checklist (after pulling latest main):**
  ```bash
  npm install --prefix backend-nestjs
  npm run build --prefix backend-nestjs
  npm run migration:run --prefix backend-nestjs
  pm2 restart noor-backend
  SMOKE_BASE_URL=https://your.domain \
    SMOKE_SUPER_ADMIN_EMAIL=superadmin@example.com \
    SMOKE_SUPER_ADMIN_PASSWORD=replace-with-strong-password \
    SMOKE_TENANT_NAME="Smoke Tenant" \
    SMOKE_TENANT_SLUG="smoke-tenant" \
    SMOKE_TENANT_ADMIN_EMAIL=tenant-admin-$(date +%s)@noor.test \
    SMOKE_TENANT_ADMIN_PASSWORD=replace-with-strong-password \
    SMOKE_PRODUCT_BARCODE=replace-with-barcode \
    npm run smoke:e2e --prefix backend-nestjs
  ```
- Build uses `tsc -p tsconfig.build.json` and clears stale `tsconfig*.tsbuildinfo` before compiling. Only files under `src/` compile; `ormconfig.ts`, tests, and specs are excluded.
- PM2: `pm2 start ecosystem.config.js --only noor-backend` (runs `dist/main.js` with `NODE_ENV=production`).
- Build output entry lives at `backend-nestjs/dist/main.js`; if a build ever finishes without that file, rerun `npm run build` to surface the error (a postbuild check now fails fast when the entry is missing). After building, restart with `pm2 restart noor-backend`.

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
- Super admin seed migrations are gated by `ALLOW_DEFAULT_SUPER_ADMIN_SEED=true` and are blocked in production. Use `npm run seed:smoke --prefix backend-nestjs` only for local smoke setups.
- Login steps:
  1. Run backend + frontend locally.
  2. POST `/api/auth/login` (or use the login page) with the seeded SUPER_ADMIN credentials (`SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` when running `seed:smoke`) → store JWT in `localStorage` (`token`).
  3. Visit `/super/tenants` to manage tenants via the new `/front-api/super/tenants` proxy.
- Creating tenants:
  - Use the UI to create/patch/delete tenants; payloads support `name`, `slug`, `domain`, `whatsappPhoneNumberId`, and `isActive`.
  - There is no pre-seeded “GHITHAK” tenant; create one manually through the super admin screen or via `POST /api/tenants`.
- Tenant admins authenticate with the same `/api/auth/login` endpoint but receive JWTs scoped to their tenant. After login they can access `/admin` and `/service`.

## Onboarding & User Management
- Super admin flow:
  - Create tenants from `/super/tenants`.
  - From the same screen, open “حسابات الإدارة” for any tenant to view users and create the first `TENANT_ADMIN` via the slide-over form (calls `/front-api/super/tenants/[tenantId]/users` → `/api/tenants/:id/users`).
  - Share the generated credentials with the tenant so they can log in.
- Tenant admin flow:
  - After login, the top navigation shows the Noor logo plus the tenant name to make it clear which account is active.
  - Manage staff from `/admin/staff`: list current users, create new roles (Tenant Admin, Agent, Staff), and share initial passwords or invitations.
  - Other tenant tools (zones, service dashboard, etc.) remain under `/admin/*` and respect the same theming/branding.

## Basic HTTP Reference
- `GET /api/tenants` – list tenants (super admin only).
- `POST /api/tenants` – create tenant (supports optional `domain`, `whatsappPhoneNumberId`, `isActive`).
- `PATCH /api/tenants/:id` – update tenant.
- `DELETE /api/tenants/:id` – delete tenant.
- `GET /api/tenants/check?slug=...` – slug availability.
- `/front-api/super/tenants` mirrors the same contract for the frontend.

## Smoke Testing
- Canonical environment variables: `SMOKE_BASE_URL`, `SMOKE_SUPER_ADMIN_EMAIL`, `SMOKE_SUPER_ADMIN_PASSWORD`, `SMOKE_TENANT_NAME`, `SMOKE_TENANT_SLUG`, `SMOKE_TENANT_ADMIN_EMAIL`, `SMOKE_TENANT_ADMIN_PASSWORD`, `SMOKE_PRODUCT_BARCODE`.
- Legacy fallbacks remain supported (`BASE_URL`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `TENANT_NAME`, `TENANT_SLUG`, `TENANT_ADMIN_EMAIL`, `TENANT_ADMIN_PASSWORD`, `PRODUCT_BARCODE`).
- Run with: `npm run smoke:e2e --prefix backend-nestjs` (uses `backend-nestjs/scripts/smoke-e2e.sh`).

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
