# Building a Docker image

## Install Packer

Follow the [packer installation documentation](https://www.packer.io/intro/getting-started/setup.html).

## Install Docker

Follow the installation instruction for your OS:

* [Installation on Mac OS X](https://docs.docker.com/engine/installation/mac/)
* [Installation on Windows](https://docs.docker.com/engine/installation/windows/)
* [Installation on Ubuntu](https://docs.docker.com/engine/installation/linux/ubuntulinux/)
    * make sure your user is in the `docker` group by running `sudo usermod -aG docker $USER` and signing in/out of your Ubuntu session

## Build the image

In the project root folder, run the following command:

`vagrant up image`

At the end of the process, you might see a "A box must be specified" error message: just ignore it.

When the build process is done, the image should be located in a `docker-export` folder beside the project root folder.

If you want to re-build the image, make sure you delete/move the existing image file first.
