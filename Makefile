# See: https://gist.github.com/asukakenji/f15ba7e588ac42795f421b48b8aede63
# For a list of valid GOOS and GOARCH values
# Note: these can be overriden on the command line e.g. `make PLATFORM=<platform> ARCH=<arch>`
PLATFORM=$(shell go env GOOS)
ARCH=$(shell go env GOARCH)

TAG=latest

# build target, can be one of "production", "testing", "development"
ENV=development
WEBPACK_CONFIG=webpack/webpack.$(ENV).js

.DEFAULT_GOAL := help

.PHONY: help build-storybook build-client devops download-binaries tidy clean client-deps

##@ Building

init-dist:
	mkdir -p dist

build-storybook:
	yarn storybook:build

build-client: init-dist ## Build the client
	@export NODE_ENV=$(ENV) && yarn build --config $(WEBPACK_CONFIG)

build-server: init-dist ## Build the server binary
	@./build/build_binary.sh "$(PLATFORM)" "$(ARCH)"

build: build-server build-client ## Build the server and client

build-image: build ## Build the Portainer image
	docker build -t portainerci/portainer:$(TAG) -f build/linux/Dockerfile .

devops: clean init-dist download-binaries build-client ## Build the server binary for CI
	echo "Building the devops binary..."
	@./build/build_binary_azuredevops.sh "$(PLATFORM)" "$(ARCH)"

##@ Dependencies

download-binaries: ## Download dependant binaries
	@./build/download_binaries.sh $(PLATFORM) $(ARCH)

tidy: ## Tidy up the go.mod file
	cd api && go mod tidy
 
client-deps: ## Install client dependencies
	yarn

##@ Cleanup

clean: ## Remove all build and download artifacts
	@echo "Clearing the dist directory..."
	@rm -rf dist/*

##@ Testing

test-client: ## Run client tests
	yarn test

test-server:	## Run server tests
	cd api && go test -v ./...

test: test-client test-server ## Run all tests

##@ Dev

dev-server: build-image ## Run the server in development mode
	@./dev/run_container.sh


##@ Format

format-client: ## Format client code
	yarn format

format-server: ## Format server code
	cd api && go fmt ./...

format: format-client format-server ## Format all code

##@ Lint

lint-client: ## Lint client code
	yarn lint

lint-server: ## Lint server code
	cd api && go vet ./...

lint: lint-client lint-server ## Lint all code

##@ Extension

dev-extension: build-server build-client ## Run the extension in development mode
	make local -f build/docker-extension/Makefile

##@ Docs

docs-deps: ## Install docs dependencies
	go install github.com/swaggo/swag/cmd/swag@v1.8.11

docs-build: docs-deps ## Build docs
	cd api && swag init -g ./http/handler/handler.go --parseDependency --parseInternal --parseDepth 2 --markdownFiles ./

docs-validate: docs-build ## Validate docs
	yarn swagger2openapi --warnOnly api/docs/swagger.yaml -o api/docs/openapi.yaml
	yarn swagger-cli validate api/docs/openapi.yaml

docs-clean: ## Clean docs
	rm -rf api/docs

docs-validate-clean: docs-validate docs-clean ## Validate and clean docs

##@ Helpers

help:  ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
