#!/usr/bin/env ruby

require './deployment/autoconfigure.rb'

VERBOSE = false

Vagrant.autoconfigure({
  "local" => {
    "hosts" => ["192.168.50.42"],
    "vars" => {
      "hostname" => "cocorico.cc"
    },
    "memory" => 4096,
    "skip_tags" => []
  }
})
