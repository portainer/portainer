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
	title    string
	expected []portainer.EndpointID
	filter   string
}

func Test_endpointList(t *testing.T) {
	var err error
	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	trustedEndpoint := portainer.Endpoint{ID: 1, UserTrusted: true, IsEdgeDevice: true, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment}
	untrustedEndpoint := portainer.Endpoint{ID: 2, UserTrusted: false, IsEdgeDevice: true, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment}
	regularUntrustedEdgeEndpoint := portainer.Endpoint{ID: 3, UserTrusted: false, IsEdgeDevice: false, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment}
	regularTrustedEdgeEndpoint := portainer.Endpoint{ID: 4, UserTrusted: true, IsEdgeDevice: false, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment}
	regularEndpoint := portainer.Endpoint{ID: 5, UserTrusted: false, IsEdgeDevice: false, GroupID: 1, Type: portainer.DockerEnvironment}

	endpoints := []portainer.Endpoint{
		trustedEndpoint,
		untrustedEndpoint,
		regularUntrustedEdgeEndpoint,
		regularTrustedEdgeEndpoint,
		regularEndpoint,
	}

	for _, endpoint := range endpoints {
		err = store.Endpoint().Create(&endpoint)
		is.NoError(err, "error creating environment")
	}

	err = store.User().Create(&portainer.User{Username: "admin", Role: portainer.AdministratorRole})
	is.NoError(err, "error creating a user")

	bouncer := helper.NewTestRequestBouncer()
	h := NewHandler(bouncer)
	h.DataStore = store
	h.ComposeStackManager = testhelpers.NewComposeStackManager()

	tests := []endpointListEdgeDeviceTest{
		{
			"should show all edge endpoints",
			[]portainer.EndpointID{trustedEndpoint.ID, untrustedEndpoint.ID, regularUntrustedEdgeEndpoint.ID, regularTrustedEdgeEndpoint.ID},
			EdgeDeviceFilterAll,
		},
		{
			"should show only trusted edge devices",
			[]portainer.EndpointID{trustedEndpoint.ID, regularTrustedEdgeEndpoint.ID},
			EdgeDeviceFilterTrusted,
		},
		{
			"should show only untrusted edge devices",
			[]portainer.EndpointID{untrustedEndpoint.ID, regularUntrustedEdgeEndpoint.ID},
			EdgeDeviceFilterUntrusted,
		},
		{
			"should show no edge devices",
			[]portainer.EndpointID{regularEndpoint.ID, regularUntrustedEdgeEndpoint.ID, regularTrustedEdgeEndpoint.ID},
			EdgeDeviceFilterNone,
		},
	}

	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			is := assert.New(t)

			req := buildEndpointListRequest(test.filter)
			resp, err := doEndpointListRequest(req, h, is)
			is.NoError(err)

			is.Equal(len(test.expected), len(resp))

			respIds := []portainer.EndpointID{}

			for _, endpoint := range resp {
				respIds = append(respIds, endpoint.ID)
			}

			is.ElementsMatch(test.expected, respIds)
		})
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
