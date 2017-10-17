###############################################################################################
# Docker container to deploy cenx-cf forked Portainer project UI.
#
# See: README.md
###############################################################################################

FROM alpine:3.4

MAINTAINER CENX "cenx.com"

ENV VERSION 1.15.0-1-SNAPSHOT

ARG PLATFORM=linux
ARG ARCH=x86_64
ARG DOCKER_VERSION=17.09.0-ce

RUN apk --no-cache --update upgrade && apk --no-cache add ca-certificates wget && update-ca-certificates && apk add bash
RUN wget -O docker-binaries.tgz https://download.docker.com/${PLATFORM}/static/stable/${ARCH}/docker-${DOCKER_VERSION}.tgz \
  && tar -xf docker-binaries.tgz

COPY dist /

VOLUME /data

WORKDIR /

EXPOSE 9000

ENTRYPOINT ["/portainer-linux-amd64"]
