FROM ubuntu:20.04

# Expose port for the Portainer UI and Edge server
EXPOSE 9000
EXPOSE 9443
EXPOSE 8000

WORKDIR /src/portainer

# Set TERM as noninteractive to suppress debconf errors
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

# Set default go version
ARG GO_VERSION=go1.17.6.linux-amd64

# Install packages
RUN apt-get update --fix-missing && apt-get install -qq \
	dialog \
	apt-utils \
	curl \
	build-essential \
	git \
	wget \
	apt-transport-https \
	ca-certificates \
	gnupg-agent \
	software-properties-common

# Install Docker CLI
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add - \
	&& add-apt-repository \
	"deb [arch=amd64] https://download.docker.com/linux/ubuntu \
	$(lsb_release -cs) \
	stable" \
	&& apt-get update \
	&& apt-get install -y docker-ce-cli


# Install NodeJS
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash - \
	&& apt-get install -y nodejs

# Install Package manager
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

# Install Golang
RUN cd /tmp \
	&& wget -q https://dl.google.com/go/${GO_VERSION}.tar.gz \
	&& tar -xf ${GO_VERSION}.tar.gz \
	&& mv go /usr/local

# Copy run script
COPY run.sh /
RUN chmod +x /run.sh

ENTRYPOINT ["/run.sh"]
