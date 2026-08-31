package templates

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"
	libclient "github.com/portainer/portainer/pkg/libhttp/client"

	"github.com/portainer/portainer/pkg/featureflags"
	"github.com/stretchr/testify/require"
)

// templateFile must not dereference a nil templates response. fetchTemplates
// returns (nil, nil) when external requests are disabled and the configured
// templates URL is still the default one, which used to panic further down
// when indexing into the (nil) template list.
//
// This test mutates the process-wide featureflags state, so it intentionally
// does not run in parallel with other tests.
func TestTemplateFile_ReturnsNotFound_WhenExternalRequestsDisabledForDefaultURL(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)

	featureflags.Parse([]string{libclient.DisableExternalRequests}, []featureflags.Feature{libclient.DisableExternalRequests})
	t.Cleanup(func() {
		featureflags.Parse(nil, []featureflags.Feature{libclient.DisableExternalRequests})
	})

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store

	req := httptest.NewRequest(http.MethodPost, "/templates/1/file", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	require.Equal(t, http.StatusNotFound, rec.Code)
}
