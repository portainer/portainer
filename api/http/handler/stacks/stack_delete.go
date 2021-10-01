package stacks

import (
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strconv"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/stackutils"
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
// @param endpointId query int false "Environment(Endpoint) identifier used to remove an external stack (required when external is set to true)"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Not found"
// @failure 500 "Server error"
// @router /stacks/{id} [delete]
func (handler *Handler) stackDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid stack identifier route variable", Err: err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve info from request context", Err: err}
	}

	externalStack, _ := request.RetrieveBooleanQueryParameter(r, "external", true)
	if externalStack {
		return handler.deleteExternalStack(r, w, stackID, securityContext)
	}

	id, err := strconv.Atoi(stackID)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid stack identifier route variable", Err: err}
	}

	stack, err := handler.DataStore.Stack().Stack(portainer.StackID(id))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find a stack with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find a stack with the specified identifier inside the database", Err: err}
	}

	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", true)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid query parameter: endpointId", Err: err}
	}

	isOrphaned := portainer.EndpointID(endpointID) != stack.EndpointID

	if isOrphaned && !securityContext.IsAdmin {
		return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Permission denied to remove orphaned stack", Err: errors.New("Permission denied to remove orphaned stack")}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find the endpoint associated to the stack inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find the endpoint associated to the stack inside the database", Err: err}
	}

	resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve a resource control associated to the stack", Err: err}
	}

	if !isOrphaned {
		err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
		if err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Permission denied to access endpoint", Err: err}
		}

		if stack.Type == portainer.DockerSwarmStack || stack.Type == portainer.DockerComposeStack {
			access, err := handler.userCanAccessStack(securityContext, endpoint.ID, resourceControl)
			if err != nil {
				return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to verify user authorizations to validate stack access", Err: err}
			}
			if !access {
				return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Access denied to resource", Err: httperrors.ErrResourceAccessDenied}
			}
		}
	}

	// stop scheduler updates of the stack before removal
	if stack.AutoUpdate != nil {
		stopAutoupdate(stack.ID, stack.AutoUpdate.JobID, *handler.Scheduler)
	}

	err = handler.deleteStack(securityContext.UserID, stack, endpoint)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: err.Error(), Err: err}
	}

	err = handler.DataStore.Stack().DeleteStack(portainer.StackID(id))
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to remove the stack from the database", Err: err}
	}

	if resourceControl != nil {
		err = handler.DataStore.ResourceControl().DeleteResourceControl(resourceControl.ID)
		if err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to remove the associated resource control from the database", Err: err}
		}
	}

	err = handler.FileService.RemoveDirectory(stack.ProjectPath)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to remove stack files from disk", Err: err}
	}

	return response.Empty(w)
}

func (handler *Handler) deleteExternalStack(r *http.Request, w http.ResponseWriter, stackName string, securityContext *security.RestrictedRequestContext) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid query parameter: endpointId", Err: err}
	}

	if !securityContext.IsAdmin {
		return &httperror.HandlerError{StatusCode: http.StatusUnauthorized, Message: "Permission denied to delete the stack", Err: httperrors.ErrUnauthorized}
	}

	stack, err := handler.DataStore.Stack().StackByName(stackName)
	if err != nil && !handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to check for stack existence inside the database", Err: err}
	}
	if stack != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "A stack with this name exists inside the database. Cannot use external delete method", Err: errors.New("A tag already exists with this name")}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find the endpoint associated to the stack inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find the endpoint associated to the stack inside the database", Err: err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Permission denied to access endpoint", Err: err}
	}

	stack = &portainer.Stack{
		Name: stackName,
		Type: portainer.DockerSwarmStack,
	}

	err = handler.deleteStack(securityContext.UserID, stack, endpoint)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to delete stack", Err: err}
	}

	return response.Empty(w)
}

func (handler *Handler) deleteStack(userID portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	if stack.Type == portainer.DockerSwarmStack {
		return handler.SwarmStackManager.Remove(stack, endpoint)
	}
	if stack.Type == portainer.DockerComposeStack {
		return handler.ComposeStackManager.Down(context.TODO(), stack, endpoint)
	}
	if stack.Type == portainer.KubernetesStack {
		var manifestFiles []string

		//if it is a compose format kub stack, create a temp dir and convert the manifest files into it
		//then process the remove operation
		if stack.IsComposeFormat {
			fileNames := append([]string{stack.EntryPoint}, stack.AdditionalFiles...)
			tmpDir, err := ioutil.TempDir("", "kub_delete")
			if err != nil {
				return errors.Wrap(err, "failed to create temp directory for deleting kub stack")
			}
			defer os.RemoveAll(tmpDir)

			for _, fileName := range fileNames {
				manifestFilePath := filesystem.JoinPaths(tmpDir, fileName)
				manifestContent, err := handler.FileService.GetFileContent(stack.ProjectPath, fileName)
				if err != nil {
					return errors.Wrap(err, "failed to read manifest file")
				}

				manifestContent, err = handler.KubernetesDeployer.ConvertCompose(manifestContent)
				if err != nil {
					return errors.Wrap(err, "failed to convert docker compose file to a kube manifest")
				}

				err = filesystem.WriteToFile(manifestFilePath, []byte(manifestContent))
				if err != nil {
					return errors.Wrap(err, "failed to create temp manifest file")
				}
				manifestFiles = append(manifestFiles, manifestFilePath)
			}
		} else {
			manifestFiles = stackutils.GetStackFilePaths(stack)
		}
		out, err := handler.KubernetesDeployer.Remove(userID, endpoint, manifestFiles, stack.Namespace)
		return errors.WithMessagef(err, "failed to remove kubernetes resources: %q", out)
	}
	return fmt.Errorf("unsupported stack type: %v", stack.Type)
}
