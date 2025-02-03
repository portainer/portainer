package edgestacks

import (
	"errors"
	"fmt"
	"net/http"
	"slices"
	"strconv"
	"time"

	portainer "github.com/portainer/portainer/api"
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

	updateFn := func(stack *portainer.EdgeStack) (*portainer.EdgeStack, error) {
		return handler.updateEdgeStackStatus(stack, stack.ID, payload)
	}

	stack, err := handler.stackCoordinator.UpdateStatus(r, portainer.EdgeStackID(stackID), updateFn)
	if err != nil {
		var httpErr *httperror.HandlerError
		if errors.As(err, &httpErr) {
			return httpErr
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	if ok, _ := strconv.ParseBool(r.Header.Get("X-Portainer-No-Body")); ok {
		return nil
	}

	return response.JSON(w, stack)
}

func (handler *Handler) updateEdgeStackStatus(stack *portainer.EdgeStack, stackID portainer.EdgeStackID, payload updateStatusPayload) (*portainer.EdgeStack, error) {
	if payload.Version > 0 && payload.Version < stack.Version {
		return stack, nil
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

	if containsStatus := slices.ContainsFunc(environmentStatus.Status, func(e portainer.EdgeStackDeploymentStatus) bool {
		return e.Type == deploymentStatus.Type
	}); !containsStatus {
		environmentStatus.Status = append(environmentStatus.Status, deploymentStatus)
	}

	stack.Status[environmentId] = environmentStatus
}
