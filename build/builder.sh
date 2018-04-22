#!/bin/sh

# [mainPath=<path_to_mainpath>] [mainPackagePath=<path_to_package>] [DEPSONLY=true] [COMPRESS_BINARY=true] builder.sh

#---

build_env() {
  echo "Building environment setting up..."

  if [ -z "$mainPath" ]; then mainPath="$(realpath .)"; fi

  [ "$(ls -A $mainPath)" ] || ( echo "Error: Must mount Go source code into <mainPath> directory [$mainPath]"; exit 990 )

  mainPackagePath="${mainPath}/${mainPackagePath}"

  # Grab Go package name
  iComment() { go list -e -f '{{.ImportComment}}' 2>/dev/null || true; }
  if [[ ! -z "${mainPackagePath}" ]]; then
    pkgName="$(cd $mainPackagePath && iComment)"
  else
    pkgName="$(iComment)"
  fi

  if [ -z "$pkgName" ]; then
    echo "Error: Must add canonical import path to root package"
    exit 992
  fi

  # Grab just first path listed in GOPATH, and construct Go package path
  pkgPath="${GOPATH%%:*}/src/$pkgName"

  # Set-up src directory tree in GOPATH, and link source dir into GOPATH
  mkdir -p "$(dirname "$pkgPath")"
  ln -sf "$mainPath" "$pkgPath"

  # Enable vendor experiment, else add local godeps dir to GOPATH, else get all package dependencies
  if [ -e "$pkgPath/vendor" ]; then export GO15VENDOREXPERIMENT=1;
  elif [ -e "$pkgPath/Godeps/_workspace" ]; then GOPATH="$pkgPath/Godeps/_workspace:$GOPATH";
  else goget;
  fi
}

#---

dobuild() { # Compile statically linked version of package
  # Optional OUTPUT env var to use the "-o" go build switch forces build to write the resulting executable or object to the named output file
  CGO_ENABLED=${CGO_ENABLED:-0} \
  GOOS="$GOOS" GOARCH="$GOARCH" go build -a --installsuffix cgo --ldflags="${LDFLAGS:--s}" \
  $(if [[ ! -z "${OUTPUT}" ]]; then echo "-o ${OUTPUT}"; else echo ""; fi);
  rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi
  if [[ "$COMPRESS_BINARY" == "true" ]]; then upx -v -9 ${OUTPUT}; fi
}

#---

if [ -z ${BUILD_GOOS+x} ]; then
  goget() { go get -t -d -v ./...; }
  build_pkg() { echo "Building $pkgName...";  dobuild; }
else
  goget() { `GOOS=${BUILD_GOOS:-""} GOARCH=${BUILD_GOARCH:-""} go get -t -d -v ./...`; }
  build_pkg() {
    for GOOS in ${BUILD_GOOS:-"darwin linux windows"}; do
      for GOARCH in ${BUILD_GOARCH:-"386 amd64 arm"}; do
        echo "Building $pkgName for $GOOS-$GOARCH..."
        OUTPUT="${pkgName##*/}-$GOOS-$GOARCH"
        if [ "$GOOS" = "windows" ]; then OUTPUT="$OUTPUT.exe"; fi
        dobuild
      done
    done
  }
fi

#---

godep_save() {
  missing_package="start"
  while [ "$missing_package" != "" ]; do
    missing_package=$(godep save $@ 2>&1 | egrep '^godep: Package (.*) not found' | sed 's/.*(\(.*\)).*/\1/');
   [ "$missing_package" != "" ] && { echo "Installing missing package: ${missing_package}"; go get -u "${missing_package}"; }
  done
  godep save $@
}

#---

save_pkg_deps() {
  echo "Saving dependencies with godep"
  echo "Remove symlink to '$mainPath'; mkdir, cp and cd instead"
  rm -rf "$(dirname "$pkgPath")"
  mkdir -p "$pkgPath"
  cp -r "$mainPath/"* "$pkgPath/"
  cd "$pkgPath"

  echo "Get tools/godep"
  go get github.com/tools/godep
  godep_save ./...

  mkdir -pv /tmp/targodeps

  echo "Copy vendor and Godeps"
  cp -r vendor /tmp/targodeps/
  cp -r Godeps /tmp/targodeps/

  echo "Save tar to /godeps"
  mkdir -pv /godeps
  tar -vcf "/godeps/$(echo $pkgName | cut -d \/ -f 3)-godeps.tar" -C /tmp/targodeps/ .
}

#---

build_env

if [[ ! -z "${mainPackagePath}" ]]; then cd ${mainPackagePath}; fi

if [ -z ${DEPSONLY+x} ]; then
  build_pkg
else
  save_pkg_deps
fi
