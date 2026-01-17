#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${SMOKE_BASE_URL:-${BASE_URL:-}}"
SUPER_ADMIN_EMAIL="${SMOKE_SUPER_ADMIN_EMAIL:-${SUPER_ADMIN_EMAIL:-}}"
SUPER_ADMIN_PASSWORD="${SMOKE_SUPER_ADMIN_PASSWORD:-${SUPER_ADMIN_PASSWORD:-}}"
TENANT_NAME="${SMOKE_TENANT_NAME:-${TENANT_NAME:-}}"
TENANT_SLUG="${SMOKE_TENANT_SLUG:-${TENANT_SLUG:-}}"
TENANT_ADMIN_EMAIL="${SMOKE_TENANT_ADMIN_EMAIL:-${TENANT_ADMIN_EMAIL:-}}"
TENANT_ADMIN_PASSWORD="${SMOKE_TENANT_ADMIN_PASSWORD:-${TENANT_ADMIN_PASSWORD:-}}"
PRODUCT_BARCODE="${SMOKE_PRODUCT_BARCODE:-${PRODUCT_BARCODE:-}}"

require_env() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "Missing required env var: $name" >&2
    exit 1
  fi
}

json_get() {
  python3 - "$1" <<'PY'
import json
import sys

key = sys.argv[1]
try:
    data = json.load(sys.stdin)
except json.JSONDecodeError:
    sys.exit(0)
for part in key.split('.'):
    if isinstance(data, dict):
        data = data.get(part)
    else:
        data = None
        break
if data is None:
    sys.exit(0)
if isinstance(data, (dict, list)):
    print(json.dumps(data))
else:
    print(data)
PY
}

require_env SMOKE_BASE_URL "$BASE_URL"
require_env SMOKE_SUPER_ADMIN_EMAIL "$SUPER_ADMIN_EMAIL"
require_env SMOKE_SUPER_ADMIN_PASSWORD "$SUPER_ADMIN_PASSWORD"
require_env SMOKE_TENANT_NAME "$TENANT_NAME"
require_env SMOKE_TENANT_SLUG "$TENANT_SLUG"
require_env SMOKE_TENANT_ADMIN_EMAIL "$TENANT_ADMIN_EMAIL"
require_env SMOKE_TENANT_ADMIN_PASSWORD "$TENANT_ADMIN_PASSWORD"
require_env SMOKE_PRODUCT_BARCODE "$PRODUCT_BARCODE"

BASE_URL="${BASE_URL%/}"
if [[ "$BASE_URL" == */api ]]; then
  BASE_URL="${BASE_URL%/api}"
fi

log_step() {
  echo "\n==> $1"
}

log_step "Logging in as super admin"
SUPER_LOGIN=$(curl -sS -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$SUPER_ADMIN_EMAIL\",\"password\":\"$SUPER_ADMIN_PASSWORD\"}")
SUPER_TOKEN=$(printf '%s' "$SUPER_LOGIN" | json_get token)
if [[ -z "$SUPER_TOKEN" ]]; then
  echo "Super admin login failed: $SUPER_LOGIN" >&2
  exit 1
fi

log_step "Creating or loading tenant"
TENANT_RESPONSE=$(curl -sS -X POST "$BASE_URL/api/tenants" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$TENANT_NAME\",\"slug\":\"$TENANT_SLUG\"}")
TENANT_ID=$(printf '%s' "$TENANT_RESPONSE" | json_get id)

if [[ -z "$TENANT_ID" ]]; then
  TENANTS_LIST=$(curl -sS -X GET "$BASE_URL/api/tenants" \
    -H "Authorization: Bearer $SUPER_TOKEN")
  TENANT_ID=$(printf '%s' "$TENANTS_LIST" | python3 - "$TENANT_SLUG" <<'PY'
import json
import sys

payload = json.load(sys.stdin)
slug = sys.argv[1]
for item in payload or []:
    if item.get('slug') == slug:
        print(item.get('id') or '')
        sys.exit(0)
print('')
PY
)
fi

if [[ -z "$TENANT_ID" ]]; then
  echo "Tenant creation failed: $TENANT_RESPONSE" >&2
  exit 1
fi

log_step "Creating tenant admin"
TENANT_ADMIN_RESPONSE=$(curl -sS -X POST "$BASE_URL/api/tenants/$TENANT_ID/users" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Smoke Tenant Admin\",\"email\":\"$TENANT_ADMIN_EMAIL\",\"password\":\"$TENANT_ADMIN_PASSWORD\",\"role\":\"TENANT_ADMIN\"}")
TENANT_ADMIN_ID=$(printf '%s' "$TENANT_ADMIN_RESPONSE" | json_get id)

if [[ -z "$TENANT_ADMIN_ID" ]]; then
  echo "Tenant admin creation failed: $TENANT_ADMIN_RESPONSE" >&2
  echo "Use a unique SMOKE_TENANT_ADMIN_EMAIL if the account already exists." >&2
  exit 1
fi

log_step "Logging in as tenant admin"
ADMIN_LOGIN=$(curl -sS -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TENANT_ADMIN_EMAIL\",\"password\":\"$TENANT_ADMIN_PASSWORD\"}")
ADMIN_TOKEN=$(printf '%s' "$ADMIN_LOGIN" | json_get token)
if [[ -z "$ADMIN_TOKEN" ]]; then
  echo "Tenant admin login failed: $ADMIN_LOGIN" >&2
  exit 1
fi

log_step "Fetching product by barcode"
PRODUCT_RESPONSE=$(curl -sS -X GET "$BASE_URL/api/products/alternatives/$PRODUCT_BARCODE" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
PRODUCT_ID=$(printf '%s' "$PRODUCT_RESPONSE" | json_get product.id)
if [[ -z "$PRODUCT_ID" ]]; then
  echo "Product lookup failed: $PRODUCT_RESPONSE" >&2
  exit 1
fi

log_step "Creating order"
ORDER_RESPONSE=$(curl -sS -X POST "$BASE_URL/api/orders" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"customer\":{\"name\":\"Smoke Test\",\"phone\":\"+966500000000\"},\"items\":[{\"product_id\":\"$PRODUCT_ID\",\"quantity\":2}],\"delivery_fee\":5}")
ORDER_ID=$(printf '%s' "$ORDER_RESPONSE" | json_get id)
CUSTOMER_ID=$(printf '%s' "$ORDER_RESPONSE" | json_get customer.id)
if [[ -z "$ORDER_ID" ]]; then
  echo "Order creation failed: $ORDER_RESPONSE" >&2
  exit 1
fi

log_step "Updating order status"
STATUS_RESPONSE=$(curl -sS -X PATCH "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"CONFIRMED"}')
UPDATED_STATUS=$(printf '%s' "$STATUS_RESPONSE" | json_get status)
if [[ "$UPDATED_STATUS" != "CONFIRMED" ]]; then
  echo "Order status update failed: $STATUS_RESPONSE" >&2
  exit 1
fi

log_step "Creating invoice"
INVOICE_RESPONSE=$(curl -sS -X POST "$BASE_URL/api/orders/$ORDER_ID/invoice" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
INVOICE_ID=$(printf '%s' "$INVOICE_RESPONSE" | json_get id)
if [[ -z "$INVOICE_ID" ]]; then
  echo "Invoice creation failed: $INVOICE_RESPONSE" >&2
  exit 1
fi

log_step "Recording payment"
PAYMENT_RESPONSE=$(curl -sS -X POST "$BASE_URL/api/invoices/$INVOICE_ID/payments" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method":"CASH","amount":50}')
PAID_STATUS=$(printf '%s' "$PAYMENT_RESPONSE" | json_get status)
if [[ -z "$PAID_STATUS" ]]; then
  echo "Payment failed: $PAYMENT_RESPONSE" >&2
  exit 1
fi

log_step "Adjusting loyalty points"
POINTS_RESPONSE=$(curl -sS -X POST "$BASE_URL/api/customers/$CUSTOMER_ID/points/adjust" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"delta":10,"reason":"smoke-adjustment"}')
POINTS_BALANCE=$(printf '%s' "$POINTS_RESPONSE" | json_get balance)
if [[ -z "$POINTS_BALANCE" ]]; then
  echo "Loyalty points adjustment failed: $POINTS_RESPONSE" >&2
  exit 1
fi

echo "\nSmoke E2E completed successfully."
