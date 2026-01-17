# Final Delivery Plan

## Purpose
Define a production-ready delivery plan for the Noor SaaS system, including a comprehensive task checklist, acceptance criteria, deployment checklist, and smoke tests. This document captures current gaps and the work required to meet the product, security, and operational requirements.

---

## Repo Audit Summary (Step 1)
> Scope: existing modules, schema/migrations, WhatsApp/AI integration points, sockets, frontend console, and Android app structure.

### Backend (NestJS)
- **Module inventory:** Auth, Tenants, Users, Orders (gateway only), Socket, Tracking, WhatsApp, AI, Zones, Conversations, Products, Tenant Users, Tenant Integrations. (`backend-nestjs/src/app.module.ts`)
- **Controllers present:** Auth, Tenants, Tenant Users, Tenant Integrations (admin + super), Conversations, Products, Zones, WhatsApp webhook, Tracking. (`backend-nestjs/src/**/**.controller.ts`)
- **Orders API:** HTTP controllers/services now cover order creation, status updates, invoices, payments, and loyalty points. (`backend-nestjs/src/orders/*.ts`)

### Database Schema & Migrations
- **Entities present:** customers, conversations, orders, order items, products, inventory, promotions, tenants, tenant integrations, zones, branches, users. (`backend-nestjs/src/database/entities/*.entity.ts`)
- **Entities include:** invoices, payments, and loyalty points ledger; remaining gaps are saved lists (customer lists), delivery fee rules, and driver/preparer workflows.
- **Migrations exist** under `backend-nestjs/src/database/migrations`, including **two super admin seed migrations** with default credentials. (`backend-nestjs/src/database/migrations/1710000001000-create-super-admin-seed.ts`, `backend-nestjs/src/database/migrations/1710000002001-CreateSuperAdminSeed.ts`)
- **TypeORM synchronize** is toggled by `TYPEORM_SYNC` in app module; production should rely only on migrations. (`backend-nestjs/src/app.module.ts`)

### WhatsApp + AI Integration
- **Inbound webhook handler** processes messages and invokes AI classification. (`backend-nestjs/src/whatsapp/whatsapp.controller.ts`, `backend-nestjs/src/whatsapp/whatsapp.service.ts`)
- **AI service** calls OpenAI Chat Completions with per-tenant credentials from integrations. (`backend-nestjs/src/ai/ai.service.ts`, `backend-nestjs/src/tenant-integrations/tenant-integrations.service.ts`)
- **Tenant integrations** store WhatsApp/AI tokens encrypted at rest with NOOR_MASTER_KEY; tenant admins receive masked values. (`backend-nestjs/src/tenant-integrations/tenant-integrations.service.ts`)

### Realtime & Tracking
- **Socket gateways** for service console, orders status, and driver location updates. (`backend-nestjs/src/sockets/conversations.gateway.ts`, `backend-nestjs/src/orders/orders.gateway.ts`, `backend-nestjs/src/sockets/location.gateway.ts`)
- **Tracking controller** serves a simple HTML tracking page (no live data wiring yet). (`backend-nestjs/src/tracking/tracking.controller.ts`)

### Frontend (Next.js)
- **Service center UI** exists with conversations list, takeover/resolve actions, and context panel. (`frontend-nextjs/src/app/service/page.tsx`)
- **Super/admin routes** exist at `frontend-nextjs/src/app/super` and `frontend-nextjs/src/app/admin` (audit pending for scope coverage).

### Android Apps
- **Driver app** and **Preparer app** exist with only basic string resources. (`android-driver-app/app/src/main/res/values/strings.xml`, `android-preparer-app/app/src/main/res/values/strings.xml`)
- **i18n scaffolding** not present beyond a single `strings.xml` file.

---

## Current Gaps (Initial Assessment)
> **Note:** This is a high-level gap analysis based on stated requirements. A deeper audit of the codebase, schema, and apps will be completed in subsequent implementation phases.

### Product & Data Model
- **System of record enforcement:** Confirm Noor is the final source for customers, conversations, orders, invoices, and loyalty points, while external systems remain catalog sources only.
- **AI reactive behavior:** Ensure AI never initiates conversations, only responds to inbound WhatsApp or post-template/campaign messages.
- **Progressive customer info collection:** Missing data capture (name, payment method cash/card, address) must be enforced in flow.
- **Tenant-specific credentials & instructions:** Per-tenant WhatsApp + AI credentials and instruction/flow rules with strict editing permissions.
- **Customer saved lists:** Limit of 10 lists per customer, interactive WhatsApp list rendering, reorder by list name, item modifications.
- **Service center console:** Inbox, labels, customer profile panel, order timeline, AI-to-agent handoff, search/filters.
- **Operations workflows:** Branches, zones, delivery fee rules, preparer workflow, driver workflow, real-time tracking (socket.io).
- **Exports:** Hybrid synchronous/async export system with tenant and SUPER_ADMIN scope.
- **Android apps:** Minimal 3-screen UX for driver + preparer with i18n (Arabic default, Hindi now, Bengali/English scaffolding).
- **Orders + invoices + points:** Core HTTP APIs now exist; remaining work is test coverage, reporting, and operational UX. (`backend-nestjs/src/orders/*.ts`)
- **Saved lists:** No entities/endpoints for customer lists. (No list entities in `backend-nestjs/src/database/entities`)

### Security & Engineering
- **Tenant isolation:** Enforce tenant_id checks across all tenant endpoints; SUPER_ADMIN cross-tenant access.
- **Secrets at rest:** Encryption is required with NOOR_MASTER_KEY; migrate any legacy plaintext secrets.
- **No insecure default admin:** Default super admin seeds must remain disabled in production; provide a safe SUPER_ADMIN reset tool restricted to SUPER_ADMIN.
- **Migrations:** Required for all DB changes.
- **Deployment docs:** Ubuntu 22.04 + nginx + pm2 including socket.io config.
- **TypeORM sync:** `TYPEORM_SYNC` is supported but must remain false in production; enforce migrations-only workflow. (`backend-nestjs/src/app.module.ts`)

---

## Phase Plan (High-Level)
1. **Discovery & Audit**
   - Inventory existing schemas, APIs, background jobs, integrations, and app flows.
   - Identify current gaps per module against requirements.
2. **Backend Core & Data Integrity**
   - Enforce system-of-record rules, tenant isolation, and data ownership.
   - Implement missing domain entities and validations.
3. **AI/WhatsApp Orchestration**
   - Ensure reactive-only AI and progressive info collection.
   - Per-tenant credentials, instructions, and secure masking.
4. **Service Center Console**
   - Build/complete inbox, labels, profile panel, timeline, handoff, and search.
5. **Operations & Real-Time**
   - Branches/zones, delivery fee rules, preparer/driver workflow, socket.io tracking.
6. **Exports & Admin Tools**
   - Hybrid export system and SUPER_ADMIN-only global exports.
   - Secure SUPER_ADMIN reset tool.
7. **Android Apps**
   - Finalize 3-screen UX and i18n requirements.
8. **Deployment & Docs**
   - Production deployment guide and smoke tests.

---

## Detailed Task Checklist & Acceptance Criteria

### 1) System of Record & Data Model
**Tasks**
- Define/verify entities: customers, conversations, orders, invoices, loyalty points.
- Ensure writes are final in Noor, not overridden by external sources.
- Map external sources to catalog-only entities (products/prices/availability).
- Audit existing entities in `backend-nestjs/src/database/entities` and add missing tables via migrations.

**Acceptance Criteria**
- Orders/invoices/points cannot be overwritten by external connectors.
- External imports only update catalog data.
- All domain writes are scoped to a tenant_id.
- New invoice/payment/points entities are present with migrations (no TypeORM sync reliance).

### 2) Tenant Isolation & Roles
**Tasks**
- Enforce tenant_id in all tenant endpoints (middleware/guards + service checks).
- Implement SUPER_ADMIN cross-tenant access with explicit authorization.

**Acceptance Criteria**
- All tenant routes validate tenant_id; non-admin cross-tenant requests are rejected.
- SUPER_ADMIN can access cross-tenant export/management.

### 3) AI & WhatsApp Flow
**Tasks**
- Ensure AI is reactive only.
- Implement progressive data collection (name, payment method, address).
- Per-tenant AI credentials and instructions.
- Mask secrets; tenant can view masked but not edit.
- Extend the current WhatsApp handler and AI classifier pipeline. (`backend-nestjs/src/whatsapp/whatsapp.service.ts`, `backend-nestjs/src/ai/ai.service.ts`)

**Acceptance Criteria**
- AI only responds to inbound or template-triggered messages.
- Flow collects missing fields before checkout completion.
- Only SUPER_ADMIN can edit sensitive keys.
- Secrets are encrypted at rest in tenant integrations; masked responses for tenant admins.

### 4) Customer Saved Lists (WhatsApp)
**Tasks**
- Enforce max 10 lists per customer.
- Provide interactive list rendering on WhatsApp.
- Enable reorder by list name and item edits.

**Acceptance Criteria**
- API enforces list cap with errors on overflow.
- WhatsApp UI uses list template message with correct ordering.
- CRUD endpoints for list items with tenant/customer validation.

### 5) Service Center Web Console
**Tasks**
- Inbox with conversation list + assignment.
- Labels and filters.
- Customer profile panel and order timeline.
- AI-to-agent handoff.
- Search/filters.
- Expand the existing service dashboard UI and wire to new backend endpoints. (`frontend-nextjs/src/app/service/page.tsx`)

**Acceptance Criteria**
- Agents can view/open conversations and see customer/order context.
- Labels can be applied and filtered.
- Handoff preserves context and disables AI responses.
- Order timeline and customer panel reflect Noor system-of-record data.

### 6) Operations Workflows
**Tasks**
- Branch/zone management.
- Delivery fee rules engine.
- Preparer workflow (order queue, status updates).
- Driver workflow (assignment, pickup, delivery completion).
- socket.io real-time tracking.
- Extend socket namespaces and tracking to emit real order/driver updates. (`backend-nestjs/src/sockets/*.ts`, `backend-nestjs/src/tracking/tracking.controller.ts`)

**Acceptance Criteria**
- Orders move through defined statuses with audit trail.
- Drivers can update location and status; clients receive real-time updates.
- Delivery fee is calculated from rules per zone/branch.

### 7) Exports
**Tasks**
- Tenant exports (CSV/XLSX).
- SUPER_ADMIN cross-tenant exports.
- Hybrid export execution (sync small, async large).

**Acceptance Criteria**
- Export API chooses sync/async based on dataset size.
- Async exports produce downloadable results with status tracking.

### 8) Android Apps (Driver & Preparer)
**Tasks**
- Ensure minimal 3-screen UX flows.
- Implement i18n: Arabic default, Hindi enabled, Bengali/English scaffolding.
- Build out string resources and layouts in both apps. (`android-driver-app/app/src/main`, `android-preparer-app/app/src/main`)

**Acceptance Criteria**
- Apps build in debug mode.
- Language selection defaults to Arabic with Hindi translations.

### 9) Security & Secrets
**Tasks**
- Encrypt secrets at rest using NOOR_MASTER_KEY.
- Remove/disable insecure default SUPER_ADMIN seed.
- Add SUPER_ADMIN reset tool restricted to SUPER_ADMIN.
- Encrypt tenant integration tokens stored in `tenant_integrations` and migrate any legacy plaintext values. (`backend-nestjs/src/database/entities/tenant-integration.entity.ts`)

**Acceptance Criteria**
- Secrets are unreadable without master key.
- No default admin credentials exist in production.

### 10) Deployment Docs & Smoke Tests
**Tasks**
- Provide Ubuntu 22.04 + nginx + pm2 deployment docs.
- Include socket.io nginx location config.
- Provide deployment checklist and smoke tests.
- Document socket namespaces for `/service`, `/orders`, and `/location`. (`backend-nestjs/src/sockets/*.ts`)

**Acceptance Criteria**
- Docs include step-by-step installation, env setup, process management, and nginx reverse proxy with socket.io.
- Smoke tests verify core flows (auth, orders/invoices/payments/points, messaging, exports).

---

## Deployment Checklist (To be finalized)
- [ ] Provision Ubuntu 22.04 server
- [ ] Install Node.js, pnpm/yarn/npm, pm2, nginx
- [ ] Configure environment variables (NOOR_MASTER_KEY, DB, WhatsApp, AI keys)
- [ ] Run DB migrations
- [ ] Build backend + frontend + Android apps
- [ ] Configure nginx reverse proxy + socket.io routes
- [ ] Start services with pm2
- [ ] Run smoke checks (`backend-nestjs/scripts/smoke-e2e.sh`) with SMOKE_* env vars
- [ ] Verify health checks and logs

---

## Smoke Tests (To be finalized)
- [ ] Tenant auth and tenant_id isolation
- [ ] Inbound WhatsApp message triggers AI response
- [ ] AI prompts for missing name/payment/address
- [ ] Create order, invoice, loyalty points
- [ ] Export small dataset (sync) and large dataset (async)
- [ ] Driver/preparer workflow status updates
- [ ] socket.io live tracking updates

---

## Delivery Principles
- Prioritize data integrity and tenant isolation.
- Keep AI reactive and compliant with conversation rules.
- Ensure production readiness and operational visibility.
