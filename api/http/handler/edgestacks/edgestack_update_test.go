package edgestacks

import (
	"bytes"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/roar"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

var errForcedClearFailure = errors.New("forced clear failure")

// errClearEdgeStackStatusService forces Clear to fail so that error-propagation
// paths in handleChangeEdgeGroups can be exercised without a live DB failure.
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

// Update
func TestUpdateAndInspect(t *testing.T) {
	t.Parallel()
	handler, rawAPIKey := setupHandler(t)

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	// Update edge stack: create new Endpoint, EndpointRelation and EdgeGroup
	endpointID := portainer.EndpointID(6)
	newEndpoint := createEndpointWithId(t, handler.DataStore, endpointID)

	err := handler.DataStore.Endpoint().Create(&newEndpoint)
	require.NoError(t, err)

	endpointRelation := portainer.EndpointRelation{
		EndpointID: endpointID,
		EdgeStacks: map[portainer.EdgeStackID]bool{
			edgeStack.ID: true,
		},
	}

	err = handler.DataStore.EndpointRelation().Create(&endpointRelation)
	require.NoError(t, err)

	newEdgeGroup := portainer.EdgeGroup{
		ID:           2,
		Name:         "EdgeGroup 2",
		Dynamic:      false,
		TagIDs:       nil,
		EndpointIDs:  roar.FromSlice([]portainer.EndpointID{newEndpoint.ID}),
		PartialMatch: false,
	}

	err = handler.DataStore.EdgeGroup().Create(&newEdgeGroup)
	require.NoError(t, err)

	payload := updateEdgeStackPayload{
		StackFileContent: "update-test",
		UpdateVersion:    true,
		EdgeGroups:       append(edgeStack.EdgeGroups, newEdgeGroup.ID),
		DeploymentType:   portainer.EdgeStackDeploymentCompose,
	}

	jsonPayload, err := json.Marshal(payload)
	require.NoError(t, err)

	r := bytes.NewBuffer(jsonPayload)
	req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("/edge_stacks/%d", edgeStack.ID), r)
	require.NoError(t, err)

	req.Header.Add("x-api-key", rawAPIKey)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected a %d response, found: %d", http.StatusOK, rec.Code)
	}

	// Get updated edge stack
	req, err = http.NewRequest(http.MethodGet, fmt.Sprintf("/edge_stacks/%d", edgeStack.ID), nil)
	require.NoError(t, err)

	req.Header.Add("x-api-key", rawAPIKey)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected a %d response, found: %d", http.StatusOK, rec.Code)
	}

	updatedStack := portainer.EdgeStack{}
	err = json.NewDecoder(rec.Body).Decode(&updatedStack)
	require.NoError(t, err)

	if payload.UpdateVersion && updatedStack.Version != edgeStack.Version+1 {
		t.Fatalf("expected EdgeStack version %d, found %d", edgeStack.Version+1, updatedStack.Version+1)
	}

	if updatedStack.DeploymentType != payload.DeploymentType {
		t.Fatalf("expected DeploymentType %d, found %d", edgeStack.DeploymentType, updatedStack.DeploymentType)
	}

	if !reflect.DeepEqual(updatedStack.EdgeGroups, payload.EdgeGroups) {
		t.Fatalf("expected EdgeGroups to be equal")
	}
}

// TestUpdateEdgeGroupsClearsStaleStatusOnReassignment reproduces BE-13141: an
// endpoint that is removed from an edge stack's edge groups and later
// re-added must not keep showing the status from its previous deployment.
func TestUpdateEdgeGroupsClearsStaleStatusOnReassignment(t *testing.T) {
	t.Parallel()
	handler, rawAPIKey := setupHandler(t)

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	staleStatus := &portainer.EdgeStackStatusForEnv{
		EndpointID: endpoint.ID,
		Status: []portainer.EdgeStackDeploymentStatus{
			{Time: 1, Type: portainer.EdgeStackStatusError, Error: "boom"},
		},
	}

	err := handler.DataStore.EdgeStackStatus().Create(edgeStack.ID, endpoint.ID, staleStatus)
	require.NoError(t, err)

	emptyEdgeGroup := portainer.EdgeGroup{
		ID:   2,
		Name: "EdgeGroup 2",
	}

	err = handler.DataStore.EdgeGroup().Create(&emptyEdgeGroup)
	require.NoError(t, err)

	// Reassign the stack away from the endpoint's group.
	updateEdgeStackRequest(t, handler, rawAPIKey, edgeStack.ID, updateEdgeStackPayload{
		StackFileContent: "update-test",
		EdgeGroups:       []portainer.EdgeGroupID{emptyEdgeGroup.ID},
		DeploymentType:   portainer.EdgeStackDeploymentCompose,
	})

	// Re-assign the stack back to the endpoint's original group.
	updateEdgeStackRequest(t, handler, rawAPIKey, edgeStack.ID, updateEdgeStackPayload{
		StackFileContent: "update-test",
		EdgeGroups:       edgeStack.EdgeGroups,
		DeploymentType:   portainer.EdgeStackDeploymentCompose,
	})

	status, err := handler.DataStore.EdgeStackStatus().Read(edgeStack.ID, endpoint.ID)
	require.NoError(t, err)
	require.Empty(t, status.Status)
}

// TestHandleChangeEdgeGroupsPropagatesClearError ensures a failure to clear
// the stale Edge stack status aborts the edge groups change instead of being
// silently ignored.
func TestHandleChangeEdgeGroupsPropagatesClearError(t *testing.T) {
	t.Parallel()
	handler, _ := setupHandler(t)

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		relationConfig, err := edge.FetchEndpointRelationsConfig(tx)
		require.NoError(t, err)

		_, _, err = handler.handleChangeEdgeGroups(errClearDataStoreTx{DataStoreTx: tx}, &edgeStack, edgeStack.EdgeGroups, nil, relationConfig)

		return err
	})
	require.ErrorIs(t, err, errForcedClearFailure)
}

func updateEdgeStackRequest(t *testing.T, handler *Handler, rawAPIKey string, edgeStackID portainer.EdgeStackID, payload updateEdgeStackPayload) {
	t.Helper()

	jsonPayload, err := json.Marshal(payload)
	require.NoError(t, err)

	r := bytes.NewBuffer(jsonPayload)
	req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("/edge_stacks/%d", edgeStackID), r)
	require.NoError(t, err)

	req.Header.Add("x-api-key", rawAPIKey)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	require.Equal(t, http.StatusOK, rec.Code)
}

func TestUpdateWithInvalidEdgeGroups(t *testing.T) {
	t.Parallel()
	handler, rawAPIKey := setupHandler(t)

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	newEdgeGroup := portainer.EdgeGroup{
		ID:           2,
		Name:         "EdgeGroup 2",
		Dynamic:      false,
		TagIDs:       nil,
		EndpointIDs:  roar.FromSlice([]portainer.EndpointID{8889}),
		PartialMatch: false,
	}

	err := handler.DataStore.EdgeGroup().Create(&newEdgeGroup)
	require.NoError(t, err)

	cases := []struct {
		Name               string
		Payload            updateEdgeStackPayload
		ExpectedStatusCode int
	}{
		{
			"Update with non-existing EdgeGroupID",
			updateEdgeStackPayload{
				StackFileContent: "error-test",
				UpdateVersion:    true,
				EdgeGroups:       []portainer.EdgeGroupID{9999},
				DeploymentType:   edgeStack.DeploymentType,
			},
			http.StatusInternalServerError,
		},
		{
			"Update with invalid EdgeGroup (non-existing Endpoint)",
			updateEdgeStackPayload{
				StackFileContent: "error-test",
				UpdateVersion:    true,
				EdgeGroups:       []portainer.EdgeGroupID{2},
				DeploymentType:   edgeStack.DeploymentType,
			},
			http.StatusInternalServerError,
		},
		{
			"Update DeploymentType from Docker to Kubernetes",
			updateEdgeStackPayload{
				StackFileContent: "error-test",
				UpdateVersion:    true,
				EdgeGroups:       []portainer.EdgeGroupID{1},
				DeploymentType:   portainer.EdgeStackDeploymentKubernetes,
			},
			http.StatusBadRequest,
		},
	}

	for _, tc := range cases {
		t.Run(tc.Name, func(t *testing.T) {
			jsonPayload, err := json.Marshal(tc.Payload)
			if err != nil {
				t.Fatal("JSON marshal error:", err)
			}

			r := bytes.NewBuffer(jsonPayload)
			req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("/edge_stacks/%d", edgeStack.ID), r)
			if err != nil {
				t.Fatal("request error:", err)
			}

			req.Header.Add("x-api-key", rawAPIKey)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != tc.ExpectedStatusCode {
				t.Fatalf("expected a %d response, found: %d", tc.ExpectedStatusCode, rec.Code)
			}
		})
	}
}

func TestUpdateWithInvalidPayload(t *testing.T) {
	t.Parallel()
	handler, rawAPIKey := setupHandler(t)

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	cases := []struct {
		Name               string
		Payload            updateEdgeStackPayload
		ExpectedStatusCode int
	}{
		{
			"Update with empty StackFileContent",
			updateEdgeStackPayload{
				StackFileContent: "",
				UpdateVersion:    true,
				EdgeGroups:       edgeStack.EdgeGroups,
				DeploymentType:   edgeStack.DeploymentType,
			},
			http.StatusBadRequest,
		},
		{
			"Update with empty EdgeGroups",
			updateEdgeStackPayload{
				StackFileContent: "error-test",
				UpdateVersion:    true,
				EdgeGroups:       []portainer.EdgeGroupID{},
				DeploymentType:   edgeStack.DeploymentType,
			},
			http.StatusBadRequest,
		},
	}

	for _, tc := range cases {
		t.Run(tc.Name, func(t *testing.T) {
			jsonPayload, err := json.Marshal(tc.Payload)
			require.NoError(t, err)

			r := bytes.NewBuffer(jsonPayload)
			req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("/edge_stacks/%d", edgeStack.ID), r)
			require.NoError(t, err)

			req.Header.Add("x-api-key", rawAPIKey)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != tc.ExpectedStatusCode {
				t.Fatalf("expected a %d response, found: %d", tc.ExpectedStatusCode, rec.Code)
			}
		})
	}
}
