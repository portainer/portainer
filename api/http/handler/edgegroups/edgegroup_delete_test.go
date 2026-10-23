package edgegroups

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/stretchr/testify/require"
)

func TestEdgeGroupDeleteBlockedByWorkflow(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store

	err := store.EdgeGroup().Create(&portainer.EdgeGroup{
		ID:   1,
		Name: "Test Edge Group",
	})
	require.NoError(t, err)

	err = store.Workflow().Create(&portainer.Workflow{
		Name: "Test Workflow",
		Artifacts: []portainer.Artifact{{
			EdgeGroups: []portainer.EdgeGroupID{1},
		}},
	})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/edge_groups/1", nil)

	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusConflict, rr.Result().StatusCode)

	_, err = store.EdgeGroup().Read(1)
	require.NoError(t, err)
}
