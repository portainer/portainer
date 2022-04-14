# Makefile for development purpose

.PHONY: local build
local: clean build install
remote: clean build-remote install

ORG=portainer
VERSION=0.0.0
IMAGE_NAME=$(ORG)/portainer-docker-extension
TAGGED_IMAGE_NAME=$(IMAGE_NAME):$(VERSION)

clean:
	-docker extension remove $(IMAGE_NAME)
	-docker rmi $(IMAGE_NAME):$(VERSION)

build:
	docker buildx build -f build/linux/Dockerfile --load --build-arg TAG=$(VERSION) --build-arg PORTAINER_IMAGE_NAME=$(IMAGE_NAME) --tag=$(TAGGED_IMAGE_NAME) .

build-remote:
	docker buildx build -f build/linux/Dockerfile --push --builder=buildx-multi-arch --platform=windows/amd64,linux/amd64,linux/arm64 --build-arg TAG=$(VERSION) --build-arg PORTAINER_IMAGE_NAME=$(IMAGE_NAME) --tag=$(TAGGED_IMAGE_NAME) .

install:
	docker extension install $(TAGGED_IMAGE_NAME)

multiarch:
	docker buildx create --name=buildx-multi-arch --driver=docker-container --driver-opt=network=host

portainer:
	yarn build
