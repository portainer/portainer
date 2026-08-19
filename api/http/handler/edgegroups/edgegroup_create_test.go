package edgegroups

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestEdgeGroupCreateHandler(t *testing.T) {
	t.Parallel()
	handler, _ := newHandlerWithEdgeEndpoints(t)

	rr := httptest.NewRecorder()

	req := httptest.NewRequest(
		http.MethodPost,
		"/edge_groups",
		strings.NewReader(`{"Name": "New Edge Group", "Endpoints": [1, 2, 3]}`),
	)

	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusOK, rr.Result().StatusCode)

	var responseGroup portainer.EdgeGroup
	err := json.NewDecoder(rr.Body).Decode(&responseGroup)
	require.NoError(t, err)

	require.ElementsMatch(t, []portainer.EndpointID{1, 2, 3}, responseGroup.Endpoints)
}

func TestEdgeGroupCreatePanic(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store

	err := store.EdgeGroup().Create(&portainer.EdgeGroup{ID: 1, Name: "New Edge Group"})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost,
		"/edge_groups",
		strings.NewReader(`{"Name": "New Edge Group", "Endpoints": [1, 2, 3]}`),
	)

	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusBadRequest, rr.Result().StatusCode)
}
