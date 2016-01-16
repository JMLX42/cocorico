#!/usr/bin/env ruby

# require 'rbconfig'
# (RbConfig::CONFIG['host_os'] =~ /mswin|mingw|cygwin/)

module AutoConfigure

  def autoconfigure(inventory)
    Vagrant.configure("2") do |config|
      inventory.each do |key, value|
        if key == "local"
          self._define_local config, key, value
        else
          self._define_managed config, key, value
        end
      end
    end

    self._write(inventory, "provisioning/generated/hosts.json")
  end

  def _provision(config, limit, skip = [])

    config.vm.provision "shell" do |s|
      s.path = File.join("deployment", "ansible.sh")

      s.args = ["provisioning/provision.yml", "provisioning/inventory", limit]
      s.args.push("--skip-tags", skip.join(",")) if skip and skip.length != 0
      s.args.push("-vvv") if VERBOSE
    end

    # config.vm.provision "ansible" do |ansible|
    #   ansible.sudo = true
    #   ansible.playbook = "provisioning/provision.yml"
    #   ansible.inventory_path = "provisioning/inventory"
    #   ansible.verbose = "vvv" if VERBOSE
    #   ansible.limit = limit
    #   ansible.skip_tags = skip if skip and skip.length != 0
    # end

  end

  def _define_managed(config, name, params)

    # Workaround for https://github.com/tknerr/vagrant-managed-servers/issues/34
    return unless ARGV.include?(name)

    config.vm.define name, autostart: false do |config|
      config.vm.box = "tknerr/managed-server-dummy"

      config.vm.hostname = params["vars"]["hostname"]

      config.vm.provider :managed do |managed, override|
        managed.server = params["hosts"][0] # FIXME: Deal with multiple hosts.

        override.ssh.username = params["vars"]["ansible_ssh_user"]
        override.ssh.private_key_path = params["vars"]["ansible_ssh_private_key_file"]
      end

      self._provision config, name, params["skip_tags"]
    end

  end

  def _define_local(config, name, params)

    config.vm.define name, primary: true do |config|
      config.vm.box = "ubuntu-trusty-64-current"
      config.vm.box_url = "https://cloud-images.ubuntu.com/vagrant/trusty/current/trusty-server-cloudimg-amd64-vagrant-disk1.box"

      config.vm.network :private_network, ip: params["hosts"][0]

      config.vm.hostname = params["vars"]["hostname"]

      config.vm.provider :virtualbox do |vbox, override|
        vbox.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
        vbox.customize ["guestproperty", "set", :id, "/VirtualBox/GuestAdd/VBoxService/--timesync-set-threshold", 10000]
        vbox.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
        vbox.customize ["modifyvm", :id, "--natdnsproxy1", "on"]
        vbox.customize ["modifyvm", :id, "--memory", params["memory"]]
        vbox.customize ["modifyvm", :id, "--cpus", 2]
        vbox.customize ["modifyvm", :id, "--ioapic", "on"]

        override.ssh.shell = "bash -c 'BASH_ENV=/etc/profile exec bash'"
      end

      config.vm.synced_folder ".", "/vagrant"#, owner: "www-data", group: "www-data"#, :mount_options => ["dmode=775,fmode=664"]

      config.vm.provision "shell", inline: "echo 'VM private network: #{params["hosts"][0]} #{params["vars"]["hostname"]}'"

      self._provision config, name, params["skip_tags"]
    end

  end

  def _write(inventory, filename)

    File.open(filename,"w") do |f|
      f.write("// Auto-generated (autoconfigure.rb)\n")
      f.write(JSON.pretty_generate(inventory))
    end

  end

end

Vagrant.extend(AutoConfigure)
