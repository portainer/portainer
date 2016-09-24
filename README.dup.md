# Portainer

[![Microbadger](https://images.microbadger.com/badges/image/portainer/portainer.svg)](http://microbadger.com/images/portainer/portainer "Image size")
[![Gitter](https://badges.gitter.im/portainer/Lobby.svg)](https://gitter.im/portainer/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

Portainer is a web interface for the Docker remote API.

![Dashboard](/dashboard.png)

## Supported Docker versions

The following Docker versions are supported:

* full support for Docker 1.10, 1.11 and 1.12
* partial support for Docker 1.9 (some features won't be available)

## Run

### Quickstart

1. Run: `docker run -d -p 9000:9000 --privileged -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer`

2. Open your browser to `http://<dockerd host ip>:9000`

Bind mounting the Unix socket into the Portainer container is much more secure than exposing your docker daemon over TCP.

The `--privileged` flag is required for hosts using SELinux.

### Specify socket to connect to Docker daemon

By default Portainer connects to the Docker daemon with`/var/run/docker.sock`. For this to work you need to bind mount the unix socket into the container with `-v /var/run/docker.sock:/var/run/docker.sock`.

You can use the `--host`, `-H` flags to change this socket:

```
# Connect to a tcp socket:
$ docker run -d -p 9000:9000 portainer/portainer -H tcp://127.0.0.1:2375
```

```
# Connect to another unix socket:
$ docker run -d -p 9000:9000 portainer/portainer -H unix:///path/to/docker.sock
```

### Swarm support

**Supported Swarm version: 1.2.3**

You can access a specific view for you Swarm cluster by defining the `--swarm` flag:

```
# Connect to a tcp socket and enable Swarm:
$ docker run -d -p 9000:9000 portainer/portainer -H tcp://<SWARM_HOST>:<SWARM_PORT> --swarm
```

*NOTE*: Due to Swarm not exposing information in a machine readable way, the app is bound to a specific version of Swarm at the moment.

### Change address/port Portainer is served on
Portainer listens on port 9000 by default. If you run Portainer inside a container then you can bind the container's internal port to any external address and port:

```
# Expose Portainer on 10.20.30.1:80
$ docker run -d -p 10.20.30.1:80:9000 --privileged -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer
```

### Access a Docker engine protected via TLS

Ensure that you have access to the CA, the cert and the public key used to access your Docker engine.  

These files will need to be named `ca.pem`, `cert.pem` and `key.pem` respectively. Store them somewhere on your disk and mount a volume containing these files inside the UI container:

```
$ docker run -d -p 9000:9000 portainer/portainer -v /path/to/certs:/certs -H https://my-docker-host.domain:2376 --tlsverify
```

You can also use the `--tlscacert`, `--tlscert` and `--tlskey` flags if you want to change the default path to the CA, certificate and key file respectively:

```
$ docker run -d -p 9000:9000 portainer/portainer -v /path/to/certs:/certs -H https://my-docker-host.domain:2376 --tlsverify --tlscacert /certs/myCa.pem --tlscert /certs/myCert.pem --tlskey /certs/myKey.pem
```

*Note*: Replace `/path/to/certs` to the path to the certificate files on your disk.

### Use your own logo

You can use the `--logo` flag to specify an URL to your own logo.

For example, using the Docker logo:

```
$ docker run -d -p 9000:9000 --privileged -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer --logo "https://www.docker.com/sites/all/themes/docker/assets/images/brand-full.svg"
```

The custom logo will replace the Portainer logo in the UI.

### Hide containers with specific labels

You can hide specific containers in the containers view by using the `--hide-label` or `-l` options and specifying a label.

For example, take a container started with the label `owner=acme`:

```
$ docker run -d --label owner=acme nginx
```

You can hide it in the view by starting the ui with:

```
$ docker run -d -p 9000:9000 --privileged -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer -l owner=acme
```

### Reverse proxy configuration

Has been tested with Nginx 1.11.

Use the following configuration to host the UI at `myhost.mydomain.com/portainer`:

```nginx
upstream portainer {
    server ADDRESS:PORT;
}

server {
  listen 80;

  location /portainer/ {
      proxy_http_version 1.1;
      proxy_set_header Connection "";
      proxy_pass http://portainer/;
  }
  location /portainer/ws/ {
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_http_version 1.1;
      proxy_pass http://portainer/ws/;
  }
}
```

Replace `ADDRESS:PORT` with the Portainer container details.

### Host your own apps

You can specify an URL to your own templates (**Apps**) definitions using the `--templates` or `-t` flags.

By default, the following templates will be used (https://raw.githubusercontent.com/portainer/templates/master/templates.json).

For more information about hosting your own template definition and the format, see: https://github.com/portainer/templates

### Available options

The following options are available for the `portainer` binary:

* `--host`, `-H`: Docker daemon endpoint (default: `"unix:///var/run/docker.sock"`)
* `--bind`, `-p`: Address and port to serve Portainer (default: `":9000"`)
* `--data`, `-d`: Path to the data folder (default: `"."`)
* `--assets`, `-a`: Path to the assets (default: `"."`)
* `--swarm`, `-s`: Swarm cluster support (default: `false`)
* `--tlsverify`: TLS support (default: `false`)
* `--tlscacert`: Path to the CA (default `/certs/ca.pem`)
* `--tlscert`: Path to the TLS certificate file (default `/certs/cert.pem`)
* `--tlskey`: Path to the TLS key (default `/certs/key.pem`)
* `--hide-label`, `-l`: Hide containers with a specific label in the UI
* `--logo`: URL to a picture to be displayed as a logo in the UI
* `--templates`, `-t`: URL to templates (apps) definitions
