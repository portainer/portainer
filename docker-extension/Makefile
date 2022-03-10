
.PHONY: all build
all: clean build install

ORG=portainer
VERSION=2.11.4
IMAGE_NAME=$(ORG)/portainer-extension
TAGGED_IMAGE_NAME=$(IMAGE_NAME):$(VERSION)

clean:
	-docker extension remove $(IMAGE_NAME)
	-docker rmi $(PORTAINER_IMAGE_NAME):$(VERSION)
	-docker rmi $(IMAGE_NAME)

build:
	docker buildx build -f build/linux/Dockerfile --push --builder=buildx-multi-arch --platform=windows/amd64,linux/amd64,linux/arm64 --build-arg TAG=$(VERSION) --build-arg PORTAINER_IMAGE_NAME=$(IMAGE_NAME) --tag=$(TAGGED_IMAGE_NAME) .

install:
	docker extension install $(TAGGED_IMAGE_NAME)

multiarch:
	docker buildx create --name=buildx-multi-arch --driver=docker-container --driver-opt=network=host

portainer:
	yarn build


