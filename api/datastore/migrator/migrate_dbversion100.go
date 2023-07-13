package migrator

import (
	"os"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/chisel/crypto"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/rs/zerolog/log"
)

func (m *Migrator) migrateDockerDesktopExtentionSetting() error {
	log.Info().Msg("updating docker desktop extention flag in settings")

	isDDExtension := false
	if _, ok := os.LookupEnv("DOCKER_EXTENSION"); ok {
		isDDExtension = true
	}

	settings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	settings.IsDockerDesktopExtension = isDDExtension

	return m.settingsService.UpdateSettings(settings)
}

func (m *Migrator) convertSeedToPrivateKeyForDB100() error {
	var serverInfo *portainer.TunnelServerInfo

	serverInfo, err := m.TunnelServerService.Info()
	if err != nil {
		if dataservices.IsErrObjectNotFound(err) {
			log.Info().Msg("ServerInfo object not found")
			return nil
		}
		log.Error().
			Err(err).
			Msg("Failed to read ServerInfo from DB")
		return err
	}

	if serverInfo.PrivateKeySeed != "" {
		key, err := crypto.GenerateGo119CompatibleKey(serverInfo.PrivateKeySeed)
		if err != nil {
			log.Error().
				Err(err).
				Msg("Failed to read ServerInfo from DB")
			return err
		}

		err = m.fileService.StoreChiselPrivateKey(key)
		if err != nil {
			log.Error().
				Err(err).
				Msg("Failed to save Chisel private key to disk")
			return err
		}
	} else {
		log.Info().Msg("PrivateKeySeed is blank")
	}

	serverInfo.PrivateKeySeed = ""
	err = m.TunnelServerService.UpdateInfo(serverInfo)
	if err != nil {
		log.Error().
			Err(err).
			Msg("Failed to clean private key seed in DB")
	} else {
		log.Info().Msg("Success to migrate private key seed to private key file")
	}
	return err
}
