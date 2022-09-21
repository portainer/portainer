package edgeupdateschedules

import (
	"fmt"
	"os"
	"path"
	"strconv"

	"github.com/cbroglie/mustache"
	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edge/stacks"
	"github.com/portainer/portainer/api/edge/updateschedule"
	"github.com/portainer/portainer/api/filesystem"
)

func (handler *Handler) createUpdateEdgeStack(scheduleID updateschedule.UpdateScheduleID, name string, groupIDs []portainer.EdgeGroupID, version string) (portainer.EdgeStackID, error) {
	agentImagePrefix := os.Getenv("AGENT_IMAGE_PREFIX")
	if agentImagePrefix == "" {
		agentImagePrefix = "portainer/agent"
	}

	agentImage := fmt.Sprintf("%s:%s", agentImagePrefix, version)

	stack, err := stacks.CreateEdgeStack(handler.dataStore, buildEdgeStackName(scheduleID, name), portainer.EdgeStackDeploymentCompose, groupIDs, func(stackFolder string, relatedEndpointIds []portainer.EndpointID) (composePath string, manifestPath string, projectPath string, err error) {
		templateName := path.Join(handler.assetsPath, mustacheUpdateEdgeStackTemplateFile)
		skipPullAgentImage := ""
		env := os.Getenv("EDGE_UPDATE_SKIP_PULL_AGENT_IMAGE")
		if env != "" {
			skipPullAgentImage = "1"
		}

		composeFile, err := mustache.RenderFile(templateName, map[string]string{
			"image_name":            agentImage,
			"schedule_id":           strconv.Itoa(int(scheduleID)),
			"skip_pull_agent_image": skipPullAgentImage,
		})

		if err != nil {
			return "", "", "", errors.WithMessage(err, "failed to render edge stack template")
		}

		composePath = filesystem.ComposeFileDefaultName

		projectPath, err = handler.fileService.StoreEdgeStackFileFromBytes(stackFolder, composePath, []byte(composeFile))
		if err != nil {
			return "", "", "", err
		}

		return composePath, "", projectPath, nil
	})

	if err != nil {
		return 0, err
	}

	return stack.ID, nil
}
