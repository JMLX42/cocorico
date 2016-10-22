#!/bin/bash

# This script runs on the backup server, manually triggered by the user:
# - it finds the latest snapshot according to a timestamp
# - it restores all the files back to the backup client
# - it runs a script on the backup client to re-import databases

set -x

test $# -eq 3 || {
    echo "usage: restore.sh user host timestamp" 1>&2
    exit 1
}

DATE=`date +"%Y-%m-%d-%H-%M-%S"`
SSH_USER=$1
SSH_HOST=$2
TIMESTAMP=$3

RESTORE_DIR_SRC=${HOME}/backup/${SSH_HOST}
RESTORE_DIR_DST=/tmp/restore-${DATE}

rdiff-backup --restore-as-of ${TIMESTAMP} ${RESTORE_DIR_SRC} ${SSH_USER}@${SSH_HOST}::${RESTORE_DIR_DST}

ssh -C ${SSH_USER}@${SSH_HOST} sudo /usr/local/bin/restore.sh ${RESTORE_DIR_DST}
