package endpoints

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/internal/testhelpers"
)

func TestEndpointDeleteEdgeGroupsConcurrently(t *testing.T) {
	const endpointsCount = 100

	_, store := datastore.MustNewTestStore(t, true, false)

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store
	handler.ProxyManager = proxy.NewManager(nil)
	handler.ProxyManager.NewProxyFactory(nil, nil, nil, nil, nil, nil, nil, nil)

	// Create all the environments and add them to the same edge group

	var endpointIDs []portainer.EndpointID

	for i := range endpointsCount {
		endpointID := portainer.EndpointID(i) + 1

		if err := store.Endpoint().Create(&portainer.Endpoint{
			ID:   endpointID,
			Name: "env-" + strconv.Itoa(int(endpointID)),
			Type: portainer.EdgeAgentOnDockerEnvironment,
		}); err != nil {
			t.Fatal("could not create endpoint:", err)
		}

		endpointIDs = append(endpointIDs, endpointID)
	}

	if err := store.EdgeGroup().Create(&portainer.EdgeGroup{
		ID:        1,
		Name:      "edgegroup-1",
		Endpoints: endpointIDs,
	}); err != nil {
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

			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)
		}(endpointID)
	}

	wg.Wait()

	// Check that the edge group is consistent

	edgeGroup, err := handler.DataStore.EdgeGroup().Read(1)
	if err != nil {
		t.Fatal("could not retrieve the edge group:", err)
	}

	if len(edgeGroup.Endpoints) > 0 {
		t.Fatal("the edge group is not consistent")
	}
}
