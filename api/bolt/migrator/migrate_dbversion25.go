package migrator

import (
	portainer "github.com/portainer/portainer/api"
)

func (m *Migrator) updateEndpointSettingsToDB25() error {
	settings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for i := range endpoints {
		endpoint := endpoints[i]
		endpoint.SecuritySettings = portainer.EndpointSecuritySettings{
			AllowBindMountsForRegularUsers:            settings.AllowBindMountsForRegularUsers,
			AllowContainerCapabilitiesForRegularUsers: settings.AllowContainerCapabilitiesForRegularUsers,
			AllowDeviceMappingForRegularUsers:         settings.AllowDeviceMappingForRegularUsers,
			AllowHostNamespaceForRegularUsers:         settings.AllowHostNamespaceForRegularUsers,
			AllowPrivilegedModeForRegularUsers:        settings.AllowPrivilegedModeForRegularUsers,
			AllowStackManagementForRegularUsers:       settings.AllowStackManagementForRegularUsers,
			AllowVolumeBrowserForRegularUsers:         settings.AllowVolumeBrowserForRegularUsers,
			EnableHostManagementFeatures:              settings.EnableHostManagementFeatures,
		}

		err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}
