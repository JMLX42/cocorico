#!/usr/bin/env ruby

require './deployment/autoconfigure.rb'

VERBOSE = false

Vagrant.autoconfigure({
  "local" => {
    "hosts" => ["192.168.50.42"],
    "vars" => {
      "hostname" => "cocorico.cc.test"
    },
    "memory" => 2048,
    "skip_tags" => []
  }
})
