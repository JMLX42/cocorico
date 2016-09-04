#!/usr/bin/env ruby

require './deployment/vagrant.rb'

Vagrant.autoconfigure({
  :local => {
    :provider => "virtualbox",
    :hosts => ["192.168.50.42"],
    :vars => {
      :hostname => "local.cocorico.cc"
    },
    :memory => 3072
  },
  :image => {
    :provider => "docker",
    :hosts => ["127.0.0.1"],
    :vars => {
      :hostname => "local.cocorico.cc"
    }
  },
  :prod => {
    :provider => "managed",
    :hosts => ["164.132.226.123"],
    :vars => {
      :hostname => "cocorico.cc",
      :ansible_ssh_user => "root",
      :ansible_ssh_private_key_file => "key/cocorico.cc"
    }
  }
})
