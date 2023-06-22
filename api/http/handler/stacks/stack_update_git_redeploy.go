package stacks

import (
	"net/http"
	"time"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/git"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	k "github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
)

type stackGitRedployPayload struct {
	RepositoryReferenceName  string
	RepositoryAuthentication bool
	RepositoryUsername       string
	RepositoryPassword       string
	Env                      []portainer.Pair
	Prune                    bool
	// Force a pulling to current image with the original tag though the image is already the latest
	PullImage bool `example:"false"`
}

func (payload *stackGitRedployPayload) Validate(r *http.Request) error {
	return nil
}

// @id StackGitRedeploy
// @summary Redeploy a stack
// @description Pull and redeploy a stack via Git
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Stack identifier"
// @param endpointId query int false "Stacks created before version 1.18.0 might not have an associated environment(endpoint) identifier. Use this optional parameter to set the environment(endpoint) identifier used by the stack."
// @param body body stackGitRedployPayload true "Git configs for pull and redeploy a stack"
// @success 200 {object} portainer.Stack "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Not found"
// @failure 500 "Server error"
// @router /stacks/{id}/git/redeploy [put]
func (handler *Handler) stackGitRedeploy(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
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

	if stack.GitConfig == nil {
		return httperror.BadRequest("Stack is not created from git", err)
	}

	// TODO: this is a work-around for stacks created with Portainer version >= 1.17.1
	// The EndpointID property is not available for these stacks, this API environment(endpoint)
	// can use the optional EndpointID query parameter to associate a valid environment(endpoint) identifier to the stack.
	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", true)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: endpointId", err)
	}
	if endpointID != int(stack.EndpointID) {
		stack.EndpointID = portainer.EndpointID(endpointID)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(stack.EndpointID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find the environment associated to the stack inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find the environment associated to the stack inside the database", err)
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return httperror.Forbidden("Permission denied to access environment", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	//only check resource control when it is a DockerSwarmStack or a DockerComposeStack
	if stack.Type == portainer.DockerSwarmStack || stack.Type == portainer.DockerComposeStack {

		resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve a resource control associated to the stack", err)
		}

		access, err := handler.userCanAccessStack(securityContext, endpoint.ID, resourceControl)
		if err != nil {
			return httperror.InternalServerError("Unable to verify user authorizations to validate stack access", err)
		}
		if !access {
			return httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied)
		}
	}

	canManage, err := handler.userCanManageStacks(securityContext, endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to verify user authorizations to validate stack deletion", err)
	}
	if !canManage {
		errMsg := "Stack management is disabled for non-admin users"
		return httperror.Forbidden(errMsg, errors.New(errMsg))
	}

	var payload stackGitRedployPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	stack.GitConfig.ReferenceName = payload.RepositoryReferenceName
	stack.Env = payload.Env
	if stack.Type == portainer.DockerSwarmStack {
		stack.Option = &portainer.StackOption{
			Prune: payload.Prune,
		}
	}

	repositoryUsername := ""
	repositoryPassword := ""
	if payload.RepositoryAuthentication {
		repositoryPassword = payload.RepositoryPassword

		// When the existing stack is using the custom username/password and the password is not updated,
		// the stack should keep using the saved username/password
		if repositoryPassword == "" && stack.GitConfig != nil && stack.GitConfig.Authentication != nil {
			repositoryPassword = stack.GitConfig.Authentication.Password
		}
		repositoryUsername = payload.RepositoryUsername
	}

	cloneOptions := git.CloneOptions{
		ProjectPath:   stack.ProjectPath,
		URL:           stack.GitConfig.URL,
		ReferenceName: stack.GitConfig.ReferenceName,
		Username:      repositoryUsername,
		Password:      repositoryPassword,
		TLSSkipVerify: stack.GitConfig.TLSSkipVerify,
	}

	clean, err := git.CloneWithBackup(handler.GitService, handler.FileService, cloneOptions)
	if err != nil {
		return httperror.InternalServerError("Unable to clone git repository directory", err)
	}

	defer clean()

	httpErr := handler.deployStack(r, stack, payload.PullImage, endpoint)
	if httpErr != nil {
		return httpErr
	}

	newHash, err := handler.GitService.LatestCommitID(stack.GitConfig.URL, stack.GitConfig.ReferenceName, repositoryUsername, repositoryPassword, stack.GitConfig.TLSSkipVerify)
	if err != nil {
		return httperror.InternalServerError("Unable get latest commit id", errors.WithMessagef(err, "failed to fetch latest commit id of the stack %v", stack.ID))
	}
	stack.GitConfig.ConfigHash = newHash

	user, err := handler.DataStore.User().Read(securityContext.UserID)
	if err != nil {
		return httperror.BadRequest("Cannot find context user", errors.Wrap(err, "failed to fetch the user"))
	}
	stack.UpdatedBy = user.Username
	stack.UpdateDate = time.Now().Unix()
	stack.Status = portainer.StackStatusActive

	err = handler.DataStore.Stack().Update(stack.ID, stack)
	if err != nil {
		return httperror.InternalServerError("Unable to persist the stack changes inside the database", errors.Wrap(err, "failed to update the stack"))
	}

	if stack.GitConfig != nil && stack.GitConfig.Authentication != nil && stack.GitConfig.Authentication.Password != "" {
		// sanitize password in the http response to minimise possible security leaks
		stack.GitConfig.Authentication.Password = ""
	}

	return response.JSON(w, stack)
}

func (handler *Handler) deployStack(r *http.Request, stack *portainer.Stack, pullImage bool, endpoint *portainer.Endpoint) *httperror.HandlerError {
	var (
		deploymentConfiger deployments.StackDeploymentConfiger
		err                error
	)

	switch stack.Type {
	case portainer.DockerSwarmStack:
		prune := false
		if stack.Option != nil {
			prune = stack.Option.Prune
		}

		// Create swarm deployment config
		securityContext, err := security.RetrieveRestrictedRequestContext(r)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve info from request context", err)
		}

		deploymentConfiger, err = deployments.CreateSwarmStackDeploymentConfig(securityContext, stack, endpoint, handler.DataStore, handler.FileService, handler.StackDeployer, prune, pullImage)
		if err != nil {
			return httperror.InternalServerError(err.Error(), err)
		}

	case portainer.DockerComposeStack:
		// Create compose deployment config
		securityContext, err := security.RetrieveRestrictedRequestContext(r)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve info from request context", err)
		}

		deploymentConfiger, err = deployments.CreateComposeStackDeploymentConfig(securityContext, stack, endpoint, handler.DataStore, handler.FileService, handler.StackDeployer, pullImage, true)
		if err != nil {
			return httperror.InternalServerError(err.Error(), err)
		}
	case portainer.KubernetesStack:
		handler.stackCreationMutex.Lock()
		defer handler.stackCreationMutex.Unlock()

		tokenData, err := security.RetrieveTokenData(r)
		if err != nil {
			return httperror.BadRequest("Failed to retrieve user token data", err)
		}

		user := &portainer.User{
			ID:       tokenData.ID,
			Username: tokenData.Username,
		}

		appLabel := k.KubeAppLabels{
			StackID:   int(stack.ID),
			StackName: stack.Name,
			Owner:     tokenData.Username,
			Kind:      "git",
		}

		deploymentConfiger, err = deployments.CreateKubernetesStackDeploymentConfig(stack, handler.KubernetesDeployer, appLabel, user, endpoint)
		if err != nil {
			return httperror.InternalServerError(err.Error(), err)
		}
	default:
		return httperror.InternalServerError("Unsupported stack", errors.Errorf("unsupported stack type: %v", stack.Type))
	}

	err = deploymentConfiger.Deploy()
	if err != nil {
		return httperror.InternalServerError(err.Error(), err)
	}
	return nil
}
