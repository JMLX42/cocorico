#!/bin/bash

pushd api
npm install && npm run build && npm test
popd

pushd app
npm install && npm run build && npm test
popd
