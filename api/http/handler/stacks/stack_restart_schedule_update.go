package stacks

import (
	"net/http"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/pkg/errors"
	"github.com/robfig/cron/v3"
	"github.com/rs/zerolog/log"
)

type updateStackRestartSchedulePayload struct {
	RestartSchedule *portainer.StackRestartSchedule `json:"RestartSchedule"`
}

func (payload *updateStackRestartSchedulePayload) Validate(r *http.Request) error {
	if payload.RestartSchedule == nil {
		return nil
	}

	payload.RestartSchedule.CronExpression = strings.TrimSpace(payload.RestartSchedule.CronExpression)
	if payload.RestartSchedule.CronExpression == "" {
		return httperrors.NewInvalidPayloadError("RestartSchedule.CronExpression must be provided")
	}

	if _, err := cron.ParseStandard(payload.RestartSchedule.CronExpression); err != nil {
		return httperrors.NewInvalidPayloadError("invalid RestartSchedule.CronExpression format")
	}

	return nil
}

// @id StackRestartScheduleUpdate
// @summary Update a stack restart schedule
// @description Update or clear a stack restart schedule.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Stack identifier"
// @param endpointId query int false "Environment identifier"
// @param body body updateStackRestartSchedulePayload true "Restart schedule details"
// @success 200 {object} portainer.Stack "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Not found"
// @failure 500 "Server error"
// @router /stacks/{id}/restart/schedule [put]
func (handler *Handler) stackRestartScheduleUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: endpointId", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	var payload updateStackRestartSchedulePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	var stack *portainer.Stack
	err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		stack, err = tx.Stack().Read(portainer.StackID(stackID))
		if tx.IsErrObjectNotFound(err) {
			return httperror.NotFound("Unable to find a stack with the specified identifier inside the database", err)
		}
		if err != nil {
			return httperror.InternalServerError("Unable to find a stack with the specified identifier inside the database", err)
		}

		if stack.Type == portainer.KubernetesStack {
			return httperror.BadRequest("Scheduled restarts are not supported for kubernetes stacks", errors.New("scheduled restarts are not supported for kubernetes stacks"))
		}

		if endpointID != 0 && portainer.EndpointID(endpointID) != stack.EndpointID {
			stack.EndpointID = portainer.EndpointID(endpointID)
		}

		endpoint, err := tx.Endpoint().Endpoint(stack.EndpointID)
		if tx.IsErrObjectNotFound(err) {
			return httperror.NotFound("Unable to find the environment associated to the stack inside the database", err)
		}
		if err != nil {
			return httperror.InternalServerError("Unable to find the environment associated to the stack inside the database", err)
		}

		if err := handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint); err != nil {
			return httperror.Forbidden("Permission denied to access environment", err)
		}

		resourceControl, err := tx.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve a resource control associated to the stack", err)
		}

		if access, err := handler.userCanAccessStack(securityContext, resourceControl); err != nil {
			return httperror.InternalServerError("Unable to verify user authorizations to validate stack access", err)
		} else if !access {
			return httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied)
		}

		if canManage, err := handler.userCanManageStacks(securityContext, endpoint); err != nil {
			return httperror.InternalServerError("Unable to verify user authorizations to validate stack updates", err)
		} else if !canManage {
			errMsg := "Stack management is disabled for non-admin users"
			return httperror.Forbidden(errMsg, errors.New(errMsg))
		}

		if payload.RestartSchedule == nil {
			stack.RestartSchedule = nil
		} else {
			stack.RestartSchedule = &portainer.StackRestartSchedule{
				CronExpression: payload.RestartSchedule.CronExpression,
				PullImages:     payload.RestartSchedule.PullImages,
			}
		}

		user, err := tx.User().Read(securityContext.UserID)
		if err != nil {
			return httperror.BadRequest("Cannot find context user", errors.Wrap(err, "failed to fetch the user"))
		}

		stack.UpdatedBy = user.Username
		stack.UpdateDate = time.Now().Unix()

		if err := tx.Stack().Update(stack.ID, stack); err != nil {
			return httperror.InternalServerError("Unable to persist the stack changes inside the database", err)
		}

		userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
		if err := fillStackGitConfig(tx, userContext, stack); err != nil {
			return httperror.InternalServerError("Unable to load git config for stack", err)
		}

		return nil
	})
	if err == nil {
		if reconcileErr := handler.StackScheduler.Reconcile(portainer.StackID(stackID)); reconcileErr != nil {
			log.Warn().Err(reconcileErr).Int("stack_id", stackID).Msg("stack scheduler reconcile failed after restart schedule update")
		}
	}

	return response.TxResponse(w, stack, err)
}
