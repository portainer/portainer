package edgestack

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/boltdb"
	"github.com/portainer/portainer/api/logs"

	"github.com/stretchr/testify/require"
)

func TestUpdate(t *testing.T) {
	t.Parallel()
	var conn portainer.Connection = &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)

	defer logs.CloseAndLogErr(conn)

	service, err := NewService(conn, func(portainer.Transaction, portainer.EdgeStackID) {})
	require.NoError(t, err)

	const edgeStackID = 1
	edgeStack := &portainer.EdgeStack{
		ID:   edgeStackID,
		Name: "Test Stack",
	}

	err = service.Create(edgeStackID, edgeStack)
	require.NoError(t, err)

	err = service.UpdateEdgeStackFunc(edgeStackID, func(edgeStack *portainer.EdgeStack) {
		edgeStack.Name = "Updated Stack"
	})
	require.NoError(t, err)

	updatedStack, err := service.EdgeStack(edgeStackID)
	require.NoError(t, err)
	require.Equal(t, "Updated Stack", updatedStack.Name)

	err = conn.UpdateTx(func(tx portainer.Transaction) error {
		return service.UpdateEdgeStackFuncTx(tx, edgeStackID, func(edgeStack *portainer.EdgeStack) {
			edgeStack.Name = "Updated Stack Again"
		})
	})
	require.NoError(t, err)

	updatedStack, err = service.EdgeStack(edgeStackID)
	require.NoError(t, err)
	require.Equal(t, "Updated Stack Again", updatedStack.Name)
}
