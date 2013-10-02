# Dockerfile for DockerUI

FROM ubuntu:12.04

MAINTAINER Michael Crosby http://crosbymichael.com

RUN echo "deb http://archive.ubuntu.com/ubuntu precise main universe" > /etc/apt/sources.list
RUN apt-get update
RUN apt-get upgrade -y

ADD . /app/

WORKDIR /app/

RUN apt-get install -y golang-go && go build dockerui.go

EXPOSE 9000
ENTRYPOINT ["./dockerui"]
