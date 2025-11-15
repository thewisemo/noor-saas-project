# مخطط قاعدة البيانات (Multi-tenant)

يعتمد Noor على `tenant_id` لعزل البيانات. تم تصميم المخطط طبقا للموديلات التالية:

| الجدول | أهم الحقول | الملاحظات |
| --- | --- | --- |
| `tenants` | `id`, `name`, `slug`, `domain`, `whatsapp_phone_number_id`, `settings` | سجل المستأجر مع إعدادات القنوات. |
| `users` | `id`, `tenant_id`, `name`, `email`, `phone`, `password_hash`, `role`, `is_active` | يدعم الأدوار `SUPER_ADMIN`, `TENANT_ADMIN`, `STAFF`, `DRIVER`, `PREPARER`, `AGENT`. |
| `branches` | `tenant_id`, `name`, `slug`, `location`, `opening_hours` | فرع لكل مستأجر، مرتبط بالمناطق. |
| `zones` | `tenant_id`, `branch_id`, `name`, `polygon (GeoJSON)`, `delivery_fee`, `minimum_order_value` | يتم حفظ المضلع كـ GeoJSON ويستخدم في حاسبة الرسوم. |
| `products` | `tenant_id`, `name`, `sku`, `barcode`, `price`, `currency`, `is_available`, `attributes` | بيانات الأصناف + الحقول التي يعتمد عليها اقتراح البدائل. |
| `inventory` | `tenant_id`, `product_id`, `branch_id`, `quantity`, `reserved_quantity` | لتتبع المخزون لكل فرع. |
| `customers` | `tenant_id`, `name`, `phone`, `whatsapp_number`, `email`, `address`, `location` | يتم إنشاء العملاء مباشرة من محادثات واتساب. |
| `customer_groups` | `tenant_id`, `name`, `rules` | لتجزئة العملاء لحملات التسويق. |
| `promotions` | `tenant_id`, `code`, `discount_type`, `discount_value`, `starts_at`, `ends_at`, `conditions` | يدعم خصومات النسبة، القيمة الثابتة، ورسوم التوصيل. |
| `orders` | `tenant_id`, `order_number`, `customer_id`, `status`, `payment_status`, `sub_total`, `delivery_fee`, `total_amount`, `assigned_driver_id` | جدول الطلبات الأساسي مع ربط المنطقة والسائق. |
| `order_items` | `tenant_id`, `order_id`, `product_id`, `quantity`, `unit_price`, `status` | حالة كل صنف داخل الطلب. |
| `marketing_campaigns` | `tenant_id`, `name`, `channel`, `payload`, `audience`, `status` | قنوات التسويق (SMS/WhatsApp/Email). |
| `conversations` | `tenant_id`, `customer_id`, `channel`, `status`, `messages JSONB`, `assigned_agent_id` | وحفظ كامل لسجل الرسائل (bot/agent/customer). |
| `otp_codes` | `tenant_id`, `phone`, `code_hash`, `expires_at`, `attempts`, `is_verified` | خدمة OTP للسائقين والمجهزين. |

## المهاجرات (Migrations)

يتوفر مساران أساسيان:

1. `1710000000000-initial-schema.ts` لإنشاء جميع الجداول + مؤشرات Tenancy.
2. `1710000001000-create-super-admin-seed.ts` لإضافة حساب Super Admin (admin@noor.system / superadmin123).

يتم تنفيذ المهاجرات عبر `npm run build && npx typeorm-ts-node-commonjs migration:run -d ormconfig.ts`.
