package edgestacks

import (
	"errors"
	"net/http"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/pkg/featureflags"
	"github.com/rs/zerolog/log"

	"github.com/asaskevich/govalidator"
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

	if *payload.Status == portainer.EdgeStackStatusError && govalidator.IsNull(payload.Error) {
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
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	var stack *portainer.EdgeStack
	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		stack, err = handler.updateEdgeStackStatus(handler.DataStore, r, portainer.EdgeStackID(stackID), payload)
	} else {
		err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			stack, err = handler.updateEdgeStackStatus(tx, r, portainer.EdgeStackID(stackID), payload)
			return err
		})
	}

	if err != nil {
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
			log.Warn().
				Err(err).
				Int("stackID", int(stackID)).
				Int("status", int(*payload.Status)).
				Msg("Unable to find a stack inside the database, skipping error")
			return nil, nil
		}

		return nil, err
	}

	endpoint, err := tx.Endpoint().Endpoint(payload.EndpointID)
	if err != nil {
		return nil, handler.handlerDBErr(err, "Unable to find an environment with the specified identifier inside the database")
	}

	err = handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint)
	if err != nil {
		return nil, httperror.Forbidden("Permission denied to access environment", err)
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

	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		err = tx.EdgeStack().UpdateEdgeStackFunc(stackID, func(edgeStack *portainer.EdgeStack) {
			updateEnvStatus(payload.EndpointID, edgeStack, deploymentStatus)

			stack = edgeStack
		})
		if err != nil {
			return nil, handler.handlerDBErr(err, "Unable to persist the stack changes inside the database")
		}
	} else {
		updateEnvStatus(payload.EndpointID, stack, deploymentStatus)

		err = tx.EdgeStack().UpdateEdgeStack(stackID, stack)
		if err != nil {
			return nil, handler.handlerDBErr(err, "Unable to persist the stack changes inside the database")
		}
	}

	return stack, nil
}

func updateEnvStatus(environmentId portainer.EndpointID, stack *portainer.EdgeStack, deploymentStatus portainer.EdgeStackDeploymentStatus) {
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
