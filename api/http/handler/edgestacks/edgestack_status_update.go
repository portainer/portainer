package edgestacks

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/rs/zerolog/log"
)

type updateStatusPayload struct {
	Error      string
	Status     *portainer.EdgeStackStatusType
	EndpointID portainer.EndpointID
	Time       int64
}

func (payload *updateStatusPayload) Validate(r *http.Request) error {
	if payload.Status == nil {
		return errors.New("invalid status")
	}

	if payload.EndpointID == 0 {
		return errors.New("invalid EnvironmentID")
	}

	if *payload.Status == portainer.EdgeStackStatusError && len(payload.Error) == 0 {
		return errors.New("error message is mandatory when status is error")
	}

	if payload.Time == 0 {
		payload.Time = time.Now().Unix()
	}

	return nil
}

// @id EdgeStackStatusUpdate
// @summary Update an EdgeStack status
// @description Authorized only if the request is done by an Edge Environment(Endpoint)
// @tags edge_stacks
// @accept json
// @produce json
// @param id path int true "EdgeStack Id"
// @param body body updateStatusPayload true "EdgeStack status payload"
// @success 200 {object} portainer.EdgeStack
// @failure 500
// @failure 400
// @failure 404
// @failure 403
// @router /edge_stacks/{id}/status [put]
func (handler *Handler) edgeStackStatusUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	var payload updateStatusPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", fmt.Errorf("edge polling error: %w. Environment ID: %d", err, payload.EndpointID))
	}

	var stack *portainer.EdgeStack
	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		stack, err = handler.updateEdgeStackStatus(tx, r, portainer.EdgeStackID(stackID), payload)
		return err
	}); err != nil {
		var httpErr *httperror.HandlerError
		if errors.As(err, &httpErr) {
			return httpErr
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return response.JSON(w, stack)
}

func (handler *Handler) updateEdgeStackStatus(tx dataservices.DataStoreTx, r *http.Request, stackID portainer.EdgeStackID, payload updateStatusPayload) (*portainer.EdgeStack, error) {
	stack, err := tx.EdgeStack().EdgeStack(stackID)
	if err != nil {
		if dataservices.IsErrObjectNotFound(err) {
			// skip error because agent tries to report on deleted stack
			log.Debug().
				Err(err).
				Int("stackID", int(stackID)).
				Int("status", int(*payload.Status)).
				Msg("Unable to find a stack inside the database, skipping error")
			return nil, nil
		}

		return nil, fmt.Errorf("unable to retrieve Edge stack from the database: %w. Environment ID: %d", err, payload.EndpointID)
	}

	endpoint, err := tx.Endpoint().Endpoint(payload.EndpointID)
	if err != nil {
		return nil, handler.handlerDBErr(fmt.Errorf("unable to find the environment from the database: %w. Environment ID: %d", err, payload.EndpointID), "unable to find the environment")
	}

	if err := handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint); err != nil {
		return nil, httperror.Forbidden("Permission denied to access environment", fmt.Errorf("unauthorized edge endpoint operation: %w. Environment name: %s", err, endpoint.Name))
	}

	status := *payload.Status

	log.Debug().
		Int("stackID", int(stackID)).
		Int("status", int(status)).
		Msg("Updating stack status")

	deploymentStatus := portainer.EdgeStackDeploymentStatus{
		Type:  status,
		Error: payload.Error,
		Time:  payload.Time,
	}

	updateEnvStatus(payload.EndpointID, stack, deploymentStatus)

	if err := tx.EdgeStack().UpdateEdgeStack(stackID, stack); err != nil {
		return nil, handler.handlerDBErr(fmt.Errorf("unable to update Edge stack to the database: %w. Environment name: %s", err, endpoint.Name), "unable to update Edge stack")
	}

	return stack, nil
}

func updateEnvStatus(environmentId portainer.EndpointID, stack *portainer.EdgeStack, deploymentStatus portainer.EdgeStackDeploymentStatus) {
	if deploymentStatus.Type == portainer.EdgeStackStatusRemoved {
		delete(stack.Status, environmentId)

		return
	}

	environmentStatus, ok := stack.Status[environmentId]
	if !ok {
		environmentStatus = portainer.EdgeStackStatus{
			EndpointID: environmentId,
			Status:     []portainer.EdgeStackDeploymentStatus{},
		}
	}

	environmentStatus.Status = append(environmentStatus.Status, deploymentStatus)

	stack.Status[environmentId] = environmentStatus
}
