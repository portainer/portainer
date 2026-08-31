package edgestacks

import (
	"bytes"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

// Update Status
func TestUpdateStatusAndInspect(t *testing.T) {
	t.Parallel()
	handler, rawAPIKey := setupHandler(t)

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	// Update edge stack status
	newStatus := portainer.EdgeStackStatusError
	payload := updateStatusPayload{
		Error:      "test-error",
		Status:     &newStatus,
		EndpointID: endpoint.ID,
	}

	jsonPayload, err := json.Marshal(payload)
	require.NoError(t, err)

	r := bytes.NewBuffer(jsonPayload)
	req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("/edge_stacks/%d/status", edgeStack.ID), r)
	require.NoError(t, err)

	req.Header.Set(portainer.PortainerAgentEdgeIDHeader, endpoint.EdgeID)
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

	endpointStatus, ok := updatedStack.Status[payload.EndpointID]
	require.True(t, ok)

	lastStatus := endpointStatus.Status[len(endpointStatus.Status)-1]

	if len(endpointStatus.Status) == len(edgeStack.Status[payload.EndpointID].Status) {
		t.Fatal("expected status array to be updated")
	}

	if lastStatus.Type != *payload.Status {
		t.Fatalf("expected EdgeStackStatusType %d, found %d", *payload.Status, lastStatus.Type)
	}

	if endpointStatus.EndpointID != payload.EndpointID {
		t.Fatalf("expected EndpointID %d, found %d", payload.EndpointID, endpointStatus.EndpointID)
	}
}

// A status update for an Edge stack that no longer exists (e.g. it was
// deleted after the agent last polled) must not panic and must be reported
// as successful, since the agent has nothing left to reconcile against.
func TestUpdateStatusForNonExistentEdgeStack(t *testing.T) {
	t.Parallel()
	handler, _ := setupHandler(t)

	endpoint := createEndpoint(t, handler.DataStore)

	newStatus := portainer.EdgeStackStatusRunning
	payload := updateStatusPayload{
		Status:     &newStatus,
		EndpointID: endpoint.ID,
	}

	jsonPayload, err := json.Marshal(payload)
	require.NoError(t, err)

	r := bytes.NewBuffer(jsonPayload)
	req, err := http.NewRequest(http.MethodPut, "/edge_stacks/9999/status", r)
	require.NoError(t, err)

	req.Header.Set(portainer.PortainerAgentEdgeIDHeader, endpoint.EdgeID)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	require.Equal(t, http.StatusOK, rec.Code)
	require.Empty(t, rec.Body.Bytes())
}

func TestUpdateStatusForUnassignedEdgeStack(t *testing.T) {
	t.Parallel()
	handler, _ := setupHandler(t)

	endpoint := createEndpoint(t, handler.DataStore)
	unrelatedEndpoint := createEndpointWithId(t, handler.DataStore, 6)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	newStatus := portainer.EdgeStackStatusRunning
	payload := updateStatusPayload{
		Status:     &newStatus,
		EndpointID: unrelatedEndpoint.ID,
	}

	jsonPayload, err := json.Marshal(payload)
	require.NoError(t, err)

	r := bytes.NewBuffer(jsonPayload)
	req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("/edge_stacks/%d/status", edgeStack.ID), r)
	require.NoError(t, err)

	req.Header.Set(portainer.PortainerAgentEdgeIDHeader, unrelatedEndpoint.EdgeID)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	require.Equal(t, http.StatusForbidden, rec.Code)

	_, err = handler.DataStore.EdgeStackStatus().Read(edgeStack.ID, unrelatedEndpoint.ID)
	require.True(t, handler.DataStore.IsErrObjectNotFound(err))
}

func TestUpdateStatusRemovedAllowedAfterUnassignment(t *testing.T) {
	t.Parallel()
	handler, _ := setupHandler(t)

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	// Simulate the endpoint being unassigned from the stack (e.g. edge group changed)
	// before the agent has torn down and reported its final status back.
	relation, err := handler.DataStore.EndpointRelation().EndpointRelation(endpoint.ID)
	require.NoError(t, err)

	delete(relation.EdgeStacks, edgeStack.ID)
	require.NoError(t, handler.DataStore.EndpointRelation().UpdateEndpointRelation(endpoint.ID, relation))

	newStatus := portainer.EdgeStackStatusRemoved
	payload := updateStatusPayload{
		Status:     &newStatus,
		EndpointID: endpoint.ID,
	}

	jsonPayload, err := json.Marshal(payload)
	require.NoError(t, err)

	r := bytes.NewBuffer(jsonPayload)
	req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("/edge_stacks/%d/status", edgeStack.ID), r)
	require.NoError(t, err)

	req.Header.Set(portainer.PortainerAgentEdgeIDHeader, endpoint.EdgeID)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	require.Equal(t, http.StatusOK, rec.Code)
}

func TestUpdateStatusWithInvalidPayload(t *testing.T) {
	t.Parallel()
	handler, _ := setupHandler(t)

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	// Update edge stack status
	statusError := portainer.EdgeStackStatusError
	statusOk := portainer.EdgeStackStatusDeploymentReceived
	cases := []struct {
		Name                 string
		Payload              updateStatusPayload
		ExpectedErrorMessage string
		ExpectedStatusCode   int
	}{
		{
			"Update with nil Status",
			updateStatusPayload{
				Error:      "test-error",
				Status:     nil,
				EndpointID: endpoint.ID,
			},
			"Invalid status",
			400,
		},
		{
			"Update with error status and empty error message",
			updateStatusPayload{
				Error:      "",
				Status:     &statusError,
				EndpointID: endpoint.ID,
			},
			"Error message is mandatory when status is error",
			400,
		},
		{
			"Update with missing EndpointID",
			updateStatusPayload{
				Error:      "",
				Status:     &statusOk,
				EndpointID: 0,
			},
			"Invalid EnvironmentID",
			400,
		},
	}

	for _, tc := range cases {
		t.Run(tc.Name, func(t *testing.T) {
			jsonPayload, err := json.Marshal(tc.Payload)
			require.NoError(t, err)

			r := bytes.NewBuffer(jsonPayload)
			req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("/edge_stacks/%d/status", edgeStack.ID), r)
			require.NoError(t, err)

			req.Header.Set(portainer.PortainerAgentEdgeIDHeader, endpoint.EdgeID)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != tc.ExpectedStatusCode {
				t.Fatalf("expected a %d response, found: %d", tc.ExpectedStatusCode, rec.Code)
			}
		})
	}
}
