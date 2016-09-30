# Portainer

The easiest way to manage Docker.

[![Microbadger](https://images.microbadger.com/badges/image/portainer/portainer.svg)](http://microbadger.com/images/portainer/portainer "Image size")
[![Documentation Status](https://readthedocs.org/projects/portainer/badge/?version=stable)](http://portainer.readthedocs.io/en/stable/?badge=stable)
[![Gitter](https://badges.gitter.im/portainer/Lobby.svg)](https://gitter.im/portainer/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

Portainer is a lightweight management UI which allows you to **easily** manage your Docker host or Swarm cluster.

# Usage

It's really simple to deploy it using Docker:

```shell
$ docker run -d -p 9000:9000 portainer/portainer -H tcp://<DOCKER_HOST>:<DOCKER_PORT>
```

Just point it at your targeted Docker host and then access Portainer by hitting [http://localhost:9000](http://localhost:9000) with a web browser.

If your target is a Docker Swarm cluster or a Docker cluster using *swarm mode*, just add the flag `--swarm`:

```shell
$ docker run -d -p 9000:9000 portainer/portainer -H tcp://<SWARM_HOST>:<SWARM_PORT> --swarm
```

If you don't specify any target, its default behaviour is to use a bind mount on the Docker socket so you can easily deploy it to manage your local Docker host:

```shell
$ docker run -d -p 9000:9000 -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer
```

Have a look at our [documentation](http://portainer.readthedocs.io/en/stable/deployment.html) for more deployment options.

# Configuration

Portainer is easy to tune using CLI flags.

## Hiding specific containers

Portainer allows you to hide container with a specific label by using the `-l` flag.

For example, take a container started with the label `owner=acme`:
```shell
$ docker run -d --label owner=acme nginx
```

Simply add the `-l owner=acme` option on the CLI when starting Portainer:
```shell
$ docker run -d -p 9000:9000 -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer -l owner=acme
```

## Use your own templates

Portainer allows you to rapidly deploy containers using `App Templates`.

By default [Portainer templates](https://raw.githubusercontent.com/portainer/templates/master/templates.json) will be used but you can also define your own templates.

Add the `--templates` flag and specify the external location of your templates when starting Portainer:

```shell
$ docker run -d -p 9000:9000 -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer --templates http://my-host.my-domain/templates.json
```

For more information about hosting your own template definitions and the format, see the [templates documentation](http://portainer.readthedocs.io/en/stable/templates.html)

Check our [documentation](http://portainer.readthedocs.io/en/stable/configuration.html) for more configuration options.

# FAQ

Be sure to check our [FAQ](http://portainer.readthedocs.io/en/stable/faq.html) if you are missing some information.

# Limitations

Portainer has full support for the following Docker versions:

* Docker 1.10 to Docker 1.12 (including `swarm-mode`)
* Docker Swarm >= 1.2.3

Partial support for the following Docker versions (some features may not be available):

* Docker 1.9
