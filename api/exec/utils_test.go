package exec

import (
	"testing"
)

func Test_isBinaryPresent(t *testing.T) {

	if !IsBinaryPresent("docker") {
		t.Error("expect docker binary to exist on the path")
	}

	if IsBinaryPresent("executable-with-this-name-should-not-exist") {
		t.Error("expect binary with a random name to be missing on the path")
	}
}
