#!/usr/bin/env ruby

require './deployment/autoconfigure.rb'

VERBOSE = false

Vagrant.autoconfigure({
  "local" => {
    "hosts" => ["192.168.50.42"],
    "vars" => {
      "hostname" => "local.cocorico.cc"
    },
    "memory" => 3072,
    "skip_tags" => []
  }
})
