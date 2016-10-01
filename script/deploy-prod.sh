#!/bin/bash

openssl aes-256-cbc \
  -K "$encrypted_d9774cb211e3_key" \
  -iv "$encrypted_d9774cb211e3_iv" \
  -in "${TRAVIS_BUILD_DIR}/key/cocorico.cc.enc" \
  -out "${TRAVIS_BUILD_DIR}/key/cocorico.cc" -d

chmod 600 "${TRAVIS_BUILD_DIR}/key/cocorico.cc"

openssl aes-256-cbc \
  -K "$encrypted_1f753eb353f1_key" \
  -iv "$encrypted_1f753eb353f1_iv" \
  -in "${TRAVIS_BUILD_DIR}/provisioning/inventory/group_vars/prod.yml.enc" \
  -out "${TRAVIS_BUILD_DIR}/provisioning/inventory/group_vars/prod.yml" -d

scp \
  -i "${TRAVIS_BUILD_DIR}/key/cocorico.cc" \
  -o "StrictHostKeyChecking=no" \
  "${TRAVIS_BUILD_DIR}/provisioning/inventory/group_vars/prod.yml" \
  root@cocorico.cc:/tmp/prod.yml

ssh -i "${TRAVIS_BUILD_DIR}/key/cocorico.cc" -o "StrictHostKeyChecking=no" root@cocorico.cc << EOF
  rm -rf /vagrant
  git clone https://github.com/promethe42/cocorico /vagrant
  export PLAYBOOK="provisioning/provision.yml"
  export INVENTORY="provisioning/inventory"
  export LIMIT="prod"
  export SKIP_TAGS=""
  export VERBOSE="vvv"
  export PROVIDER="travis"
  cd /vagrant
  cp /tmp/prod.yml /vagrant/provisioning/inventory/group_vars/prod.yml
  bash ./deployment/ansible.sh
EOF
