package migrator

import portainer "github.com/portainer/portainer/api"

func (m *Migrator) migrateDBVersionToDB33() error {
	if err := m.migrateSettingsToDB33(); err != nil {
		return err
	}

	return nil
}

func (m *Migrator) migrateSettingsToDB33() error {
	settings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	settings.KubectlShellImage = portainer.DefaultKubectlShellImage
	return m.settingsService.UpdateSettings(settings)
}
