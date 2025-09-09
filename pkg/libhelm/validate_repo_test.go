package libhelm

import (
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"

	"github.com/portainer/portainer/pkg/libhelm/test"
	"github.com/stretchr/testify/require"
)

func Test_ValidateHelmRepositoryURL(t *testing.T) {
	test.EnsureIntegrationTest(t)

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
		{"fabric8.io helm repo", "https://fabric8.io/helm/", false},
		{"lensesio helm repo", "https://lensesio.github.io/kafka-helm-charts", false},
	}

	for _, test := range tests {
		func(tc testCase) {
			t.Run(tc.name, func(t *testing.T) {
				t.Parallel()
				err := ValidateHelmRepositoryURL(tc.url, nil)
				if tc.invalid {
					require.Error(t, err, "error expected: %s", tc.url)
				} else {
					require.NoError(t, err, "no error expected: %s", tc.url)
				}
			})
		}(test)
	}
}

func TestValidateHelmRepositoryURL(t *testing.T) {
	var fail bool

	const indexYAML = "apiVersion: v1\nentries: {}\ngenerated: \"2020-01-01T00:00:00Z\"\n"

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if fail {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		if r.URL.Path == "/index.yaml" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(indexYAML))
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	// Success
	err := ValidateHelmRepositoryURL(srv.URL, nil)
	require.NoError(t, err)

	// Failure
	fail = true

	var failureURLs = []string{
		"",
		"!",
		"oci://example.com",
		"ftp://example.com",
		srv.URL,
	}

	for _, url := range failureURLs {
		err = ValidateHelmRepositoryURL(url, nil)
		require.Error(t, err)

		err = ValidateHelmRepositoryURL(srv.URL, nil)
		require.Error(t, err)
	}
}

func Test_ValidateSeedsCacheAndSearchUsesCache(t *testing.T) {
	const indexYAML = "apiVersion: v1\nentries: {}\ngenerated: \"2020-01-01T00:00:00Z\"\n"

	var requestCount int32
	var fail bool

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/index.yaml" {
			if fail {
				w.WriteHeader(http.StatusNotFound)
				return
			}
			atomic.AddInt32(&requestCount, 1)
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(indexYAML))
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	// isolate helm cache/config
	temp := t.TempDir()
	t.Setenv("HELM_REPOSITORY_CONFIG", temp+"/repositories.yaml")
	t.Setenv("HELM_REPOSITORY_CACHE", temp+"/cache")
	t.Setenv("HELM_REGISTRY_CONFIG", temp+"/registry.json")
	t.Setenv("HELM_PLUGINS", temp+"/plugins")

	// validate cache is used
	err := ValidateHelmRepositoryURL(srv.URL, nil)
	require.NoError(t, err)
	require.Equal(t, int32(1), atomic.LoadInt32(&requestCount))
}
