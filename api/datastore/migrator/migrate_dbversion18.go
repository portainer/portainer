package migrator

import portainer "github.com/portainer/portainer/api"

func (m *Migrator) updateSettingsToDBVersion19() error {
	migrateLog.Info("- updating settings")
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	if legacySettings.EdgeAgentCheckinInterval == 0 {
		legacySettings.EdgeAgentCheckinInterval = portainer.DefaultEdgeAgentCheckinIntervalInSeconds
	}

	return m.settingsService.UpdateSettings(legacySettings)
}
