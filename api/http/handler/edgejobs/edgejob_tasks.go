package edgejobs

import (
	"fmt"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type taskContainer struct {
	ID         string               `json:"Id"`
	EndpointID portainer.EndpointID `json:"EndpointId"`
	Status     string               `json:"Status"`
	Created    float64              `json:"Created"`
	Labels     map[string]string    `json:"Labels"`
	Edge       bool                 `json:"Edge"`
}

// GET request on /api/edge_jobs/:id/tasks
func (handler *Handler) edgeJobTasks(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Unable to retrieve settings", err}
	}

	if !settings.EnableEdgeComputeFeatures {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Edge compute features are disabled", portainer.ErrHostManagementFeaturesDisabled}
	}

	edgeJobID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid Edge job identifier route variable", err}
	}

	edgeJob, err := handler.DataStore.EdgeJob().EdgeJob(portainer.EdgeJobID(edgeJobID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an Edge job with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an Edge job with the specified identifier inside the database", err}
	}

	tasks := make([]taskContainer, 0)

	for _, endpointID := range edgeJob.Endpoints {

		cronTask := taskContainer{
			ID:         fmt.Sprintf("edgejob_task_%d_%d", edgeJob.ID, endpointID),
			EndpointID: endpointID,
			Edge:       true,
			Status:     "",
			Created:    0,
			Labels:     map[string]string{},
		}

		tasks = append(tasks, cronTask)
	}

	return response.JSON(w, tasks)
}
