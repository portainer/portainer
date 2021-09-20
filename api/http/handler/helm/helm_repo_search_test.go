package helm

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/portainer/libhelm/binary/test"

	helper "github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func Test_helmRepoSearch(t *testing.T) {
	is := assert.New(t)

	helmPackageManager := test.NewMockHelmBinaryPackageManager("")
	h := NewTemplateHandler(helper.NewTestRequestBouncer(), helmPackageManager)

	assert.NotNil(t, h, "Handler should not fail")

	repos := []string{"https://charts.bitnami.com/bitnami", "https://portainer.github.io/k8s"}

	for _, repo := range repos {
		t.Run(repo, func(t *testing.T) {
			repoUrlEncoded := url.QueryEscape(repo)
			req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/templates/helm?repo=%s", repoUrlEncoded), nil)
			rr := httptest.NewRecorder()
			h.ServeHTTP(rr, req)

			is.Equal(http.StatusOK, rr.Code, "Status should be 200 OK")
			body, err := io.ReadAll(rr.Body)
			is.NoError(err, "ReadAll should not return error")
			is.NotEmpty(body, "Body should not be empty")
		})
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
