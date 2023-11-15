package stackutils

import (
	"testing"
)

func composeFileWithBuild(p string) []byte {
	return []byte(`
services:
  service1:
    build: ` + p)
}

func composeFileWithBuildContext(p string) []byte {
	return []byte(`
services:
  service1:
    build:
      context: ` + p)
}

func TestIsValidBuildContext(t *testing.T) {
	var validPaths = []string{
		".",
		"./portainer",
		`portainer\agent`,
		"portainer",
		" portainer",
		"https://github.com/portainer/portainer",
		"git@github.com/portainer/portainer.git",
	}

	var invalidPaths = []string{
		"/etc/shadow",
		`C:\Windows`,
		"C:/Windows",
		"./../../../../../etc/shadow",
		" ..",
	}

	testFn := func(p string, mustFail bool) {
		for _, fn := range []func(string) []byte{composeFileWithBuild, composeFileWithBuildContext} {
			composeConfig, err := loadComposeConfig(fn(p))
			if err != nil {
				t.Fatalf("failed to load compose config: %v", err)
			}

			err = IsValidBuildContext(composeConfig)
			if mustFail && err == nil {
				t.Errorf("expected '%s' to be an invalid build context", p)
			}

			if !mustFail && err != nil {
				t.Errorf("expected '%s' to be a valid build context", p)
			}
		}
	}

	for _, p := range validPaths {
		testFn(p, false)
	}

	for _, p := range invalidPaths {
		testFn(p, true)
	}
}
