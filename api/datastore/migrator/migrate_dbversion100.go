package migrator

import (
	"os"
	"time"

	portainer "github.com/portainer/portainer/api"
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

func (m *Migrator) updateEdgeStackStatusForDB100() error {
	edgeStacks, err := m.edgeStackService.EdgeStacks()
	if err != nil {
		return err
	}

	for _, edgeStack := range edgeStacks {
		statusArray := edgeStack.StatusArray
		if statusArray == nil {
			statusArray = make(map[portainer.EndpointID][]portainer.EdgeStackStatus)
		}
		for endpointID, endpointOldStatus := range edgeStack.Status {
			endpointStatusArray := statusArray[endpointID]
			if endpointOldStatus.Details.Pending {
				endpointStatusArray = append(endpointStatusArray, portainer.EdgeStackStatus{
					Type:       portainer.EdgeStackStatusPending,
					EndpointID: portainer.EndpointID(endpointID),
					Time:       time.Now().Unix(),
				})
			}

			if endpointOldStatus.Details.Acknowledged {
				endpointStatusArray = append(endpointStatusArray, portainer.EdgeStackStatus{
					Type:       portainer.EdgeStackStatusAcknowledged,
					EndpointID: portainer.EndpointID(endpointID),
					Time:       time.Now().Unix(),
				})
			}

			if endpointOldStatus.Details.Error {
				endpointStatusArray = append(endpointStatusArray, portainer.EdgeStackStatus{
					Type:       portainer.EdgeStackStatusError,
					EndpointID: portainer.EndpointID(endpointID),
					Error:      endpointOldStatus.Error,
					Time:       time.Now().Unix(),
				})
			}

			if endpointOldStatus.Details.Ok {
				endpointStatusArray = append(endpointStatusArray, portainer.EdgeStackStatus{
					Type:       portainer.EdgeStackStatusDeploymentReceived,
					EndpointID: portainer.EndpointID(endpointID),
					Time:       time.Now().Unix(),
				})
			}

			if endpointOldStatus.Details.ImagesPulled {
				endpointStatusArray = append(endpointStatusArray, portainer.EdgeStackStatus{
					Type:       portainer.EdgeStackStatusImagesPulled,
					EndpointID: portainer.EndpointID(endpointID),
					Time:       time.Now().Unix(),
				})
			}

			if endpointOldStatus.Details.Remove {
				endpointStatusArray = append(endpointStatusArray, portainer.EdgeStackStatus{
					Type:       portainer.EdgeStackStatusRemoving,
					EndpointID: portainer.EndpointID(endpointID),
					Time:       time.Now().Unix(),
				})
			}

			statusArray[endpointID] = endpointStatusArray
		}

		edgeStack.StatusArray = statusArray

		err = m.edgeStackService.UpdateEdgeStack(edgeStack.ID, &edgeStack)
		if err != nil {
			return err
		}
	}

	return nil
}
