# Orders/Invoices/Payments/Loyalty Points Smoke Tests

> Run these against a tenant-scoped account with valid auth credentials.

## Prerequisites

- Backend API running with `DATABASE_URL` set.
- Auth token with tenant scope (or SUPER_ADMIN).

## Migrations

```bash
cd backend-nestjs
npm run migration:run
```

## Orders

```bash
curl -X POST "$BASE_URL/api/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {"name": "Smoke Test", "phone": "+966500000000"},
    "items": [{"product_id": "<product-uuid>", "quantity": 2}],
    "delivery_fee": 5
  }'
```

```bash
curl -X GET "$BASE_URL/api/orders" \
  -H "Authorization: Bearer $TOKEN"
```

```bash
curl -X PATCH "$BASE_URL/api/orders/<order-uuid>/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'
```

## Invoices + Payments

```bash
curl -X POST "$BASE_URL/api/orders/<order-uuid>/invoice" \
  -H "Authorization: Bearer $TOKEN"
```

```bash
curl -X POST "$BASE_URL/api/invoices/<invoice-uuid>/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method": "CASH", "amount": 50}'
```

```bash
curl -X GET "$BASE_URL/api/invoices/<invoice-uuid>" \
  -H "Authorization: Bearer $TOKEN"
```

## Loyalty Points

```bash
curl -X POST "$BASE_URL/api/customers/<customer-uuid>/points/adjust" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"delta": 10, "reason": "manual-adjustment"}'
```

```bash
curl -X GET "$BASE_URL/api/customers/<customer-uuid>/points" \
  -H "Authorization: Bearer $TOKEN"
```
