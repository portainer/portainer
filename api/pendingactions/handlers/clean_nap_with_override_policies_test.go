package handlers

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"

	"github.com/stretchr/testify/require"
)

func TestHandlerCleanNAPWithOverridePolicies_Execute_MissingEndpointGroup(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	const endpointID portainer.EndpointID = 1

	endpoint := &portainer.Endpoint{ID: endpointID}

	h := NewHandlerCleanNAPWithOverridePolicies(nil, store)
	pa := portainer.PendingAction{
		EndpointID: endpointID,
		Action:     "CleanNAPWithOverridePolicies",
		ActionData: `{"EndpointGroupID":42}`,
	}

	err := h.Execute(pa, endpoint)
	require.Error(t, err)
	require.ErrorContains(t, err, "failed to retrieve environment group")
}
