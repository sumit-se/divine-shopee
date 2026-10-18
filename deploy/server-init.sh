#!/usr/bin/env bash
# server-init.sh — one-time server setup for DSIndian (Ubuntu 22.04)
# Run from your Mac: ssh dsindian-prod 'bash -s' < deploy/server-init.sh
set -euo pipefail

REPO="git@github.com:sumit-se/divine-shopee.git"
APP_DIR="/opt/dsindian"
SCRIPTS_DIR="$APP_DIR/scripts"

echo "==> Updating packages..."
apt-get update -qq

echo "==> Installing Java 11..."
apt-get install -y -qq openjdk-11-jdk maven

echo "==> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
apt-get install -y -qq nodejs

echo "==> Installing Nginx & MySQL..."
apt-get install -y -qq nginx mysql-server
systemctl enable mysql
systemctl start mysql

echo "==> Setting up MySQL database and user..."
# Credentials are taken from /opt/dsindian/api.env (created below)
# You can edit /opt/dsindian/api.env before running this script
source /opt/dsindian/api.env 2>/dev/null || true
DB_PASS="${DB_PASSWORD:-CHANGE_ME}"
mysql -e "
CREATE DATABASE IF NOT EXISTS SALESMANAGER CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'shopizer'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON SALESMANAGER.* TO 'shopizer'@'localhost';
FLUSH PRIVILEGES;
"

echo "==> Generating GitHub deploy key..."
mkdir -p /root/.ssh
if [ ! -f /root/.ssh/github_deploy ]; then
  ssh-keygen -t ed25519 -C "dsindian-prod-deploy" -f /root/.ssh/github_deploy -N ""
  cat >> /root/.ssh/config <<'SSHEOF'
Host github.com
    IdentityFile /root/.ssh/github_deploy
    IdentitiesOnly yes
    StrictHostKeyChecking accept-new
SSHEOF
fi

echo ""
echo "======================================================"
echo "  GITHUB DEPLOY KEY — add this to your repo:"
echo "  https://github.com/sumit-se/divine-shopee/settings/keys"
echo "======================================================"
cat /root/.ssh/github_deploy.pub
echo "======================================================"
echo ""
read -rp "Press Enter after adding the deploy key to GitHub..."

echo "==> Creating app directories..."
mkdir -p "$APP_DIR"/{api,admin,shop} "$SCRIPTS_DIR"

echo "==> Cloning repos..."
[ ! -d "$APP_DIR/api/.git" ] && git clone "$REPO" "$APP_DIR/api" --branch divineshopee-api --single-branch
[ ! -d "$APP_DIR/admin/.git" ] && git clone "$REPO" "$APP_DIR/admin" --branch divineshopee-admin --single-branch
[ ! -d "$APP_DIR/shop/.git" ] && git clone "$REPO" "$APP_DIR/shop" --branch divineshopee-shop --single-branch

echo "==> Copying deploy scripts and configs..."
cp "$APP_DIR/api/deploy/deploy-api.sh"    "$SCRIPTS_DIR/"
cp "$APP_DIR/api/deploy/deploy-admin.sh"  "$SCRIPTS_DIR/"
cp "$APP_DIR/api/deploy/deploy-shop.sh"   "$SCRIPTS_DIR/"
chmod +x "$SCRIPTS_DIR/"*.sh

echo "==> Installing systemd service..."
cp "$APP_DIR/api/deploy/dsindian-api.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable dsindian-api

echo "==> Configuring Nginx..."
rm -f /etc/nginx/sites-enabled/default
cp "$APP_DIR/api/deploy/nginx/shop.conf"  /etc/nginx/sites-available/divineshopee.in
cp "$APP_DIR/api/deploy/nginx/admin.conf" /etc/nginx/sites-available/admin.divineshopee.in
ln -sf /etc/nginx/sites-available/divineshopee.in      /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/admin.divineshopee.in /etc/nginx/sites-enabled/

echo "==> Running initial builds..."
"$SCRIPTS_DIR/deploy-api.sh"
"$SCRIPTS_DIR/deploy-shop.sh"
"$SCRIPTS_DIR/deploy-admin.sh"

echo "==> Starting services..."
systemctl start dsindian-api
nginx -t && systemctl restart nginx

echo ""
echo "======================================================"
echo "  Setup complete!"
echo "  Shop:  http://divineshopee.in"
echo "  Admin: http://admin.divineshopee.in"
echo "  API:   http://divineshopee.in/api"
echo "======================================================"
