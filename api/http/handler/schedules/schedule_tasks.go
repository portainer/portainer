package schedules

import (
	"encoding/json"
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
	Labels     map[string]string    `json:"Labels"`
}

// GET request on /api/schedules/:id/tasks
func (handler *Handler) scheduleTasks(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Unable to retrieve settings", err}
	}
	if !settings.EnableHostManagementFeatures {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Host management features are disabled", portainer.ErrHostManagementFeaturesDisabled}
	}

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

	for _, endpointID := range schedule.ScriptExecutionJob.Endpoints {
		endpoint, err := handler.EndpointService.Endpoint(endpointID)
		if err == portainer.ErrObjectNotFound {
			continue
		} else if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
		}

		endpointTasks, err := extractTasksFromContainerSnasphot(endpoint, schedule.ID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find extract schedule tasks from endpoint snapshot", err}
		}

		tasks = append(tasks, endpointTasks...)
	}

	return response.JSON(w, tasks)
}

func extractTasksFromContainerSnasphot(endpoint *portainer.Endpoint, scheduleID portainer.ScheduleID) ([]taskContainer, error) {
	endpointTasks := make([]taskContainer, 0)
	if len(endpoint.Snapshots) == 0 {
		return endpointTasks, nil
	}

	b, err := json.Marshal(endpoint.Snapshots[0].SnapshotRaw.Containers)
	if err != nil {
		return nil, err
	}

	var containers []taskContainer
	err = json.Unmarshal(b, &containers)
	if err != nil {
		return nil, err
	}

	for _, container := range containers {
		if container.Labels["io.portainer.schedule.id"] == strconv.Itoa(int(scheduleID)) {
			container.EndpointID = endpoint.ID
			endpointTasks = append(endpointTasks, container)
		}
	}

	return endpointTasks, nil
}
