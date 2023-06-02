
#!/bin/bash

GOLANGCI_LINT="go run github.com/golangci/golangci-lint/cmd/golangci-lint@v1.53.0"

cd api
if ${GOLANGCI_LINT} run --timeout=10m -c .golangci.yaml
then
    echo "golangci-lint run successfully"
else
    echo "golangci-lint run failed"
    exit 1
fi
