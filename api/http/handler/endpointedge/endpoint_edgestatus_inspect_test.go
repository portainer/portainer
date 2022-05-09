package endpointedge

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/chisel"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"

	"github.com/stretchr/testify/assert"
)

type endpointTestCase struct {
	endpoint           portainer.Endpoint
	expectedStatusCode int
}

var endpointTestCases = []endpointTestCase{
	{portainer.Endpoint{
		ID:     -1,
		Name:   "endpoint-id--1",
		Type:   portainer.EdgeAgentOnDockerEnvironment,
		URL:    "https://portainer.io:9443",
		EdgeID: "edge-id",
	}, 404},
	{portainer.Endpoint{
		ID:     2,
		Name:   "endpoint-id-2",
		Type:   portainer.EdgeAgentOnDockerEnvironment,
		URL:    "https://portainer.io:9443",
		EdgeID: "",
	}, 400},
	{portainer.Endpoint{
		ID:     4,
		Name:   "endpoint-id-4",
		Type:   portainer.EdgeAgentOnDockerEnvironment,
		URL:    "https://portainer.io:9443",
		EdgeID: "edge-id",
	}, 200},
}

func setupHandler() (*Handler, func(), error) {
	_, store, storeTeardown := datastore.MustNewTestStore(true, true)

	ctx := context.Background()
	shutdownCtx, cancelFn := context.WithCancel(ctx)

	teardown := func() {
		cancelFn()
		storeTeardown()
	}

	tmpDir, err := os.MkdirTemp(os.TempDir(), "portainer-test")
	if err != nil {
		teardown()
		return nil, nil, fmt.Errorf("could not create a tmp dir: %w", err)
	}

	fs, err := filesystem.NewService(tmpDir, "")
	if err != nil {
		teardown()
		return nil, nil, fmt.Errorf("could not start a new filesystem service: %w", err)
	}

	jwtService, err := jwt.NewService("1h", store)
	if err != nil {
		teardown()
		return nil, nil, fmt.Errorf("could not start a new jwt service: %w", err)
	}

	apiKeyService := apikey.NewAPIKeyService(nil, nil)

	settings, err := store.Settings().Settings()
	if err != nil {
		teardown()
		return nil, nil, fmt.Errorf("could not create new settings: %w", err)
	}
	settings.TrustOnFirstConnect = true

	err = store.Settings().UpdateSettings(settings)
	if err != nil {
		teardown()
		return nil, nil, fmt.Errorf("could not update settings: %w", err)
	}

	handler := NewHandler(
		security.NewRequestBouncer(store, jwtService, apiKeyService),
		store,
		fs,
		chisel.NewService(store, shutdownCtx),
	)

	handler.ReverseTunnelService = chisel.NewService(store, shutdownCtx)

	return handler, teardown, nil
}

func setEndpoint(handler *Handler, endpoint portainer.Endpoint) (err error) {
	// Avoid setting ID below 0 to generate invalid cases
	if endpoint.ID <= 0 {
		return nil
	}

	err = handler.DataStore.Endpoint().Create(&endpoint)
	if err != nil {
		return err
	}

	endpointRelation := portainer.EndpointRelation{
		EndpointID: endpoint.ID,
	}
	err = handler.DataStore.EndpointRelation().Create(&endpointRelation)
	if err != nil {
		return err
	}

	return nil
}

func TestEmptyEndpoint(t *testing.T) {
	handler, teardown, err := setupHandler()
	defer teardown()

	if err != nil {
		t.Fatal(err)
	}
	req, err := http.NewRequest(http.MethodGet, "/endpoints/ /edge/status", nil)
	if err != nil {
		t.Fatal("request error:", err)
	}

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf(fmt.Sprintf("expected a %d response, found: %d with empty endpoint ID", http.StatusNotFound, rec.Code))
	}
}

func TestWithEndpoints(t *testing.T) {
	handler, teardown, err := setupHandler()
	defer teardown()

	if err != nil {
		t.Fatal(err)
	}

	for _, test := range endpointTestCases {
		err = setEndpoint(handler, test.endpoint)
		if err != nil {
			t.Fatal(err)
		}

		req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("/%d/edge/status", test.endpoint.ID), nil)
		if err != nil {
			t.Fatal("request error:", err)
		}
		req.Header.Set(portainer.PortainerAgentEdgeIDHeader, "edge-id")

		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != test.expectedStatusCode {
			t.Fatalf(fmt.Sprintf("expected a %d response, found: %d for endpoint ID: %d", test.expectedStatusCode, rec.Code, test.endpoint.ID))
		}
	}
}

func TestLastCheckInDateIncreases(t *testing.T) {
	handler, teardown, err := setupHandler()
	defer teardown()

	if err != nil {
		t.Fatal(err)
	}

	endpoint := portainer.Endpoint{
		ID:              4,
		Name:            "test-endpoint",
		Type:            portainer.EdgeAgentOnDockerEnvironment,
		URL:             "https://portainer.io:9443",
		EdgeID:          "edge-id",
		LastCheckInDate: time.Now().Unix(),
	}

	err = setEndpoint(handler, endpoint)
	if err != nil {
		t.Fatal(err)
	}

	time.Sleep(1 * time.Second)

	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("/%d/edge/status", endpoint.ID), nil)
	if err != nil {
		t.Fatal("request error:", err)
	}
	req.Header.Set(portainer.PortainerAgentEdgeIDHeader, "edge-id")

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf(fmt.Sprintf("expected a %d response, found: %d with empty endpoint ID", http.StatusOK, rec.Code))
	}

	updatedEndpoint, err := handler.DataStore.Endpoint().Endpoint(endpoint.ID)
	if err != nil {
		t.Fatal(err)
	}

	assert.Greater(t, updatedEndpoint.LastCheckInDate, endpoint.LastCheckInDate)
}

func TestEmptyEdgeIdWithAgentPlatformHeader(t *testing.T) {
	handler, teardown, err := setupHandler()
	defer teardown()

	if err != nil {
		t.Fatal(err)
	}

	edgeId := "edge-id"
	endpoint := portainer.Endpoint{
		ID:     4,
		Name:   "test-endpoint",
		Type:   portainer.EdgeAgentOnDockerEnvironment,
		URL:    "https://portainer.io:9443",
		EdgeID: "",
	}

	err = setEndpoint(handler, endpoint)
	if err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("/%d/edge/status", endpoint.ID), nil)
	if err != nil {
		t.Fatal("request error:", err)
	}
	req.Header.Set(portainer.PortainerAgentEdgeIDHeader, edgeId)
	req.Header.Set(portainer.HTTPResponseAgentPlatform, "1")

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf(fmt.Sprintf("expected a %d response, found: %d with empty edge ID", http.StatusOK, rec.Code))
	}

	updatedEndpoint, err := handler.DataStore.Endpoint().Endpoint(endpoint.ID)
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, updatedEndpoint.EdgeID, edgeId)
}
