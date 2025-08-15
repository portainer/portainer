package migrator

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/boltdb"
	"github.com/portainer/portainer/api/dataservices/edgegroup"

	"github.com/stretchr/testify/require"
)

func TestMigrateEdgeGroupEndpointsToRoars_2_33_0Idempotency(t *testing.T) {
	var conn portainer.Connection = &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)

	defer conn.Close()

	edgeGroupService, err := edgegroup.NewService(conn)
	require.NoError(t, err)

	edgeGroup := &portainer.EdgeGroup{
		ID:        1,
		Name:      "test-edge-group",
		Endpoints: []portainer.EndpointID{1, 2, 3},
	}

	err = conn.CreateObjectWithId(edgegroup.BucketName, int(edgeGroup.ID), edgeGroup)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{EdgeGroupService: edgeGroupService})

	// Run migration once

	err = m.migrateEdgeGroupEndpointsToRoars_2_33_0()
	require.NoError(t, err)

	migratedEdgeGroup, err := edgeGroupService.Read(edgeGroup.ID)
	require.NoError(t, err)

	require.Len(t, migratedEdgeGroup.Endpoints, 0)
	require.Equal(t, len(edgeGroup.Endpoints), migratedEdgeGroup.EndpointIDs.Len())

	// Run migration again to ensure the results didn't change

	err = m.migrateEdgeGroupEndpointsToRoars_2_33_0()
	require.NoError(t, err)

	migratedEdgeGroup, err = edgeGroupService.Read(edgeGroup.ID)
	require.NoError(t, err)

	require.Len(t, migratedEdgeGroup.Endpoints, 0)
	require.Equal(t, len(edgeGroup.Endpoints), migratedEdgeGroup.EndpointIDs.Len())
}
