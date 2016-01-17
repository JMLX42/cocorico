# Cocorico

Cocorico is a democracy engine.

## Install

* Install [VirtualBox 4.3+](https://www.virtualbox.org/wiki/Downloads).
* Install [Vagrant 1.7+](https://docs.vagrantup.com/v2/installation/).
* `git clone https://github.com/promethe42/cocorico.git && cd cocorico`
* `vagrant up local` (run as admin on Windows)
* Add `192.168.50.42 cocorico.cc.test` to your hosts file.
* Go to [http://cocorico.cc.test](http://cocorico.cc.test) to test the platform.

## Building and running

All the following procedures are to be executed on the dev environment VM using SSH. To connect to the VM using SSH, use the `vagrant ssh local` command in the install directory.

### Web API

The Web API should build and run when the install is done but also whenever you start the machine. You can also manually control the process as a service:

`service cocorico-api-web stop` (or `start` or `restart`)

To debug the API, you can run it directly in your terminal and have the (error) logs:

`cd /vagrant/api && npm start`

### Web app

The Web app is build during the install. Use the following command to re-build the Web app once:

`cd /vagrant/app && npm build`

or the following command to build the Web app whenever a file changes (recommended for development):

`cd /vagrant/app && npm watch`

## Licence

MIT
