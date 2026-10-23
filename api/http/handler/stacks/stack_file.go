package stacks

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	gittypes "github.com/portainer/portainer/api/git/types"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/pkg/errors"
)

type stackFileResponse struct {
	// Content of the Stack file
	StackFileContent string `json:"StackFileContent" example:"version: 3\n services:\n web:\n image:nginx"`
}

// @id StackFileInspect
// @summary Retrieve the content of the Stack file for the specified stack
// @description Get Stack file content.
// @description **Access policy**: restricted
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Stack identifier"
// @success 200 {object} stackFileResponse "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Stack not found"
// @failure 409 "Git settings changed, redeploy required"
// @failure 500 "Server error"
// @router /stacks/{id}/file [get]
func (handler *Handler) stackFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	stack, err := handler.DataStore.Stack().Read(portainer.StackID(stackID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a stack with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a stack with the specified identifier inside the database", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(stack.EndpointID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		if !securityContext.IsAdmin {
			return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
		}
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	canManage, err := handler.userCanManageStacks(securityContext, endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to verify user authorizations to validate stack deletion", err)
	}
	if !canManage {
		errMsg := "Stack management is disabled for non-admin users"
		return httperror.Forbidden(errMsg, errors.New(errMsg))
	}

	if endpoint != nil {
		err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
		if err != nil {
			return httperror.Forbidden("Permission denied to access environment", err)
		}

		if stack.Type == portainer.DockerSwarmStack || stack.Type == portainer.DockerComposeStack {
			resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
			if err != nil {
				return httperror.InternalServerError("Unable to retrieve a resource control associated to the stack", err)
			}

			access, err := handler.userCanAccessStack(securityContext, resourceControl)
			if err != nil {
				return httperror.InternalServerError("Unable to verify user authorizations to validate stack access", err)
			}
			if !access {
				return httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied)
			}
		}
	}

	var gitConfig *gittypes.RepoConfig
	if stack.WorkflowID != 0 {
		if err := handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
			var err error
			userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
			gitConfig, _, err = loadGitConfigForStack(tx, userContext, stack.WorkflowID, stack.ID)
			if err != nil {
				return httperror.InternalServerError("Unable to load git config for stack", err)
			}
			return nil
		}); err != nil {
			return response.TxErrorResponse(err)
		}
	}

	if gitStackPendingRedeploy(stack, gitConfig) {
		return httperror.Conflict("Stack git settings have changed. Redeploy the stack to apply the new configuration.", errors.New("git settings updated without redeploy"))
	}

	stackFileContent, err := handler.FileService.GetFileContent(stack.ProjectPath, stack.EntryPoint)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve Compose file from disk", err)
	}

	return response.JSON(w, &stackFileResponse{StackFileContent: string(stackFileContent)})
}

// gitStackPendingRedeploy returns true when the stack's git settings (URL or config file path)
// have been updated via "save settings" but the stack has not yet been redeployed to apply them.
// In that state the local clone is stale and the stack file cannot be read from disk.
func gitStackPendingRedeploy(stack *portainer.Stack, gitConfig *gittypes.RepoConfig) bool {
	if gitConfig == nil || stack.CurrentDeploymentInfo == nil {
		return false
	}

	return gitConfig.URL != stack.CurrentDeploymentInfo.RepositoryURL ||
		gitConfig.ConfigFilePath != stack.CurrentDeploymentInfo.ConfigFilePath
}
