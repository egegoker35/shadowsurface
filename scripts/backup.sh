#!/usr/bin/env bash
set -e

BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/shadowdb_$TIMESTAMP.sql"

echo "💾 Backing up database to $BACKUP_FILE..."
docker compose exec -T postgres pg_dump -U shadowuser shadowdb > "$BACKUP_FILE"

echo "✅ Backup complete: $BACKUP_FILE"
echo "📦 Size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Keep only last 7 backups
ls -t "$BACKUP_DIR"/*.sql | tail -n +8 | xargs -r rm
