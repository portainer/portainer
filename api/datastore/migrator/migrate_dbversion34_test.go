package migrator

const (
	db35TestFile = "portainer-mig-35.db"
	username     = "portainer"
	password     = "password"
)

// TODO: this is exactly the kind of reaching into the internals of the store we should not do
// func setupDB35Test(t *testing.T) *Migrator {
// 	is := assert.New(t)
// 	dbConn, err := bolt.Open(path.Join(t.TempDir(), db35TestFile), 0600, &bolt.Options{Timeout: 1 * time.Second})
// 	is.NoError(err, "failed to init testing DB connection")

// 	// Create an old style dockerhub authenticated account
// 	dockerhubService, err := dockerhub.NewService(&database.DbConnection{DB: dbConn})
// 	is.NoError(err, "failed to init testing registry service")
// 	err = dockerhubService.UpdateDockerHub(&portainer.DockerHub{true, username, password})
// 	is.NoError(err, "failed to create dockerhub account")

// 	registryService, err := registry.NewService(&database.DbConnection{DB: dbConn})
// 	is.NoError(err, "failed to init testing registry service")

// 	endpointService, err := endpoint.NewService(&database.DbConnection{DB: dbConn})
// 	is.NoError(err, "failed to init endpoint service")

// 	m := &Migrator{
// 		db:               dbConn,
// 		dockerhubService: dockerhubService,
// 		registryService:  registryService,
// 		endpointService:  endpointService,
// 	}

// 	return m
// }

// // TestUpdateDockerhubToDB32 tests a normal upgrade
// func TestUpdateDockerhubToDB32(t *testing.T) {
// 	is := assert.New(t)
// 	m := setupDB35Test(t)
// 	defer m.db.Close()
// 	defer os.Remove(db35TestFile)

// 	if err := m.updateDockerhubToDB32(); err != nil {
// 		t.Errorf("failed to update settings: %v", err)
// 	}

// 	// Verify we have a single registry were created
// 	registries, err := m.registryService.Registries()
// 	is.NoError(err, "failed to read registries from the RegistryService")
// 	is.Equal(len(registries), 1, "only one migrated registry expected")
// }

// // TestUpdateDockerhubToDB32_with_duplicate_migrations tests an upgrade where in earlier versions a broken migration
// // created a large number of duplicate "dockerhub migrated" registry entries.
// func TestUpdateDockerhubToDB32_with_duplicate_migrations(t *testing.T) {
// 	is := assert.New(t)
// 	m := setupDB35Test(t)
// 	defer m.db.Close()
// 	defer os.Remove(db35TestFile)

// 	// Create lots of duplicate entries...
// 	registry := &portainer.Registry{
// 		Type:             portainer.DockerHubRegistry,
// 		Name:             "Dockerhub (authenticated - migrated)",
// 		URL:              "docker.io",
// 		Authentication:   true,
// 		Username:         "portainer",
// 		Password:         "password",
// 		RegistryAccesses: portainer.RegistryAccesses{},
// 	}

// 	for i := 1; i < 150; i++ {
// 		err := m.registryService.CreateRegistry(registry)
// 		assert.NoError(t, err, "create registry failed")
// 	}

// 	// Verify they were created
// 	registries, err := m.registryService.Registries()
// 	is.NoError(err, "failed to read registries from the RegistryService")
// 	is.Condition(func() bool {
// 		return len(registries) > 1
// 	}, "expected multiple duplicate registry entries")

// 	// Now run the migrator
// 	if err := m.updateDockerhubToDB32(); err != nil {
// 		t.Errorf("failed to update settings: %v", err)
// 	}

// 	// Verify we have a single registry were created
// 	registries, err = m.registryService.Registries()
// 	is.NoError(err, "failed to read registries from the RegistryService")
// 	is.Equal(len(registries), 1, "only one migrated registry expected")
// }
