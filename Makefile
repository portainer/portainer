REF = HEAD
VERSION = $(shell git describe --always $(REF))

all: ts less

clean:
	rm js/*.js

ts:
	tsc js/*.ts

less:
	less css/*.less > css/app.css

.PHONY: all clean hash ts less
