package sdk

import (
	"encoding/json"
	"testing"

	"github.com/portainer/portainer/pkg/libhelm/options"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type testCase struct {
	name    string
	url     string
	invalid bool
}

var tests = []testCase{
	{"not a helm repo", "https://portainer.io", true},
	{"ingress helm repo", "https://kubernetes.github.io/ingress-nginx", false},
	{"portainer helm repo", "https://portainer.github.io/k8s/", false},
	{"elastic helm repo with trailing slash", "https://helm.elastic.co/", false},
}

func Test_SearchRepo(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	// Create a new SDK package manager
	hspm := NewHelmSDKPackageManager()

	for _, test := range tests {
		func(tc testCase) {
			t.Run(tc.name, func(t *testing.T) {
				t.Parallel()
				response, err := hspm.SearchRepo(options.SearchRepoOptions{Repo: tc.url})
				if tc.invalid {
					require.Error(t, err, "error expected: %s", tc.url)
				} else {
					require.NoError(t, err, "no error expected: %s", tc.url)
				}

				if err == nil {
					is.NotEmpty(response, "response expected")
				}
			})
		}(test)
	}

	t.Run("search repo with keyword", func(t *testing.T) {
		// Search for charts with keyword
		searchOpts := options.SearchRepoOptions{
			Repo: "https://kubernetes.github.io/ingress-nginx",
		}
		responseBytes, err := hspm.SearchRepo(searchOpts)

		// The function should not fail by design, even when not running in a k8s environment
		require.NoError(t, err, "should not return error when not in k8s environment")
		is.NotNil(responseBytes, "should return non-nil response")
		is.NotEmpty(responseBytes, "should return non-empty response")

		// Parse the 	ext response
		var repoIndex RepoIndex
		err = json.Unmarshal(responseBytes, &repoIndex)
		require.NoError(t, err, "should parse JSON response without error")
		is.NotEmpty(repoIndex, "should have at least one chart")

		// Verify charts structure apiVersion, entries, generated
		is.Equal("v1", repoIndex.APIVersion, "apiVersion should be v1")
		is.NotEmpty(repoIndex.Entries, "entries should not be empty")
		is.NotEmpty(repoIndex.Generated, "generated should not be empty")

		// there should be at least one chart
		is.NotEmpty(repoIndex.Entries, "should have at least one chart")
	})

	t.Run("search repo with empty repo URL", func(t *testing.T) {
		// Search with empty repo URL
		searchOpts := options.SearchRepoOptions{
			Repo: "",
		}
		_, err := hspm.SearchRepo(searchOpts)
		require.Error(t, err, "should return error when repo URL is empty")
	})
}
