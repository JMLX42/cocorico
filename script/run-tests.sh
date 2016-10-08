#!/bin/bash

set -ev

pushd api
npm install && npm run build && npm test
popd

pushd app
npm install && npm run build && npm test
popd

pushd blockchain-worker
npm install && npm test
popd
