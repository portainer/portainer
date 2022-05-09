## Installing the Portainer extension

### Prerequisites

#### Docker desktop with extension support

First you must install a version of docker desktop with extension support (4.8.0 or later)

- [Windows](https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe?utm_source=docker&utm_medium=webreferral&utm_campaign=docs-driven-download-win-amd64 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe?utm_source=docker&utm_medium=webreferral&utm_campaign=docs-driven-download-win-amd64')
- [Mac with intel chip](https://desktop.docker.com/mac/main/amd64/Docker.dmg?utm_source=docker&utm_medium=webreferral&utm_campaign=docs-driven-download-mac-amd64 'https://desktop.docker.com/mac/main/amd64/Docker.dmg?utm_source=docker&utm_medium=webreferral&utm_campaign=docs-driven-download-mac-amd64')
- [Mac with arm chip](https://desktop.docker.com/mac/main/arm64/Docker.dmg?utm_source=docker&utm_medium=webreferral&utm_campaign=docs-driven-download-mac-arm64 'https://desktop.docker.com/mac/main/arm64/Docker.dmg?utm_source=docker&utm_medium=webreferral&utm_campaign=docs-driven-download-mac-arm64')
- [Linux DEB](https://desktop-stage.docker.com/linux/main/amd64/78933/docker-desktop-4.8.0-amd64.deb?utm_source=docker&utm_medium=webreferral&utm_campaign=docs-driven-download-linux-amd64 'https://desktop-stage.docker.com/linux/main/amd64/78933/docker-desktop-4.8.0-amd64.deb?utm_source=docker&utm_medium=webreferral&utm_campaign=docs-driven-download-linux-amd64')
- [Linux RPM](https://desktop-stage.docker.com/linux/main/amd64/78933/docker-desktop-4.8.0-x86_64.rpm?utm_source=docker&utm_medium=webreferral&utm_campaign=docs-driven-download-linux-amd64 'https://desktop-stage.docker.com/linux/main/amd64/78933/docker-desktop-4.8.0-x86_64.rpm?utm_source=docker&utm_medium=webreferral&utm_campaign=docs-driven-download-linux-amd64')

### Docker extension CLI plugin

Next you must install the CLI plugin to enable extension development. Please follow [Docker’s official documentation](https://docs.docker.com/desktop/extensions-sdk/#prerequisites) as it will be the most up to date

**_Tip: make sure you have started Docker Desktop for the first time before installing the CLI extension to prevent errors._**

### Build from local changes

1. Run `yarn` to install the project dependencies
2. Run `yarn dev:extension` to install the extension
3. Make your code changes
4. Re-run `yarn dev:extension` to rebuild and re-install with your latest changes

## Accessing the Portainer extension

Going to your Docker Desktop dashboard, you should see Portainer listed in the Extension menu on the left and can access Portainer directly by clicking it.

#### Improvements & suggestions

If you have an idea of how to improve this process or any of the code related to it, feel free to open an issue & pull request.
