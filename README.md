
<p align="center">
  <img title="portainer" src='https://portainer.io/images/logo_alt.png' />
</p>

[![Docker Pulls](https://img.shields.io/docker/pulls/portainer/portainer.svg)](https://hub.docker.com/r/portainer/portainer/)
[![Microbadger](https://images.microbadger.com/badges/image/portainer/portainer.svg)](http://microbadger.com/images/portainer/portainer "Image size")
[![Documentation Status](https://readthedocs.org/projects/portainer/badge/?version=stable)](http://portainer.readthedocs.io/en/stable/?badge=stable)
[![Codefresh build status]( https://g.codefresh.io/api/badges/build?repoOwner=portainer&repoName=portainer&branch=develop&pipelineName=portainer-ci&accountName=deviantony&type=cf-1)]( https://g.codefresh.io/repositories/portainer/portainer/builds?filter=trigger:build;branch:develop;service:5922a08a3a1aab000116fcc6~portainer-ci)
[![Code Climate](https://codeclimate.com/github/portainer/portainer/badges/gpa.svg)](https://codeclimate.com/github/portainer/portainer)
[![Slack](https://portainer.io/slack/badge.svg)](https://portainer.io/slack/)
[![Gitter](https://badges.gitter.im/portainer/Lobby.svg)](https://gitter.im/portainer/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=YHXZJQNJQ36H6)

**_Portainer_** is a lightweight management UI which allows you to **easily** manage your different Docker environments (Docker hosts or Swarm clusters).

**_Portainer_** is meant to be as **simple** to deploy as it is to use. It consists of a single container that can run on any Docker engine (can be deployed as Linux container or a Windows native container).

**_Portainer_** allows you to manage your Docker containers, images, volumes, networks and more ! It is compatible with the *standalone Docker* engine and with *Docker Swarm mode*.

## Demo

<img src="https://portainer.io/images/screenshots/portainer.gif" width="77%"/>

You can try out the public demo instance: http://demo.portainer.io/ (login with the username **admin** and the password **tryportainer**).

Please note that the public demo cluster is **reset every 15min**.

Alternatively, you can deploy a copy of the demo stack inside a [play-with-docker (PWD)](https://labs.play-with-docker.com) playground:

- Browse [PWD/?stack=portainer-demo/play-with-docker/docker-stack.yml](http://play-with-docker.com/?stack=https://raw.githubusercontent.com/portainer/portainer-demo/master/play-with-docker/docker-stack.yml)
- Sign in with your [Docker ID](https://docs.docker.com/docker-id)
- Follow [these](https://github.com/portainer/portainer-demo/blob/master/play-with-docker/docker-stack.yml#L5-L8) steps.

Unlike the public demo, the playground sessions are deleted after 4 hours. Apart from that, all the settings are same, including default credentials.

## Getting started

* [Deploy Portainer](https://portainer.readthedocs.io/en/latest/deployment.html)
* [Documentation](https://portainer.readthedocs.io)

## Getting help

* Issues: https://github.com/portainer/portainer/issues
* FAQ: https://portainer.readthedocs.io/en/latest/faq.html
* Slack (chat): https://portainer.io/slack/
* Gitter (chat): https://gitter.im/portainer/Lobby

## Reporting bugs and contributing

* Want to report a bug or request a feature? Please open [an issue](https://github.com/portainer/portainer/issues/new).
* Want to help us build **_portainer_**? Follow our [contribution guidelines](https://portainer.readthedocs.io/en/latest/contribute.html) to build it  locally and make a pull request. We need all the help we can get!

## Limitations

**_Portainer_** has full support for the following Docker versions:

* Docker 1.10 to the latest version
* Docker Swarm >= 1.2.3 (support for standalone Docker Swarm is dropped in Portainer 1.17.0, but the built-in Swarm Mode is fully supported)

Partial support for the following Docker versions (some features may not be available):

* Docker 1.9

## Licensing

Portainer is licensed under the zlib license. See [LICENSE](./LICENSE) for reference.

Portainer also contains the following code, which is licensed under the [MIT license](https://opensource.org/licenses/MIT):

UI For Docker: Copyright (c) 2013-2016 Michael Crosby (crosbymichael.com), Kevan Ahlquist (kevanahlquist.com), Anthony Lapenna (portainer.io)

rdash-angular: Copyright (c) [2014] [Elliot Hesp]
