.PHONY: build run

.SUFFIXES:

OPEN = $(shell which xdg-open || which open)
PORT ?= 9000

install:
	npm install -g grunt-cli
	npm install

build:
	grunt build
	docker build --rm -t dockerui .

build-release:
	grunt build
	docker run --rm -v $(pwd):/src centurylink/golang-builder

test:
	grunt

run:
	-docker stop dockerui
	-docker rm dockerui
	docker run -d -p $(PORT):9000 -v /var/run/docker.sock:/docker.sock --name dockerui dockerui -e /docker.sock 

open:
	$(OPEN) localhost:$(PORT)


