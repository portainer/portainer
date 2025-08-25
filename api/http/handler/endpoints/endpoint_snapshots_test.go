package endpoints

import (
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_endpointSnapshots(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, true)

	endpointID := portainer.EndpointID(123)
	endpoint := &portainer.Endpoint{
		ID:     endpointID,
		Name:   "mock",
		URL:    "http://mock.example/",
		Status: portainer.EndpointStatusDown, // starts in down state
	}
	err := store.Endpoint().Create(endpoint)

	require.NoError(t, err, "error creating environment")

	err = store.User().Create(
		&portainer.User{
			Username: "admin",
			Role:     portainer.AdministratorRole,
		},
	)
	require.NoError(t, err, "error creating a user")

	bouncer := testhelpers.NewTestRequestBouncer()

	snapshotService := &mockSnapshotService{
		snapshotEndpointShouldSucceed: atomic.Bool{},
	}
	snapshotService.snapshotEndpointShouldSucceed.Store(true)

	h := NewHandler(bouncer)
	h.DataStore = store
	h.SnapshotService = snapshotService

	doPostRequest := func() {
		req := httptest.NewRequest(http.MethodPost, "/endpoints/snapshot", nil)
		ctx := security.StoreTokenData(req, &portainer.TokenData{ID: 1, Username: "admin", Role: 1})
		req = req.WithContext(ctx)
		testhelpers.AddTestSecurityCookie(req, "Bearer dummytoken")

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		require.Equal(t, http.StatusNoContent, rr.Code, "Status should be 204")

		_, err := io.ReadAll(rr.Body)
		require.NoError(t, err, "ReadAll should not return error")
	}

	doPostRequest()

	// check that the endpoint has been immediately set to up
	endpoint, err = store.Endpoint().Endpoint(endpointID)
	require.NoError(t, err, "error getting endpoint")
	assert.Equal(t, portainer.EndpointStatusUp, endpoint.Status, "endpoint should be up (1) since mock snapshot returned ok")

	// set the mock to return an error
	snapshotService.snapshotEndpointShouldSucceed.Store(false)
	doPostRequest()

	// check that the endpoint has been immediately set to down
	endpoint, err = store.Endpoint().Endpoint(endpointID)
	require.NoError(t, err, "error getting endpoint")
	assert.Equal(t, portainer.EndpointStatusDown, endpoint.Status, "endpoint should be down (2) since mock snapshot returned error")
}

var _ portainer.SnapshotService = &mockSnapshotService{}

type mockSnapshotService struct {
	snapshotEndpointShouldSucceed atomic.Bool
}

func (s *mockSnapshotService) Start() {
}

func (s *mockSnapshotService) SetSnapshotInterval(snapshotInterval string) error {
	return nil
}

func (s *mockSnapshotService) SnapshotEndpoint(endpoint *portainer.Endpoint) error {
	if s.snapshotEndpointShouldSucceed.Load() {
		return nil
	}

	return errors.New("snapshot failed")
}

func (s *mockSnapshotService) FillSnapshotData(endpoint *portainer.Endpoint, includeRaw bool) error {
	return nil
}
