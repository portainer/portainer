ARG OSVERSION
FROM --platform=linux/amd64 gcr.io/k8s-staging-e2e-test-images/windows-servercore-cache:1.0-linux-amd64-${OSVERSION} as core

FROM mcr.microsoft.com/windows/nanoserver:${OSVERSION} as production
ENV PATH "C:\mingit\cmd;C:\Windows\system32;C:\Windows;"

COPY --from=core /Windows/System32/netapi32.dll /Windows/System32/netapi32.dll

USER ContainerAdministrator

COPY dist/mingit/ mingit/
COPY dist/docker.exe /
COPY dist/docker-compose.exe /
COPY dist/helm.exe /
COPY dist/kubectl.exe /
COPY dist/mustache-templates /mustache-templates/
COPY dist/portainer.exe /
COPY dist/public /public/

# storybook exists only in portainerci builds
COPY dist/storybook* /storybook/

EXPOSE 9000
EXPOSE 9443
EXPOSE 8000

LABEL io.portainer.server true

ENTRYPOINT ["/portainer.exe"]