#!/usr/bin/env bash
# deploy-api.sh — pull latest + build + restart Spring Boot API
# Lives on server at /opt/dsindian/scripts/deploy-api.sh
set -euo pipefail

APP_DIR="/opt/dsindian/api"

echo "[api] Pulling latest from divineshopee-api..."
cd "$APP_DIR"
git pull origin divineshopee-api

echo "[api] Building JAR (skipping tests)..."
mvn clean package -DskipTests -q

echo "[api] Restarting service..."
systemctl restart dsindian-api
systemctl --no-pager status dsindian-api

echo "[api] Deploy complete."
