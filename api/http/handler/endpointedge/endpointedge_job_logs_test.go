package endpointedge

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"

	"github.com/stretchr/testify/require"
)

func TestUpdateUnrelatedEdgeJobLogs(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, false)

	h := &Handler{DataStore: store}

	endpointID := portainer.EndpointID(2)
	edgeJobID := portainer.EdgeJobID(3)
	payload := logsPayload{FileContent: "log content"}

	err := store.Endpoint().Create(&portainer.Endpoint{
		ID:   endpointID,
		Name: "test-endpoint",
	})
	require.NoError(t, err)

	err = store.EdgeJob().CreateWithID(edgeJobID, &portainer.EdgeJob{
		ID:   edgeJobID,
		Name: "test-edge-job",
	})
	require.NoError(t, err)

	// There is no relation between the edge job and the endpoint, so the
	// update must fail
	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return h.updateEdgeJobLogs(tx, endpointID, edgeJobID, payload)
	})
	require.Error(t, err)
}
