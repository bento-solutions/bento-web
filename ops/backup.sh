#!/usr/bin/env bash
# Nightly backup of the blog: the Postgres database and the uploaded media.
# Installed in the bento user's crontab on the server (see README). Keeps 14 days.
# These files sit on the same server as the blog, so they do not protect against losing the server.
set -euo pipefail

DEST="${BACKUP_DIR:-/srv/bento/backups/bento-web}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"

mkdir -p "$DEST"
chmod 700 "$DEST"

# Written under a temporary name, so a failed run never looks like a good backup.
docker exec bento-web-postgres pg_dump -U bento_web -Fc bento_web >"$DEST/db-$STAMP.dump.tmp"
docker run --rm -v bento-web_bento-web-media:/media:ro alpine:3 tar -czf - -C /media . >"$DEST/media-$STAMP.tgz.tmp"

[ -s "$DEST/db-$STAMP.dump.tmp" ] || { echo "ERROR: empty database dump" >&2; exit 1; }
[ -s "$DEST/media-$STAMP.tgz.tmp" ] || { echo "ERROR: empty media archive" >&2; exit 1; }
mv "$DEST/db-$STAMP.dump.tmp" "$DEST/db-$STAMP.dump"
mv "$DEST/media-$STAMP.tgz.tmp" "$DEST/media-$STAMP.tgz"

find "$DEST" -maxdepth 1 -type f \( -name 'db-*.dump' -o -name 'media-*.tgz' \) -mtime "+$KEEP_DAYS" -delete
find "$DEST" -maxdepth 1 -type f -name '*.tmp' -mtime +1 -delete

echo "$(date -u +%FT%TZ) ok db=$(du -h "$DEST/db-$STAMP.dump" | cut -f1) media=$(du -h "$DEST/media-$STAMP.tgz" | cut -f1)"
