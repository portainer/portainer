FROM alpine:latest as builder

# required to run docker-compose
RUN mkdir /tmp
  
FROM portainer/base

COPY dist /

VOLUME /data
WORKDIR /

EXPOSE 9000
EXPOSE 8000

COPY --from=builder /tmp /tmp

ENTRYPOINT ["/portainer"]
