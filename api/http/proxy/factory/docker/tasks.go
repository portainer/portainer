package docker

import (
	"errors"
	"net/http"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/responseutils"
)

const (
	taskObjectServiceIdentifier = "ServiceID"
)

// taskListOperation extracts the response as a JSON object, loop through the tasks array
// and filter the tasks based on resource controls before rewriting the response
func taskListOperation(response *http.Response, executor *operationExecutor) error {
	var err error

	// TaskList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/TaskList
	responseArray, err := responseutils.GetResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if !executor.operationContext.isAdmin && !executor.operationContext.endpointResourceAccess {
		responseArray, err = filterTaskList(responseArray, executor.operationContext)
		if err != nil {
			return err
		}
	}

	return responseutils.RewriteResponse(response, responseArray, http.StatusOK)
}

// findContainerResourceControl will search for a resource control object associated to the container or
// inherited from another resource (based on labels) in the following order: a Swarm service, a Swarm stack or a Compose stack.
// If no resource control is found, it will search for Portainer specific resource control labels and will generate
// a resource control based on these if they exist. Public access control label take precedence over user/team access control labels.
func findTaskServiceResourceControl(responseObject map[string]interface{}, resourceControls []portainer.ResourceControl) *portainer.ResourceControl {
	serviceID := responseObject[taskObjectServiceIdentifier].(string)

	resourceControl := portainer.GetResourceControlByResourceIDAndType(serviceID, portainer.ServiceResourceControl, resourceControls)
	if resourceControl != nil {
		return resourceControl
	}

	taskLabels := selectorTaskLabels(responseObject)
	if taskLabels != nil {
		if taskLabels[resourceLabelForDockerSwarmStackName] != nil {
			inheritedSwarmStackIdentifier := taskLabels[resourceLabelForDockerSwarmStackName].(string)
			resourceControl = portainer.GetResourceControlByResourceIDAndType(inheritedSwarmStackIdentifier, portainer.StackResourceControl, resourceControls)

			if resourceControl != nil {
				return resourceControl
			}
		}
	}

	return nil
}

// selectorTaskLabels retrieve the Labels of the task if present.
// Task schema reference: https://docs.docker.com/engine/api/v1.28/#operation/TaskList
func selectorTaskLabels(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Spec.ContainerSpec.Labels
	taskSpecObject := responseutils.GetJSONObject(responseObject, "Spec")
	if taskSpecObject != nil {
		containerSpecObject := responseutils.GetJSONObject(taskSpecObject, "ContainerSpec")
		if containerSpecObject != nil {
			return responseutils.GetJSONObject(containerSpecObject, "Labels")
		}
	}
	return nil
}

// filterTaskList loops through all tasks and filters public tasks (no associated resource control)
// as well as authorized tasks (access granted to the user based on existing resource control).
// Resource controls checks are based on: service identifier, stack identifier (from label).
// Task object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/TaskList
// any resource control giving access to the user based on the associated service identifier.
func filterTaskList(taskData []interface{}, context *restrictedDockerOperationContext) ([]interface{}, error) {
	filteredTaskData := make([]interface{}, 0)

	for _, task := range taskData {
		taskObject := task.(map[string]interface{})
		if taskObject[taskObjectServiceIdentifier] == nil {
			return nil, errors.New("docker service task identifier not found")
		}

		resourceControl := findTaskServiceResourceControl(taskObject, context.resourceControls)

		if resourceControl == nil {
			if context.isAdmin || context.endpointResourceAccess {
				filteredTaskData = append(filteredTaskData, taskObject)
			}
			continue
		}

		if context.isAdmin || context.endpointResourceAccess || portainer.UserCanAccessResource(context.userID, context.userTeamIDs, resourceControl) {
			taskObject = decorateObject(taskObject, resourceControl)
			filteredTaskData = append(filteredTaskData, taskObject)
		}
	}

	return filteredTaskData, nil
}
