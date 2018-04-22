#wget https://github.com/portainer/portainer/releases/download/1.13.4/portainer-1.15.0-linux-amd64.tar.gz

FROM portainer/factory as base
#RUN apk --no-cache --update upgrade && apk --no-cache add ca-certificates

FROM scratch
COPY --from=base /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
VOLUME /data
WORKDIR /portainer
EXPOSE 9000
ENTRYPOINT ["./portainer"]
#ADD portainer-1.15.0-linux-amd64.tar.gz /
#`build.sh` requires this file to end with an empty line
