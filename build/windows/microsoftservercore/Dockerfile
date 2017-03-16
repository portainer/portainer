FROM microsoft/windowsservercore

COPY dist /

RUN mkdir C:\\data

WORKDIR /

EXPOSE 9000

ENTRYPOINT ["/portainer.exe"]
