package datastore

import (
	"fmt"

	"github.com/gofrs/uuid"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/models"
)

// Init creates the default data set.
func (store *Store) Init() error {
	conn := store.GetConnection()
	err := conn.Init()
	if err != nil {
		return err
	}

	err = store.initVersions()
	if err != nil {
		return err
	}

	// err = store.checkOrCreateDefaultSettings()
	// if err != nil {
	// 	return err
	// }

	// err = store.checkOrCreateDefaultSSLSettings()
	// if err != nil {
	// 	return err
	// }

	// return store.checkOrCreateDefaultData()
	return nil
}

func (store *Store) initVersions() error {
	_, err := store.VersionService.InstanceID()
	if store.IsErrObjectNotFound(err) {
		uid, err := uuid.NewV4()
		if err != nil {
			return err
		}

		instanceID := uid.String()

		db := store.connection.GetDB()

		fmt.Println("updating instance id")
		tx := db.Create(&models.Version{Key: models.InstanceKey, Value: instanceID})
		if tx.Error != nil {
			return tx.Error
		}

		fmt.Printf("updating version id %s\n", models.VersionKey)
		tx = db.Create(&models.Version{Key: models.VersionKey, Value: fmt.Sprint(portainer.DBVersion)})
		if tx.Error != nil {
			return tx.Error
		}

		fmt.Println("updating updating id")
		tx = db.Create(&models.Version{Key: models.UpdatingKey, Value: "false"})
		if tx.Error != nil {
			return tx.Error
		}

		fmt.Println("updating edition id")
		tx = db.Create(&models.Version{Key: models.EditionKey, Value: fmt.Sprint(portainer.PortainerCE)})
		if tx.Error != nil {
			return tx.Error
		}
	} else {
		return err
	}

	return nil
}

func (store *Store) checkOrCreateDefaultSettings() error {
	// TODO: these need to also be applied when importing
	settings, err := store.SettingsService.Settings()
	if store.IsErrObjectNotFound(err) {
		defaultSettings := &portainer.Settings{
			EnableTelemetry:      false,
			AuthenticationMethod: portainer.AuthenticationInternal,
			BlackListedLabels:    make([]portainer.Pair, 0),
			InternalAuthSettings: portainer.InternalAuthSettings{
				RequiredPasswordLength: 12,
			},
			LDAPSettings: portainer.LDAPSettings{
				AnonymousMode:   true,
				AutoCreateUsers: true,
				TLSConfig:       portainer.TLSConfiguration{},
				SearchSettings: []portainer.LDAPSearchSettings{
					{},
				},
				GroupSearchSettings: []portainer.LDAPGroupSearchSettings{
					{},
				},
			},
			OAuthSettings: portainer.OAuthSettings{
				SSO: true,
			},
			SnapshotInterval:         portainer.DefaultSnapshotInterval,
			EdgeAgentCheckinInterval: portainer.DefaultEdgeAgentCheckinIntervalInSeconds,
			TemplatesURL:             portainer.DefaultTemplatesURL,
			HelmRepositoryURL:        portainer.DefaultHelmRepositoryURL,
			UserSessionTimeout:       portainer.DefaultUserSessionTimeout,
			KubeconfigExpiry:         portainer.DefaultKubeconfigExpiry,
			KubectlShellImage:        portainer.DefaultKubectlShellImage,
		}

		return store.SettingsService.UpdateSettings(defaultSettings)
	}
	if err != nil {
		return err
	}

	if settings.UserSessionTimeout == "" {
		settings.UserSessionTimeout = portainer.DefaultUserSessionTimeout
		return store.Settings().UpdateSettings(settings)
	}
	return nil
}

func (store *Store) checkOrCreateDefaultSSLSettings() error {
	_, err := store.SSLSettings().Settings()
	if store.IsErrObjectNotFound(err) {
		defaultSSLSettings := &portainer.SSLSettings{
			HTTPEnabled: true,
		}

		return store.SSLSettings().UpdateSettings(defaultSSLSettings)
	}

	return err
}

func (store *Store) checkOrCreateDefaultData() error {
	groups, err := store.EndpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	if len(groups) == 0 {
		unassignedGroup := &portainer.EndpointGroup{
			Name:               "Unassigned",
			Description:        "Unassigned environments",
			Labels:             []portainer.Pair{},
			UserAccessPolicies: portainer.UserAccessPolicies{},
			TeamAccessPolicies: portainer.TeamAccessPolicies{},
			TagIDs:             []portainer.TagID{},
		}

		err = store.EndpointGroupService.Create(unassignedGroup)
		if err != nil {
			return err
		}
	}
	return nil
}
