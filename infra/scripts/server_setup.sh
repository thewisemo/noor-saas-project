#!/usr/bin/env bash
set -e

apt update && apt upgrade -y
apt install nginx nodejs npm postgresql postgresql-contrib redis-server certbot python3-certbot-nginx git -y
npm install pm2 -g

sudo -u postgres psql -c "CREATE DATABASE noor_db;"
sudo -u postgres psql -c "CREATE USER noor_user WITH PASSWORD 'ChangeMeNOW!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE noor_db TO noor_user;"
