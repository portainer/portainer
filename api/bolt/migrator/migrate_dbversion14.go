package migrator

import (
	"strings"

	"github.com/portainer/portainer/api"
)

func (m *Migrator) updateSettingsToDBVersion15() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.EnableHostManagementFeatures = false
	return m.settingsService.UpdateSettings(legacySettings)
}

func (m *Migrator) updateTemplatesToVersion15() error {
	legacyTemplates, err := m.templateService.Templates()
	if err != nil {
		return err
	}

	for _, template := range legacyTemplates {
		template.Logo = strings.Replace(template.Logo, "https://portainer.io/images", portainer.AssetsServerURL, -1)

		err = m.templateService.UpdateTemplate(template.ID, &template)
		if err != nil {
			return err
		}
	}

	return nil
}
