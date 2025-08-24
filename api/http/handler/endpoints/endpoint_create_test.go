package endpoints

import (
	"net/http"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/chisel"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/pkg/fips"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// EE-only kubeconfig validation tests removed for CE

func TestSaveEndpointAndUpdateAuthorizations(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)

	endpointGroup := &portainer.EndpointGroup{
		ID:   1,
		Name: "test-endpoint-group",
	}

	err := store.EndpointGroup().Create(endpointGroup)
	require.NoError(t, err)

	h := &Handler{
		DataStore: store,
	}

	testCases := []struct {
		name           string
		endpointType   portainer.EndpointType
		expectRelation bool
	}{
		{
			name:           "create azure environment, expect no relation to be created",
			endpointType:   portainer.AzureEnvironment,
			expectRelation: false,
		},
		{
			name:           "create edge agent environment, expect relation to be created",
			endpointType:   portainer.EdgeAgentOnDockerEnvironment,
			expectRelation: true,
		},
		{
			name:           "create kubernetes environment, expect no relation to be created",
			endpointType:   portainer.KubernetesLocalEnvironment,
			expectRelation: false,
		},
		{
			name:           "create kubeconfig environment, expect no relation to be created",
			endpointType:   portainer.AgentOnKubernetesEnvironment,
			expectRelation: false,
		},
		{
			name:           "create agent docker environment, expect no relation to be created",
			endpointType:   portainer.AgentOnDockerEnvironment,
			expectRelation: false,
		},
		{
			name:           "create unsecured environment, expect no relation to be created",
			endpointType:   portainer.DockerEnvironment,
			expectRelation: false,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			endpoint := &portainer.Endpoint{
				ID:      portainer.EndpointID(store.Endpoint().GetNextIdentifier()),
				Type:    testCase.endpointType,
				GroupID: portainer.EndpointGroupID(endpointGroup.ID),
			}

			err := h.saveEndpointAndUpdateAuthorizations(store, endpoint)
			require.NoError(t, err)

			relation, relationErr := store.EndpointRelation().EndpointRelation(endpoint.ID)
			if testCase.expectRelation {
				require.NoError(t, relationErr)
				require.NotNil(t, relation)
			} else {
				require.Error(t, relationErr)
				require.True(t, store.IsErrObjectNotFound(relationErr))
				require.Nil(t, relation)
			}
		})
	}
}

func TestCreateEndpointFailure(t *testing.T) {
	fips.InitFIPS(false)

	_, store := datastore.MustNewTestStore(t, true, false)

	h := NewHandler(testhelpers.NewTestRequestBouncer())
	h.DataStore = store

	payload := &endpointCreatePayload{
		Name:                 "Test Endpoint",
		EndpointCreationType: agentEnvironment,
		TLS:                  true,
		TLSCertFile:          []byte("invalid data"),
		TLSKeyFile:           []byte("invalid data"),
	}

	endpoint, httpErr := h.createEndpoint(store, payload)
	require.NotNil(t, httpErr)
	require.Equal(t, http.StatusInternalServerError, httpErr.StatusCode)
	require.Nil(t, endpoint)
}

func TestCreateEdgeAgentEndpoint_ContainerEngineMapping(t *testing.T) {
	fips.InitFIPS(false)

	_, store := datastore.MustNewTestStore(t, true, false)

	// required group for save flow
	endpointGroup := &portainer.EndpointGroup{ID: 1, Name: "test-group"}
	err := store.EndpointGroup().Create(endpointGroup)
	require.NoError(t, err)

	h := &Handler{
		DataStore:            store,
		ReverseTunnelService: chisel.NewService(store, nil, nil),
	}

	tests := []struct {
		name     string
		engine   string
		wantType portainer.EndpointType
	}{
		{
			name:     "empty engine -> EdgeAgentOnKubernetesEnvironment",
			engine:   "",
			wantType: portainer.EdgeAgentOnKubernetesEnvironment,
		},
		{
			name:     "docker engine -> EdgeAgentOnDockerEnvironment",
			engine:   portainer.ContainerEngineDocker,
			wantType: portainer.EdgeAgentOnDockerEnvironment,
		},
		{
			name:     "podman engine -> EdgeAgentOnDockerEnvironment",
			engine:   portainer.ContainerEnginePodman,
			wantType: portainer.EdgeAgentOnDockerEnvironment,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			payload := &endpointCreatePayload{
				Name:                 "edge-endpoint",
				EndpointCreationType: edgeAgentEnvironment,
				ContainerEngine:      tc.engine,
				GroupID:              1,
				URL:                  "https://portainer.example:9443",
			}

			ep, httpErr := h.createEdgeAgentEndpoint(store, payload)
			require.Nil(t, httpErr)
			require.NotNil(t, ep)

			assert.Equal(t, tc.wantType, ep.Type)
			assert.Equal(t, tc.engine, ep.ContainerEngine)
		})
	}
}
