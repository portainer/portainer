package migrations

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrations/types"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   31,
		Timestamp: 1646097944,
		Up:        v31_up_kubeconfig_expiry_to_32,
		Down:      v31_down_kubeconfig_expiry_to_32,
		Name:      "kubeconfig expiry to 32",
	})
}

func v31_up_kubeconfig_expiry_to_32() error {
	settings, err := migrator.store.SettingsService.Settings()
	if err != nil {
		return err
	}
	settings.KubeconfigExpiry = portainer.DefaultKubeconfigExpiry
	return migrator.store.SettingsService.UpdateSettings(settings)
}

func v31_down_kubeconfig_expiry_to_32() error {
	return nil
}
