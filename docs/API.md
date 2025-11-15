# واجهات API الأساسية

جميع المسارات خلف `/api` وتستخدم JWT في ترويسة `Authorization: Bearer <token>`.

## المصادقة
- `POST /auth/login` — بريد/كلمة مرور (Super Admin ولوحات الويب).
- `POST /auth/otp/request` — حقول: `phone`, `tenantSlug`. ترسل OTP عبر مزود SMS.
- `POST /auth/otp/verify` — تتحقق من الرمز وتعيد JWT للسائق أو المُجهّز.

## إدارة المستأجرين
- `GET /tenants` — Super Admin فقط.
- `POST /tenants` — Super Admin، مع الحقول `name`, `slug?`, `domain?`, `whatsappPhoneNumberId?`.
- `GET /tenants/check?slug=foo` — للتحقق من توفر الـ slug.

## المناطق (Zones)
- `GET /zones` — يعيد جميع المناطق الخاصة بالمستأجر بعد استخراج `tenant_id` من الـ JWT.
- `POST /zones` — ينشئ Polygon جديد باستخدام GeoJSON (يستقبل مصفوفة نقاط lat/lng).
- `PATCH /zones/:id` — تعديل الرسوم أو المضلع.
- `DELETE /zones/:id` — حذف المنطقة.

## المنتجات والبدائل
- `GET /products/alternatives/:barcode` — يعيد المنتج الأساسي + 3 بدائل مقترحة (تعتمد على أقرب سعر وباقة التنقل).

## المحادثات
- `GET /conversations?status=AI_ACTIVE` — قائمة آخر 100 محادثة مع العميل وملخص الرسائل.
- `POST /conversations/takeover/:id` — تغيير الحالة إلى `AGENT_TAKEN_OVER` وتعيين المعرف الحالي (من الـ JWT).
- `POST /conversations/:id/resolve` — إنهاء المحادثة وتحويل الحالة إلى `RESOLVED`.

## ويتساب Webhook
- `POST /webhook/whatsapp` — يستقبل Webhook Meta الرسمي، يتعرف على المستأجر، يسجل العميل/المحادثة، يحسب رسوم المناطق عند مشاركة اللوكيشن، ويتعامل مع رموز الخصم والبدائل عبر OpenAI.
- `GET /webhook/whatsapp` — Endpoint التحقق من Meta (يستخدم `WHATSAPP_VERIFY_TOKEN`).
