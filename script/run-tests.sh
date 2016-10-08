#!/bin/bash

set -v
set +e

pushd api
npm install && npm run build && npm test
$API_RC=$?
if [[ $API_RC != 0 ]]; then
    cat /opt/cocorico/log/api-web.forever.log | json -gi
    cat /opt/cocorico/log/blockchain.log
    cat /opt/cocorico/log/blockchain-worker-vote.forever.log | json -gi
    cat /opt/cocorico/log/blockchain-worker-ballot.forever.log | json -gi
fi
popd


pushd app
npm install && npm run build && npm test
$APP_RC=$?
popd

pushd blockchain-worker
npm install && npm test
$BLOCKCHAIN_WORKER_RC=$?
popd

if [[ $API_RC != 0 ]] || [[ $APP_RC != 0 ]] || [[ $BLOCKCHAIN_WORKER_RC != 0 ]]; then
    exit 1
fi
