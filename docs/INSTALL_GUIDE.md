# دليل التثبيت (Ubuntu 22.04 - Hostinger)
## تثبيت الحزم
apt update && apt upgrade -y
apt install nginx nodejs npm postgresql postgresql-contrib redis-server certbot python3-certbot-nginx git -y
npm install pm2 -g
## قاعدة البيانات
sudo -u postgres psql -c "CREATE DATABASE noor_db;"
sudo -u postgres psql -c "CREATE USER noor_user WITH PASSWORD '[ضع_كلمة_سر_قوية]';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE noor_db TO noor_user;"
## الباكند
cd /var/www/noor/backend-nestjs
cp .env.example .env
nano .env   # عدّل DATABASE_URL و JWT_SECRET و REDIS_URL
npm install && npm run build
pm2 start dist/main.js --name "noor-api"
## الواجهة
cd /var/www/noor/frontend-nextjs
cp .env.example .env
nano .env   # NEXT_PUBLIC_API_URL=https://noor.ghithak.com.sa/api
npm install && npm run build
pm2 start "npm run start" --name "noor-web"
## Nginx + SSL
nano /etc/nginx/sites-available/default
# الصق محتوى infra/nginx/noor.conf.template
nginx -t && systemctl restart nginx
certbot --nginx -d noor.ghithak.com.sa --non-interactive --agree-tos -m you@example.com
pm2 save
## تسجيل دخول Super Admin
البريد: admin@noor.system  |  كلمة المرور: superadmin123
