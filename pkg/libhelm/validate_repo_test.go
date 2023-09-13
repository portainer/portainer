package libhelm

import (
	"testing"

	"github.com/portainer/portainer/pkg/libhelm/libhelmtest"
	"github.com/stretchr/testify/assert"
)

func Test_ValidateHelmRepositoryURL(t *testing.T) {
	libhelmtest.EnsureIntegrationTest(t)
	is := assert.New(t)

	type testCase struct {
		name    string
		url     string
		invalid bool
	}

	tests := []testCase{
		{"blank", "", true},
		{"slashes", "//", true},
		{"slash", "/", true},
		{"invalid scheme", "garbage://a.b.c", true},
		{"invalid domain", "https://invaliddomain/", true},
		{"not helm repo", "http://google.com", true},
		{"not valid repo with trailing slash", "http://google.com/", true},
		{"not valid repo with trailing slashes", "http://google.com////", true},
		{"bitnami helm repo", "https://charts.bitnami.com/bitnami/", false},
		{"gitlap helm repo", "https://charts.gitlab.io/", false},
		{"portainer helm repo", "https://portainer.github.io/k8s/", false},
		{"elastic helm repo", "https://helm.elastic.co/", false},
		{"redirect", "https://charts.jetstack.io/", false},
	}

	for _, test := range tests {
		func(tc testCase) {
			t.Run(tc.name, func(t *testing.T) {
				t.Parallel()
				err := ValidateHelmRepositoryURL(tc.url, nil)
				if tc.invalid {
					is.Errorf(err, "error expected: %s", tc.url)
				} else {
					is.NoError(err, "no error expected: %s", tc.url)
				}
			})
		}(test)
	}
}
