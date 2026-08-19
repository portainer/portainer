package pendingactions_test

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"

	"github.com/stretchr/testify/require"
)

func TestDeleteByEndpoint(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, false)

	// Create Endpoint 1
	err := store.PendingActions().Create(&portainer.PendingAction{EndpointID: 1})
	require.NoError(t, err)

	// Create Endpoint 2
	err = store.PendingActions().Create(&portainer.PendingAction{EndpointID: 2})
	require.NoError(t, err)

	// Delete Endpoint 1
	err = store.PendingActions().DeleteByEndpointID(1)
	require.NoError(t, err)

	// Check that only Endpoint 2 remains
	pendingActions, err := store.PendingActions().ReadAll()
	require.NoError(t, err)
	require.Len(t, pendingActions, 1)
	require.Equal(t, portainer.EndpointID(2), pendingActions[0].EndpointID)
}
