package migrations

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrations/types"
	"github.com/sirupsen/logrus"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   24,
		Timestamp: 1646095944,
		Up:        v24_up_endpoint_settings_to_25,
		Down:      v24_down_endpoint_settings_to_25,
		Name:      "endpoint settings to 25",
	})
}

func v24_up_endpoint_settings_to_25() error {
	logrus.Info("Updating endpoint settings")
	settings, err := migrator.store.SettingsService.Settings()
	if err != nil {
		return err
	}

	endpoints, err := migrator.store.EndpointService.Endpoints()
	if err != nil {
		return err
	}

	for i := range endpoints {
		endpoint := endpoints[i]

		securitySettings := portainer.EndpointSecuritySettings{}

		if endpoint.Type == portainer.EdgeAgentOnDockerEnvironment ||
			endpoint.Type == portainer.AgentOnDockerEnvironment ||
			endpoint.Type == portainer.DockerEnvironment {

			securitySettings = portainer.EndpointSecuritySettings{
				AllowBindMountsForRegularUsers:            settings.AllowBindMountsForRegularUsers,
				AllowContainerCapabilitiesForRegularUsers: settings.AllowContainerCapabilitiesForRegularUsers,
				AllowDeviceMappingForRegularUsers:         settings.AllowDeviceMappingForRegularUsers,
				AllowHostNamespaceForRegularUsers:         settings.AllowHostNamespaceForRegularUsers,
				AllowPrivilegedModeForRegularUsers:        settings.AllowPrivilegedModeForRegularUsers,
				AllowStackManagementForRegularUsers:       settings.AllowStackManagementForRegularUsers,
			}

			if endpoint.Type == portainer.AgentOnDockerEnvironment || endpoint.Type == portainer.EdgeAgentOnDockerEnvironment {
				securitySettings.AllowVolumeBrowserForRegularUsers = settings.AllowVolumeBrowserForRegularUsers
				securitySettings.EnableHostManagementFeatures = settings.EnableHostManagementFeatures
			}
		}

		endpoint.SecuritySettings = securitySettings

		err = migrator.store.EndpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}

func v24_down_endpoint_settings_to_25() error {
	return nil
}
