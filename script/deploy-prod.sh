#!/bin/bash

if [ "$TRAVIS" == "" ] || [ "$TRAVIS_BRANCH" == "feature/master-deploy" ]; then

  openssl aes-256-cbc \
    -K "$encrypted_1f753eb353f1_key" \
    -iv "$encrypted_1f753eb353f1_iv" \
    -in "./key/cocorico.cc.enc" \
    -out "./key/cocorico.cc" -d

  ssh root@cocorico.cc -i ./key/cocorico.cc << EOF
    rm -rf /vagrant
    git clone https://github.com/promethe42/cocorico /vagrant
    export PLAYBOOK="provisioning/provision.yml"
    export INVENTORY="provisioning/inventory"
    export LIMIT="prod"
    export SKIP_TAGS=""
    export VERBOSE="vvv"
    export PROVIDER="travis"
    echo $PLAYBOOK
    cd /vagrant
    bash ./deployment/ansible.sh
EOF
elif [ "$TRAVIS_BRANCH" != "master" ]; then
  echo "Not on the master branch: skipping production deployment."
fi
