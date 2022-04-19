package endpoints

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	helper "github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

type endpointListEdgeDeviceTest struct {
	expected []portainer.EndpointID
	filter   string
}

func Test_endpointList(t *testing.T) {
	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	trustedEndpoint := portainer.Endpoint{ID: 1, UserTrusted: true, IsEdgeDevice: true, GroupID: 1}
	err := store.Endpoint().Create(&trustedEndpoint)
	is.NoError(err, "error creating environment")

	untrustedEndpoint := portainer.Endpoint{ID: 2, UserTrusted: false, IsEdgeDevice: true, GroupID: 1}
	err = store.Endpoint().Create(&untrustedEndpoint)
	is.NoError(err, "error creating environment")

	regularEndpoint := portainer.Endpoint{ID: 3, IsEdgeDevice: false, GroupID: 1}
	err = store.Endpoint().Create(&regularEndpoint)
	is.NoError(err, "error creating environment")

	err = store.User().Create(&portainer.User{Username: "admin", Role: portainer.AdministratorRole})
	is.NoError(err, "error creating a user")

	bouncer := helper.NewTestRequestBouncer()
	h := NewHandler(bouncer)
	h.DataStore = store
	h.ComposeStackManager = testhelpers.NewComposeStackManager()

	tests := []endpointListEdgeDeviceTest{
		{
			[]portainer.EndpointID{trustedEndpoint.ID, untrustedEndpoint.ID},
			EdgeDeviceFilterAll,
		},
		{
			[]portainer.EndpointID{trustedEndpoint.ID},
			EdgeDeviceFilterTrusted,
		},
		{
			[]portainer.EndpointID{untrustedEndpoint.ID},
			EdgeDeviceFilterUntrusted,
		},
	}

	for _, test := range tests {
		req := buildEndpointListRequest(test.filter)
		resp, err := doEndpointListRequest(req, h, is)
		is.NoError(err)

		is.Equal(len(test.expected), len(resp))

		respIds := []portainer.EndpointID{}

		for _, endpoint := range resp {
			respIds = append(respIds, endpoint.ID)
		}

		is.Equal(test.expected, respIds, "response should contain all edge devices")
	}
}

func buildEndpointListRequest(filter string) *http.Request {
	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/endpoints?edgeDeviceFilter=%s", filter), nil)

	ctx := security.StoreTokenData(req, &portainer.TokenData{ID: 1, Username: "admin", Role: 1})
	req = req.WithContext(ctx)

	restrictedCtx := security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	req = req.WithContext(restrictedCtx)

	req.Header.Add("Authorization", "Bearer dummytoken")

	return req
}

func doEndpointListRequest(req *http.Request, h *Handler, is *assert.Assertions) ([]portainer.Endpoint, error) {
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	is.Equal(http.StatusOK, rr.Code, "Status should be 200")
	body, err := io.ReadAll(rr.Body)
	if err != nil {
		return nil, err
	}

	resp := []portainer.Endpoint{}
	err = json.Unmarshal(body, &resp)
	if err != nil {
		return nil, err
	}

	return resp, nil
}
