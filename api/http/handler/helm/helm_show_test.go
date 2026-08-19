package helm

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/pkg/libhelm/test"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_helmShow(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	helmPackageManager := test.NewMockHelmPackageManager()
	h := NewTemplateHandler(testhelpers.NewTestRequestBouncer(), helmPackageManager)

	is.NotNil(h, "Handler should not fail")

	commands := map[string]string{
		"values": test.MockDataValues,
		"chart":  test.MockDataChart,
		"readme": test.MockDataReadme,
	}

	for cmd, expect := range commands {
		t.Run(cmd, func(t *testing.T) {
			is.NotNil(h, "Handler should not fail")

			repoUrlEncoded := url.QueryEscape("https://charts.bitnami.com/bitnami")
			chart := "nginx"
			req := httptest.NewRequest("GET", fmt.Sprintf("/templates/helm/%s?repo=%s&chart=%s", cmd, repoUrlEncoded, chart), nil)
			rr := httptest.NewRecorder()
			h.ServeHTTP(rr, req)

			is.Equal(http.StatusOK, rr.Code, "Status should be 200 OK")

			body, err := io.ReadAll(rr.Body)
			require.NoError(t, err, "ReadAll should not return error")
			is.Equal(string(body), expect, "Unexpected search response")
		})
	}
}
