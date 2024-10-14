package endpointedge

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/chisel"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type endpointTestCase struct {
	endpoint           portainer.Endpoint
	endpointRelation   portainer.EndpointRelation
	expectedStatusCode int
}

var endpointTestCases = []endpointTestCase{
	{
		portainer.Endpoint{},
		portainer.EndpointRelation{},
		http.StatusForbidden,
	},
	{
		portainer.Endpoint{
			ID:     -1,
			Name:   "endpoint-id-1",
			Type:   portainer.EdgeAgentOnDockerEnvironment,
			URL:    "https://portainer.io:9443",
			EdgeID: "edge-id",
		},
		portainer.EndpointRelation{
			EndpointID: -1,
		},
		http.StatusForbidden,
	},
	{
		portainer.Endpoint{
			ID:     2,
			Name:   "endpoint-id-2",
			Type:   portainer.EdgeAgentOnDockerEnvironment,
			URL:    "https://portainer.io:9443",
			EdgeID: "",
		},
		portainer.EndpointRelation{
			EndpointID: 2,
		},
		http.StatusForbidden,
	},
	{
		portainer.Endpoint{
			ID:     4,
			Name:   "endpoint-id-4",
			Type:   portainer.EdgeAgentOnDockerEnvironment,
			URL:    "https://portainer.io:9443",
			EdgeID: "edge-id",
		},
		portainer.EndpointRelation{
			EndpointID: 4,
		},
		http.StatusOK,
	},
}

func mustSetupHandler(t *testing.T) *Handler {
	tmpDir := t.TempDir()
	fs, err := filesystem.NewService(tmpDir, "")
	if err != nil {
		t.Fatalf("could not start a new filesystem service: %s", err)
	}

	_, store := datastore.MustNewTestStore(t, true, true)

	ctx := context.Background()
	shutdownCtx, cancelFn := context.WithCancel(ctx)
	t.Cleanup(cancelFn)

	jwtService, err := jwt.NewService("1h", store)
	if err != nil {
		t.Fatalf("could not start a new JWT service: %s", err)
	}

	apiKeyService := apikey.NewAPIKeyService(nil, nil)

	settings, err := store.Settings().Settings()
	if err != nil {
		t.Fatalf("could not create new settings: %s", err)
	}
	settings.TrustOnFirstConnect = true

	if err = store.Settings().UpdateSettings(settings); err != nil {
		t.Fatalf("could not update settings: %s", err)
	}

	handler := NewHandler(
		security.NewRequestBouncer(store, jwtService, apiKeyService),
		store,
		fs,
		chisel.NewService(store, shutdownCtx, nil),
	)

	handler.ReverseTunnelService = chisel.NewService(store, shutdownCtx, nil)

	return handler
}

func createEndpoint(handler *Handler, endpoint portainer.Endpoint, endpointRelation portainer.EndpointRelation) (err error) {
	// Avoid setting ID below 0 to generate invalid test cases
	if endpoint.ID <= 0 {
		return nil
	}

	if err := handler.DataStore.Endpoint().Create(&endpoint); err != nil {
		return err
	}

	return handler.DataStore.EndpointRelation().Create(&endpointRelation)
}

func TestMissingEdgeIdentifier(t *testing.T) {
	handler := mustSetupHandler(t)
	endpointID := portainer.EndpointID(45)

	if err := createEndpoint(handler, portainer.Endpoint{
		ID:     endpointID,
		Name:   "endpoint-id-45",
		Type:   portainer.EdgeAgentOnDockerEnvironment,
		URL:    "https://portainer.io:9443",
		EdgeID: "edge-id",
	}, portainer.EndpointRelation{EndpointID: endpointID}); err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/endpoints/%d/edge/status", endpointID), nil)
	if err != nil {
		t.Fatal("request error:", err)
	}

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected a %d response, found: %d without Edge identifier", http.StatusForbidden, rec.Code)
	}
}

func TestWithEndpoints(t *testing.T) {
	handler := mustSetupHandler(t)

	for _, test := range endpointTestCases {
		err := createEndpoint(handler, test.endpoint, test.endpointRelation)
		if err != nil {
			t.Fatal(err)
		}

		req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/endpoints/%d/edge/status", test.endpoint.ID), nil)
		if err != nil {
			t.Fatal("request error:", err)
		}

		req.Header.Set(portainer.PortainerAgentEdgeIDHeader, test.endpoint.EdgeID)
		req.Header.Set(portainer.HTTPResponseAgentPlatform, "1")

		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != test.expectedStatusCode {
			t.Fatalf("expected a %d response, found: %d for endpoint ID: %d", test.expectedStatusCode, rec.Code, test.endpoint.ID)
		}
	}
}

func TestLastCheckInDateIncreases(t *testing.T) {
	handler := mustSetupHandler(t)

	endpointID := portainer.EndpointID(56)
	endpoint := portainer.Endpoint{
		ID:              endpointID,
		Name:            "test-endpoint-56",
		Type:            portainer.EdgeAgentOnDockerEnvironment,
		URL:             "https://portainer.io:9443",
		EdgeID:          "edge-id",
		LastCheckInDate: time.Now().Unix(),
	}

	endpointRelation := portainer.EndpointRelation{
		EndpointID: endpoint.ID,
	}

	if err := createEndpoint(handler, endpoint, endpointRelation); err != nil {
		t.Fatal(err)
	}

	time.Sleep(1 * time.Second)

	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/endpoints/%d/edge/status", endpoint.ID), nil)
	if err != nil {
		t.Fatal("request error:", err)
	}

	req.Header.Set(portainer.PortainerAgentEdgeIDHeader, "edge-id")
	req.Header.Set(portainer.HTTPResponseAgentPlatform, "1")

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected a %d response, found: %d", http.StatusOK, rec.Code)
	}

	updatedEndpoint, err := handler.DataStore.Endpoint().Endpoint(endpoint.ID)
	if err != nil {
		t.Fatal(err)
	}

	assert.Greater(t, updatedEndpoint.LastCheckInDate, endpoint.LastCheckInDate)
}

func TestEmptyEdgeIdWithAgentPlatformHeader(t *testing.T) {
	handler := mustSetupHandler(t)

	endpointID := portainer.EndpointID(44)
	edgeId := "edge-id"
	endpoint := portainer.Endpoint{
		ID:     endpointID,
		Name:   "test-endpoint-44",
		Type:   portainer.EdgeAgentOnDockerEnvironment,
		URL:    "https://portainer.io:9443",
		EdgeID: "",
	}
	endpointRelation := portainer.EndpointRelation{
		EndpointID: endpoint.ID,
	}

	if err := createEndpoint(handler, endpoint, endpointRelation); err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/endpoints/%d/edge/status", endpoint.ID), nil)
	if err != nil {
		t.Fatal("request error:", err)
	}

	req.Header.Set(portainer.PortainerAgentEdgeIDHeader, edgeId)
	req.Header.Set(portainer.HTTPResponseAgentPlatform, "1")

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected a %d response, found: %d with empty edge ID", http.StatusOK, rec.Code)
	}

	updatedEndpoint, err := handler.DataStore.Endpoint().Endpoint(endpoint.ID)
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, updatedEndpoint.EdgeID, edgeId)
}

func TestEdgeStackStatus(t *testing.T) {
	handler := mustSetupHandler(t)

	endpointID := portainer.EndpointID(7)
	endpoint := portainer.Endpoint{
		ID:              endpointID,
		Name:            "test-endpoint-7",
		Type:            portainer.EdgeAgentOnDockerEnvironment,
		URL:             "https://portainer.io:9443",
		EdgeID:          "edge-id",
		LastCheckInDate: time.Now().Unix(),
	}

	edgeStackID := portainer.EdgeStackID(17)
	edgeStack := portainer.EdgeStack{
		ID:   edgeStackID,
		Name: "test-edge-stack-17",
		Status: map[portainer.EndpointID]portainer.EdgeStackStatus{
			endpointID: {},
		},
		CreationDate:   time.Now().Unix(),
		EdgeGroups:     []portainer.EdgeGroupID{1, 2},
		ProjectPath:    "/project/path",
		EntryPoint:     "entrypoint",
		Version:        237,
		ManifestPath:   "/manifest/path",
		DeploymentType: 1,
	}

	endpointRelation := portainer.EndpointRelation{
		EndpointID: endpoint.ID,
		EdgeStacks: map[portainer.EdgeStackID]bool{
			edgeStack.ID: true,
		},
	}

	err := handler.DataStore.EdgeStack().Create(edgeStack.ID, &edgeStack)
	require.NoError(t, err)

	if err := createEndpoint(handler, endpoint, endpointRelation); err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/endpoints/%d/edge/status", endpoint.ID), nil)
	if err != nil {
		t.Fatal("request error:", err)
	}

	req.Header.Set(portainer.PortainerAgentEdgeIDHeader, "edge-id")
	req.Header.Set(portainer.HTTPResponseAgentPlatform, "1")

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected a %d response, found: %d", http.StatusOK, rec.Code)
	}

	var data endpointEdgeStatusInspectResponse
	if err := json.NewDecoder(rec.Body).Decode(&data); err != nil {
		t.Fatal("error decoding response:", err)
	}

	assert.Len(t, data.Stacks, 1)
	assert.Equal(t, edgeStack.ID, data.Stacks[0].ID)
	assert.Equal(t, edgeStack.Version, data.Stacks[0].Version)
}

func TestEdgeJobsResponse(t *testing.T) {
	handler := mustSetupHandler(t)

	localCreateEndpoint := func(endpointID portainer.EndpointID, tagIDs []portainer.TagID) *portainer.Endpoint {
		endpoint := portainer.Endpoint{
			ID:              endpointID,
			Name:            "test-endpoint-" + strconv.Itoa(int(endpointID)),
			Type:            portainer.EdgeAgentOnDockerEnvironment,
			URL:             "https://portainer.io:9443",
			EdgeID:          "edge-id-" + strconv.Itoa(int(endpointID)),
			TagIDs:          tagIDs,
			LastCheckInDate: time.Now().Unix(),
			UserTrusted:     true,
		}
		err := createEndpoint(handler, endpoint,
			portainer.EndpointRelation{EndpointID: endpointID})
		require.NoError(t, err)

		return &endpoint
	}

	dynamicGroupTags := []portainer.TagID{1, 2, 3}

	endpoint := localCreateEndpoint(77, nil)
	endpointFromStaticEdgeGroup := localCreateEndpoint(78, nil)
	endpointFromDynamicEdgeGroup := localCreateEndpoint(79, dynamicGroupTags)
	unrelatedEndpoint := localCreateEndpoint(80, nil)

	staticEdgeGroup := portainer.EdgeGroup{
		ID:        1,
		Endpoints: []portainer.EndpointID{endpointFromStaticEdgeGroup.ID},
	}
	err := handler.DataStore.EdgeGroup().Create(&staticEdgeGroup)
	require.NoError(t, err)

	dynamicEdgeGroup := portainer.EdgeGroup{
		ID:      2,
		Dynamic: true,
		TagIDs:  dynamicGroupTags,
	}
	err = handler.DataStore.EdgeGroup().Create(&dynamicEdgeGroup)
	require.NoError(t, err)

	path, err := handler.FileService.StoreEdgeJobFileFromBytes("test-script", []byte("pwd"))
	require.NoError(t, err)

	edgeJobID := portainer.EdgeJobID(35)
	edgeJob := portainer.EdgeJob{
		ID:             edgeJobID,
		Created:        time.Now().Unix(),
		CronExpression: "* * * * *",
		Name:           "test-edge-job",
		ScriptPath:     path,
		Recurring:      true,
		Version:        57,
		Endpoints: map[portainer.EndpointID]portainer.EdgeJobEndpointMeta{
			endpoint.ID: {},
		},
		EdgeGroups: []portainer.EdgeGroupID{staticEdgeGroup.ID, dynamicEdgeGroup.ID},
	}

	err = handler.DataStore.EdgeJob().Create(&edgeJob)
	require.NoError(t, err)

	f := func(endpoint *portainer.Endpoint, scheduleLen int) {
		req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/endpoints/%d/edge/status", endpoint.ID), nil)
		require.NoError(t, err)

		req.Header.Set(portainer.PortainerAgentEdgeIDHeader, endpoint.EdgeID)
		req.Header.Set(portainer.HTTPResponseAgentPlatform, "1")

		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		require.Equal(t, http.StatusOK, rec.Code)

		var data endpointEdgeStatusInspectResponse
		err = json.NewDecoder(rec.Body).Decode(&data)
		require.NoError(t, err)

		require.Len(t, data.Schedules, scheduleLen)

		if scheduleLen > 0 {
			require.Equal(t, edgeJob.ID, data.Schedules[0].ID)
			require.Equal(t, edgeJob.CronExpression, data.Schedules[0].CronExpression)
			require.Equal(t, edgeJob.Version, data.Schedules[0].Version)
		}
	}

	f(endpoint, 1)
	f(endpointFromStaticEdgeGroup, 1)
	f(endpointFromDynamicEdgeGroup, 1)
	f(unrelatedEndpoint, 0)
}
