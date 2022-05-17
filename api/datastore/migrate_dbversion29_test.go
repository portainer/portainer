package datastore

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrator"
	"github.com/portainer/portainer/api/internal/authorization"
)

const dummyLogoURL = "example.com"

// initTestingDBConn creates a settings service with raw database DB connection
// for unit testing usage only since using NewStore will cause cycle import inside migrator pkg
func initTestingSettingsService(dbConn portainer.Connection, preSetObj map[string]interface{}) error {
	//insert a obj
	if err := dbConn.UpdateObject("settings", []byte("SETTINGS"), preSetObj); err != nil {
		return err
	}
	return nil
}

func setup(store *Store) error {
	var err error
	dummySettingsObj := map[string]interface{}{
		"LogoURL": dummyLogoURL,
	}
	err = initTestingSettingsService(store.connection, dummySettingsObj)
	if err != nil {
		return err
	}
	return nil
}

func TestMigrateSettings(t *testing.T) {
	_, store, teardown := MustNewTestStore(false, true)
	defer teardown()

	err := setup(store)
	if err != nil {
		t.Errorf("failed to complete testing setups, err: %v", err)
	}

	updatedSettings, err := store.SettingsService.Settings()
	// SO -basically, this test _isn't_ testing migration, its testing golang type defaults.
	if updatedSettings.LogoURL != dummyLogoURL { // ensure a pre-migrate setting isn't unset
		t.Errorf("unexpected value changes in the updated settings, want LogoURL value: %s, got LogoURL value: %s", dummyLogoURL, updatedSettings.LogoURL)
	}
	if updatedSettings.OAuthSettings.SSO != false { // I recon golang defaulting will make this false
		t.Errorf("unexpected default OAuth SSO setting, want: false, got: %t", updatedSettings.OAuthSettings.SSO)
	}
	if updatedSettings.OAuthSettings.LogoutURI != "" {
		t.Errorf("unexpected default OAuth HideInternalAuth setting, want:, got: %s", updatedSettings.OAuthSettings.LogoutURI)
	}

	m := migrator.NewMigrator(&migrator.MigratorParameters{
		DatabaseVersion:         29,
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
	})
	if err := m.MigrateSettingsToDB30(); err != nil {
		t.Errorf("failed to update settings: %v", err)
	}
	if err != nil {
		t.Errorf("failed to retrieve the updated settings: %v", err)
	}
	if updatedSettings.LogoURL != dummyLogoURL {
		t.Errorf("unexpected value changes in the updated settings, want LogoURL value: %s, got LogoURL value: %s", dummyLogoURL, updatedSettings.LogoURL)
	}
	if updatedSettings.OAuthSettings.SSO != false {
		t.Errorf("unexpected default OAuth SSO setting, want: false, got: %t", updatedSettings.OAuthSettings.SSO)
	}
	if updatedSettings.OAuthSettings.LogoutURI != "" {
		t.Errorf("unexpected default OAuth HideInternalAuth setting, want:, got: %s", updatedSettings.OAuthSettings.LogoutURI)
	}
}
