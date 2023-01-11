#!/bin/bash

# For reference see: https://portainer.atlassian.net/wiki/spaces/TECH/pages/570589194/Code+Freeze+Preparation

# Portainer (CE + EE)
#   Change version in package.json
#   Change APIVersion in portainer.go
#   Change @version in handler/handler.go

# This script requires jq
#   sudo apt-get install jq

if ! [ -x "$(command -v sed)" ]; then
  echo 'Error: sed is not installed.' >&2
  exit 1
fi

if ! [ -x "$(command -v jq)" ]; then
  echo 'Error: jq is not installed. Get it here: https://stedolan.github.io/jq/download/' >&2
  exit 1
fi

CURRENT_VERSION=$(jq -r '.version' package.json)
PROMPT=true

# Parse the major, minor and patch versions
# out.
# You use it like this:
#    semver="3.4.5+xyz"
#    a=($(ParseSemVer "$semver"))
#    major=${a[0]}
#    minor=${a[1]}
#    patch=${a[2]}
#    printf "%-32s %4d %4d %4d\n" "$semver" $major $minor $patch
function ParseSemVer() {
    local token="$1"
    local major=0
    local minor=0
    local patch=0

    if [[ "$token" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+) ]]; then
        major=${BASH_REMATCH[1]}
        minor=${BASH_REMATCH[2]}
        patch=${BASH_REMATCH[3]}
    fi

    echo "$major $minor $patch"
}

Help()
{
   echo "*** Bump Portainer version ***"
   echo
   echo "The Portainer version is in the semantic version format:"
   echo "    X.Y.Z (Major.Minor.Patch)"
   echo
   echo "The current version is defined in multiple files."
   echo "This script will update the version in the following files:"
   echo "    package.json"
   echo "    api/portainer.go"
   echo "    api/http/handler/handler.go"
   echo 
   echo "Usage: bump-version.sh [-s|-h]"
   echo "options:"
   echo "  -h     Print this Help."
   echo "  -s     Silently bump minor version without prompting."
   echo
}

case "$1" in
    -s) 
        # automatically bump minor version with no prompting
        PROMPT=false
    ;;
    
    -h | --help)   # display Help
        Help
        exit
esac


[ $PROMPT == true ] && { 
    echo "Current Portainer version: ${CURRENT_VERSION}"
}

a=($(ParseSemVer "$CURRENT_VERSION"))
major=${a[0]}
minor=${a[1]}
patch=${a[2]}

minor=$(($minor+1))
NEW_VERSION="${major}.${minor}.${patch}"

[ $PROMPT == true ] && { 
    echo -n "New Portainer version: [${NEW_VERSION}]: "
    read -r inp

    [[ ! -z "$inp" ]] && NEW_VERSION="$inp"

    a=($(ParseSemVer "$NEW_VERSION"))
    major=${a[0]}
    minor=${a[1]}
    patch=${a[2]}

    if [ "$major" == 0 ] && [ "$minor" == 0 ] && [ "$patch" = 0 ]; then
        echo "Invalid version format, must be major.minor.patch"
        exit 1
    fi

    echo "Version will be changed to: ${NEW_VERSION}"
    echo -n "Continue? [y/N]: "
    read -r inp

    if [ "$inp" != "y" ]; then
        echo "Version left unchanged"
        exit 1
    fi
}


tmp=$(mktemp)

# Change version in package.json
filename="package.json"
jq --arg a "$NEW_VERSION" '.version = $a' package.json > "$tmp" && mv "$tmp" "$filename"
echo "Updated $filename."

# Update portainer.go
filename="api/portainer.go"
sed -E "s/^([[:blank:]]*APIVersion[[:blank:]]*=[[:blank:]]*).*/\1\"$NEW_VERSION\"/" "$filename" > "$tmp" && mv "$tmp" "$filename"
echo "Updated $filename."

# Change @version in handler/handler.go
filename="api/http/handler/handler.go"
sed -E "s|// @version .*|// @version $NEW_VERSION|" "$filename" > "$tmp" && mv "$tmp" "$filename"
echo "Updated $filename."
echo
echo "IMPORTANT! Before committing, please ensure the files have updated correctly with 'git diff'"

