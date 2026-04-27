package workflows

import (
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	ce "github.com/portainer/portainer/api/gitops/workflows"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestWorkflowsList_StackStatusDerivation(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name           string
		deployStatus   []portainer.StackDeploymentStatus
		expectedStatus ce.Status
	}{
		{
			name:           "no deployment status → healthy",
			expectedStatus: ce.StatusHealthy,
		},
		{
			name:           "active → healthy",
			deployStatus:   []portainer.StackDeploymentStatus{{Status: portainer.StackStatusActive}},
			expectedStatus: ce.StatusHealthy,
		},
		{
			name:           "error → error",
			deployStatus:   []portainer.StackDeploymentStatus{{Status: portainer.StackStatusError}},
			expectedStatus: ce.StatusError,
		},
		{
			name:           "deploying → syncing",
			deployStatus:   []portainer.StackDeploymentStatus{{Status: portainer.StackStatusDeploying}},
			expectedStatus: ce.StatusSyncing,
		},
		{
			name:           "inactive → paused",
			deployStatus:   []portainer.StackDeploymentStatus{{Status: portainer.StackStatusInactive}},
			expectedStatus: ce.StatusPaused,
		},
		{
			name: "last entry wins",
			deployStatus: []portainer.StackDeploymentStatus{
				{Status: portainer.StackStatusDeploying},
				{Status: portainer.StackStatusActive},
			},
			expectedStatus: ce.StatusHealthy,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			_, store := datastore.MustNewTestStore(t, false, true)

			require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
				require.NoError(t, tx.Stack().Create(&portainer.Stack{
					ID:               1,
					Name:             "status-stack",
					DeploymentStatus: tc.deployStatus,
					GitConfig:        gitConfig("https://github.com/x/y"),
				}))

				require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
				return nil
			}))

			h := NewHandler(store, nil)
			rr := httptest.NewRecorder()
			h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.AdministratorRole, ""))

			items := decodeWorkflows(t, rr)
			require.Len(t, items, 1)
			assert.Equal(t, tc.expectedStatus, items[0].Status.Target.Status, tc.name)
		})
	}
}
