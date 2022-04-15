package endpoints

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	portaineree "github.com/portainer/portainer-ee/api"
	"github.com/portainer/portainer-ee/api/datastore"
	"github.com/portainer/portainer-ee/api/http/security"
	"github.com/portainer/portainer-ee/api/internal/testhelpers"
	helper "github.com/portainer/portainer-ee/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

type endpointListEdgeDeviceTest struct {
	expected []portaineree.EndpointID
	filter   string
}

func Test_endpointList(t *testing.T) {
	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	trustedEndpoint := portaineree.Endpoint{ID: 1, UserTrusted: true, IsEdgeDevice: true, GroupID: 1}
	err := store.Endpoint().Create(&trustedEndpoint)
	is.NoError(err, "error creating environment")

	untrustedEndpoint := portaineree.Endpoint{ID: 2, UserTrusted: false, IsEdgeDevice: true, GroupID: 1}
	err = store.Endpoint().Create(&untrustedEndpoint)
	is.NoError(err, "error creating environment")

	regularEndpoint := portaineree.Endpoint{ID: 3, IsEdgeDevice: false, GroupID: 1}
	err = store.Endpoint().Create(&regularEndpoint)
	is.NoError(err, "error creating environment")

	err = store.User().Create(&portaineree.User{Username: "admin", Role: portaineree.AdministratorRole})
	is.NoError(err, "error creating a user")

	bouncer := helper.NewTestRequestBouncer()
	h := NewHandler(bouncer, helper.NewUserActivityService(), store, nil)
	h.ComposeStackManager = testhelpers.NewComposeStackManager()

	tests := []endpointListEdgeDeviceTest{
		{
			[]portaineree.EndpointID{trustedEndpoint.ID, untrustedEndpoint.ID},
			EdgeDeviceFilterAll,
		},
		{
			[]portaineree.EndpointID{trustedEndpoint.ID},
			EdgeDeviceFilterTrusted,
		},
		{
			[]portaineree.EndpointID{untrustedEndpoint.ID},
			EdgeDeviceFilterUntrusted,
		},
	}

	for _, test := range tests {
		req := buildEndpointListRequest(test.filter)
		resp, err := doEndpointListRequest(req, h, is)
		is.NoError(err)

		is.Equal(len(test.expected), len(resp))

		respIds := []portaineree.EndpointID{}

		for _, endpoint := range resp {
			respIds = append(respIds, endpoint.ID)
		}

		is.Equal(test.expected, respIds, "response should contain all edge devices")
	}
}

func buildEndpointListRequest(filter string) *http.Request {
	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/endpoints?edgeDeviceFilter=%s", filter), nil)

	ctx := security.StoreTokenData(req, &portaineree.TokenData{ID: 1, Username: "admin", Role: 1})
	req = req.WithContext(ctx)

	restrictedCtx := security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	req = req.WithContext(restrictedCtx)

	req.Header.Add("Authorization", "Bearer dummytoken")

	return req
}

func doEndpointListRequest(req *http.Request, h *Handler, is *assert.Assertions) ([]portaineree.Endpoint, error) {
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	is.Equal(http.StatusOK, rr.Code, "Status should be 200")
	body, err := io.ReadAll(rr.Body)
	if err != nil {
		return nil, err
	}

	resp := []portaineree.Endpoint{}
	err = json.Unmarshal(body, &resp)
	if err != nil {
		return nil, err
	}

	return resp, nil
}
