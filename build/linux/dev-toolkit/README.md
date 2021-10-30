It simplifies the development environment setup as you don't need to setup all the dependencies on your local machine (golang, nodejs, yarn).

## Requirements

All you need to have installed is Docker.

## Build the image locally

Use the following instructions to build the toolkit locally:

```
cd build/linux/dev-toolkit/
docker build -t portainer-development-toolkit -f toolkit.Dockerfile .
```

Note: If using WSL2, you might need to use the `--network host` build option.

## How to use it

Assuming the image is built and available under `portainer-development-toolkit`.

Start the development environment inside a container, this must be executed in the root folder of the Portainer project:

```
$ docker run -it -e PORTAINER_PROJECT=$PWD \
-e PUSER=${USER} \
-e PUID=$(id -u ${USER}) \
-e PGID=$(id -g ${USER}) \
-e DOCKERGID=$(getent group docker | awk -F: '{printf "%d", $3}') \
-v $PWD:/src/portainer \
-v ~/.ssh:/host-ssh:ro \
-v /var/run/docker.sock:/var/run/docker.sock \
--name portainer-development-toolkit \
portainer-development-toolkit \
/bin/bash
```

This will pull the dev-toolkit container image, configure it and open an interactive shell session (bash) for you to work with.

The Portainer codebase will be available under `/src/portainer` and you can now work with the usual development tools:

```
$ yarn
...
$ yarn start
...
```

`yarn start` will keep the usual process of creating a local container running the Portainer instance in development mode, this container will be running on your machine (not inside the dev-toolkit container).

You can stop that container by exiting it and re-use it later on by simply starting it:

```
$ docker start -i portainer-development-toolkit
```

This will start the container and open an interactive shell session.

## What is this PUSER voodoo and what are these environment variables

In order to keep the ability to use this container on different developers environment, it needs to have a generic way to start.

### PORTAINER_PROJECT

This environment variable defines where the Portainer project root folder resides on your machine and will be used by Docker to bind mount the `/dist` folder when deploying the local development Portainer instance.

### PUSER, PUID and PGID

In order to work-around some file permissions issues referenced in the original piece of work around a containerized environment (see https://github.com/portainer/portainer/pull/3863#issuecomment-673153705), we need to create a specific user inside the container that will match the current user on your system.

### DOCKERGID

Related to the environment variables above, the newly created user will need to be part of the `docker` group on your machine in order to be able to use the Docker client to start the local development Portainer instance.

## Final notes

I've been able to use this successfully on my Windows/WSL2 environment and I've tried to make it so that the changes would be compliant with the existing workflow of running it directly on a local environment but I did not test that. If this PR is of interest, then it will probably need to be tested. As this is also changing the gruntfile, it can have an impact on CI/CD and release pipelines.

This was originally designed to be used with the Portainer codebase but can probably be adapted with minor changes to fit the Portainer agent development workflow.