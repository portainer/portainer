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
# First, let's create a space to persist our code, dependencies and VS extensions
$ mkdir -pv /home/alapenna/workspaces/portainer-toolkit

# Export the space as an env var
$ export TOOLKIT_ROOT=/home/alapenna/workspaces/portainer-toolkit

# Run the toolkit
$ docker run -it --init \
-p 3000:3000 \
-p 9000:9000 -p 9443:9443 -p 8000:8000 \
-v ${TOOLKIT_ROOT}:/home/workspace:cached \
--name portainer-development-toolkit \
portainer-development-toolkit
```

Now you can access VScode directly at http://localhost:3000 and start coding (almost)!

## Legacy deployment (running as a container on the host)

You can still run Portainer through a base container with the host but you will need to pass extra parameters when deploying the toolkit container:

```
$ docker run -it --init -p 3000:3000 \
-v /var/run/docker.sock:/var/run/docker.sock \
-v ${TOOLKIT_ROOT}:/home/workspace:cached \
-e PORTAINER_PROJECT=${TOOLKIT_ROOT}/portainer \
--name portainer-development-toolkit \
portainer-development-toolkit
```

### Why do I need PORTAINER_PROJECT?

This environment variable defines where the Portainer project root folder resides on your machine and will be used by Docker to bind mount the `/dist` folder when deploying the local development Portainer instance.

# What's next?

## Extensibility

Developers should be able to customize the environment to their liking (I prefer work with zsh as a shell for example), we need to provide instructions on how they can use this build system as a base and extend it to their liking.

## Improved dev workflow/UX

Multiple steps are required for the dev environment to be ready:

- Downloading the front-end (FE) dependencies (aka node_modules)
- Downloading the back-end (BE) dependencies (go libraries)
- Downloading the runtime BE assets (Docker, Kubernetes binaries...)

There should be a way to install/refresh these via yarn:

- yarn fe:install and yarn fe:update, shortcuts: yarn fe:i and yarn fe:u

  - this is actually done via yarn to install, and then yarn add/upgrade/delete for package management

- yarn be:install and yarn be:update, shortcuts: yarn be:i and yarn be:u
  - this is actually done through go build, and then go get -u when another dependency version is needed
- yarn assets:install and yarn assets:update, shortcuts yarn assets:i and yarn assets:u

There should be a way to init the environment for the first time to install all the dependencies:

- yarn init
  - instead there should be a command that will build backend+frontend and run it

Once the environment is ready, a developer can work on different dimensions:

- The FE
- The BE
- Both

(?) A developer should be able to run Portainer in multiple ways (?)

- Directly running the binary
- Starting Portainer running inside a container

A developer should be able to:

- Rebuild the backend without restarting the entire webpack/watch process
- Clean the entire project (FE+BE)

## Updating the toolkit

A developer should be able to update the toolkit to a more recent version (to support a newer Golang version for example) without having to rebuild the entire system/container.

## VSCode + zsh

https://medium.com/fbdevclagos/updating-visual-studio-code-default-terminal-shell-from-bash-to-zsh-711c40d6f8dc
