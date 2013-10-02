# Dockerfile for DockerUI

FROM ubuntu:12.04

MAINTAINER Michael Crosby http://crosbymichael.com

RUN apt-get update
RUN apt-get upgrade -y

ADD https://go.googlecode.com/files/go1.1.2.linux-amd64.tar.gz /opt/go.tar.gz

RUN                                       \
  cd /opt                                ;\
  tar xvvf go.tar.gz                     ;\
  rm go.tar.gz                           ;\
  ln -s /opt/go/bin/go /usr/local/bin/go ;\
#RUN

ENV GOROOT /opt/go

ADD . /app/

WORKDIR /app/

RUN go build dockerui.go

EXPOSE 9000
ENTRYPOINT ["./dockerui"]
