# دليل التثبيت والتشغيل (Noor SaaS) — نسخة "انسخ والصق"

> **المتطلبات**: خادم Ubuntu 22.04 LTS جديد + وصول Root + دومين موجّه إلى الـIP (`noor.ghithak.com.sa`).  
> **المخدّم**: Hostinger VPS (الخطوات متوافقة تمامًا مع إعداداته).

---

## الوصول إلى الخادم
1. ادخل إلى لوحة تحكم Hostinger.
2. اذهب إلى قسم **VPS** واختر السيرفر الخاص بك.
3. انسخ تفاصيل **SSH Access**.
4. من ويندوز (PuTTY) أو ماك/لينكس (Terminal): اتصل كـ root.

```bash
ssh root@YOUR_SERVER_IP
```

---

## 1) التجهيز الآلي للسيرفر (Zero‑Error Server Setup)

**انسخ والصق هذه الأوامر بالترتيب:**

```bash
apt update && apt upgrade -y
apt install nginx nodejs npm postgresql postgresql-contrib redis-server certbot python3-certbot-nginx git -y
npm install pm2 -g
```

### إعداد قاعدة البيانات (PostgreSQL)

> استبدل كلمة السر القوية مكان النص داخل القوسين.

```bash
sudo -u postgres psql -c "CREATE DATABASE noor_db;"
sudo -u postgres psql -c "CREATE USER noor_user WITH PASSWORD '[كلمة_سر_قوية]';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE noor_db TO noor_user;"
```

### تنزيل الكود

> استبدل عنوان المستودع الخاص بك بدل `[Your_Repo_URL]` حال رفعك للملفات.

```bash
git clone [Your_Repo_URL] /var/www/noor
```

---

## 2) تشغيل الواجهة الخلفية (Backend – NestJS)

```bash
cd /var/www/noor/backend-nestjs
cp .env.example .env
nano .env
```

**املأ المتغيرات التالية:**
- `DATABASE_URL=postgres://noor_user:[كلمة_سر_قوية]@localhost:5432/noor_db`
- `JWT_SECRET=غيّره_فورًا`
- `OPENAI_API_KEY=...`
- `WHATSAPP_API_TOKEN=...` (إن كنت تستخدم Meta WhatsApp Cloud)
- `WHATSAPP_VERIFY_TOKEN=غيّره`
- `REDIS_URL=redis://localhost:6379`
- `TYPEORM_SYNC=true` (للتشغيل الأول فقط)

ثم:

```bash
npm install
npm run build
pm2 start dist/main.js --name "noor-api"
```

---

## 3) تشغيل الواجهة الأمامية (Frontend – Next.js)

```bash
cd /var/www/noor/frontend-nextjs
cp .env.example .env
nano .env
```

**املأ المتغيرات التالية:**
- `NEXT_PUBLIC_API_URL=https://noor.ghithak.com.sa/api`
- `NEXT_PUBLIC_SOCKET_URL=wss://noor.ghithak.com.sa`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...`

ثم:

```bash
npm install
npm run build
pm2 start "npm run start" --name "noor-web"
```

---

## 4) إعداد Nginx كـ Reverse Proxy

افتح الملف الافتراضي:

```bash
nano /etc/nginx/sites-available/default
```

**امسح كل شيء والصق التالي كما هو:**

```nginx
server {
  listen 80;
  server_name noor.ghithak.com.sa;

  client_max_body_size 25m;

  # واجهة الويب (Next.js) على المنفذ 3000
  location / {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_pass http://127.0.0.1:3000;
  }

  # الواجهة الخلفية (NestJS) على المنفذ 3001
  location /api/ {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
    proxy_pass http://127.0.0.1:3001/;
  }
}
```

اختبر وأعد التشغيل:

```bash
nginx -t
systemctl restart nginx
```

ثم فعّل SSL المجاني (Let's Encrypt) – **أمر آلي بدون أسئلة** (عدّل الإيميل):

```bash
certbot --nginx -d noor.ghithak.com.sa --non-interactive --agree-tos -m you@example.com
```

احفظ العمليات:

```bash
pm2 save
```

**النتيجة المتوقعة:** يعمل الموقع على `https://noor.ghithak.com.sa` ويعرض شاشة تسجيل الدخول بالعربية.

---

## 5) إعداد أول عميل (Ghithak Market)

1. افتح `https://noor.ghithak.com.sa` وسجّل دخول **Super Admin**:
   - البريد: `admin@noor.system`
   - كلمة المرور: `superadmin123`
2. من "إدارة المستأجرين" أنشئ مستأجرًا باسم **Ghithak Market** وأنشئ له مديرًا.
3. سجّل الدخول كمدير المستأجر الجديد.
4. إعدادات الردّ الذكي: أدخل مفاتيح OpenAI و WhatsApp.
5. الفروع والنطاقات: أنشئ فرعًا وارسم نطاق توصيل وحدّد رسمًا.
6. المنتجات: ارفع ملف `sample-data/sample-products.xlsx` عبر شاشة الاستيراد وطبّق المَابينغ.
7. العروض: أنشئ عرض "توصيل مجاني" لرقم جوالك.
8. التعليمات: اكتب "أنت مساعد لمتجر غذائك. كن ودودًا." واحفظ.
9. اختبار واتساب الحقيقي:
   - أرسل رسالة "طلب جديد من غذائك ..." من رقمك المضاف للعرض.
   - أرسل الموقع ضمن نطاقك.
   - راقب تطبيق الخصم ورسوم التوصيل في الرد النهائي.

---

## 6) ملفات البنية التحتية المفيدة

- تكوين PM2 الموحَّد: `infra/pm2/ecosystem.config.js`
- قالب Nginx: `infra/nginx/noor.conf.template`
- سكربت إعداد سريع: `infra/scripts/server_setup.sh`

---

## ملاحظات

- للتشغيل الأول يمكن إبقاء `TYPEORM_SYNC=true` ثم إطفاؤه لاحقًا.
- إن واجهت منفذًا محجوزًا غيّر القيم في `.env` وتعديل Nginx وفقًا لذلك.
- تذكّر تحديث بيانات Super Admin الافتراضية بعد التشغيل الأول.
