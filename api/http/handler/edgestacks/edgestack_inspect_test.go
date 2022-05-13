package edgestacks

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"
)

func setupHandler(t *testing.T) (*Handler, string, func()) {
	t.Helper()

	_, store, storeTeardown := datastore.MustNewTestStore(true, true)

	jwtService, err := jwt.NewService("1h", store)
	if err != nil {
		storeTeardown()
		t.Fatal(err)
	}

	user := &portainer.User{ID: 2, Username: "admin", Role: portainer.AdministratorRole}
	err = store.User().Create(user)
	if err != nil {
		storeTeardown()
		t.Fatal(err)
	}

	apiKeyService := apikey.NewAPIKeyService(store.APIKeyRepository(), store.User())
	rawAPIKey, _, err := apiKeyService.GenerateApiKey(*user, "test")
	if err != nil {
		storeTeardown()
		t.Fatal(err)
	}

	handler := NewHandler(
		security.NewRequestBouncer(store, jwtService, apiKeyService),
		store,
	)

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		t.Fatal(err)
	}
	settings.EnableEdgeComputeFeatures = true

	err = handler.DataStore.Settings().UpdateSettings(settings)
	if err != nil {
		t.Fatal(err)
	}

	return handler, rawAPIKey, storeTeardown
}

func createEndpoint(t *testing.T, store dataservices.DataStore) portainer.Endpoint {
	t.Helper()

	endpointID := portainer.EndpointID(rand.Int())

	endpoint := portainer.Endpoint{
		ID:              endpointID,
		Name:            "test-endpoint-" + strconv.Itoa(int(endpointID)),
		Type:            portainer.EdgeAgentOnDockerEnvironment,
		URL:             "https://portainer.io:9443",
		EdgeID:          "edge-id",
		LastCheckInDate: time.Now().Unix(),
	}

	err := store.Endpoint().Create(&endpoint)
	if err != nil {
		t.Fatal(err)
	}

	return endpoint
}

func createEdgeStack(t *testing.T, store dataservices.DataStore, endpointID portainer.EndpointID) portainer.EdgeStack {
	t.Helper()

	edgeStackID := portainer.EdgeStackID(rand.Int())
	edgeStack := portainer.EdgeStack{
		ID:   edgeStackID,
		Name: "test-edge-stack-" + strconv.Itoa(int(edgeStackID)),
		Status: map[portainer.EndpointID]portainer.EdgeStackStatus{
			endpointID: {Type: portainer.StatusOk, Error: "", EndpointID: endpointID},
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
		EndpointID: endpointID,
		EdgeStacks: map[portainer.EdgeStackID]bool{
			edgeStack.ID: true,
		},
	}

	err := store.EdgeStack().Create(edgeStack.ID, &edgeStack)
	if err != nil {
		t.Fatal(err)
	}

	err = store.EndpointRelation().Create(&endpointRelation)
	if err != nil {
		t.Fatal(err)
	}

	return edgeStack
}

func TestCreateAndInspect(t *testing.T) {
	handler, rawAPIKey, teardown := setupHandler(t)
	defer teardown()

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("/edge_stacks/%d", edgeStack.ID), nil)
	if err != nil {
		t.Fatal("request error:", err)
	}

	req.Header.Add("x-api-key", rawAPIKey)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", http.StatusOK, rec.Code))
	}

	data := portainer.EdgeStack{}
	err = json.NewDecoder(rec.Body).Decode(&data)
	if err != nil {
		t.Fatal("error decoding response:", err)
	}

	if data.ID != edgeStack.ID {
		t.Fatalf(fmt.Sprintf("expected EdgeStackID %d, found %d", int(edgeStack.ID), data.ID))
	}

	if int(data.Status[endpoint.ID].Type) != int(portainer.StatusOk) {
		t.Fatalf(fmt.Sprintf("expected EdgeStackStatusType %d, found %d", int(portainer.StatusOk), int(data.Status[endpoint.ID].Type)))
	}
}

func TestDeleteAndInspect(t *testing.T) {
	handler, rawAPIKey, teardown := setupHandler(t)
	defer teardown()

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("/edge_stacks/%d", edgeStack.ID), nil)
	if err != nil {
		t.Fatal("request error:", err)
	}

	req.Header.Add("x-api-key", rawAPIKey)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", http.StatusOK, rec.Code))
	}

	data := portainer.EdgeStack{}
	err = json.NewDecoder(rec.Body).Decode(&data)
	if err != nil {
		t.Fatal("error decoding response:", err)
	}

	if data.ID != edgeStack.ID {
		t.Fatalf(fmt.Sprintf("expected EdgeStackID %d, found %d", int(edgeStack.ID), data.ID))
	}

	handler.DataStore.EdgeStack().DeleteEdgeStack(edgeStack.ID)

	req, err = http.NewRequest(http.MethodGet, fmt.Sprintf("/edge_stacks/%d", edgeStack.ID), nil)
	if err != nil {
		t.Fatal("request error:", err)
	}

	req.Header.Add("x-api-key", rawAPIKey)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", http.StatusNotFound, rec.Code))
	}
}

func TestUpdateAndInspect(t *testing.T) {
	handler, rawAPIKey, teardown := setupHandler(t)
	defer teardown()

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("/edge_stacks/%d", edgeStack.ID), nil)
	if err != nil {
		t.Fatal("request error:", err)
	}

	req.Header.Add("x-api-key", rawAPIKey)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", http.StatusOK, rec.Code))
	}

	data := portainer.EdgeStack{}
	err = json.NewDecoder(rec.Body).Decode(&data)
	if err != nil {
		t.Fatal("error decoding response:", err)
	}

	if data.ID != edgeStack.ID {
		t.Fatalf(fmt.Sprintf("expected EdgeStackID %d, found %d", int(edgeStack.ID), data.ID))
	}

	if int(data.Status[endpoint.ID].Type) != int(portainer.StatusOk) {
		t.Fatalf(fmt.Sprintf("expected EdgeStackStatusType %d, found %d", int(portainer.StatusOk), int(data.Status[endpoint.ID].Type)))
	}

	edgeStack.Version = 239
	err = handler.DataStore.EdgeStack().UpdateEdgeStack(edgeStack.ID, &edgeStack)
	if err != nil {
		t.Fatal(err)
	}

	req, err = http.NewRequest(http.MethodGet, fmt.Sprintf("/edge_stacks/%d", edgeStack.ID), nil)
	if err != nil {
		t.Fatal("request error:", err)
	}

	req.Header.Add("x-api-key", rawAPIKey)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", http.StatusOK, rec.Code))
	}

	data = portainer.EdgeStack{}
	err = json.NewDecoder(rec.Body).Decode(&data)
	if err != nil {
		t.Fatal("error decoding response:", err)
	}

	if data.Version != int(edgeStack.Version) {
		t.Fatalf(fmt.Sprintf("expected EdgeStackID %d, found %d", edgeStack.Version, data.Version))
	}
}

func TestInvalidEdgeID(t *testing.T) {
	handler, rawAPIKey, teardown := setupHandler(t)
	defer teardown()

	req, err := http.NewRequest(http.MethodGet, "/edge_stacks/x", nil)
	if err != nil {
		t.Fatal("request error:", err)
	}

	req.Header.Add("x-api-key", rawAPIKey)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", http.StatusBadRequest, rec.Code))
	}
}
