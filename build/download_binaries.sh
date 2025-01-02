#!/usr/bin/env bash
set -euo pipefail

PLATFORM=${1:-"linux"}
ARCH=${2:-"amd64"}

BINARY_VERSION_FILE="./binary-version.json"

dockerVersion=$(jq -r '.docker' < "${BINARY_VERSION_FILE}")
helmVersion=$(jq -r '.helm' < "${BINARY_VERSION_FILE}")
kubectlVersion=$(jq -r '.kubectl' < "${BINARY_VERSION_FILE}")
mingitVersion=$(jq -r '.mingit' < "${BINARY_VERSION_FILE}")

mkdir -p dist

echo "Checking and downloading binaries for docker ${dockerVersion}, helm ${helmVersion}, kubectl ${kubectlVersion} and mingit ${mingitVersion} (Windows only)"

# Determine the binary file names based on the platform
dockerBinary="dist/docker"
helmBinary="dist/helm"
kubectlBinary="dist/kubectl"

if [ "$PLATFORM" == "windows" ]; then
    dockerBinary="dist/docker.exe"
    helmBinary="dist/helm.exe"
    kubectlBinary="dist/kubectl.exe"
fi

# Check and download docker binary
if [ ! -f "$dockerBinary" ]; then
    echo "Downloading docker binary..."
    /usr/bin/env bash ./build/download_docker_binary.sh "$PLATFORM" "$ARCH" "$dockerVersion"
else
    echo "Docker binary already exists, skipping download."
fi

# Check and download helm binary
if [ ! -f "$helmBinary" ]; then
    echo "Downloading helm binary..."
    /usr/bin/env bash ./build/download_helm_binary.sh "$PLATFORM" "$ARCH" "$helmVersion"
else
    echo "Helm binary already exists, skipping download."
fi

# Check and download kubectl binary
if [ ! -f "$kubectlBinary" ]; then
    echo "Downloading kubectl binary..."
    /usr/bin/env bash ./build/download_kubectl_binary.sh "$PLATFORM" "$ARCH" "$kubectlVersion"
else
    echo "Kubectl binary already exists, skipping download."
fi

# Check and download mingit binary only for Windows
if [ "$PLATFORM" == "windows" ]; then
    if [ ! -f "dist/mingit" ]; then
        echo "Downloading mingit binary..."
        /usr/bin/env bash ./build/download_mingit_binary.sh "$PLATFORM" "$ARCH" "$mingitVersion"
    else
        echo "Mingit binary already exists, skipping download."
    fi
fi
