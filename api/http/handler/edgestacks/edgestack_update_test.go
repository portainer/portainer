package edgestacks

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	portainer "github.com/portainer/portainer/api"
)

// Update
func TestUpdateAndInspect(t *testing.T) {
	handler, rawAPIKey := setupHandler(t)

	endpoint := createEndpoint(t, handler.DataStore)
	edgeStack := createEdgeStack(t, handler.DataStore, endpoint.ID)

	// Update edge stack: create new Endpoint, EndpointRelation and EdgeGroup
	endpointID := portainer.EndpointID(6)
	newEndpoint := createEndpointWithId(t, handler.DataStore, endpointID)

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

	payload := updateEdgeStackPayload{
		StackFileContent: "update-test",
		UpdateVersion:    true,
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
		t.Fatalf("expected a %d response, found: %d", http.StatusOK, rec.Code)
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
		t.Fatalf("expected a %d response, found: %d", http.StatusOK, rec.Code)
	}

	updatedStack := portainer.EdgeStack{}
	err = json.NewDecoder(rec.Body).Decode(&updatedStack)
	if err != nil {
		t.Fatal("error decoding response:", err)
	}

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

func TestUpdateWithInvalidEdgeGroups(t *testing.T) {
	handler, rawAPIKey := setupHandler(t)

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
				t.Fatalf("expected a %d response, found: %d", tc.ExpectedStatusCode, rec.Code)
			}
		})
	}
}
