<p align="center">
  <img title="portainer" src='https://github.com/portainer/portainer/blob/develop/app/assets/images/logo_alt.png?raw=true' />
</p>

[![Docker Pulls](https://img.shields.io/docker/pulls/portainer/portainer.svg)](https://hub.docker.com/r/portainer/portainer/)
[![Microbadger](https://images.microbadger.com/badges/image/portainer/portainer.svg)](http://microbadger.com/images/portainer/portainer 'Image size')
[![Build Status](https://portainer.visualstudio.com/Portainer%20CI/_apis/build/status/Portainer%20CI?branchName=develop)](https://portainer.visualstudio.com/Portainer%20CI/_build/latest?definitionId=3&branchName=develop)
[![Code Climate](https://codeclimate.com/github/portainer/portainer/badges/gpa.svg)](https://codeclimate.com/github/portainer/portainer)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=YHXZJQNJQ36H6)

**_Portainer_** is a lightweight management UI which allows you to **easily** manage your different Docker environments (Docker hosts or Swarm clusters).
**_Portainer_** is meant to be as **simple** to deploy as it is to use. It consists of a single container that can run on any Docker engine (can be deployed as Linux container or a Windows native container, supports other platforms too).
**_Portainer_** allows you to manage all your Docker resources (containers, images, volumes, networks and more!) It is compatible with the _standalone Docker_ engine and with _Docker Swarm mode_.

## Demo

You can try out the public demo instance: http://demo.portainer.io/ (login with the username **admin** and the password **tryportainer**).

Please note that the public demo cluster is **reset every 15min**.

Alternatively, you can deploy a copy of the demo stack inside a [play-with-docker (PWD)](https://labs.play-with-docker.com) playground:

- Browse [PWD/?stack=portainer-demo/play-with-docker/docker-stack.yml](http://play-with-docker.com/?stack=https://raw.githubusercontent.com/portainer/portainer-demo/master/play-with-docker/docker-stack.yml)
- Sign in with your [Docker ID](https://docs.docker.com/docker-id)
- Follow [these](https://github.com/portainer/portainer-demo/blob/master/play-with-docker/docker-stack.yml#L5-L8) steps.

Unlike the public demo, the playground sessions are deleted after 4 hours. Apart from that, all the settings are the same, including default credentials.

## Getting started

- [Deploy Portainer](https://www.portainer.io/installation/)
- [Documentation](https://documentation.portainer.io)

## Getting help

For FORMAL Support, please purchase a support subscription from here: https://www.portainer.io/products-services/portainer-business-support/

For community support: You can find more information about Portainer's community support framework policy here: https://www.portainer.io/2019/04/portainer-support-policy/

- Issues: https://github.com/portainer/portainer/issues
- FAQ: https://documentation.portainer.io
- Slack (chat): https://portainer.io/slack/

## Reporting bugs and contributing

- Want to report a bug or request a feature? Please open [an issue](https://github.com/portainer/portainer/issues/new).
- Want to help us build **_portainer_**? Follow our [contribution guidelines](https://www.portainer.io/documentation/how-to-contribute/) to build it locally and make a pull request. We need all the help we can get!

## Security

- Here at Portainer, we believe in [responsible disclosure](https://en.wikipedia.org/wiki/Responsible_disclosure) of security issues. If you have found a security issue, please report it to <security@portainer.io>.

## Privacy

**To make sure we focus our development effort in the right places we need to know which features get used most often. To give us this information we use [Matomo Analytics](https://matomo.org/), which is hosted in Germany and is fully GDPR compliant.**

When Portainer first starts, you are given the option to DISABLE analytics. If you **don't** choose to disable it, we collect anonymous usage as per [our privacy policy](https://www.portainer.io/documentation/in-app-analytics-and-privacy-policy/). **Please note**, there is no personally identifiable information sent or stored at any time and we only use the data to help us improve Portainer.

## Limitations

Portainer supports "Current - 2 docker versions only. Prior versions may operate, however these are not supported.

## Licensing

Portainer is licensed under the zlib license. See [LICENSE](./LICENSE) for reference.

Portainer also contains the following code, which is licensed under the [MIT license](https://opensource.org/licenses/MIT):

UI For Docker: Copyright (c) 2013-2016 Michael Crosby (crosbymichael.com), Kevan Ahlquist (kevanahlquist.com), Anthony Lapenna (portainer.io)

rdash-angular: Copyright (c) [2014][elliot hesp]
