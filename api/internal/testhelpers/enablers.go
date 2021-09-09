package testhelpers

import (
	"flag"
	"os"
	"testing"
)

var integration bool
var extended bool

func init() {
	flag.BoolVar(&extended, "extended", false, "enable extended (longer running) tests")
	flag.BoolVar(&integration, "integration", false, "enable integration tests")
}

// IntegrationTest enables or disables integration tests
func IntegrationTest(t *testing.T) {
	_, enabled := os.LookupEnv("INTEGRATION_TEST")

	if !(integration || enabled) {
		t.Skip("Skipping integration test", t)
	}
}

// ExtendedTest enables or disables extended tests.
// use this function to skip some tests that may take a little too long to complete and break CI
func ExtendedTests(t *testing.T) bool {
	_, env := os.LookupEnv("EXTENDED_TEST")
	extended = extended || env

	if extended {
		t.Log("** Enabling extended tests **")
	}

	return extended
}
