package edgegroups

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/roar"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

var errForcedClearFailure = errors.New("forced clear failure")

// errClearEdgeStackStatusService forces Clear to fail so that error-propagation
// paths in updateEndpointStacks can be exercised without a live DB failure.
type errClearEdgeStackStatusService struct {
	dataservices.EdgeStackStatusService
}

func (errClearEdgeStackStatusService) Clear(portainer.EdgeStackID, []portainer.EndpointID) error {
	return errForcedClearFailure
}

type errClearDataStoreTx struct {
	dataservices.DataStoreTx
}

func (errClearDataStoreTx) EdgeStackStatus() dataservices.EdgeStackStatusService {
	return errClearEdgeStackStatusService{}
}

func TestEdgeGroupUpdateHandler(t *testing.T) {
	t.Parallel()
	handler, store := newHandlerWithEdgeEndpoints(t)

	err := store.EdgeGroup().Create(&portainer.EdgeGroup{
		ID:          1,
		Name:        "Test Edge Group",
		EndpointIDs: roar.FromSlice([]portainer.EndpointID{1}),
	})
	require.NoError(t, err)

	rr := httptest.NewRecorder()

	req := httptest.NewRequest(
		http.MethodPut,
		"/edge_groups/1",
		strings.NewReader(`{"Endpoints": [1, 2, 3]}`),
	)

	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusOK, rr.Result().StatusCode)

	var responseGroup portainer.EdgeGroup
	err = json.NewDecoder(rr.Body).Decode(&responseGroup)
	require.NoError(t, err)

	require.ElementsMatch(t, []portainer.EndpointID{1, 2, 3}, responseGroup.Endpoints)
}

// TestEdgeGroupUpdateClearsStaleStatusOnEndpointReassignment reproduces
// BE-13141: an endpoint newly added to an Edge group that is related to an
// Edge stack must not keep showing the status left over from a previous
// deployment to that stack.
func TestEdgeGroupUpdateClearsStaleStatusOnEndpointReassignment(t *testing.T) {
	t.Parallel()
	handler, store := newHandlerWithEdgeEndpoints(t)

	err := store.EdgeGroup().Create(&portainer.EdgeGroup{
		ID:          1,
		Name:        "Test Edge Group",
		EndpointIDs: roar.FromSlice([]portainer.EndpointID{2, 3}),
	})
	require.NoError(t, err)

	edgeStack := portainer.EdgeStack{
		ID:             1,
		Name:           "test-edge-stack",
		CreationDate:   time.Now().Unix(),
		EdgeGroups:     []portainer.EdgeGroupID{1},
		ProjectPath:    "/project/path",
		EntryPoint:     "entrypoint",
		ManifestPath:   "/manifest/path",
		DeploymentType: portainer.EdgeStackDeploymentKubernetes,
	}
	err = store.EdgeStack().Create(edgeStack.ID, &edgeStack)
	require.NoError(t, err)

	staleStatus := &portainer.EdgeStackStatusForEnv{
		EndpointID: 1,
		Status: []portainer.EdgeStackDeploymentStatus{
			{Time: 1, Type: portainer.EdgeStackStatusError, Error: "boom"},
		},
	}

	err = store.EdgeStackStatus().Create(edgeStack.ID, 1, staleStatus)
	require.NoError(t, err)

	rr := httptest.NewRecorder()

	req := httptest.NewRequest(
		http.MethodPut,
		"/edge_groups/1",
		strings.NewReader(`{"Endpoints": [1, 2, 3]}`),
	)

	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusOK, rr.Result().StatusCode)

	status, err := store.EdgeStackStatus().Read(edgeStack.ID, 1)
	require.NoError(t, err)
	require.Empty(t, status.Status)
}

// TestUpdateEndpointStacksPropagatesClearError ensures a failure to clear the
// stale Edge stack status aborts the relation update instead of being
// silently ignored.
func TestUpdateEndpointStacksPropagatesClearError(t *testing.T) {
	t.Parallel()
	handler, store := newHandlerWithEdgeEndpoints(t)

	endpoint, err := store.Endpoint().Endpoint(1)
	require.NoError(t, err)

	edgeGroup := portainer.EdgeGroup{
		ID:          1,
		Name:        "Test Edge Group",
		EndpointIDs: roar.FromSlice([]portainer.EndpointID{endpoint.ID}),
	}
	err = store.EdgeGroup().Create(&edgeGroup)
	require.NoError(t, err)

	edgeStack := portainer.EdgeStack{
		ID:         1,
		Name:       "test-edge-stack",
		EdgeGroups: []portainer.EdgeGroupID{edgeGroup.ID},
	}
	err = store.EdgeStack().Create(edgeStack.ID, &edgeStack)
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return handler.updateEndpointStacks(errClearDataStoreTx{DataStoreTx: tx}, endpoint, []portainer.EdgeGroup{edgeGroup}, []portainer.EdgeStack{edgeStack})
	})
	require.ErrorIs(t, err, errForcedClearFailure)
}

func TestEdgeGroupUpdatePanic(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, "/edge_groups/1", strings.NewReader("{}"))

	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusNotFound, rr.Result().StatusCode)
}
