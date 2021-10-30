The entire Portainer development stack inside a container (including the IDE!).

Inspired/made after reading https://www.gitpod.io/blog/openvscode-server-launch

## Requirements

All you need to have installed is Docker.

## (optional) Build the toolkit image locally

Assuming the toolkit is not built/provided by Portainer or you want to tweak it, use the following instructions to build the toolkit locally:

```
cd build/linux/dev-toolkit/
docker build -t portainer-development-toolkit -f toolkit.Dockerfile .
```

Note: If using WSL2, you might need to use the `--network host` build option.

## How to use it

Assuming the image is built and available under `portainer-development-toolkit`.

Start the development environment inside a container, this must be executed in the root folder of the Portainer project:

```
# First, let's create a space to persist our code, dependencies and extensions
$ mkdir -pv /home/alapenna/workspaces/portainer-toolkit

# Export the space as an env var
$ export TOOLKIT_ROOT=/home/alapenna/workspaces/portainer-toolkit

# Run the toolkit
$ docker run -it --init -p 3000:3000 \
-v /var/run/docker.sock:/var/run/docker.sock \
-v ${TOOLKIT_ROOT}:/home/workspace:cached \
-e PORTAINER_PROJECT=${TOOLKIT_ROOT}/portainer \
--name portainer-development-toolkit \
portainer-development-toolkit
```

Now you can access VScode directly at http://localhost:3000 and start coding (almost)!

### Why do I need PORTAINER_PROJECT?

This environment variable defines where the Portainer project root folder resides on your machine and will be used by Docker to bind mount the `/dist` folder when deploying the local development Portainer instance.
