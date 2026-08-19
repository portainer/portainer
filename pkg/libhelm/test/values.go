package test

import (
	"os"

	"github.com/portainer/portainer/api/logs"
)

// CreateValuesFile creates a temporary file with the given content for testing
func CreateValuesFile(values string) (string, error) {
	file, err := os.CreateTemp("", "helm-values")
	if err != nil {
		return "", err
	}

	if _, err := file.WriteString(values); err != nil {
		logs.CloseAndLogErr(file)
		return "", err
	}

	if err := file.Close(); err != nil {
		return "", err
	}

	return file.Name(), nil
}
