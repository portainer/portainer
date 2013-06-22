# Dockerfile for DockerUI

FROM ubuntu

MAINTAINER Michael Crosby http://crosbymichael.com

RUN echo "deb http://archive.ubuntu.com/ubuntu precise main universe" > /etc/apt/sources.list
RUN apt-get update
RUN apt-get upgrade

ADD . /dockerui

EXPOSE 9000:9000

