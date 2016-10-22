#!/bin/bash

# This script runs in a cron job, on the backup server:
# - it runs /usr/local/bin/backup.sh on the backup client
# - it starts rdiff-backup in server mode on the backup client
# - it retrieves files to ~${USER}/${HOST} on the backup server

set -x

test $# -eq 2 || {
    echo "usage: backup.sh user host" 1>&2
    exit 1
}

DATE=`date +"%Y-%m-%d-%H-%M-%S"`
SSH_USER=$1
SSH_HOST=$2
BACKUP_DIR_SRC=/tmp/backup-${DATE}
BACKUP_DIR_DST=${HOME}/backup/${SSH_HOST}

ssh -C ${SSH_USER}@${SSH_HOST} nice sudo /usr/local/bin/backup.sh ${BACKUP_DIR_SRC}

test $? -eq 0 || {
    echo "error: pre-backup scripts failed on the backup client, not proceeding" > /dev/stderr
    exit 1
}

mkdir -p ${BACKUP_DIR_DST}

OPTIONS="--exclude-special-files --restrict-read-only /"
rdiff-backup --remote-schema "ssh -C %s nice sudo /usr/bin/rdiff-backup --server ${OPTIONS}" ${SSH_USER}@${SSH_HOST}::${BACKUP_DIR_SRC} ${BACKUP_DIR_DST}

ssh -C ${SSH_USER}@${SSH_HOST} nice sudo rm -rf ${BACKUP_DIR_SRC}
