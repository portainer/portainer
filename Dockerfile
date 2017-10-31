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

FROM node:8.7.0  as nodebuilder

# build portainer web ui
WORKDIR /code
COPY ./package.json /code/package.json
RUN npm install -g bower grunt-cli && npm install
COPY --from=gobuilder /dist /code/dist
COPY ./bower.json /code/bower.json
RUN bower install --allow-root
COPY . /code
RUN grunt build
RUN mv /code/dist/portainer-$(uname -s | tr '[:upper:]' '[:lower:]')-$(dpkg --print-architecture) /code/dist/portainer

FROM portainer/base:latest

ENV VERSION 1.15.0-1-SNAPSHOT
COPY --from=nodebuilder /code/dist /
VOLUME /data
WORKDIR /
EXPOSE 9000
ENTRYPOINT ["/portainer"]
