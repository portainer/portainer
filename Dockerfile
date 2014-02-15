FROM ubuntu:12.04

RUN apt-get update

RUN apt-get install -y curl                                                       
RUN curl -s https://go.googlecode.com/files/go1.2.linux-amd64.tar.gz | tar -v -C /opt -xz ;\
    cp -a /opt/go/* /usr/local/                                                             ;\
    rm -rf /opt/go;

ENV GOROOT /usr/local/
ADD . /app/
WORKDIR /app/
RUN go build dockerui.go
EXPOSE 9000
ENTRYPOINT ["./dockerui"]
