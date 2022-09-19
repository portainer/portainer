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

const (
	// mustacheUpdateEdgeStackTemplateFile represents the name of the edge stack template file for edge updates
	mustacheUpdateEdgeStackTemplateFile = "edge-update.yml.mustache"
)

func (handler *Handler) validateUniqueName(name string, id updateschedule.UpdateScheduleID) error {
	list, err := handler.dataStore.EdgeUpdateSchedule().List()
	if err != nil {
		return errors.WithMessage(err, "Unable to list edge update schedules")
	}

	for _, schedule := range list {
		if id != schedule.ID && schedule.Name == name {
			return errors.New("Edge update schedule name already in use")
		}
	}

	return nil
}

func (handler *Handler) createUpdateEdgeStack(scheduleID updateschedule.UpdateScheduleID, name string, groupIDs []portainer.EdgeGroupID, version string) (portainer.EdgeStackID, error) {
	agentImagePrefix := os.Getenv("AGENT_IMAGE_PREFIX")
	if agentImagePrefix == "" {
		agentImagePrefix = "portainer/agent"
	}

	agentImage := fmt.Sprintf("%s:%s", agentImagePrefix, version)

	stack, err := stacks.CreateEdgeStack(handler.dataStore, buildEdgeStackName(scheduleID, name), portainer.EdgeStackDeploymentCompose, groupIDs, func(stackFolder string, relatedEndpointIds []portainer.EndpointID) (composePath string, manifestPath string, projectPath string, err error) {
		templateName := path.Join(handler.assetsPath, mustacheUpdateEdgeStackTemplateFile)
		skipPullAgentImage := false
		env := os.Getenv("EDGE_UPDATE_SKIP_PULL_AGENT_IMAGE")
		if env != "" {
			skipPullAgentImage = true
		}

		composeFile, err := mustache.RenderFile(templateName, map[string]string{
			"image_name":            agentImage,
			"schedule_id":           strconv.Itoa(int(scheduleID)),
			"skip_pull_agent_image": strconv.FormatBool(skipPullAgentImage),
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
