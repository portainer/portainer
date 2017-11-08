FROM portainer/base

COPY dist /

VOLUME /data

WORKDIR /

EXPOSE 9000

ENTRYPOINT ["./portainer"]

HEALTHCHECK --start-period=10ms --interval=30s --timeout=5s --retries=3 CMD ["./portainer", "-c"]

#ADD portainer-1.15.0-linux-amd64.tar.gz /
#`build.sh` requires this file to end with an empty line
