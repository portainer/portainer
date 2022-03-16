package migrator

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
)

func (m *Migrator) migrateDBVersionToDB33() error {
	if err := m.migrateSettingsToDB33(); err != nil {
		return err
	}

	return m.validateSettingsToDB33()
}

func (m *Migrator) migrateSettingsToDB33() error {
	settings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	migrateLog.Info("Setting default kubectl shell image")
	settings.KubectlShellImage = portainer.DefaultKubectlShellImage
	return m.settingsService.UpdateSettings(settings)
}

func (m *Migrator) validateSettingsToDB33() error {
	settings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	if settings.KubectlShellImage != portainer.DefaultKubectlShellImage {
		return fmt.Errorf("settings KubectlShellImage is not same as portainer.DefaultKubectlShellImage")
	}

	return nil
}
