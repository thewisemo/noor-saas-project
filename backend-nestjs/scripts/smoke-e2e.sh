#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://127.0.0.1:3001}
API_BASE="${BASE_URL%/}/api"

SUPER_ADMIN_EMAIL=${SUPER_ADMIN_EMAIL:-admin@noor.system}
SUPER_ADMIN_PASSWORD=${SUPER_ADMIN_PASSWORD:-superadmin123}

TENANT_NAME=${SMOKE_TENANT_NAME:-"Smoke Tenant"}
TENANT_SLUG=${SMOKE_TENANT_SLUG:-"smoke-tenant"}
TENANT_ADMIN_EMAIL=${SMOKE_TENANT_ADMIN_EMAIL:-"smoke-admin@noor.system"}
TENANT_ADMIN_PASSWORD=${SMOKE_TENANT_ADMIN_PASSWORD:-"smokeadmin123"}
TENANT_ADMIN_NAME=${SMOKE_TENANT_ADMIN_NAME:-"Smoke Admin"}

PRODUCT_BARCODE=${SMOKE_PRODUCT_BARCODE:-"0000000000"}
CUSTOMER_NAME=${SMOKE_CUSTOMER_NAME:-"Smoke Customer"}
CUSTOMER_PHONE=${SMOKE_CUSTOMER_PHONE:-"+966555000000"}

export SMOKE_TENANT_SLUG="$TENANT_SLUG"
export SMOKE_TENANT_ADMIN_EMAIL="$TENANT_ADMIN_EMAIL"

log() {
  echo "[smoke] $*"
}

fail() {
  echo "[smoke] ERROR: $*" >&2
  exit 1
}

request() {
  local method=$1
  local url=$2
  local token=${3:-}
  local data=${4:-}
  local response
  local body
  local status

  if [[ -n "$data" ]]; then
    if ! response=$(curl -sS -w "\n%{http_code}" -X "$method" \
      -H 'Content-Type: application/json' \
      ${token:+-H "Authorization: Bearer $token"} \
      --data "$data" \
      "$url"); then
      fail "Request failed: $method $url"
    fi
  else
    if ! response=$(curl -sS -w "\n%{http_code}" -X "$method" \
      -H 'Content-Type: application/json' \
      ${token:+-H "Authorization: Bearer $token"} \
      "$url"); then
      fail "Request failed: $method $url"
    fi
  fi

  body=${response%$'\n'*}
  status=${response##*$'\n'}

  if [[ ! "$status" =~ ^[0-9]{3}$ ]]; then
    echo "[smoke] Unexpected response status for $method $url: $status" >&2
    echo "$body" >&2
    exit 1
  fi

  if (( status >= 400 )); then
    echo "[smoke] ERROR $method $url -> $status" >&2
    echo "[smoke] Response body:" >&2
    echo "$body" >&2
    exit 1
  fi

  echo "$body"
}

json_eval() {
  local body=$1
  local expr=$2
  local output
  if ! output=$(python3 - "$body" "$expr" <<'PY'
import json
import os
import sys

body = sys.argv[1]
expr = sys.argv[2]

try:
  data = json.loads(body)
except Exception:
  sys.exit(1)

try:
  value = eval(expr, {"json": data, "os": os})
except Exception:
  sys.exit(2)

if value is None or value == "":
  sys.exit(3)

if isinstance(value, (dict, list)):
  print(json.dumps(value))
else:
  print(value)
PY
); then
    local code=$?
    if [[ $code -eq 1 ]]; then
      echo "[smoke] Non-JSON response while reading: $expr" >&2
      echo "$body" >&2
      exit 1
    fi
    if [[ $code -eq 3 ]]; then
      echo "[smoke] Missing value for: $expr" >&2
      echo "$body" >&2
      exit 1
    fi
    echo "[smoke] Failed to evaluate expression: $expr" >&2
    echo "$body" >&2
    exit 1
  fi
  echo "$output"
}

json_optional() {
  local body=$1
  local expr=$2
  local output
  if ! output=$(python3 - "$body" "$expr" <<'PY'
import json
import os
import sys

body = sys.argv[1]
expr = sys.argv[2]

try:
  data = json.loads(body)
except Exception:
  sys.exit(1)

try:
  value = eval(expr, {"json": data, "os": os})
except Exception:
  sys.exit(2)

if value is None or value == "":
  sys.exit(0)

if isinstance(value, (dict, list)):
  print(json.dumps(value))
else:
  print(value)
PY
); then
    local code=$?
    if [[ $code -eq 1 ]]; then
      echo "[smoke] Non-JSON response while reading: $expr" >&2
      echo "$body" >&2
      exit 1
    fi
    echo "[smoke] Failed to evaluate expression: $expr" >&2
    echo "$body" >&2
    exit 1
  fi
  echo "$output"
}

log "Logging in as super admin..."
login_body=$(request POST "$API_BASE/auth/login" "" "{\"email\":\"$SUPER_ADMIN_EMAIL\",\"password\":\"$SUPER_ADMIN_PASSWORD\"}")
SUPER_TOKEN=$(json_eval "$login_body" 'json.get("token")')

log "Ensuring tenant exists..."
tenants_body=$(request GET "$API_BASE/tenants" "$SUPER_TOKEN")
tenant_id=$(json_optional "$tenants_body" 'next((t.get("id") for t in (json if isinstance(json, list) else (json.get("data") or json.get("tenants") or [])) if t.get("slug") == os.environ.get("SMOKE_TENANT_SLUG")), None)')

if [[ -z "$tenant_id" ]]; then
  create_tenant_body=$(request POST "$API_BASE/tenants" "$SUPER_TOKEN" "{\"name\":\"$TENANT_NAME\",\"slug\":\"$TENANT_SLUG\"}")
  tenant_id=$(json_eval "$create_tenant_body" 'json.get("id")')
fi

log "Ensuring tenant admin exists..."
users_body=$(request GET "$API_BASE/tenants/$tenant_id/users" "$SUPER_TOKEN")
admin_exists=$(json_optional "$users_body" 'next((u.get("id") for u in (json if isinstance(json, list) else (json.get("data") or json.get("users") or [])) if u.get("email") == os.environ.get("SMOKE_TENANT_ADMIN_EMAIL")), None)')

if [[ -z "$admin_exists" ]]; then
  request POST "$API_BASE/tenants/$tenant_id/users" "$SUPER_TOKEN" "{\"name\":\"$TENANT_ADMIN_NAME\",\"email\":\"$TENANT_ADMIN_EMAIL\",\"password\":\"$TENANT_ADMIN_PASSWORD\"}" >/dev/null
fi

log "Logging in as tenant admin..."
tenant_login_body=$(request POST "$API_BASE/auth/login" "" "{\"email\":\"$TENANT_ADMIN_EMAIL\",\"password\":\"$TENANT_ADMIN_PASSWORD\"}")
TENANT_TOKEN=$(json_eval "$tenant_login_body" 'json.get("token")')

log "Resolving product by barcode..."
product_body=$(request GET "$API_BASE/products/alternatives/$PRODUCT_BARCODE" "$TENANT_TOKEN")
product_id=$(json_eval "$product_body" '((json.get("product") or {}).get("id")) or (json[0].get("id") if isinstance(json, list) and json else None) or (next((item.get("id") for item in (json.get("data") or json.get("products") or []) if isinstance(item, dict)), None))')

log "Creating or fetching customer..."
customer_body=$(request POST "$API_BASE/customers" "$TENANT_TOKEN" "{\"name\":\"$CUSTOMER_NAME\",\"phone\":\"$CUSTOMER_PHONE\"}")
customer_id=$(json_eval "$customer_body" 'json.get("id")')

log "Creating order..."
order_body=$(request POST "$API_BASE/orders" "$TENANT_TOKEN" "{\"customer_id\":\"$customer_id\",\"items\":[{\"product_id\":\"$product_id\",\"quantity\":1}],\"delivery_fee\":0}")
order_id=$(json_eval "$order_body" 'json.get("id")')
order_total=$(json_eval "$order_body" 'json.get("total_amount") or json.get("totalAmount")')

log "Creating invoice..."
invoice_body=$(request POST "$API_BASE/orders/$order_id/invoice" "$TENANT_TOKEN")
invoice_id=$(json_eval "$invoice_body" 'json.get("id")')
invoice_total=$(json_eval "$invoice_body" 'json.get("total_amount") or json.get("totalAmount") or None')

payment_total=${invoice_total:-$order_total}

node -e 'const amount = Number(process.argv[1]); if (!Number.isFinite(amount) || amount <= 0) process.exit(1);' "$payment_total" || {
  echo "[smoke] Invalid payment amount: $payment_total" >&2
  exit 1
}

log "Recording payment..."
request POST "$API_BASE/invoices/$invoice_id/payments" "$TENANT_TOKEN" "{\"method\":\"CASH\",\"amount\":$payment_total}" >/dev/null

log "PASS"
