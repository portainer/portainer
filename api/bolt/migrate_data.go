package bolt

import (
	"log"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/migrator"
	"github.com/portainer/portainer/api/internal/authorization"
)

// MigrateData automatically migrate the data based on the DBVersion.
// This process is only triggered on an existing database, not if the database was just created.
// if force is true, then migrate regardless.
func (store *Store) MigrateData(force bool) error {
	if store.isNew && !force {
		return store.VersionService.StoreDBVersion(portainer.DBVersion)
	}

	migrator, err := store.newMigrator()
	if err != nil {
		return err
	}

	if migrator.Version() < portainer.DBVersion {
		migrator, err := store.newMigrator()
		if err != nil {
			return err
		}

		log.Printf("Migrating database from version %v to %v.\n", migrator.Version(), portainer.DBVersion)
		err = migrator.MigrateCE()
		if err != nil {
			log.Printf("An error occurred during database migration: %s\n", err)
			return err
		}
	}

	return nil
}

func (store *Store) newMigrator() (*migrator.Migrator, error) {
	version, err := store.version()
	if err != nil {
		return nil, err
	}

	migratorParams := &migrator.Parameters{
		DB:                      store.connection.DB,
		DatabaseVersion:         version,
		EndpointGroupService:    store.EndpointGroupService,
		EndpointService:         store.EndpointService,
		EndpointRelationService: store.EndpointRelationService,
		ExtensionService:        store.ExtensionService,
		RegistryService:         store.RegistryService,
		ResourceControlService:  store.ResourceControlService,
		RoleService:             store.RoleService,
		ScheduleService:         store.ScheduleService,
		SettingsService:         store.SettingsService,
		StackService:            store.StackService,
		TagService:              store.TagService,
		TeamMembershipService:   store.TeamMembershipService,
		UserService:             store.UserService,
		VersionService:          store.VersionService,
		FileService:             store.fileService,
		DockerhubService:        store.DockerHubService,
		AuthorizationService:    authorization.NewService(store),
	}
	return migrator.NewMigrator(migratorParams), nil
}
