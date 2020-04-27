FROM alpine:latest
COPY dist /
VOLUME /data
WORKDIR /
EXPOSE 9000

ENTRYPOINT ["/portainer"]
