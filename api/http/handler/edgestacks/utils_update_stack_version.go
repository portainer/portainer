package edgestacks

import (
	"fmt"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"

	"github.com/rs/zerolog/log"
)

func (handler *Handler) updateStackVersion(tx dataservices.DataStoreTx, stack *portainer.EdgeStack, deploymentType portainer.EdgeStackDeploymentType, config []byte, oldGitHash string, relatedEnvironmentsIDs []portainer.EndpointID) error {
	stack.Version++

	if err := tx.EdgeStackStatus().Clear(stack.ID, relatedEnvironmentsIDs); err != nil {
		return err
	}

	return handler.storeStackFile(stack, deploymentType, config)
}

func (handler *Handler) storeStackFile(stack *portainer.EdgeStack, deploymentType portainer.EdgeStackDeploymentType, config []byte) error {
	if deploymentType != stack.DeploymentType {
		// deployment type was changed - need to delete all old files
		if err := handler.FileService.RemoveDirectory(stack.ProjectPath); err != nil {
			log.Warn().Err(err).Msg("Unable to clear old files")
		}

		stack.EntryPoint = ""
		stack.ManifestPath = ""
		stack.DeploymentType = deploymentType
	}

	stackFolder := strconv.Itoa(int(stack.ID))
	entryPoint := ""
	if deploymentType == portainer.EdgeStackDeploymentCompose {
		if stack.EntryPoint == "" {
			stack.EntryPoint = filesystem.ComposeFileDefaultName
		}

		entryPoint = stack.EntryPoint
	}

	if deploymentType == portainer.EdgeStackDeploymentKubernetes {
		if stack.ManifestPath == "" {
			stack.ManifestPath = filesystem.ManifestFileDefaultName
		}

		entryPoint = stack.ManifestPath
	}

	if _, err := handler.FileService.StoreEdgeStackFileFromBytes(stackFolder, entryPoint, config); err != nil {
		return fmt.Errorf("unable to persist updated Compose file with version on disk: %w", err)
	}

	return nil
}
