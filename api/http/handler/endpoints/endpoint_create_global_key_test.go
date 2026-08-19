package endpoints

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/testhelpers"
)

func TestEmptyGlobalKey(t *testing.T) {
	t.Parallel()
	handler := NewHandler(testhelpers.NewTestRequestBouncer())

	req, err := http.NewRequest(http.MethodPost, "https://portainer.io:9443/endpoints/global-key", nil)
	if err != nil {
		t.Fatal("request error:", err)
	}
	req.Header.Set(portainer.PortainerAgentEdgeIDHeader, "")

	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatal("expected a 400 response, found:", rec.Code)
	}
}
