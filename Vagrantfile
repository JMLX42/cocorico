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
  }
})
