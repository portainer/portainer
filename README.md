
<p align="center">
  <img title="portainer" src='http://portainer.io/images/logo_alt.png' />
</p>

[![Microbadger version](https://images.microbadger.com/badges/version/portainer/portainer.svg)](https://microbadger.com/images/portainer/portainer "Latest version on Docker Hub")
[![Microbadger](https://images.microbadger.com/badges/image/portainer/portainer.svg)](http://microbadger.com/images/portainer/portainer "Image size")
[![Documentation Status](https://readthedocs.org/projects/portainer/badge/?version=latest)](http://portainer.readthedocs.io/en/latest/?badge=latest)
[![Gitter](https://badges.gitter.im/portainer/Lobby.svg)](https://gitter.im/portainer/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

**_Portainer_** is a lightweight management UI which allows you to **easily** manage your Docker host or Swarm cluster.

**_Portainer_** is meant to be as **simple** to deploy as it is to use. It consists of a single container that can run on any Docker for Linux engine. A Docker for Windows version is on its way !

**_Portainer_** allows you to manage your Docker containers, images, volumes, networks and more ! It is compatible with the *standalone Docker* engine and with *Docker Swarm*.

## Demo

<img src="http://portainer.io/images/screenshots/portainer.gif" width="77%"/>

You can try out the public demo instance: http://demo.portainer.io/ (login with the username **demo** and the password **tryportainer**).

Please note that the public demo cluster is **reset every 15min**.

## Getting started

* [Deploy Portainer](https://portainer.readthedocs.io/en/latest/deployment.html)
* [Documentation](https://portainer.readthedocs.io)

## Getting help

* Issues: https://github.com/portainer/portainer/issues
* FAQ: https://portainer.readthedocs.io/en/latest/faq.html
* Gitter (chat): https://gitter.im/portainer/Lobby
* Slack: http://portainer.io/slack/

## Reporting bugs and contributing

* Want to report a bug or request a feature? Please open [an issue](https://github.com/portainer/portainer/issues/new).
* Want to help us build **_portainer_**? Follow our [contribution guidelines](https://portainer.readthedocs.io/en/latest/contribute.html) to build it  locally and make a pull request. We need all the help we can get!

## Limitations

**_Portainer_** has full support for the following Docker versions:

* Docker 1.10 to Docker 1.12 (including `swarm-mode`)
* Docker Swarm >= 1.2.3

Partial support for the following Docker versions (some features may not be available):

* Docker 1.9
