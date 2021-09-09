package helm

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/portainer/libhelm/binary/test"
	"github.com/stretchr/testify/assert"

	helper "github.com/portainer/portainer/api/internal/testhelpers"
)

func Test_helmRepoSearch(t *testing.T) {
	extended := helper.ExtendedTests(t)
	is := assert.New(t)

	helmPackageManager := test.NewMockHelmBinaryPackageManager("")
	h := NewTemplateHandler(helper.NewTestRequestBouncer(), helmPackageManager)

	assert.NotNil(t, h, "Handler should not fail")

	type testCase struct {
		repo    string
		enabled bool
	}

	tests := []testCase{
		{"https://charts.bitnami.com/bitnami", false},
		{"https://portainer.github.io/k8s", true},
	}

	for _, test := range tests {
		func(tc testCase) {
			if tc.enabled || extended {
				t.Run(tc.repo, func(t *testing.T) {
					t.Parallel()
					repoUrlEncoded := url.QueryEscape(tc.repo)
					req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/templates/helm?repo=%s", repoUrlEncoded), nil)
					rr := httptest.NewRecorder()
					h.ServeHTTP(rr, req)

					is.Equal(http.StatusOK, rr.Code, "Status should be 200 OK")

					body, err := io.ReadAll(rr.Body)
					is.NoError(err, "ReadAll should not return error")
					is.NotEmpty(body, "Body should not be empty")
				})
			}
		}(test)
	}

	t.Run("fails on invalid URL", func(t *testing.T) {
		repo := "abc.com"
		repoUrlEncoded := url.QueryEscape(repo)
		req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/templates/helm?repo=%s", repoUrlEncoded), nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusBadRequest, rr.Code, "Status should be 400 Bad request")
	})
}
