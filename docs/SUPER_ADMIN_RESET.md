# Super Admin Password Reset (Safe Flow)

## Overview
Super admin password resets must be performed by an authenticated **SUPER_ADMIN** account. Default seeds are disabled by default and only allowed when explicitly enabled via `ALLOW_DEFAULT_SUPER_ADMIN_SEED=true` for local development.

## Reset Endpoint
**Route:** `POST /super/admins/reset-password`

**Auth:** Bearer token for a user with `SUPER_ADMIN` role.

**Body:**
```json
{
  "email": "superadmin@example.com",
  "password": "replace-with-strong-password"
}
```

**Example (curl):**
```bash
curl -X POST "https://<host>/api/super/admins/reset-password" \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@example.com","password":"replace-with-strong-password"}'
```

## Notes
- The reset tool **requires** a valid SUPER_ADMIN JWT; there is **no unauthenticated reset**.
- Default super admin seeds are disabled in production unless `ALLOW_DEFAULT_SUPER_ADMIN_SEED=true`.
- Secrets encryption requires `NOOR_MASTER_KEY` to be configured.
