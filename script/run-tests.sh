#!/bin/bash

set -v
set +e

pushd api
npm install && npm run build && npm test
popd

if [[ $rc != 0 ]]; then
    cat /opt/cocorico/log/api-web.forever.log
    cat /opt/cocorico/log/blockchain.log
    cat /opt/cocorico/log/blockchain-worker-vote.forever.log
    cat /opt/cocorico/log/blockchain-worker-ballot.forever.log
fi

pushd app
npm install && npm run build && npm test
popd

pushd blockchain-worker
npm install && npm test
popd
