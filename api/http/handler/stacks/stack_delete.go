package stacks

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/pkg/errors"
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
			access, err := handler.userCanAccessStack(securityContext, endpoint.ID, resourceControl)
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

	// stop scheduler updates of the stack before removal
	if stack.AutoUpdate != nil {
		deployments.StopAutoupdate(stack.ID, stack.AutoUpdate.JobID, handler.Scheduler)
	}

	if err := handler.deleteStack(securityContext.UserID, stack, endpoint); err != nil {
		return httperror.InternalServerError(err.Error(), err)
	}

	if err := handler.DataStore.Stack().Delete(portainer.StackID(id)); err != nil {
		return httperror.InternalServerError("Unable to remove the stack from the database", err)
	}

	if resourceControl != nil {
		if err := handler.DataStore.ResourceControl().Delete(resourceControl.ID); err != nil {
			return httperror.InternalServerError("Unable to remove the associated resource control from the database", err)
		}
	}

	if err := handler.FileService.RemoveDirectory(stack.ProjectPath); err != nil {
		log.Warn().Err(err).Msg("Unable to remove stack files from disk")
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

	if err := handler.deleteStack(securityContext.UserID, stack, endpoint); err != nil {
		return httperror.InternalServerError("Unable to delete stack", err)
	}

	return response.Empty(w)
}

func (handler *Handler) deleteStack(userID portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	if stack.Type == portainer.DockerSwarmStack {
		stack.Name = handler.SwarmStackManager.NormalizeStackName(stack.Name)

		if stackutils.IsRelativePathStack(stack) {
			return handler.StackDeployer.UndeployRemoteSwarmStack(stack, endpoint)
		}

		return handler.SwarmStackManager.Remove(stack, endpoint)
	}

	if stack.Type == portainer.DockerComposeStack {
		stack.Name = handler.ComposeStackManager.NormalizeStackName(stack.Name)

		if stackutils.IsRelativePathStack(stack) {
			return handler.StackDeployer.UndeployRemoteComposeStack(stack, endpoint)
		}

		return handler.ComposeStackManager.Down(context.TODO(), stack, endpoint)
	}

	if stack.Type == portainer.KubernetesStack {
		manifestFiles := stackutils.GetStackFilePaths(stack, true)

		out, err := handler.KubernetesDeployer.Remove(userID, endpoint, manifestFiles, stack.Namespace)
		if err != nil {
			for _, manifest := range manifestFiles {
				if exists, fileExistsErr := filesystem.FileExists(manifest); fileExistsErr != nil || !exists {
					// If removal has failed and one of the manifest files is missing,
					// we can consider this stack as removed
					log.Warn().Err(fileExistsErr).Msgf("failed to find manifest %s, but stack deletion will continue", manifest)
					return nil
				}
			}
		}

		return errors.WithMessagef(err, "failed to remove kubernetes resources: %q", out)
	}

	return fmt.Errorf("unsupported stack type: %v", stack.Type)
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

	errors := make([]error, 0)
	// Delete all the stacks one by one
	for _, stack := range stacksToDelete {
		log.Debug().Msgf("Trying to delete Kubernetes stack id `%d`", stack.ID)

		// stop scheduler updates of the stack before removal
		if stack.AutoUpdate != nil {
			deployments.StopAutoupdate(stack.ID, stack.AutoUpdate.JobID, handler.Scheduler)
		}

		err = handler.deleteStack(securityContext.UserID, &stack, endpoint)
		if err != nil {
			log.Err(err).Msgf("Unable to delete Kubernetes stack `%d`", stack.ID)
			errors = append(errors, err)

			continue
		}

		if err := handler.DataStore.Stack().Delete(stack.ID); err != nil {
			errors = append(errors, err)
			log.Err(err).Msgf("Unable to remove the stack `%d` from the database", stack.ID)

			continue
		}

		if err := handler.FileService.RemoveDirectory(stack.ProjectPath); err != nil {
			errors = append(errors, err)
			log.Warn().Err(err).Msg("Unable to remove stack files from disk")
		}

		log.Debug().Msgf("Kubernetes stack `%d` deleted", stack.ID)
	}

	if len(errors) > 0 {
		return httperror.InternalServerError("Unable to delete some Kubernetes stack(s). Check Portainer logs for more details", nil)
	}

	return response.Empty(w)
}
