#!/usr/bin/env bash
# deploy-admin.sh — pull latest + build Angular admin
# Lives on server at /opt/dsindian/scripts/deploy-admin.sh
set -euo pipefail

APP_DIR="/opt/dsindian/admin"
ENV_FILE="/opt/dsindian/admin.env"

echo "[admin] Pulling latest from divineshopee-admin..."
cd "$APP_DIR"
git pull origin divineshopee-admin

echo "[admin] Installing dependencies..."
npm ci --silent

echo "[admin] Building production bundle..."
npx ng build --configuration production

echo "[admin] Injecting runtime env vars into env.js..."
set -a
[ -f "$ENV_FILE" ] && source "$ENV_FILE"
set +a
envsubst < src/assets/env.template.js > dist/assets/env.js

echo "[admin] Deploy complete — served from $APP_DIR/dist"
