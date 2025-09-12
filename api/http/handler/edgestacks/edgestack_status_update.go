package edgestacks

import (
	"errors"
	"fmt"
	"net/http"
	"slices"
	"strconv"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type updateStatusPayload struct {
	Error      string
	Status     *portainer.EdgeStackStatusType
	EndpointID portainer.EndpointID
	Time       int64
	Version    int
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

	endpoint, err := handler.DataStore.Endpoint().Endpoint(payload.EndpointID)
	if err != nil {
		return handlerDBErr(fmt.Errorf("unable to find the environment from the database: %w. Environment ID: %d", err, payload.EndpointID), "unable to find the environment")
	}

	if err := handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint); err != nil {
		return httperror.Forbidden("Permission denied to access environment", fmt.Errorf("unauthorized edge endpoint operation: %w. Environment name: %s", err, endpoint.Name))
	}

	var stack *portainer.EdgeStack

	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		var err error
		stack, err = tx.EdgeStack().EdgeStack(portainer.EdgeStackID(stackID))
		if err != nil {
			if dataservices.IsErrObjectNotFound(err) {
				return nil
			}

			return httperror.InternalServerError("Unable to retrieve Edge stack from the database", err)
		}

		if err := handler.updateEdgeStackStatus(tx, stack, stack.ID, payload); err != nil {
			return httperror.InternalServerError("Unable to update Edge stack status", err)
		}

		return nil
	}); err != nil {
		return response.TxErrorResponse(err)
	}

	if ok, _ := strconv.ParseBool(r.Header.Get("X-Portainer-No-Body")); ok {
		return nil
	}

	if err := fillEdgeStackStatus(handler.DataStore, stack); err != nil {
		return handlerDBErr(err, "Unable to retrieve edge stack status from the database")
	}

	return response.JSON(w, stack)
}

func (handler *Handler) updateEdgeStackStatus(tx dataservices.DataStoreTx, stack *portainer.EdgeStack, stackID portainer.EdgeStackID, payload updateStatusPayload) error {
	if payload.Version > 0 && payload.Version < stack.Version {
		return nil
	}

	status := *payload.Status

	deploymentStatus := portainer.EdgeStackDeploymentStatus{
		Type:  status,
		Error: payload.Error,
		Time:  payload.Time,
	}

	if deploymentStatus.Type == portainer.EdgeStackStatusRemoved {
		return tx.EdgeStackStatus().Delete(stackID, payload.EndpointID)
	}

	environmentStatus, err := tx.EdgeStackStatus().Read(stackID, payload.EndpointID)
	if err != nil && !tx.IsErrObjectNotFound(err) {
		return err
	} else if tx.IsErrObjectNotFound(err) {
		environmentStatus = &portainer.EdgeStackStatusForEnv{
			EndpointID: payload.EndpointID,
			Status:     []portainer.EdgeStackDeploymentStatus{},
		}
	}

	if containsStatus := slices.ContainsFunc(environmentStatus.Status, func(e portainer.EdgeStackDeploymentStatus) bool {
		return e.Type == deploymentStatus.Type
	}); !containsStatus {
		environmentStatus.Status = append(environmentStatus.Status, deploymentStatus)
	}

	return tx.EdgeStackStatus().Update(stackID, payload.EndpointID, environmentStatus)
}
