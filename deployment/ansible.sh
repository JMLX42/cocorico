#!/bin/bash

# Only used when running Ansible directly on the guest (Windows host).

PLAYBOOK=$1
shift
INVENTORY=$1
shift
LIMIT=$1
shift

ROOT=/vagrant

cd ${ROOT}

# Fix output buffering and colors.
export PYTHONUNBUFFERED=1
export ANSIBLE_FORCE_COLOR=true

# Make sure Ansible playbook exists.
if [ ! -f ${PLAYBOOK} ]; then
    echo "Cannot find Ansible playbook."
    exit 1
fi

# Check internet.
wget --quiet --spider http://google.com
if [ "$?" != 0 ]; then
    echo "No internet connectivity!"
    exit 1
fi

# Install Ansible locally.
if [ ! -x /usr/bin/ansible-playbook ]; then
    echo "Installing Ansible."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -qq -y software-properties-common apt-transport-https
    apt-add-repository ppa:fkrull/deadsnakes-python2.7
    apt-add-repository ppa:ansible/ansible
    apt-get update -qq
    apt-get install -qq -y python2.7 python-pip
    pip install ansible==1.9.4
fi

# Mark inventory scripts as executable (otherwise Ansible treats them differently).
chmod +x ${INVENTORY}/*.sh

# Run the playbook.
echo "Running Ansible provisioner defined in Vagrantfile."
ansible-playbook -i provisioning/inventory ${PLAYBOOK} --connection=local --limit=${LIMIT} $@
