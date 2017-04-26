#!/bin/bash

VERBOSE=0

while test $# -gt 0
do
    case "$1" in
        --verbose) VERBOSE=1
            ;;
        -v) VERBOSE=1
            ;;
        --*) echo "unknown option $1"; exit 1
            ;;
    esac
    shift
done

if [[ $VERBOSE == 0 ]]; then
    set -v
fi

set +e

pushd api
npm install && npm run build
service cocorico-api-web restart
npm test
API_RC=$?
if [[ $API_RC != 0 ]] && [[ $VERBOSE != 0 ]]; then
    cat /opt/cocorico/log/api-web.forever.log
    cat /opt/cocorico/log/blockchain-worker-vote.forever.log
    cat /opt/cocorico/log/blockchain-worker-ballot.forever.log
    cat /opt/cocorico/log/blockchain.log
fi
popd


pushd app
npm install && npm run build && npm test
APP_RC=$?
popd

pushd blockchain-worker
npm install && npm test
BLOCKCHAIN_WORKER_RC=$?
popd

pushd webhook
npm install && npm test
popd

if [[ $API_RC != 0 ]] || [[ $APP_RC != 0 ]] || [[ $BLOCKCHAIN_WORKER_RC != 0 ]]; then
    exit 1
fi
