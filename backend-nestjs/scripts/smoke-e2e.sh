#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
SUPER_ADMIN_EMAIL="${SUPER_ADMIN_EMAIL:-admin@noor.system}"
SUPER_ADMIN_PASSWORD="${SUPER_ADMIN_PASSWORD:-superadmin123}"
TENANT_NAME="${SEED_TENANT_NAME:-Noor Test Tenant}"
TENANT_SLUG="${SEED_TENANT_SLUG:-noor-test}"
TENANT_ADMIN_EMAIL="${TENANT_ADMIN_EMAIL:-tenant-admin@noor.test}"
TENANT_ADMIN_PASSWORD="${TENANT_ADMIN_PASSWORD:-TenantAdmin123!}"
TENANT_ADMIN_NAME="${TENANT_ADMIN_NAME:-Noor Tenant Admin}"
SEED_PRODUCT_BARCODE="${SEED_PRODUCT_BARCODE:-TEST-BARCODE}"

echo "[smoke] Logging in as super admin..."
SUPER_ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$SUPER_ADMIN_EMAIL\",\"password\":\"$SUPER_ADMIN_PASSWORD\"}" | \
  python -c "import sys, json; print(json.load(sys.stdin)['token'])")

echo "[smoke] Fetching tenants..."
TENANT_ID=$(curl -s -X GET "$BASE_URL/api/tenants" \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" | \
  python - <<'PY'
import json, sys, os
slug = os.environ.get('SEED_TENANT_SLUG', 'noor-test')
data = json.load(sys.stdin)
for tenant in data:
    if tenant.get('slug') == slug:
        print(tenant.get('id'))
        sys.exit(0)
print("")
PY
)

if [[ -z "$TENANT_ID" ]]; then
  echo "[smoke] Creating tenant..."
  TENANT_ID=$(curl -s -X POST "$BASE_URL/api/tenants" \
    -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$TENANT_NAME\",\"slug\":\"$TENANT_SLUG\",\"isActive\":true}" | \
    python -c "import sys, json; print(json.load(sys.stdin)['id'])")
fi

echo "[smoke] Ensuring tenant admin exists..."
EXISTING_ADMIN=$(curl -s -X GET "$BASE_URL/api/tenants/$TENANT_ID/users" \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" | \
  python - <<'PY'
import json, sys, os
email = os.environ.get('TENANT_ADMIN_EMAIL', 'tenant-admin@noor.test').lower()
data = json.load(sys.stdin)
for user in data:
    if user.get('email', '').lower() == email:
        print(user.get('id'))
        sys.exit(0)
print("")
PY
)

if [[ -z "$EXISTING_ADMIN" ]]; then
  curl -s -X POST "$BASE_URL/api/tenants/$TENANT_ID/users" \
    -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$TENANT_ADMIN_NAME\",\"email\":\"$TENANT_ADMIN_EMAIL\",\"password\":\"$TENANT_ADMIN_PASSWORD\"}" > /dev/null
fi

echo "[smoke] Logging in as tenant admin..."
TENANT_ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TENANT_ADMIN_EMAIL\",\"password\":\"$TENANT_ADMIN_PASSWORD\"}" | \
  python -c "import sys, json; print(json.load(sys.stdin)['token'])")

echo "[smoke] Resolving test product via barcode..."
PRODUCT_ID=$(curl -s -X GET "$BASE_URL/api/products/alternatives/$SEED_PRODUCT_BARCODE" \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" | \
  python -c "import sys, json; print(json.load(sys.stdin)['product']['id'])")

echo "[smoke] Creating order..."
ORDER_ID=$(curl -s -X POST "$BASE_URL/api/orders" \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"customer\":{\"name\":\"Smoke Test\",\"phone\":\"+966500000000\"},\"items\":[{\"product_id\":\"$PRODUCT_ID\",\"quantity\":1}],\"delivery_fee\":5}" | \
  python -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo "[smoke] Creating invoice..."
INVOICE_ID=$(curl -s -X POST "$BASE_URL/api/orders/$ORDER_ID/invoice" \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" | \
  python -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo "[smoke] Recording payment..."
curl -s -X POST "$BASE_URL/api/invoices/$INVOICE_ID/payments" \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"method\":\"CASH\",\"amount\":50}" > /dev/null

echo "[smoke] PASS: auth -> tenant -> tenant admin -> order -> invoice -> payment"
