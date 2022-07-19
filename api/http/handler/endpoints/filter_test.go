package endpoints

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"
	helper "github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

type filterTest struct {
	title    string
	expected []portainer.EndpointID
	query    EnvironmentsQuery
}

func Test_Filter_edgeDeviceFilter(t *testing.T) {

	trustedEdgeDevice := portainer.Endpoint{ID: 1, UserTrusted: true, IsEdgeDevice: true, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment}
	untrustedEdgeDevice := portainer.Endpoint{ID: 2, UserTrusted: false, IsEdgeDevice: true, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment}
	regularUntrustedEdgeEndpoint := portainer.Endpoint{ID: 3, UserTrusted: false, IsEdgeDevice: false, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment}
	regularTrustedEdgeEndpoint := portainer.Endpoint{ID: 4, UserTrusted: true, IsEdgeDevice: false, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment}
	regularEndpoint := portainer.Endpoint{ID: 5, GroupID: 1, Type: portainer.DockerEnvironment}

	endpoints := []portainer.Endpoint{
		trustedEdgeDevice,
		untrustedEdgeDevice,
		regularUntrustedEdgeEndpoint,
		regularTrustedEdgeEndpoint,
		regularEndpoint,
	}

	handler, teardown := setupFilterTest(t, endpoints)

	defer teardown()

	tests := []filterTest{
		{
			"should show all edge endpoints",
			[]portainer.EndpointID{trustedEdgeDevice.ID, untrustedEdgeDevice.ID, regularUntrustedEdgeEndpoint.ID, regularTrustedEdgeEndpoint.ID},
			EnvironmentsQuery{
				types: []portainer.EndpointType{portainer.EdgeAgentOnDockerEnvironment, portainer.EdgeAgentOnKubernetesEnvironment},
			},
		},
		{
			"should show only trusted edge devices and other regular endpoints",
			[]portainer.EndpointID{trustedEdgeDevice.ID, regularEndpoint.ID},
			EnvironmentsQuery{
				edgeDevice: BoolAddr(true),
			},
		},
		{
			"should show only untrusted edge devices and other regular endpoints",
			[]portainer.EndpointID{untrustedEdgeDevice.ID, regularEndpoint.ID},
			EnvironmentsQuery{
				edgeDevice:          BoolAddr(true),
				edgeDeviceUntrusted: true,
			},
		},
		{
			"should show no edge devices",
			[]portainer.EndpointID{regularEndpoint.ID, regularUntrustedEdgeEndpoint.ID, regularTrustedEdgeEndpoint.ID},
			EnvironmentsQuery{
				edgeDevice: BoolAddr(false),
			},
		},
	}

	runTests(tests, t, handler, endpoints)
}

func runTests(tests []filterTest, t *testing.T, handler *Handler, endpoints []portainer.Endpoint) {
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			runTest(t, test, handler, endpoints)
		})
	}
}

func runTest(t *testing.T, test filterTest, handler *Handler, endpoints []portainer.Endpoint) {
	is := assert.New(t)

	filteredEndpoints, _, err := handler.filterEndpointsByQuery(endpoints, test.query, []portainer.EndpointGroup{}, &portainer.Settings{})

	is.NoError(err)

	is.Equal(len(test.expected), len(filteredEndpoints))

	respIds := []portainer.EndpointID{}

	for _, endpoint := range filteredEndpoints {
		respIds = append(respIds, endpoint.ID)
	}

	is.ElementsMatch(test.expected, respIds)

}

func setupFilterTest(t *testing.T, endpoints []portainer.Endpoint) (handler *Handler, teardown func()) {
	is := assert.New(t)
	_, store, teardown := datastore.MustNewTestStore(true, true)

	for _, endpoint := range endpoints {
		err := store.Endpoint().Create(&endpoint)
		is.NoError(err, "error creating environment")
	}

	err := store.User().Create(&portainer.User{Username: "admin", Role: portainer.AdministratorRole})
	is.NoError(err, "error creating a user")

	bouncer := helper.NewTestRequestBouncer()
	handler = NewHandler(bouncer, nil)
	handler.DataStore = store
	handler.ComposeStackManager = testhelpers.NewComposeStackManager()

	return handler, teardown
}
