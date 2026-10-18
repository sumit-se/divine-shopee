#!/usr/bin/env bash
# deploy-shop.sh — pull latest + build React shop
# Lives on server at /opt/dsindian/scripts/deploy-shop.sh
set -euo pipefail

APP_DIR="/opt/dsindian/shop"
ENV_FILE="/opt/dsindian/shop.env"

echo "[shop] Pulling latest from divineshopee-shop..."
cd "$APP_DIR"
git pull origin divineshopee-shop

# Overlay production .env from server-side file
[ -f "$ENV_FILE" ] && cp "$ENV_FILE" .env

echo "[shop] Installing dependencies..."
npm ci --silent

echo "[shop] Building..."
npm run build

echo "[shop] Injecting runtime env vars..."
cd build
cp "$APP_DIR/.env" .
bash "$APP_DIR/env.sh"

echo "[shop] Deploy complete — served from $APP_DIR/build"
