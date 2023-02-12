FROM alpine:3.15.4

COPY dist /

VOLUME /data
WORKDIR /

EXPOSE 9000
EXPOSE 9443
EXPOSE 8000

LABEL io.portainer.server true

ENTRYPOINT ["/portainer"]
