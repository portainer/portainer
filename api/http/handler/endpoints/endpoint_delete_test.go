package endpoints

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/demo"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"
)

func TestEndpointDeleteEdgeGroupsConcurrently(t *testing.T) {
	const endpointsCount = 100

	_, store, teardown := datastore.MustNewTestStore(t, true, false)
	defer teardown()

	user := &portainer.User{ID: 2, Username: "admin", Role: portainer.AdministratorRole}
	err := store.User().Create(user)
	if err != nil {
		t.Fatal("could not create admin user:", err)
	}

	jwtService, err := jwt.NewService("1h", store)
	if err != nil {
		t.Fatal("could not initialize the JWT service:", err)
	}

	apiKeyService := apikey.NewAPIKeyService(store.APIKeyRepository(), store.User())
	rawAPIKey, _, err := apiKeyService.GenerateApiKey(*user, "test")
	if err != nil {
		t.Fatal("could not generate API key:", err)
	}

	bouncer := security.NewRequestBouncer(store, jwtService, apiKeyService)

	handler := NewHandler(bouncer, demo.NewService())
	handler.DataStore = store
	handler.ProxyManager = proxy.NewManager(nil, nil, nil, nil, nil, nil, nil)

	// Create all the environments and add them to the same edge group

	var endpointIDs []portainer.EndpointID

	for i := 0; i < endpointsCount; i++ {
		endpointID := portainer.EndpointID(i) + 1

		err = store.Endpoint().Create(&portainer.Endpoint{
			ID:   endpointID,
			Name: "env-" + strconv.Itoa(int(endpointID)),
			Type: portainer.EdgeAgentOnDockerEnvironment,
		})
		if err != nil {
			t.Fatal("could not create endpoint:", err)
		}

		endpointIDs = append(endpointIDs, endpointID)
	}

	err = store.EdgeGroup().Create(&portainer.EdgeGroup{
		ID:        1,
		Name:      "edgegroup-1",
		Endpoints: endpointIDs,
	})
	if err != nil {
		t.Fatal("could not create edge group:", err)
	}

	// Remove the environments concurrently

	var wg sync.WaitGroup
	wg.Add(len(endpointIDs))

	for _, endpointID := range endpointIDs {
		go func(ID portainer.EndpointID) {
			defer wg.Done()

			req, err := http.NewRequest(http.MethodDelete, "/endpoints/"+strconv.Itoa(int(ID)), nil)
			if err != nil {
				t.Fail()
				return
			}
			req.Header.Add("X-Api-Key", rawAPIKey)

			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)
		}(endpointID)
	}

	wg.Wait()

	// Check that the edge group is consistent

	edgeGroup, err := handler.DataStore.EdgeGroup().EdgeGroup(1)
	if err != nil {
		t.Fatal("could not retrieve the edge group:", err)
	}

	if len(edgeGroup.Endpoints) > 0 {
		t.Fatal("the edge group is not consistent")
	}
}
