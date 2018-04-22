#!/usr/bin/env sh

c="/etc/profile.d/ansi_color.sh"; if [ -f "$c" ]; then . "$c"; fi

printf "\n${ANSI_MAGENTA}[FACTORY] Setting environment...${ANSI_NOCOLOR}\n"

mkdir -pv /src-volume/api /docker-binaries dist/public
cp -r /portainer-deps/Godeps /src-volume/api
cp -r /portainer-deps/vendor /src-volume/api
ln -s /portainer-deps/node_modules ./node_modules
ln -s /docker-binaries ./docker-binaries

export PATH=$PATH:$(pwd)/bin

cp "${WORKDIR}gruntfile.js" ./

printf "\n${ANSI_MAGENTA}[FACTORY] Running build...${ANSI_NOCOLOR}\n"
find "${WORKDIR}build" -maxdepth 1 -mindepth 1 -type f -name "*build*" -print0 | xargs -0 dos2unix
"${WORKDIR}build/build.sh" "$@"
