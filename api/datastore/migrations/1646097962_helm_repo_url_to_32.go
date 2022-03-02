package migrations

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrations/types"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   31,
		Timestamp: 1646097962,
		Up:        v31_up_helm_repo_url_to_32,
		Down:      v31_down_helm_repo_url_to_32,
		Name:      "helm repo url to 32",
	})
}

func v31_up_helm_repo_url_to_32() error {
	settings, err := migrator.store.SettingsService.Settings()
	if err != nil {
		return err
	}
	settings.HelmRepositoryURL = portainer.DefaultHelmRepositoryURL
	return migrator.store.SettingsService.UpdateSettings(settings)
}

func v31_down_helm_repo_url_to_32() error {
	return nil
}
