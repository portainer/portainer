.PHONY: build run

.SUFFIXES:

OPEN = $(shell which xdg-open || which open)
PORT ?= 9000

build:
	docker build --rm -t dockerui .

run:
	docker run -d -p $(PORT):9000 -v /var/run/docker.sock:/docker.sock dockerui -e /docker.sock

open:
	$(OPEN) localhost:$(PORT)


