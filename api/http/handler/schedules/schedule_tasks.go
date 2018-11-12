package schedules

import (
	"errors"
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
)

type taskContainer struct {
	ID         string               `json:"Id"`
	EndpointID portainer.EndpointID `json:"EndpointId"`
	Status     string               `json:"Status"`
	Created    float64              `json:"Created"`
}

// GET request on /api/schedules/:id/tasks
func (handler *Handler) scheduleTasks(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	scheduleID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid schedule identifier route variable", err}
	}

	schedule, err := handler.ScheduleService.Schedule(portainer.ScheduleID(scheduleID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a schedule with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a schedule with the specified identifier inside the database", err}
	}

	if schedule.JobType != portainer.ScriptExecutionJobType {
		return &httperror.HandlerError{http.StatusBadRequest, "Unable to retrieve schedule tasks", errors.New("This type of schedule do not have any associated tasks")}
	}

	tasks := make([]taskContainer, 0)

	for _, endpointId := range schedule.ScriptExecutionJob.Endpoints {
		endpoint, err := handler.EndpointService.Endpoint(endpointId)
		if err == portainer.ErrObjectNotFound {
			continue
		} else if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
		}

		endpointTasks := extractTasksFromSnasphot(endpoint, schedule.ID)
		tasks = append(tasks, endpointTasks...)
	}

	return response.JSON(w, tasks)
}

// FIXME: refactor
func extractTasksFromSnasphot(endpoint *portainer.Endpoint, scheduleID portainer.ScheduleID) []taskContainer {
	endpointTasks := make([]taskContainer, 0)
	if len(endpoint.Snapshots) == 0 {
		return endpointTasks
	}

	containerList := endpoint.Snapshots[0].SnapshotRaw.Containers.([]interface{})

	for _, container := range containerList {
		containerObject := container.(map[string]interface{})

		labelsObject := containerObject["Labels"]
		if labelsObject != nil {
			labels := labelsObject.(map[string]interface{})

			scheduleIdLabel := labels["io.portainer.schedule.id"]

			if scheduleIdLabel != nil && scheduleIdLabel.(string) == strconv.Itoa(int(scheduleID)) {
				task := taskContainer{
					ID:         containerObject["Id"].(string),
					EndpointID: endpoint.ID,
					Status:     containerObject["Status"].(string),
					Created:    containerObject["Created"].(float64),
				}
				endpointTasks = append(endpointTasks, task)
			}
		}
	}

	return endpointTasks
}
