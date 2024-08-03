# See: https://gist.github.com/asukakenji/f15ba7e588ac42795f421b48b8aede63
# For a list of valid GOOS and GOARCH values
# Note: these can be overriden on the command line e.g. `make PLATFORM=<platform> ARCH=<arch>`
PLATFORM=$(shell go env GOOS)
ARCH=$(shell go env GOARCH)

# build target, can be one of "production", "testing", "development"
ENV=development
WEBPACK_CONFIG=webpack/webpack.$(ENV).js
TAG=local

SWAG=go run github.com/swaggo/swag/cmd/swag@v1.16.2 
GOTESTSUM=go run gotest.tools/gotestsum@latest

# Don't change anything below this line unless you know what you're doing
.DEFAULT_GOAL := help


##@ Building
.PHONY: init-dist build-storybook build build-client build-server build-image devops
init-dist:
	@mkdir -p dist

build-all: deps build-server build-client ## Build the client, server and download external dependancies (doesn't build an image)

build-client: init-dist ## Build the client
	export NODE_ENV=$(ENV) && yarn build --config $(WEBPACK_CONFIG)

build-server: init-dist ## Build the server binary
	./build/build_binary.sh "$(PLATFORM)" "$(ARCH)"

build-image: build-all ## Build the Portainer image locally
	docker buildx build --load -t portainerci/portainer:$(TAG) -f build/linux/Dockerfile .

build-storybook: ## Build and serve the storybook files
	yarn storybook:build

devops: clean deps build-client ## Build the everything target specifically for CI
	echo "Building the devops binary..."
	@./build/build_binary_azuredevops.sh "$(PLATFORM)" "$(ARCH)"

##@ Build dependencies
.PHONY: deps server-deps client-deps tidy
deps: server-deps client-deps ## Download all client and server build dependancies

server-deps: init-dist ## Download dependant server binaries
	@./build/download_binaries.sh $(PLATFORM) $(ARCH)

client-deps: ## Install client dependencies
	yarn

tidy: ## Tidy up the go.mod file
	cd api && go mod tidy


##@ Cleanup
.PHONY: clean
clean: ## Remove all build and download artifacts
	@echo "Clearing the dist directory..."
	@rm -rf dist/*


##@ Testing
.PHONY: test test-client test-server
test: test-server test-client ## Run all tests

test-client: ## Run client tests
	yarn test $(ARGS)

test-server:	## Run server tests
	$(GOTESTSUM) --format pkgname-and-test-fails --format-hide-empty-pkg --hide-summary skipped -- -cover  ./...

##@ Dev
.PHONY: dev dev-client dev-server
dev: ## Run both the client and server in development mode	
	make dev-server
	make dev-client

dev-client: ## Run the client in development mode 
	yarn dev

dev-server: build-server ## Run the server in development mode
	@./dev/run_container.sh

dev-server-podman: build-server ## Run the server in development mode
	@./dev/run_container_podman.sh

##@ Format
.PHONY: format format-client format-server

format: format-client format-server ## Format all code

format-client: ## Format client code
	yarn format

format-server: ## Format server code
	go fmt ./...

##@ Lint
.PHONY: lint lint-client lint-server
lint: lint-client lint-server ## Lint all code

lint-client: ## Lint client code
	yarn lint

lint-server: ## Lint server code
	golangci-lint run --timeout=10m -c .golangci.yaml


##@ Extension
.PHONY: dev-extension
dev-extension: build-server build-client ## Run the extension in development mode
	make local -f build/docker-extension/Makefile


##@ Docs
.PHONY: docs-build docs-validate docs-clean docs-validate-clean
docs-build: init-dist ## Build docs
	cd api && $(SWAG) init -o "../dist/docs" -ot "yaml" -g ./http/handler/handler.go --parseDependency --parseInternal --parseDepth 2 -p pascalcase --markdownFiles ./ 

docs-validate: docs-build ## Validate docs
	yarn swagger2openapi --warnOnly dist/docs/swagger.yaml -o dist/docs/openapi.yaml
	yarn swagger-cli validate dist/docs/openapi.yaml

##@ Helpers
.PHONY: help
help:  ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
