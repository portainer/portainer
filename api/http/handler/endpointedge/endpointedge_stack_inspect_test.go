package endpointedge

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/require"
)

func TestEndpointEdgeStackInspectRejectsUnassignedStack(t *testing.T) {
	t.Parallel()
	handler := mustSetupHandler(t)

	endpointID := portainer.EndpointID(10)
	require.NoError(t, createEndpoint(handler, portainer.Endpoint{
		ID:     endpointID,
		Name:   "endpoint-10",
		Type:   portainer.EdgeAgentOnDockerEnvironment,
		URL:    "https://portainer.io:9443",
		EdgeID: "edge-id",
	}, portainer.EndpointRelation{EndpointID: endpointID}))

	edgeStackID := portainer.EdgeStackID(99)
	edgeStack := &portainer.EdgeStack{
		ID:         edgeStackID,
		Name:       "unassigned-stack",
		EntryPoint: "docker-compose.yml",
	}
	require.NoError(t, handler.DataStore.EdgeStack().Create(edgeStackID, edgeStack))

	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/endpoints/%d/edge/stacks/%d", endpointID, edgeStackID), nil)
	require.NoError(t, err)

	req.Header.Set(portainer.PortainerAgentEdgeIDHeader, "edge-id")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	require.Equal(t, http.StatusForbidden, rec.Code)
}

func TestEndpointEdgeStackInspectAllowsAssignedStack(t *testing.T) {
	t.Parallel()
	handler := mustSetupHandler(t)

	fileName := "docker-compose.yml"
	edgeStackID := portainer.EdgeStackID(100)

	projectPath, err := handler.FileService.StoreEdgeStackFileFromBytes(strconv.Itoa(int(edgeStackID)), fileName, []byte("version: '3'"))
	require.NoError(t, err)

	edgeStack := &portainer.EdgeStack{
		ID:          edgeStackID,
		Name:        "assigned-stack",
		EntryPoint:  fileName,
		ProjectPath: projectPath,
	}
	require.NoError(t, handler.DataStore.EdgeStack().Create(edgeStackID, edgeStack))

	endpointID := portainer.EndpointID(11)
	require.NoError(t, createEndpoint(handler, portainer.Endpoint{
		ID:     endpointID,
		Name:   "endpoint-11",
		Type:   portainer.EdgeAgentOnDockerEnvironment,
		URL:    "https://portainer.io:9443",
		EdgeID: "edge-id",
	}, portainer.EndpointRelation{
		EndpointID: endpointID,
		EdgeStacks: map[portainer.EdgeStackID]bool{edgeStackID: true},
	}))

	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/endpoints/%d/edge/stacks/%d", endpointID, edgeStackID), nil)
	require.NoError(t, err)

	req.Header.Set(portainer.PortainerAgentEdgeIDHeader, "edge-id")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	require.Equal(t, http.StatusOK, rec.Code)
}
