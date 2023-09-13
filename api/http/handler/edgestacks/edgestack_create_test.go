package edgestacks

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
)

// Create
func TestCreateAndInspect(t *testing.T) {
	handler, rawAPIKey := setupHandler(t)

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

	payload := edgeStackFromStringPayload{
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
	req, err := http.NewRequest(http.MethodPost, "/edge_stacks/create/string", r)
	if err != nil {
		t.Fatal("request error:", err)
	}
	req.Header.Add("x-api-key", rawAPIKey)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected a %d response, found: %d", http.StatusOK, rec.Code)
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
		t.Fatalf("expected a %d response, found: %d", http.StatusOK, rec.Code)
	}

	data = portainer.EdgeStack{}
	err = json.NewDecoder(rec.Body).Decode(&data)
	if err != nil {
		t.Fatal("error decoding response:", err)
	}

	if payload.Name != data.Name {
		t.Fatalf("expected EdgeStack Name %s, found %s", payload.Name, data.Name)
	}
}

func TestCreateWithInvalidPayload(t *testing.T) {
	handler, rawAPIKey := setupHandler(t)

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	cases := []struct {
		Name               string
		Payload            interface{}
		ExpectedStatusCode int
		Method             string
	}{
		{
			Name:               "Invalid method parameter",
			Payload:            edgeStackFromStringPayload{},
			Method:             "invalid",
			ExpectedStatusCode: 400,
		},

		{
			Name:               "Empty edgeStackFromStringPayload with string method",
			Payload:            edgeStackFromStringPayload{},
			Method:             "string",
			ExpectedStatusCode: 400,
		},
		{
			Name:               "Empty edgeStackFromStringPayload with repository method",
			Payload:            edgeStackFromStringPayload{},
			Method:             "repository",
			ExpectedStatusCode: 400,
		},
		{
			Name:               "Empty edgeStackFromStringPayload with file method",
			Payload:            edgeStackFromStringPayload{},
			Method:             "file",
			ExpectedStatusCode: 400,
		},
		{
			Name: "Duplicated EdgeStack Name",
			Payload: edgeStackFromStringPayload{
				Name:             edgeStack.Name,
				StackFileContent: "content",
				EdgeGroups:       edgeStack.EdgeGroups,
				DeploymentType:   edgeStack.DeploymentType,
			},
			Method:             "string",
			ExpectedStatusCode: http.StatusConflict,
		},
		{
			Name: "Empty EdgeStack Groups",
			Payload: edgeStackFromStringPayload{
				Name:             edgeStack.Name,
				StackFileContent: "content",
				EdgeGroups:       []portainer.EdgeGroupID{},
				DeploymentType:   edgeStack.DeploymentType,
			},
			Method:             "string",
			ExpectedStatusCode: 400,
		},
		{
			Name: "EdgeStackDeploymentKubernetes with Docker endpoint",
			Payload: edgeStackFromStringPayload{
				Name:             "Stack name",
				StackFileContent: "content",
				EdgeGroups:       []portainer.EdgeGroupID{1},
				DeploymentType:   portainer.EdgeStackDeploymentKubernetes,
			},
			Method:             "string",
			ExpectedStatusCode: 500,
		},
		{
			Name: "Empty Stack File Content",
			Payload: edgeStackFromStringPayload{
				Name:             "Stack name",
				StackFileContent: "",
				EdgeGroups:       []portainer.EdgeGroupID{1},
				DeploymentType:   portainer.EdgeStackDeploymentCompose,
			},
			Method:             "string",
			ExpectedStatusCode: 400,
		},
		{
			Name: "Clone Git repository error",
			Payload: edgeStackFromGitRepositoryPayload{
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
			Method:             "repository",
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
			req, err := http.NewRequest(http.MethodPost, fmt.Sprintf("/edge_stacks/create/%s", tc.Method), r)
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
