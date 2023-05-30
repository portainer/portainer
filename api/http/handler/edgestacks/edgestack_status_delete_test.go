package edgestacks

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
)

func TestDeleteStatus(t *testing.T) {
	handler, _ := setupHandler(t)

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	req, err := http.NewRequest(http.MethodDelete, fmt.Sprintf("/edge_stacks/%d/status/%d", edgeStack.ID, endpoint.ID), nil)
	if err != nil {
		t.Fatal("request error:", err)
	}

	req.Header.Set(portainer.PortainerAgentEdgeIDHeader, endpoint.EdgeID)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected a %d response, found: %d", http.StatusOK, rec.Code)
	}
}
