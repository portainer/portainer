package edgejobs

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type edgeJobUpdatePayload struct {
	Name           *string
	CronExpression *string
	Recurring      *bool
	Endpoints      []portainer.EndpointID
	FileContent    *string
}

func (payload *edgeJobUpdatePayload) Validate(r *http.Request) error {
	if payload.Name != nil && !govalidator.Matches(*payload.Name, `^[a-zA-Z0-9][a-zA-Z0-9_.-]+$`) {
		return errors.New("Invalid Edge job name format. Allowed characters are: [a-zA-Z0-9_.-]")
	}
	return nil
}

func (handler *Handler) edgeJobUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
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

	var payload edgeJobUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	edgeJob, err := handler.DataStore.EdgeJob().EdgeJob(portainer.EdgeJobID(edgeJobID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an Edge job with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an Edge job with the specified identifier inside the database", err}
	}

	err = handler.updateEdgeSchedule(edgeJob, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update Edge job", err}
	}

	err = handler.DataStore.EdgeJob().UpdateEdgeJob(edgeJob.ID, edgeJob)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist Edge job changes inside the database", err}
	}

	return response.JSON(w, edgeJob)
}

func (handler *Handler) updateEdgeSchedule(edgeJob *portainer.EdgeJob, payload *edgeJobUpdatePayload) error {
	if payload.Name != nil {
		edgeJob.Name = *payload.Name
	}

	if payload.Endpoints != nil {

		endpointIDs := make([]portainer.EndpointID, 0)

		for _, ID := range payload.Endpoints {
			endpoint, err := handler.DataStore.Endpoint().Endpoint(ID)
			if err != nil {
				return err
			}

			if endpoint.Type == portainer.EdgeAgentEnvironment {
				endpointIDs = append(endpointIDs, endpoint.ID)
			}
		}

		edgeJob.Endpoints = endpointIDs
	}

	updateVersion := false
	if payload.CronExpression != nil {
		edgeJob.CronExpression = *payload.CronExpression
		updateVersion = true
	}

	if payload.FileContent != nil {
		_, err := handler.FileService.StoreEdgeJobFileFromBytes(strconv.Itoa(int(edgeJob.ID)), []byte(*payload.FileContent))
		if err != nil {
			return err
		}

		updateVersion = true
	}

	if payload.Recurring != nil {
		edgeJob.Recurring = *payload.Recurring
		updateVersion = true
	}

	if updateVersion {
		edgeJob.Version++
	}

	for _, endpointID := range edgeJob.Endpoints {
		handler.ReverseTunnelService.AddEdgeJob(endpointID, edgeJob)
	}

	return nil
}
