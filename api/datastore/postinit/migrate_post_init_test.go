package postinit

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/pendingactions/actions"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMigrateGPUs(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/containers/json") {
			containerSummary := []container.Summary{{ID: "container1"}}

			err := json.NewEncoder(w).Encode(containerSummary)
			require.NoError(t, err)

			return
		}

		container := container.InspectResponse{
			ContainerJSONBase: &container.ContainerJSONBase{
				ID: "container1",
				HostConfig: &container.HostConfig{
					Resources: container.Resources{
						DeviceRequests: []container.DeviceRequest{
							{Driver: "nvidia"},
						},
					},
				},
			},
		}

		err := json.NewEncoder(w).Encode(container)
		require.NoError(t, err)
	}))
	defer srv.Close()

	_, store := datastore.MustNewTestStore(t, true, false)

	migrator := &PostInitMigrator{dataStore: store}

	dockerCli, err := client.NewClientWithOpts(client.WithHost(srv.URL), client.WithHTTPClient(http.DefaultClient))
	require.NoError(t, err)

	// Nonexistent endpoint

	err = migrator.MigrateGPUs(portainer.Endpoint{}, dockerCli)
	require.Error(t, err)

	// Valid endpoint

	endpoint := portainer.Endpoint{ID: 1, PostInitMigrations: portainer.EndpointPostInitMigrations{MigrateGPUs: true}}

	err = store.Endpoint().Create(&endpoint)
	require.NoError(t, err)

	err = migrator.MigrateGPUs(endpoint, dockerCli)
	require.NoError(t, err)

	migratedEndpoint, err := store.Endpoint().Endpoint(endpoint.ID)
	require.NoError(t, err)

	require.Equal(t, endpoint.ID, migratedEndpoint.ID)
	require.False(t, migratedEndpoint.PostInitMigrations.MigrateGPUs)
	require.True(t, migratedEndpoint.EnableGPUManagement)
}

func TestPostInitMigrate_PendingActionsCreated(t *testing.T) {
	tests := []struct {
		name                   string
		existingPendingActions []*portainer.PendingAction
		expectedPendingActions int
		expectedAction         string
	}{
		{
			name: "when existing non-matching action exists, should add migration action",
			existingPendingActions: []*portainer.PendingAction{
				{
					EndpointID: 7,
					Action:     "some-other-action",
				},
			},
			expectedPendingActions: 2,
			expectedAction:         actions.PostInitMigrateEnvironment,
		},
		{
			name: "when matching action exists, should not add duplicate",
			existingPendingActions: []*portainer.PendingAction{
				{
					EndpointID: 7,
					Action:     actions.PostInitMigrateEnvironment,
				},
			},
			expectedPendingActions: 1,
			expectedAction:         actions.PostInitMigrateEnvironment,
		},
		{
			name:                   "when no actions exist, should add migration action",
			existingPendingActions: []*portainer.PendingAction{},
			expectedPendingActions: 1,
			expectedAction:         actions.PostInitMigrateEnvironment,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			is := assert.New(t)
			_, store := datastore.MustNewTestStore(t, true, true)

			// Create test endpoint
			endpoint := &portainer.Endpoint{
				ID:          7,
				UserTrusted: true,
				Type:        portainer.EdgeAgentOnDockerEnvironment,
				Edge: portainer.EnvironmentEdgeSettings{
					AsyncMode: false,
				},
				EdgeID: "edgeID",
			}
			err := store.Endpoint().Create(endpoint)
			is.NoError(err, "error creating endpoint")

			// Create any existing pending actions
			for _, action := range tt.existingPendingActions {
				err = store.PendingActions().Create(action)
				is.NoError(err, "error creating pending action")
			}

			migrator := NewPostInitMigrator(
				nil, // kubeFactory not needed for this test
				nil, // dockerFactory not needed for this test
				store,
				"",  // assetsPath not needed for this test
				nil, // kubernetesDeployer not needed for this test
			)

			err = migrator.PostInitMigrate()
			is.NoError(err, "PostInitMigrate should not return error")

			// Verify the results
			pendingActions, err := store.PendingActions().ReadAll()
			is.NoError(err, "error reading pending actions")
			is.Len(pendingActions, tt.expectedPendingActions, "unexpected number of pending actions")

			// If we expect any actions, verify at least one has the expected action type
			if tt.expectedPendingActions > 0 {
				hasExpectedAction := false
				for _, action := range pendingActions {
					if action.Action == tt.expectedAction {
						hasExpectedAction = true
						is.Equal(endpoint.ID, action.EndpointID, "action should reference correct endpoint")
						break
					}
				}
				is.True(hasExpectedAction, "should have found action of expected type")
			}
		})
	}
}
