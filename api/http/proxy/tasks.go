package proxy

import (
	"net/http"

	"github.com/portainer/portainer/api"
)

const (
	// ErrDockerTaskServiceIdentifierNotFound defines an error raised when Portainer is unable to find the service identifier associated to a task
	ErrDockerTaskServiceIdentifierNotFound = portainer.Error("Docker task service identifier not found")
	taskServiceIdentifier                  = "ServiceID"
	taskLabelForStackIdentifier            = "com.docker.stack.namespace"
)

// taskListOperation extracts the response as a JSON object, loop through the tasks array
// and filter the tasks based on resource controls before rewriting the response
func taskListOperation(response *http.Response, executor *operationExecutor) error {
	var err error

	// TaskList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/TaskList
	responseArray, err := getResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if !executor.operationContext.isAdmin && !executor.operationContext.endpointResourceAccess {
		responseArray, err = filterTaskList(responseArray, executor.operationContext)
		if err != nil {
			return err
		}
	}

	return rewriteResponse(response, responseArray, http.StatusOK)
}

// extractTaskLabelsFromTaskListObject retrieve the Labels of the task if present.
// Task schema reference: https://docs.docker.com/engine/api/v1.28/#operation/TaskList
func extractTaskLabelsFromTaskListObject(responseObject map[string]interface{}) map[string]interface{} {
	// Labels are stored under Spec.ContainerSpec.Labels
	taskSpecObject := extractJSONField(responseObject, "Spec")
	if taskSpecObject != nil {
		containerSpecObject := extractJSONField(taskSpecObject, "ContainerSpec")
		if containerSpecObject != nil {
			return extractJSONField(containerSpecObject, "Labels")
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
		if taskObject[taskServiceIdentifier] == nil {
			return nil, ErrDockerTaskServiceIdentifierNotFound
		}

		serviceID := taskObject[taskServiceIdentifier].(string)
		taskObject, access := applyResourceAccessControl(taskObject, serviceID, context)
		if !access {
			taskLabels := extractTaskLabelsFromTaskListObject(taskObject)
			taskObject, access = applyResourceAccessControlFromLabel(taskLabels, taskObject, taskLabelForStackIdentifier, context)
		}

		if access {
			filteredTaskData = append(filteredTaskData, taskObject)
		}
	}

	return filteredTaskData, nil
}
