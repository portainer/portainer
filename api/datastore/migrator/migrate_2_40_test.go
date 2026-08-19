package migrator

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/boltdb"
	"github.com/portainer/portainer/api/dataservices/endpoint"
	"github.com/portainer/portainer/api/dataservices/pendingactions"
	"github.com/portainer/portainer/api/dataservices/registry"
	"github.com/portainer/portainer/api/logs"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMigrateRegistryAccessSASecrets_2_40_0(t *testing.T) {
	t.Parallel()
	var conn portainer.Connection = &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	registryService, err := registry.NewService(conn)
	require.NoError(t, err)

	endpointService, err := endpoint.NewService(conn)
	require.NoError(t, err)

	pendingActionsService, err := pendingactions.NewService(conn)
	require.NoError(t, err)

	t.Run("sets MigrateRegistrySASecrets flag for k8s endpoints with registry access", func(t *testing.T) {
		k8sEndpoint := &portainer.Endpoint{
			ID:   1,
			Name: "k8s-cluster",
			Type: portainer.AgentOnKubernetesEnvironment,
		}
		dockerEndpoint := &portainer.Endpoint{
			ID:   2,
			Name: "docker-standalone",
			Type: portainer.DockerEnvironment,
		}

		err := conn.CreateObjectWithId(endpoint.BucketName, int(k8sEndpoint.ID), k8sEndpoint)
		require.NoError(t, err)
		err = conn.CreateObjectWithId(endpoint.BucketName, int(dockerEndpoint.ID), dockerEndpoint)
		require.NoError(t, err)

		reg := &portainer.Registry{
			ID:   1,
			Name: "test-registry",
			RegistryAccesses: portainer.RegistryAccesses{
				k8sEndpoint.ID: portainer.RegistryAccessPolicies{
					Namespaces: []string{"default", "production"},
				},
				dockerEndpoint.ID: portainer.RegistryAccessPolicies{
					Namespaces: []string{"ignored"},
				},
			},
		}

		err = conn.CreateObjectWithId(registry.BucketName, int(reg.ID), reg)
		require.NoError(t, err)

		m := NewMigrator(&MigratorParameters{
			RegistryService:       registryService,
			EndpointService:       endpointService,
			PendingActionsService: pendingActionsService,
		})

		err = m.migrateRegistryAccessSASecrets_2_40_0()
		require.NoError(t, err)

		updatedK8sEndpoint, err := endpointService.Endpoint(k8sEndpoint.ID)
		require.NoError(t, err)
		assert.True(t, updatedK8sEndpoint.PostInitMigrations.MigrateRegistrySASecrets, "should have set MigrateRegistrySASecrets flag for k8s endpoint")

		updatedDockerEndpoint, err := endpointService.Endpoint(dockerEndpoint.ID)
		require.NoError(t, err)
		assert.False(t, updatedDockerEndpoint.PostInitMigrations.MigrateRegistrySASecrets, "should not have set MigrateRegistrySASecrets flag for docker endpoint")
	})

	t.Run("skips endpoints with empty namespaces", func(t *testing.T) {
		conn2 := &boltdb.DbConnection{Path: t.TempDir()}
		err := conn2.Open()
		require.NoError(t, err)
		defer logs.CloseAndLogErr(conn2)

		registryService2, _ := registry.NewService(conn2)
		endpointService2, _ := endpoint.NewService(conn2)
		pendingActionsService2, _ := pendingactions.NewService(conn2)

		k8sEndpoint := &portainer.Endpoint{
			ID:   10,
			Name: "k8s-cluster",
			Type: portainer.AgentOnKubernetesEnvironment,
		}
		err = conn2.CreateObjectWithId(endpoint.BucketName, int(k8sEndpoint.ID), k8sEndpoint)
		require.NoError(t, err)

		reg := &portainer.Registry{
			ID:   10,
			Name: "empty-registry",
			RegistryAccesses: portainer.RegistryAccesses{
				k8sEndpoint.ID: portainer.RegistryAccessPolicies{
					Namespaces: []string{},
				},
			},
		}
		err = conn2.CreateObjectWithId(registry.BucketName, int(reg.ID), reg)
		require.NoError(t, err)

		m := NewMigrator(&MigratorParameters{
			RegistryService:       registryService2,
			EndpointService:       endpointService2,
			PendingActionsService: pendingActionsService2,
		})

		err = m.migrateRegistryAccessSASecrets_2_40_0()
		require.NoError(t, err)

		allPAs, err := pendingActionsService2.ReadAll()
		require.NoError(t, err)
		assert.Empty(t, allPAs, "should not create pending actions for empty namespaces")
	})

	t.Run("skips non-existent endpoints", func(t *testing.T) {
		conn3 := &boltdb.DbConnection{Path: t.TempDir()}
		err := conn3.Open()
		require.NoError(t, err)
		defer logs.CloseAndLogErr(conn3)

		registryService3, _ := registry.NewService(conn3)
		endpointService3, _ := endpoint.NewService(conn3)
		pendingActionsService3, _ := pendingactions.NewService(conn3)

		reg := &portainer.Registry{
			ID:   20,
			Name: "orphan-registry",
			RegistryAccesses: portainer.RegistryAccesses{
				999: portainer.RegistryAccessPolicies{
					Namespaces: []string{"default"},
				},
			},
		}
		err = conn3.CreateObjectWithId(registry.BucketName, int(reg.ID), reg)
		require.NoError(t, err)

		m := NewMigrator(&MigratorParameters{
			RegistryService:       registryService3,
			EndpointService:       endpointService3,
			PendingActionsService: pendingActionsService3,
		})

		err = m.migrateRegistryAccessSASecrets_2_40_0()
		require.NoError(t, err)

		allPAs, err := pendingActionsService3.ReadAll()
		require.NoError(t, err)
		assert.Empty(t, allPAs, "should not create pending actions for non-existent endpoints")
	})

	t.Run("idempotent - running twice creates duplicate actions but doesn't error", func(t *testing.T) {
		conn4 := &boltdb.DbConnection{Path: t.TempDir()}
		err := conn4.Open()
		require.NoError(t, err)
		defer logs.CloseAndLogErr(conn4)

		registryService4, _ := registry.NewService(conn4)
		endpointService4, _ := endpoint.NewService(conn4)
		pendingActionsService4, _ := pendingactions.NewService(conn4)

		k8sEndpoint := &portainer.Endpoint{
			ID:   30,
			Name: "k8s-cluster",
			Type: portainer.AgentOnKubernetesEnvironment,
		}
		err = conn4.CreateObjectWithId(endpoint.BucketName, int(k8sEndpoint.ID), k8sEndpoint)
		require.NoError(t, err)

		reg := &portainer.Registry{
			ID:   30,
			Name: "test-registry",
			RegistryAccesses: portainer.RegistryAccesses{
				k8sEndpoint.ID: portainer.RegistryAccessPolicies{
					Namespaces: []string{"default"},
				},
			},
		}
		err = conn4.CreateObjectWithId(registry.BucketName, int(reg.ID), reg)
		require.NoError(t, err)

		m := NewMigrator(&MigratorParameters{
			RegistryService:       registryService4,
			EndpointService:       endpointService4,
			PendingActionsService: pendingActionsService4,
		})

		err = m.migrateRegistryAccessSASecrets_2_40_0()
		require.NoError(t, err)

		err = m.migrateRegistryAccessSASecrets_2_40_0()
		require.NoError(t, err)
	})
}
