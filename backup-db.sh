#!/bin/bash

# Database Backup Script for Task Tracker
# Schedule with cron: 0 2 * * * /var/www/task-tracker/backup-db.sh

BACKUP_DIR="/var/backups/task-tracker"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="task-manager"
DB_USER="SA"
DB_PASS="YourStrongPassword123!" # Change this!

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

echo "Starting database backup..."
echo "Date: $(date)"

# Backup database
sqlcmd -S localhost -U $DB_USER -P "$DB_PASS" -Q "BACKUP DATABASE [$DB_NAME] TO DISK = N'$BACKUP_DIR/$DB_NAME-$DATE.bak' WITH NOFORMAT, NOINIT, NAME = 'Full Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_DIR/$DB_NAME-$DATE.bak"
    
    # Compress backup
    gzip "$BACKUP_DIR/$DB_NAME-$DATE.bak"
    echo "Backup compressed: $BACKUP_DIR/$DB_NAME-$DATE.bak.gz"
    
    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "*.bak.gz" -mtime +7 -delete
    echo "Old backups cleaned (kept last 7 days)"
    
    # Calculate backup size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$DB_NAME-$DATE.bak.gz" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
else
    echo "Error: Backup failed!"
    exit 1
fi

echo "Backup process completed at $(date)"
