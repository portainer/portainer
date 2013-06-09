REF = HEAD
VERSION = $(shell git describe --always $(REF))

all: less

less:
	less css/*.less > css/app.css

.PHONY: all less
