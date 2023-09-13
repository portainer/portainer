package edgestacks

import (
	"fmt"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	edgestackutils "github.com/portainer/portainer/api/internal/edge/edgestacks"
	"github.com/rs/zerolog/log"
)

func (handler *Handler) updateStackVersion(stack *portainer.EdgeStack, deploymentType portainer.EdgeStackDeploymentType, config []byte, oldGitHash string, relatedEnvironmentsIDs []portainer.EndpointID) error {

	stack.Version = stack.Version + 1
	stack.Status = edgestackutils.NewStatus(stack.Status, relatedEnvironmentsIDs)

	return handler.storeStackFile(stack, deploymentType, config)
}

func (handler *Handler) storeStackFile(stack *portainer.EdgeStack, deploymentType portainer.EdgeStackDeploymentType, config []byte) error {

	if deploymentType != stack.DeploymentType {
		// deployment type was changed - need to delete all old files
		err := handler.FileService.RemoveDirectory(stack.ProjectPath)
		if err != nil {
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

	_, err := handler.FileService.StoreEdgeStackFileFromBytes(stackFolder, entryPoint, config)
	if err != nil {
		return fmt.Errorf("unable to persist updated Compose file with version on disk: %w", err)
	}

	return nil
}
