package test

import (
	"os"
	"testing"
)

// EnsureIntegrationTest disables live integration tests that prevent portainer CI checks from succeeding on github
func EnsureIntegrationTest(t *testing.T) {
	if _, ok := os.LookupEnv("INTEGRATION_TEST"); !ok {
		t.Skip("skip an integration test")
	}
}
