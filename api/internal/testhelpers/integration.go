package testhelpers

import (
	"flag"
	"os"
	"testing"
)

var integration bool

func init() {
	flag.BoolVar(&integration, "integration", false, "enable integration tests")
}

// IntegrationTest marks the current test as an integration test
func IntegrationTest(t *testing.T) {
	_, enabled := os.LookupEnv("INTEGRATION_TEST")

	if !(integration || enabled) {
		t.Skip("Skipping integration test")
	}
}
