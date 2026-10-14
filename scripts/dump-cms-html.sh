#!/bin/bash
#
# Export the admin-authored product and category copy so PurgeCSS can see it.
#
# That copy is HTML written in the admin console and injected into the page at
# runtime. It lives in the database, so nothing in src/ mentions the classes it
# uses, and PurgeCSS would strip their rules. Run this before a production
# build whenever that copy has changed.
#
# Needs DB_PASSWORD in the environment, or it reads sm-shop's local profile.
set -euo pipefail
OUT="$(dirname "$0")/../purgecss-cms-content.html"
PROPS="${SHOPIZER_HOME:-$HOME/DSIndian/shopizer}/sm-shop/src/main/resources/profiles/local/database.properties"
PW="${DB_PASSWORD:-$(grep -m1 '^db.password=' "$PROPS" | cut -d= -f2-)}"
MYSQL_PWD="$PW" mysql -N --default-character-set=utf8mb4 -h127.0.0.1 -ushopizer SALESMANAGER -e "
  select DESCRIPTION from PRODUCT_DESCRIPTION where DESCRIPTION is not null
  union all select PRODUCT_HIGHLIGHT from PRODUCT_DESCRIPTION where PRODUCT_HIGHLIGHT is not null
  union all select DESCRIPTION from CATEGORY_DESCRIPTION where DESCRIPTION is not null
  union all select DESCRIPTION from CONTENT_DESCRIPTION where DESCRIPTION is not null;" > "$OUT"
echo "wrote $(wc -c < "$OUT") bytes to $OUT"
