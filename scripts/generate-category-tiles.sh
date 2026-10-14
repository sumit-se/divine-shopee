#!/usr/bin/env bash
#
# Builds the shop-by-category tile pictures from the category banners.
#
#   ./scripts/generate-category-tiles.sh
#
# The carousel on the home page shows each category's banner at about 170px
# wide. Serving the 1170px banner for that is 80-130KB a tile to paint a
# thumbnail, so each one is rescaled here and written to tiles/ under the same
# basename. Re-run it after adding or replacing a banner.
#
# Rescaled, not cropped: the banners are nearly 4:1 with their subjects out at
# the edges, so a square-ish crop keeps the empty middle and throws the subject
# away. The whole picture is kept and the tile is shaped to suit it.

set -euo pipefail
cd "$(dirname "$0")/.."

SRC="public/assets/img/category"
OUT="$SRC/tiles"
# 170px on the page, doubled for retina and rounded up
WIDTH=420

mkdir -p "$OUT"

for f in "$SRC"/*.jpg "$SRC"/*.webp; do
  [ -e "$f" ] || continue
  base=$(basename "$f"); stem="${base%.*}"
  # -v1 files are superseded banners kept for reference, not in use
  case "$stem" in *-v1) continue;; esac
  # sips reads webp but cannot write it, so every tile lands as jpeg
  sips -s format jpeg -s formatOptions 82 -Z "$WIDTH" "$f" --out "$OUT/$stem.jpg" >/dev/null 2>&1
  printf "  %-28s -> tiles/%-28s %sK\n" "$base" "$stem.jpg" "$(( $(stat -f%z "$OUT/$stem.jpg") / 1024 ))"
done
