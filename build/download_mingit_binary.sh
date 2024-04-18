#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
    echo "Illegal number of parameters" >&2
    exit 1
fi

PLATFORM=$1
MINGIT_VERSION=$3

if [[ ${PLATFORM} == "windows" ]]; then
  GIT_VERSION=$(echo $MINGIT_VERSION | cut -d "." -f 1-3)
  GIT_PATCH_VERSION=$(echo $MINGIT_VERSION | cut -d "." -f 4)

  wget --tries=3 --waitretry=30 --quiet "https://github.com/git-for-windows/git/releases/download/v$GIT_VERSION.windows.$GIT_PATCH_VERSION/MinGit-$GIT_VERSION-busybox-64-bit.zip"
  unzip "MinGit-$GIT_VERSION-busybox-64-bit.zip" -d dist/mingit
fi
