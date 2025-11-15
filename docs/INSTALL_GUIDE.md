# دليل التثبيت (Ubuntu 22.04 - Hostinger)

> جميع الأوامر التالية تُنفَّذ كمستخدم `root` أو مع `sudo`.

## 1. تجهيز الخادم
```bash
apt update && apt upgrade -y
apt install nginx git curl postgresql postgresql-contrib certbot python3-certbot-nginx -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y
npm install -g pm2
```

## 2. إنشاء مجلد المشروع وسحب الكود
```bash
mkdir -p /var/www/noor
cd /var/www/noor
git clone https://github.com/thewisemo/noor-saas-project.git .
```

## 3. قاعدة البيانات PostgreSQL
```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE noor_db;
CREATE USER noor_user WITH PASSWORD 'ضع_كلمة_سر_قوية';
GRANT ALL PRIVILEGES ON DATABASE noor_db TO noor_user;
SQL
```

## 4. ضبط متغيرات البيئة
### الباكند
```bash
cd /var/www/noor/backend-nestjs
cp env.example .env
nano .env
# عيّن القيم التالية:
# DATABASE_URL=postgresql://noor_user:ضع_كلمة_سر_قوية@127.0.0.1:5432/noor_db
# JWT_SECRET=عبارة_طويلة_عشوائية
# SMS_PROVIDER_BASE_URL / SMS_PROVIDER_API_KEY / SMS_PROVIDER_SENDER_ID
# OPENAI_API_KEY
# WHATSAPP_VERIFY_TOKEN / WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN
```

### الواجهة (Next.js)
```bash
cd /var/www/noor/frontend-nextjs
cp env.example .env
nano .env
# NEXT_PUBLIC_API_URL=https://noor.ghithak.com.sa/api
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=مفتاح_خرائط_جوجل
```

## 5. تثبيت الاعتمادات وبناء الحزم
### Backend (NestJS)
```bash
cd /var/www/noor/backend-nestjs
npm install
npm run build
# تنفيذ المهاجرات وتوليد حساب الـ Super Admin
npx typeorm-ts-node-commonjs migration:run -d ormconfig.ts
pm2 start dist/main.js --name noor-api
pm2 save
```

### Frontend (Next.js)
```bash
cd /var/www/noor/frontend-nextjs
npm install
npm run build
pm2 start "npm run start" --name noor-web -- --port 3000
pm2 save
```

> البيانات الافتراضية للدخول: `admin@noor.system / superadmin123`

## 6. إعداد Nginx + SSL
```bash
cp /var/www/noor/infra/nginx/noor.conf.template /etc/nginx/sites-available/noor.conf
nano /etc/nginx/sites-available/noor.conf   # عدّل server_name والبروكسي إذا لزم
ln -s /etc/nginx/sites-available/noor.conf /etc/nginx/sites-enabled/noor.conf
nginx -t && systemctl reload nginx
certbot --nginx -d noor.ghithak.com.sa --non-interactive --agree-tos -m you@example.com
```

## 7. مراقبة الخدمات
```bash
pm2 status
pm2 logs noor-api --lines 20
pm2 logs noor-web --lines 20
```

## 8. تغيير اسم النطاق لاحقًا
1. **تعديل الواجهة:** افتح ملف `frontend-nextjs/.env` وعدّل `NEXT_PUBLIC_API_URL` إلى النطاق الجديد ثم أعد `npm run build` و `pm2 restart noor-web`.  
2. **تعديل Nginx:** افتح `/etc/nginx/sites-available/noor.conf`, غيّر `server_name` ودوّن المسار الجديد، ثم `nginx -t && systemctl reload nginx`.  
3. **تجديد الشهادة:** شغّل `certbot --nginx -d domain.new --non-interactive --agree-tos -m you@example.com`.

> تنويه: تطبيقات Android (السائق والمجهز) تستخدم القيم الموجودة في `BuildConfig` (`SOCKET_URL` و `API_URL`). عند النشر ببيئة جديدة قم بتحديثها وإعادة بناء الحزم.
