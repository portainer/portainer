package stacks

import (
	"context"
	"errors"
	"net/http"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/gitops/workflows"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/rs/zerolog/log"
)

// @id StackDelete
// @summary Remove a stack
// @description Remove a stack.
// @description **Access policy**: restricted
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Stack identifier"
// @param external query boolean false "Set to true to delete an external stack. Only external Swarm stacks are supported"
// @param endpointId query int true "Environment identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Not found"
// @failure 500 "Server error"
// @router /stacks/{id} [delete]
func (handler *Handler) stackDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	externalStack, _ := request.RetrieveBooleanQueryParameter(r, "external", true)
	if externalStack {
		return handler.deleteExternalStack(r, w, stackID, securityContext)
	}

	id, err := strconv.Atoi(stackID)
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	stack, err := handler.DataStore.Stack().Read(portainer.StackID(id))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a stack with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a stack with the specified identifier inside the database", err)
	}

	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", true)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: endpointId", err)
	}

	isOrphaned := portainer.EndpointID(endpointID) != stack.EndpointID

	if isOrphaned && !securityContext.IsAdmin {
		return httperror.Forbidden("Permission denied to remove orphaned stack", errors.New("Permission denied to remove orphaned stack"))
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find the endpoint associated to the stack inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find the endpoint associated to the stack inside the database", err)
	}

	resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve a resource control associated to the stack", err)
	}

	if !isOrphaned {
		if err := handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint); err != nil {
			return httperror.Forbidden("Permission denied to access endpoint", err)
		}

		if stack.Type == portainer.DockerSwarmStack || stack.Type == portainer.DockerComposeStack {
			access, err := handler.userCanAccessStack(securityContext, resourceControl)
			if err != nil {
				return httperror.InternalServerError("Unable to verify user authorizations to validate stack access", err)
			}
			if !access {
				return httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied)
			}
		}
	}

	canManage, err := handler.userCanManageStacks(securityContext, endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to verify user authorizations to validate stack deletion", err)
	}
	if !canManage {
		errMsg := "stack deletion is disabled for non-admin users"
		return httperror.Forbidden(errMsg, errors.New(errMsg))
	}

	if err := handler.teardownService.RemoveResources(r.Context(), securityContext.UserID, stack, endpoint); err != nil {
		return httperror.InternalServerError(err.Error(), err)
	}

	var reconcileSourceID portainer.SourceID
	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if stack.WorkflowID != 0 {
			if _, sid, err := loadGitConfigForStack(tx, source.InsecureNewAdminContext(), stack.WorkflowID, stack.ID); err == nil {
				reconcileSourceID = sid
			}

			if err := workflows.DeleteIfSingleArtifact(tx, stack.WorkflowID); err != nil {
				return err
			}
		}

		return handler.teardownService.DeleteRecords(tx, stack)
	}); err != nil {
		return httperror.InternalServerError("Unable to remove the stack from the database", err)
	}

	if err := handler.teardownService.RemoveFiles(stack); err != nil {
		log.Warn().Err(err).Int("stack_id", int(stack.ID)).Msg("unable to remove stack files after stack deletion")
	}

	if err := handler.SourceScheduler.Reconcile(reconcileSourceID); err != nil {
		log.Warn().Err(err).Msg("source scheduler reconcile failed after stack deletion")
	}

	return response.Empty(w)
}

func (handler *Handler) deleteExternalStack(r *http.Request, w http.ResponseWriter, stackName string, securityContext *security.RestrictedRequestContext) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: endpointId", err)
	}

	if !securityContext.IsAdmin {
		return httperror.Unauthorized("Permission denied to delete the stack", httperrors.ErrUnauthorized)
	}

	stack, err := handler.DataStore.Stack().StackByName(stackName)
	if err != nil && !handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.InternalServerError("Unable to check for stack existence inside the database", err)
	}
	if stack != nil {
		return httperror.BadRequest("A stack with this name exists inside the database. Cannot use external delete method", errors.New("A tag already exists with this name"))
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find the endpoint associated to the stack inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find the endpoint associated to the stack inside the database", err)
	}

	if err := handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint); err != nil {
		return httperror.Forbidden("Permission denied to access endpoint", err)
	}

	stack = &portainer.Stack{
		Name: stackName,
		Type: portainer.DockerSwarmStack,
	}

	if err := handler.teardownService.RemoveResources(context.TODO(), securityContext.UserID, stack, endpoint); err != nil {
		return httperror.InternalServerError("Unable to delete stack", err)
	}

	return response.Empty(w)
}

// @id StackDeleteKubernetesByName
// @summary Remove Kubernetes stacks by name
// @description Remove a stack.
// @description **Access policy**: restricted
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @param name path string true "Stack name"
// @param external query boolean false "Set to true to delete an external stack. Only external Swarm stacks are supported"
// @param endpointId query int true "Environment identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Not found"
// @failure 500 "Server error"
// @router /stacks/name/{name} [delete]
func (handler *Handler) stackDeleteKubernetesByName(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackName, err := request.RetrieveRouteVariableValue(r, "name")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	log.Debug().Msgf("Trying to delete Kubernetes stack %q", stackName)

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", true)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: endpointId", err)
	}

	namespace, err := request.RetrieveQueryParameter(r, "namespace", false)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: namespace", err)
	}

	stacks, err := handler.DataStore.Stack().StacksByName(stackName)
	if err != nil && !handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.InternalServerError("Unable to check for stack existence inside the database", err)
	}
	if stacks == nil {
		return httperror.InternalServerError("Unable to find a stacks with the specified identifier name the database", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find the endpoint associated to the stack inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find the endpoint associated to the stack inside the database", err)
	}

	log.Debug().Msgf("Trying to delete Kubernetes stack %q for endpoint `%d`", stackName, endpointID)

	// check authorizations on all the stacks one by one
	stacksToDelete := make([]portainer.Stack, 0)
	for _, stack := range stacks {
		// only delete stacks for the specified namespace
		if stack.Namespace != namespace {
			continue
		}

		isOrphaned := portainer.EndpointID(endpointID) != stack.EndpointID
		if stack.Type != portainer.KubernetesStack {
			return httperror.BadRequest("Only Kubernetes stacks can be deleted by name", errors.New("Only Kubernetes stacks can be deleted by name"))
		}

		if isOrphaned && !securityContext.IsAdmin {
			return httperror.Forbidden("Permission denied to remove orphaned stack", errors.New("Permission denied to remove orphaned stack"))
		}

		if !isOrphaned {
			err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
			if err != nil {
				return httperror.Forbidden("Permission denied to access endpoint", err)
			}
		}

		canManage, err := handler.userCanManageStacks(securityContext, endpoint)
		if err != nil {
			return httperror.InternalServerError("Unable to verify user authorizations to validate stack deletion", err)
		}
		if !canManage {
			errMsg := "stack deletion is disabled for non-admin users"
			return httperror.Forbidden(errMsg, errors.New(errMsg))
		}

		stacksToDelete = append(stacksToDelete, stack)
	}

	log.Debug().Msgf("Trying to delete Kubernetes stacks `%v` for endpoint `%d`", stacksToDelete, endpointID)

	var errs error
	// Delete all the stacks one by one
	for _, stack := range stacksToDelete {
		log.Debug().Msgf("Trying to delete Kubernetes stack id `%d`", stack.ID)

		if err := handler.teardownService.RemoveResources(context.TODO(), securityContext.UserID, &stack, endpoint); err != nil {
			log.Err(err).Msgf("Unable to delete Kubernetes stack `%d`", stack.ID)
			errs = errors.Join(errs, err)

			continue
		}

		var reconcileSourceID portainer.SourceID
		if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			if stack.WorkflowID != 0 {
				if _, sid, err := loadGitConfigForStack(tx, source.InsecureNewAdminContext(), stack.WorkflowID, stack.ID); err == nil {
					reconcileSourceID = sid
				}

				if err := workflows.DeleteIfSingleArtifact(tx, stack.WorkflowID); err != nil {
					return err
				}
			}

			return handler.teardownService.DeleteRecords(tx, &stack)
		}); err != nil {
			errs = errors.Join(errs, err)
			log.Err(err).Int("stack_id", int(stack.ID)).Msg("unable to remove the stack from the database")

			continue
		}

		if err := handler.teardownService.RemoveFiles(&stack); err != nil {
			log.Warn().Err(err).Int("stack_id", int(stack.ID)).Msg("unable to remove stack files after stack deletion")
		}

		if err := handler.SourceScheduler.Reconcile(reconcileSourceID); err != nil {
			log.Warn().Err(err).Msg("source scheduler reconcile failed after Kubernetes stack deletion")
		}

		log.Debug().Msgf("Kubernetes stack `%d` deleted", stack.ID)
	}

	if errs != nil {
		return httperror.InternalServerError("Unable to delete some Kubernetes stack(s). Check Portainer logs for more details", nil)
	}

	return response.Empty(w)
}
