package endpointrelation

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/boltdb"
	"github.com/portainer/portainer/api/dataservices/edgestack"
	"github.com/portainer/portainer/api/internal/edge/cache"

	"github.com/stretchr/testify/require"
)

func TestUpdateRelation(t *testing.T) {
	const endpointID = 1
	const edgeStackID1 = 1
	const edgeStackID2 = 2

	var conn portainer.Connection = &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)

	defer conn.Close()

	service, err := NewService(conn)
	require.NoError(t, err)

	updateStackFnTxCalled := false

	edgeStacks := make(map[portainer.EdgeStackID]portainer.EdgeStack)
	edgeStacks[edgeStackID1] = portainer.EdgeStack{ID: edgeStackID1}
	edgeStacks[edgeStackID2] = portainer.EdgeStack{ID: edgeStackID2}

	service.RegisterUpdateStackFunction(func(tx portainer.Transaction, ID portainer.EdgeStackID, updateFunc func(edgeStack *portainer.EdgeStack)) error {
		updateStackFnTxCalled = true

		s, ok := edgeStacks[ID]
		require.True(t, ok)

		updateFunc(&s)
		edgeStacks[ID] = s

		return nil
	})

	// Nil relation

	cache.Set(endpointID, []byte("value"))

	err = service.UpdateEndpointRelation(endpointID, nil)
	_, cacheKeyExists := cache.Get(endpointID)
	require.NoError(t, err)
	require.False(t, updateStackFnTxCalled)
	require.False(t, cacheKeyExists)

	// Add a relation to two edge stacks

	cache.Set(endpointID, []byte("value"))

	err = service.UpdateEndpointRelation(endpointID, &portainer.EndpointRelation{
		EndpointID: endpointID,
		EdgeStacks: map[portainer.EdgeStackID]bool{
			edgeStackID1: true,
			edgeStackID2: true,
		},
	})
	_, cacheKeyExists = cache.Get(endpointID)
	require.NoError(t, err)
	require.True(t, updateStackFnTxCalled)
	require.False(t, cacheKeyExists)
	require.Equal(t, 1, edgeStacks[edgeStackID1].NumDeployments)
	require.Equal(t, 1, edgeStacks[edgeStackID2].NumDeployments)

	// Remove a relation to one edge stack

	updateStackFnTxCalled = false
	cache.Set(endpointID, []byte("value"))

	err = service.UpdateEndpointRelation(endpointID, &portainer.EndpointRelation{
		EndpointID: endpointID,
		EdgeStacks: map[portainer.EdgeStackID]bool{
			2: true,
		},
	})
	_, cacheKeyExists = cache.Get(endpointID)
	require.NoError(t, err)
	require.True(t, updateStackFnTxCalled)
	require.False(t, cacheKeyExists)
	require.Equal(t, 0, edgeStacks[edgeStackID1].NumDeployments)
	require.Equal(t, 1, edgeStacks[edgeStackID2].NumDeployments)

	// Delete the relation

	updateStackFnTxCalled = false
	cache.Set(endpointID, []byte("value"))

	err = service.DeleteEndpointRelation(endpointID)

	_, cacheKeyExists = cache.Get(endpointID)
	require.NoError(t, err)
	require.True(t, updateStackFnTxCalled)
	require.False(t, cacheKeyExists)
	require.Equal(t, 0, edgeStacks[edgeStackID1].NumDeployments)
	require.Equal(t, 0, edgeStacks[edgeStackID2].NumDeployments)
}

func TestAddEndpointRelationsForEdgeStack(t *testing.T) {
	var conn portainer.Connection = &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)

	defer conn.Close()

	service, err := NewService(conn)
	require.NoError(t, err)

	edgeStackService, err := edgestack.NewService(conn, func(t portainer.Transaction, esi portainer.EdgeStackID) {})
	require.NoError(t, err)

	service.RegisterUpdateStackFunction(edgeStackService.UpdateEdgeStackFuncTx)
	require.NoError(t, edgeStackService.Create(1, &portainer.EdgeStack{}))
	require.NoError(t, service.Create(&portainer.EndpointRelation{EndpointID: 1, EdgeStacks: map[portainer.EdgeStackID]bool{}}))
	require.NoError(t, service.AddEndpointRelationsForEdgeStack([]portainer.EndpointID{1}, &portainer.EdgeStack{ID: 1}))
}

func TestEndpointRelations(t *testing.T) {
	var conn portainer.Connection = &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)

	defer conn.Close()

	service, err := NewService(conn)
	require.NoError(t, err)

	require.NoError(t, service.Create(&portainer.EndpointRelation{EndpointID: 1}))
	rels, err := service.EndpointRelations()
	require.NoError(t, err)
	require.Equal(t, 1, len(rels))
}
