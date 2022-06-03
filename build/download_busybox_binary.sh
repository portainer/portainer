#!/usr/bin/env bash

BUSYBOX_VERSION=$1

wget -O "dist/busybox" "https://github.com/ben-krieger/binaries/releases/download/busybox%2F${BUSYBOX_VERSION}/busybox"
chmod +x "dist/busybox"
tar cf "dist/busybox.tar" -C "dist" "busybox"
rm "dist/busybox"

exit 0
