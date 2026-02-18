#!/bin/bash
# =============================================================================
# IVM Restore Script
# Restores database, documents, and logs from a backup
# =============================================================================

set -euo pipefail

# Configuration
POSTGRES_USER="${POSTGRES_USER:-ivm_user}"
POSTGRES_DB="${POSTGRES_DB:-ivm_db}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

# Check arguments
if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup-file>"
  echo "  backup-file: Path to backup .tar.gz or .tar.gz.enc file"
  exit 1
fi

BACKUP_FILE="$1"
RESTORE_DIR=$(mktemp -d)

echo "========================================="
echo "IVM Restore"
echo "========================================="
echo "Backup file: ${BACKUP_FILE}"
echo ""

# Decrypt if needed
if [[ "${BACKUP_FILE}" == *.enc ]]; then
  if [ -z "${ENCRYPTION_KEY}" ]; then
    echo "ERROR: Backup is encrypted but BACKUP_ENCRYPTION_KEY is not set."
    exit 1
  fi
  echo "Decrypting backup..."
  DECRYPTED="${RESTORE_DIR}/backup.tar.gz"
  openssl enc -aes-256-cbc -d -salt -pbkdf2 \
    -in "${BACKUP_FILE}" \
    -out "${DECRYPTED}" \
    -pass pass:"${ENCRYPTION_KEY}"
  BACKUP_FILE="${DECRYPTED}"
fi

# Extract backup archive
echo "Extracting backup archive..."
tar -xzf "${BACKUP_FILE}" -C "${RESTORE_DIR}"

# Find the backup directory inside
BACKUP_DIR=$(find "${RESTORE_DIR}" -maxdepth 1 -type d -name "ivm_backup_*" | head -1)
if [ -z "${BACKUP_DIR}" ]; then
  # Might be a flat archive
  BACKUP_DIR="${RESTORE_DIR}"
fi

echo ""

# 1. Restore database
if [ -f "${BACKUP_DIR}/database.dump" ]; then
  echo "[1/3] Restoring PostgreSQL database..."
  echo "  WARNING: This will overwrite the current database!"
  read -p "  Continue? (y/N): " CONFIRM
  if [ "${CONFIRM}" = "y" ] || [ "${CONFIRM}" = "Y" ]; then
    PGPASSWORD="${POSTGRES_PASSWORD:-ivm_password}" pg_restore \
      -h "${POSTGRES_HOST}" \
      -p "${POSTGRES_PORT}" \
      -U "${POSTGRES_USER}" \
      -d "${POSTGRES_DB}" \
      --clean --if-exists \
      "${BACKUP_DIR}/database.dump" 2>/dev/null || true
    echo "  Database restored."
  else
    echo "  Database restore skipped."
  fi
else
  echo "[1/3] No database dump found, skipping."
fi

# 2. Restore documents
if [ -f "${BACKUP_DIR}/documents.tar.gz" ]; then
  echo "[2/3] Restoring documents..."
  mkdir -p /data/documents
  tar -xzf "${BACKUP_DIR}/documents.tar.gz" -C /data
  echo "  Documents restored to /data/documents."
else
  echo "[2/3] No documents archive found, skipping."
fi

# 3. Restore logs
if [ -f "${BACKUP_DIR}/logs.tar.gz" ]; then
  echo "[3/3] Restoring audit logs..."
  mkdir -p /data/logs
  tar -xzf "${BACKUP_DIR}/logs.tar.gz" -C /data
  echo "  Logs restored to /data/logs."
else
  echo "[3/3] No logs archive found, skipping."
fi

# Cleanup
rm -rf "${RESTORE_DIR}"

echo ""
echo "========================================="
echo "Restore complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Restart the application: docker-compose restart app"
echo "  2. Run Prisma migrations if needed: npx prisma migrate deploy"
echo "  3. Verify data integrity"
