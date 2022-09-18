package edgestacks

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strconv"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"
)

type gitService struct {
	cloneErr error
	id       string
}

func (g *gitService) CloneRepository(destination, repositoryURL, referenceName, username, password string) error {
	return g.cloneErr
}

func (g *gitService) LatestCommitID(repositoryURL, referenceName, username, password string) (string, error) {
	return g.id, nil
}

func (g *gitService) ListRefs(repositoryURL, username, password string, hardRefresh bool) ([]string, error) {
	return nil, nil
}

func (g *gitService) ListFiles(repositoryURL, referenceName, username, password string, hardRefresh bool, includedExts []string) ([]string, error) {
	return nil, nil
}

// Helpers
func setupHandler(t *testing.T) (*Handler, string, func()) {
	t.Helper()

	_, store, storeTeardown := datastore.MustNewTestStore(t, true, true)

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

	tmpDir := t.TempDir()

	fs, err := filesystem.NewService(tmpDir, "")
	if err != nil {
		storeTeardown()
		t.Fatal(err)
	}
	handler.FileService = fs

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		t.Fatal(err)
	}
	settings.EnableEdgeComputeFeatures = true

	err = handler.DataStore.Settings().UpdateSettings(settings)
	if err != nil {
		t.Fatal(err)
	}

	handler.GitService = &gitService{errors.New("Clone error"), "git-service-id"}

	return handler, rawAPIKey, storeTeardown
}

func createEndpoint(t *testing.T, store dataservices.DataStore) portainer.Endpoint {
	t.Helper()

	endpointID := portainer.EndpointID(5)
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

	edgeGroup := portainer.EdgeGroup{
		ID:           1,
		Name:         "EdgeGroup 1",
		Dynamic:      false,
		TagIDs:       nil,
		Endpoints:    []portainer.EndpointID{endpointID},
		PartialMatch: false,
	}

	err := store.EdgeGroup().Create(&edgeGroup)
	if err != nil {
		t.Fatal(err)
	}

	edgeStackID := portainer.EdgeStackID(14)
	edgeStack := portainer.EdgeStack{
		ID:   edgeStackID,
		Name: "test-edge-stack-" + strconv.Itoa(int(edgeStackID)),
		Status: map[portainer.EndpointID]portainer.EdgeStackStatus{
			endpointID: {Type: portainer.StatusOk, Error: "", EndpointID: endpointID},
		},
		CreationDate:   time.Now().Unix(),
		EdgeGroups:     []portainer.EdgeGroupID{edgeGroup.ID},
		ProjectPath:    "/project/path",
		EntryPoint:     "entrypoint",
		Version:        237,
		ManifestPath:   "/manifest/path",
		DeploymentType: portainer.EdgeStackDeploymentKubernetes,
	}

	endpointRelation := portainer.EndpointRelation{
		EndpointID: endpointID,
		EdgeStacks: map[portainer.EdgeStackID]bool{
			edgeStack.ID: true,
		},
	}

	err = store.EdgeStack().Create(edgeStack.ID, &edgeStack)
	if err != nil {
		t.Fatal(err)
	}

	err = store.EndpointRelation().Create(&endpointRelation)
	if err != nil {
		t.Fatal(err)
	}

	return edgeStack
}

// Inspect
func TestInspectInvalidEdgeID(t *testing.T) {
	handler, rawAPIKey, teardown := setupHandler(t)
	defer teardown()

	cases := []struct {
		Name               string
		EdgeStackID        string
		ExpectedStatusCode int
	}{
		{"Invalid EdgeStackID", "x", 400},
		{"Non-existing EdgeStackID", "5", 404},
	}

	for _, tc := range cases {
		t.Run(tc.Name, func(t *testing.T) {
			req, err := http.NewRequest(http.MethodGet, "/edge_stacks/"+tc.EdgeStackID, nil)
			if err != nil {
				t.Fatal("request error:", err)
			}

			req.Header.Add("x-api-key", rawAPIKey)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != tc.ExpectedStatusCode {
				t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", tc.ExpectedStatusCode, rec.Code))
			}
		})
	}
}

// Create
func TestCreateAndInspect(t *testing.T) {
	handler, rawAPIKey, teardown := setupHandler(t)
	defer teardown()

	// Create Endpoint, EdgeGroup and EndpointRelation
	endpoint := createEndpoint(t, handler.DataStore)
	edgeGroup := portainer.EdgeGroup{
		ID:           1,
		Name:         "EdgeGroup 1",
		Dynamic:      false,
		TagIDs:       nil,
		Endpoints:    []portainer.EndpointID{endpoint.ID},
		PartialMatch: false,
	}

	err := handler.DataStore.EdgeGroup().Create(&edgeGroup)
	if err != nil {
		t.Fatal(err)
	}

	endpointRelation := portainer.EndpointRelation{
		EndpointID: endpoint.ID,
		EdgeStacks: map[portainer.EdgeStackID]bool{},
	}

	err = handler.DataStore.EndpointRelation().Create(&endpointRelation)
	if err != nil {
		t.Fatal(err)
	}

	payload := swarmStackFromFileContentPayload{
		Name:             "Test Stack",
		StackFileContent: "stack content",
		EdgeGroups:       []portainer.EdgeGroupID{1},
		DeploymentType:   portainer.EdgeStackDeploymentCompose,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		t.Fatal("JSON marshal error:", err)
	}
	r := bytes.NewBuffer(jsonPayload)

	// Create EdgeStack
	req, err := http.NewRequest(http.MethodPost, "/edge_stacks?method=string", r)
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

	// Inspect
	req, err = http.NewRequest(http.MethodGet, fmt.Sprintf("/edge_stacks/%d", data.ID), nil)
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

	if payload.Name != data.Name {
		t.Fatalf(fmt.Sprintf("expected EdgeStack Name %s, found %s", payload.Name, data.Name))
	}
}

func TestCreateWithInvalidPayload(t *testing.T) {
	handler, rawAPIKey, teardown := setupHandler(t)
	defer teardown()

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	cases := []struct {
		Name               string
		Payload            interface{}
		QueryString        string
		ExpectedStatusCode int
	}{
		{
			Name:               "Invalid query string parameter",
			Payload:            swarmStackFromFileContentPayload{},
			QueryString:        "invalid=query-string",
			ExpectedStatusCode: 400,
		},
		{
			Name:               "Invalid creation method",
			Payload:            swarmStackFromFileContentPayload{},
			QueryString:        "method=invalid-creation-method",
			ExpectedStatusCode: 500,
		},
		{
			Name:               "Empty swarmStackFromFileContentPayload with string method",
			Payload:            swarmStackFromFileContentPayload{},
			QueryString:        "method=string",
			ExpectedStatusCode: 500,
		},
		{
			Name:               "Empty swarmStackFromFileContentPayload with repository method",
			Payload:            swarmStackFromFileContentPayload{},
			QueryString:        "method=repository",
			ExpectedStatusCode: 500,
		},
		{
			Name:               "Empty swarmStackFromFileContentPayload with file method",
			Payload:            swarmStackFromFileContentPayload{},
			QueryString:        "method=file",
			ExpectedStatusCode: 500,
		},
		{
			Name: "Duplicated EdgeStack Name",
			Payload: swarmStackFromFileContentPayload{
				Name:             edgeStack.Name,
				StackFileContent: "content",
				EdgeGroups:       edgeStack.EdgeGroups,
				DeploymentType:   edgeStack.DeploymentType,
			},
			QueryString:        "method=string",
			ExpectedStatusCode: 500,
		},
		{
			Name: "Empty EdgeStack Groups",
			Payload: swarmStackFromFileContentPayload{
				Name:             edgeStack.Name,
				StackFileContent: "content",
				EdgeGroups:       []portainer.EdgeGroupID{},
				DeploymentType:   edgeStack.DeploymentType,
			},
			QueryString:        "method=string",
			ExpectedStatusCode: 500,
		},
		{
			Name: "EdgeStackDeploymentKubernetes with Docker endpoint",
			Payload: swarmStackFromFileContentPayload{
				Name:             "Stack name",
				StackFileContent: "content",
				EdgeGroups:       []portainer.EdgeGroupID{1},
				DeploymentType:   portainer.EdgeStackDeploymentKubernetes,
			},
			QueryString:        "method=string",
			ExpectedStatusCode: 500,
		},
		{
			Name: "Empty Stack File Content",
			Payload: swarmStackFromFileContentPayload{
				Name:             "Stack name",
				StackFileContent: "",
				EdgeGroups:       []portainer.EdgeGroupID{1},
				DeploymentType:   portainer.EdgeStackDeploymentCompose,
			},
			QueryString:        "method=string",
			ExpectedStatusCode: 500,
		},
		{
			Name: "Clone Git respository error",
			Payload: swarmStackFromGitRepositoryPayload{
				Name:                     "Stack name",
				RepositoryURL:            "github.com/portainer/portainer",
				RepositoryReferenceName:  "ref name",
				RepositoryAuthentication: false,
				RepositoryUsername:       "",
				RepositoryPassword:       "",
				FilePathInRepository:     "/file/path",
				EdgeGroups:               []portainer.EdgeGroupID{1},
				DeploymentType:           portainer.EdgeStackDeploymentCompose,
			},
			QueryString:        "method=repository",
			ExpectedStatusCode: 500,
		},
	}

	for _, tc := range cases {
		t.Run(tc.Name, func(t *testing.T) {
			jsonPayload, err := json.Marshal(tc.Payload)
			if err != nil {
				t.Fatal("JSON marshal error:", err)
			}
			r := bytes.NewBuffer(jsonPayload)

			// Create EdgeStack
			req, err := http.NewRequest(http.MethodPost, fmt.Sprintf("/edge_stacks?%s", tc.QueryString), r)
			if err != nil {
				t.Fatal("request error:", err)
			}

			req.Header.Add("x-api-key", rawAPIKey)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != tc.ExpectedStatusCode {
				t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", tc.ExpectedStatusCode, rec.Code))
			}
		})
	}
}

// Delete
func TestDeleteAndInspect(t *testing.T) {
	handler, rawAPIKey, teardown := setupHandler(t)
	defer teardown()

	// Create
	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	// Inspect
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

	// Delete
	req, err = http.NewRequest(http.MethodDelete, fmt.Sprintf("/edge_stacks/%d", edgeStack.ID), nil)
	if err != nil {
		t.Fatal("request error:", err)
	}

	req.Header.Add("x-api-key", rawAPIKey)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", http.StatusNoContent, rec.Code))
	}

	// Inspect
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

func TestDeleteInvalidEdgeStack(t *testing.T) {
	handler, rawAPIKey, teardown := setupHandler(t)
	defer teardown()

	cases := []struct {
		Name               string
		URL                string
		ExpectedStatusCode int
	}{
		{Name: "Non-existing EdgeStackID", URL: "/edge_stacks/-1", ExpectedStatusCode: http.StatusNotFound},
		{Name: "Invalid EdgeStackID", URL: "/edge_stacks/aaaaaaa", ExpectedStatusCode: http.StatusBadRequest},
	}

	for _, tc := range cases {
		t.Run(tc.Name, func(t *testing.T) {
			req, err := http.NewRequest(http.MethodDelete, tc.URL, nil)
			if err != nil {
				t.Fatal("request error:", err)
			}

			req.Header.Add("x-api-key", rawAPIKey)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != tc.ExpectedStatusCode {
				t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", tc.ExpectedStatusCode, rec.Code))
			}
		})
	}
}

// Update
func TestUpdateAndInspect(t *testing.T) {
	handler, rawAPIKey, teardown := setupHandler(t)
	defer teardown()

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	// Update edge stack: create new Endpoint, EndpointRelation and EdgeGroup
	endpointID := portainer.EndpointID(6)
	newEndpoint := portainer.Endpoint{
		ID:              endpointID,
		Name:            "test-endpoint-" + strconv.Itoa(int(endpointID)),
		Type:            portainer.EdgeAgentOnDockerEnvironment,
		URL:             "https://portainer.io:9443",
		EdgeID:          "edge-id",
		LastCheckInDate: time.Now().Unix(),
	}

	err := handler.DataStore.Endpoint().Create(&newEndpoint)
	if err != nil {
		t.Fatal(err)
	}

	endpointRelation := portainer.EndpointRelation{
		EndpointID: endpointID,
		EdgeStacks: map[portainer.EdgeStackID]bool{
			edgeStack.ID: true,
		},
	}

	err = handler.DataStore.EndpointRelation().Create(&endpointRelation)
	if err != nil {
		t.Fatal(err)
	}

	newEdgeGroup := portainer.EdgeGroup{
		ID:           2,
		Name:         "EdgeGroup 2",
		Dynamic:      false,
		TagIDs:       nil,
		Endpoints:    []portainer.EndpointID{newEndpoint.ID},
		PartialMatch: false,
	}

	err = handler.DataStore.EdgeGroup().Create(&newEdgeGroup)
	if err != nil {
		t.Fatal(err)
	}

	newVersion := 238
	payload := updateEdgeStackPayload{
		StackFileContent: "update-test",
		Version:          &newVersion,
		EdgeGroups:       append(edgeStack.EdgeGroups, newEdgeGroup.ID),
		DeploymentType:   portainer.EdgeStackDeploymentCompose,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		t.Fatal("request error:", err)
	}

	r := bytes.NewBuffer(jsonPayload)
	req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("/edge_stacks/%d", edgeStack.ID), r)
	if err != nil {
		t.Fatal("request error:", err)
	}

	req.Header.Add("x-api-key", rawAPIKey)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", http.StatusOK, rec.Code))
	}

	// Get updated edge stack
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

	data := portainer.EdgeStack{}
	err = json.NewDecoder(rec.Body).Decode(&data)
	if err != nil {
		t.Fatal("error decoding response:", err)
	}

	if data.Version != *payload.Version {
		t.Fatalf(fmt.Sprintf("expected EdgeStackID %d, found %d", edgeStack.Version, data.Version))
	}

	if data.DeploymentType != payload.DeploymentType {
		t.Fatalf(fmt.Sprintf("expected DeploymentType %d, found %d", edgeStack.DeploymentType, data.DeploymentType))
	}

	if !reflect.DeepEqual(data.EdgeGroups, payload.EdgeGroups) {
		t.Fatalf("expected EdgeGroups to be equal")
	}
}

func TestUpdateWithInvalidEdgeGroups(t *testing.T) {
	handler, rawAPIKey, teardown := setupHandler(t)
	defer teardown()

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	//newEndpoint := createEndpoint(t, handler.DataStore)
	newEdgeGroup := portainer.EdgeGroup{
		ID:           2,
		Name:         "EdgeGroup 2",
		Dynamic:      false,
		TagIDs:       nil,
		Endpoints:    []portainer.EndpointID{8889},
		PartialMatch: false,
	}

	handler.DataStore.EdgeGroup().Create(&newEdgeGroup)

	newVersion := 238
	cases := []struct {
		Name               string
		Payload            updateEdgeStackPayload
		ExpectedStatusCode int
	}{
		{
			"Update with non-existing EdgeGroupID",
			updateEdgeStackPayload{
				StackFileContent: "error-test",
				Version:          &newVersion,
				EdgeGroups:       []portainer.EdgeGroupID{9999},
				DeploymentType:   edgeStack.DeploymentType,
			},
			http.StatusInternalServerError,
		},
		{
			"Update with invalid EdgeGroup (non-existing Endpoint)",
			updateEdgeStackPayload{
				StackFileContent: "error-test",
				Version:          &newVersion,
				EdgeGroups:       []portainer.EdgeGroupID{2},
				DeploymentType:   edgeStack.DeploymentType,
			},
			http.StatusInternalServerError,
		},
		{
			"Update DeploymentType from Docker to Kubernetes",
			updateEdgeStackPayload{
				StackFileContent: "error-test",
				Version:          &newVersion,
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
				t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", tc.ExpectedStatusCode, rec.Code))
			}
		})
	}
}

func TestUpdateWithInvalidPayload(t *testing.T) {
	handler, rawAPIKey, teardown := setupHandler(t)
	defer teardown()

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	newVersion := 238
	cases := []struct {
		Name               string
		Payload            updateEdgeStackPayload
		ExpectedStatusCode int
	}{
		{
			"Update with empty StackFileContent",
			updateEdgeStackPayload{
				StackFileContent: "",
				Version:          &newVersion,
				EdgeGroups:       edgeStack.EdgeGroups,
				DeploymentType:   edgeStack.DeploymentType,
			},
			http.StatusBadRequest,
		},
		{
			"Update with empty EdgeGroups",
			updateEdgeStackPayload{
				StackFileContent: "error-test",
				Version:          &newVersion,
				EdgeGroups:       []portainer.EdgeGroupID{},
				DeploymentType:   edgeStack.DeploymentType,
			},
			http.StatusBadRequest,
		},
	}

	for _, tc := range cases {
		t.Run(tc.Name, func(t *testing.T) {
			jsonPayload, err := json.Marshal(tc.Payload)
			if err != nil {
				t.Fatal("request error:", err)
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
				t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", tc.ExpectedStatusCode, rec.Code))
			}
		})
	}
}

// Update Status
func TestUpdateStatusAndInspect(t *testing.T) {
	handler, rawAPIKey, teardown := setupHandler(t)
	defer teardown()

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	// Update edge stack status
	newStatus := portainer.StatusError
	payload := updateStatusPayload{
		Error:      "test-error",
		Status:     &newStatus,
		EndpointID: &endpoint.ID,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		t.Fatal("request error:", err)
	}

	r := bytes.NewBuffer(jsonPayload)
	req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("/edge_stacks/%d/status", edgeStack.ID), r)
	if err != nil {
		t.Fatal("request error:", err)
	}

	req.Header.Set(portainer.PortainerAgentEdgeIDHeader, endpoint.EdgeID)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", http.StatusOK, rec.Code))
	}

	// Get updated edge stack
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

	data := portainer.EdgeStack{}
	err = json.NewDecoder(rec.Body).Decode(&data)
	if err != nil {
		t.Fatal("error decoding response:", err)
	}

	if data.Status[endpoint.ID].Type != *payload.Status {
		t.Fatalf(fmt.Sprintf("expected EdgeStackStatusType %d, found %d", payload.Status, data.Status[endpoint.ID].Type))
	}

	if data.Status[endpoint.ID].Error != payload.Error {
		t.Fatalf(fmt.Sprintf("expected EdgeStackStatusError %s, found %s", payload.Error, data.Status[endpoint.ID].Error))
	}

	if data.Status[endpoint.ID].EndpointID != *payload.EndpointID {
		t.Fatalf(fmt.Sprintf("expected EndpointID %d, found %d", payload.EndpointID, data.Status[endpoint.ID].EndpointID))
	}
}
func TestUpdateStatusWithInvalidPayload(t *testing.T) {
	handler, _, teardown := setupHandler(t)
	defer teardown()

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	// Update edge stack status
	statusError := portainer.StatusError
	statusOk := portainer.StatusOk
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
				EndpointID: &endpoint.ID,
			},
			"Invalid status",
			400,
		},
		{
			"Update with error status and empty error message",
			updateStatusPayload{
				Error:      "",
				Status:     &statusError,
				EndpointID: &endpoint.ID,
			},
			"Error message is mandatory when status is error",
			400,
		},
		{
			"Update with nil EndpointID",
			updateStatusPayload{
				Error:      "",
				Status:     &statusOk,
				EndpointID: nil,
			},
			"Invalid EnvironmentID",
			400,
		},
	}

	for _, tc := range cases {
		t.Run(tc.Name, func(t *testing.T) {
			jsonPayload, err := json.Marshal(tc.Payload)
			if err != nil {
				t.Fatal("request error:", err)
			}

			r := bytes.NewBuffer(jsonPayload)
			req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("/edge_stacks/%d/status", edgeStack.ID), r)
			if err != nil {
				t.Fatal("request error:", err)
			}

			req.Header.Set(portainer.PortainerAgentEdgeIDHeader, endpoint.EdgeID)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != tc.ExpectedStatusCode {
				t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", tc.ExpectedStatusCode, rec.Code))
			}
		})
	}
}

// Delete Status
func TestDeleteStatus(t *testing.T) {
	handler, _, teardown := setupHandler(t)
	defer teardown()

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
		t.Fatalf(fmt.Sprintf("expected a %d response, found: %d", http.StatusOK, rec.Code))
	}
}
