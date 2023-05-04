
#!/bin/bash

cd api
if golangci-lint run --timeout=10m -c .golangci.yaml
then
    echo "golangci-lint run successfully"
else
    echo "golangci-lint run failed"
    exit 1
fi
