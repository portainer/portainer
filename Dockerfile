FROM portainer/golang-builder:latest as gobuilder

RUN mkdir -p /dist

# build portainer api
COPY api /src
RUN OUTPUT=/dist/portainer-$(uname -s | tr '[:upper:]' '[:lower:]')-$(dpkg --print-architecture) /build.sh /src/cmd/portainer

# install docker cli
ENV DOCKER_VERSION=17.09.0-ce
RUN wget -O /docker-binaries.tgz https://download.docker.com/$(uname -s | tr '[:upper:]' '[:lower:]')/static/stable/$(uname -m)/docker-${DOCKER_VERSION}.tgz \
    && tar -xf /docker-binaries.tgz -C /dist docker/docker \
    && rm /docker-binaries.tgz

FROM node:8.7.0 as nodebuilder

# build portainer web ui
WORKDIR /code
COPY ./package.json /code/package.json
RUN npm install -g bower grunt-cli && npm install
COPY ./bower.json /code/bower.json
RUN bower install --allow-root
COPY . /code
RUN grunt build
COPY --from=gobuilder /dist/portainer* /code/dist
RUN mv /code/dist/portainer-$(uname -s | tr '[:upper:]' '[:lower:]')-$(dpkg --print-architecture) /code/dist/portainer

FROM alpine:3.4

ENV VERSION 2.0.0-SNAPSHOT
RUN apk --no-cache --update upgrade && apk --no-cache add ca-certificates && update-ca-certificates && apk add bash
COPY --from=nodebuilder /code/dist /
VOLUME /data
WORKDIR /
EXPOSE 9000
ENTRYPOINT ["/portainer"]
