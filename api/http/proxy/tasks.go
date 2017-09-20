package proxy

import (
	"net/http"

	"github.com/portainer/portainer"
)

const (
	// ErrDockerTaskServiceIdentifierNotFound defines an error raised when Portainer is unable to find the service identifier associated to a task
	ErrDockerTaskServiceIdentifierNotFound = portainer.Error("Docker task service identifier not found")
	taskServiceIdentifier                  = "ServiceID"
)

// taskListOperation extracts the response as a JSON object, loop through the tasks array
// and filter the tasks based on resource controls before rewriting the response
func taskListOperation(request *http.Request, response *http.Response, executor *operationExecutor) error {
	var err error

	// TaskList response is a JSON array
	// https://docs.docker.com/engine/api/v1.28/#operation/TaskList
	responseArray, err := getResponseAsJSONArray(response)
	if err != nil {
		return err
	}

	if !executor.operationContext.isAdmin {
		responseArray, err = filterTaskList(responseArray, executor.operationContext.resourceControls,
			executor.operationContext.userID, executor.operationContext.userTeamIDs)
		if err != nil {
			return err
		}
	}

	return rewriteResponse(response, responseArray, http.StatusOK)
}
