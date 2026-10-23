package stacks

import (
	"cmp"
	"context"
	"fmt"
	"net/http"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/git"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/gitops/workflows"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	k "github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

type stackGitRedeployPayload struct {
	RepositoryReferenceName string
	// When true and RepositoryPassword is non-empty, stored credentials are replaced.
	RepositoryAuthentication bool
	RepositoryUsername       string
	// Non-empty value (with RepositoryAuthentication=true) replaces stored credentials; leave blank to keep them.
	RepositoryPassword string
	Env                []portainer.Pair
	Prune              *bool
	// RepullImageAndRedeploy indicates whether to force repulling images and redeploying the stack
	RepullImageAndRedeploy bool

	StackName string
	// Deprecated(2.36): use RepullImageAndRedeploy instead for cleaner responsibility
	// Force a pulling to current image with the original tag though the image is already the latest
	PullImage bool `example:"false"`
}

func (payload *stackGitRedeployPayload) Validate(r *http.Request) error {
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
// @param body body stackGitRedeployPayload true "Git configs for pull and redeploy of a stack. **StackName** may only be populated for Kuberenetes stacks, and if specified with a blank string, it will be set to blank"
// @success 200 {object} portainer.Stack "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Not found"
// @failure 409 "Conflict"
// @failure 500 "Server error"
// @router /stacks/{id}/git/redeploy [put]
func (handler *Handler) stackGitRedeploy(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	var stack *portainer.Stack
	var gitConfig *gittypes.RepoConfig
	var sourceID portainer.SourceID
	if err := handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		stack, err = tx.Stack().Read(portainer.StackID(stackID))
		if tx.IsErrObjectNotFound(err) {
			return httperror.NotFound("Unable to find a stack with the specified identifier inside the database", err)
		} else if err != nil {
			return httperror.InternalServerError("Unable to find a stack with the specified identifier inside the database", err)
		}

		if stack.WorkflowID == 0 {
			return httperror.BadRequest("Stack is not created from git", errors.New("stack has no git workflow"))
		}

		userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
		gitConfig, sourceID, err = loadGitConfigForStack(tx, userContext, stack.WorkflowID, stack.ID)
		if err != nil {
			return httperror.InternalServerError("Unable to load git config for stack", err)
		}
		if gitConfig == nil {
			return httperror.BadRequest("Stack is not created from git", errors.New("stack source has no git config"))
		}

		if stack.Status == portainer.StackStatusDeploying {
			return httperror.Conflict("Unable to update stack", errors.New("Stack deployment is already in progress"))
		}
		return nil
	}); err != nil {
		return response.TxErrorResponse(err)
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

	if err := handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint); err != nil {
		return httperror.Forbidden("Permission denied to access environment", err)
	}

	// Only check resource control when it is a DockerSwarmStack or a DockerComposeStack
	if stack.Type == portainer.DockerSwarmStack || stack.Type == portainer.DockerComposeStack {
		resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve a resource control associated to the stack", err)
		}

		if access, err := handler.userCanAccessStack(securityContext, resourceControl); err != nil {
			return httperror.InternalServerError("Unable to verify user authorizations to validate stack access", err)
		} else if !access {
			return httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied)
		}
	}

	if canManage, err := handler.userCanManageStacks(securityContext, endpoint); err != nil {
		return httperror.InternalServerError("Unable to verify user authorizations to validate stack deletion", err)
	} else if !canManage {
		errMsg := "Stack management is disabled for non-admin users"
		return httperror.Forbidden(errMsg, errors.New(errMsg))
	}

	var payload stackGitRedeployPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}
	payload.RepullImageAndRedeploy = payload.RepullImageAndRedeploy || payload.PullImage

	gitConfig.ReferenceName = cmp.Or(payload.RepositoryReferenceName, gitConfig.ReferenceName)

	if payload.Env != nil {
		stack.Env = payload.Env
	}

	if payload.Prune != nil {
		if stack.Type == portainer.DockerSwarmStack || stack.Type == portainer.DockerComposeStack {
			if stack.Option == nil {
				stack.Option = &portainer.StackOption{}
			}
			stack.Option.Prune = *payload.Prune
		}
	}

	if stack.Type == portainer.KubernetesStack && payload.StackName != "" {
		stack.Name = payload.StackName
	}

	auth := resolveGitAuthFromRedeployPayload(gitConfig, payload)

	cloneOptions := git.CloneOptions{
		ProjectPath:   stack.ProjectPath,
		URL:           gitConfig.URL,
		ReferenceName: gitConfig.ReferenceName,
		Username:      auth.Username,
		Password:      auth.Password,
		TLSSkipVerify: gitConfig.TLSSkipVerify,
	}

	clean, err := git.CloneWithBackup(context.TODO(), handler.GitService, handler.FileService, cloneOptions)
	if err != nil {
		if persistErr := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return persistSourceSyncError(tx, securityContext, sourceID, err)
		}); persistErr != nil {
			return httperror.InternalServerError("Unable to clone git repository directory", fmt.Errorf("%w (and failed to persist status: %w)", err, persistErr))
		}

		return httperror.InternalServerError("Unable to clone git repository directory", err)
	}

	defer clean()

	newHash, err := handler.GitService.LatestCommitID(context.TODO(), gitConfig.URL, gitConfig.ReferenceName, auth.Username, auth.Password, gitConfig.TLSSkipVerify)
	if err != nil {
		if persistErr := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return persistSourceSyncError(tx, securityContext, sourceID, err)
		}); persistErr != nil {
			return httperror.InternalServerError("Unable get latest commit id", fmt.Errorf("%w (and failed to persist status: %w)", errors.WithMessagef(err, "failed to fetch latest commit id of the stack %v", stack.ID), persistErr))
		}

		return httperror.InternalServerError("Unable get latest commit id", errors.WithMessagef(err, "failed to fetch latest commit id of the stack %v", stack.ID))
	}

	oldConfigHash := gitConfig.ConfigHash
	gitConfig.ConfigHash = newHash

	user, err := handler.DataStore.User().Read(securityContext.UserID)
	if err != nil {
		return httperror.BadRequest("Cannot find context user", errors.Wrap(err, "failed to fetch the user"))
	}
	stack.CurrentDeploymentInfo = &portainer.StackDeploymentInfo{
		RepositoryURL:   gitConfig.URL,
		ReferenceName:   gitConfig.ReferenceName,
		ConfigFilePath:  gitConfig.ConfigFilePath,
		AdditionalFiles: stack.AdditionalFiles,
		ConfigHash:      newHash,
		SourceID:        sourceID,
	}

	stack.UpdatedBy = user.Username
	stack.UpdateDate = time.Now().Unix()

	postDeploy := func(ctx context.Context, deployErr error) {
		if deployErr == nil {
			return
		}

		if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			liveStack, err := tx.Stack().Read(stack.ID)
			if err != nil {
				return err
			}

			if liveStack.CurrentDeploymentInfo != nil {
				liveStack.CurrentDeploymentInfo.ConfigHash = oldConfigHash
			}

			if err := tx.Stack().Update(liveStack.ID, liveStack); err != nil {
				return err
			}

			return workflows.UpdateArtifactFileForStack(tx, stack.WorkflowID, stack.ID, sourceID, func(a *portainer.ArtifactFile) {
				a.Hash = oldConfigHash
			})
		}); err != nil {
			log.Error().Err(err).Int("stack_id", int(stack.ID)).Msg("failed to revert config hash after failed redeploy")
		}
	}

	stackutils.PrepareStackStatusForDeployment(stack)

	deploymentConfig, httpErr := handler.deployStack(r, stack, payload.RepullImageAndRedeploy, endpoint)
	if httpErr != nil {
		return httpErr
	}

	if stack.Type == portainer.KubernetesStack {
		// Inline deployment workflow for Kubernetes stacks
		if err := handler.deployKubernetesStackInline(deploymentConfig, stack, securityContext, gitConfig, sourceID, postDeploy); err != nil {
			return err
		}

		return response.JSON(w, stack)
	}

	// Async deployment workflow for Swarm and Compose stacks
	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := tx.Stack().Update(stack.ID, stack); err != nil {
			return err
		}
		userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
		if err := saveStackGitConfig(tx, userContext, stack.WorkflowID, stack.ID, sourceID, 0, gitConfig); err != nil {
			return err
		}

		if err := workflows.SaveSourceStatus(tx, userContext, sourceID, nil); err != nil {
			return err
		}

		return fillStackGitConfig(tx, userContext, stack)
	}); err != nil {
		return httperror.InternalServerError("Unable to persist the stack changes inside the database", errors.Wrap(err, "failed to update the stack"))
	}

	if deploymentConfig != nil {
		go stackDeploy(handler.DataStore, stack.ID, deploymentConfig, postDeploy)
	}

	return response.JSON(w, stack)
}

// deployStack builds the deployment config without deploying; the caller deploys it (sync for
// Kubernetes, async for Swarm/Compose).
func (handler *Handler) deployStack(r *http.Request, stack *portainer.Stack, pullImage bool, endpoint *portainer.Endpoint) (deployments.StackDeploymentConfiger, *httperror.HandlerError) {
	switch stack.Type {
	case portainer.DockerSwarmStack:
		securityContext, err := security.RetrieveRestrictedRequestContext(r)
		if err != nil {
			return nil, httperror.InternalServerError("Unable to retrieve info from request context", err)
		}

		prune := stack.Option != nil && stack.Option.Prune

		deploymentConfiger, err := deployments.CreateSwarmStackDeploymentConfigTx(handler.DataStore, securityContext, stack, endpoint, handler.FileService, handler.StackDeployer, prune, pullImage)
		if err != nil {
			return nil, httperror.InternalServerError(err.Error(), err)
		}

		return deploymentConfiger, nil

	case portainer.DockerComposeStack:
		securityContext, err := security.RetrieveRestrictedRequestContext(r)
		if err != nil {
			return nil, httperror.InternalServerError("Unable to retrieve info from request context", err)
		}

		prune := stack.Option != nil && stack.Option.Prune

		deploymentConfiger, err := deployments.CreateComposeStackDeploymentConfigTx(handler.DataStore, securityContext, stack, endpoint, handler.FileService, handler.StackDeployer, prune, pullImage, true)
		if err != nil {
			return nil, httperror.InternalServerError(err.Error(), err)
		}

		return deploymentConfiger, nil

	case portainer.KubernetesStack:
		tokenData, err := security.RetrieveTokenData(r)
		if err != nil {
			return nil, httperror.BadRequest("Failed to retrieve user token data", err)
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

		return deployments.CreateKubernetesStackDeploymentConfig(stack, handler.KubernetesDeployer, appLabel, user, endpoint), nil
	}

	return nil, httperror.InternalServerError("Unsupported stack", errors.Errorf("unsupported stack type: %v", stack.Type))
}

// deployKubernetesStackInline deploys an already-built Kubernetes deployment config synchronously
// and returns any deploy failure to the caller, instead of the goroutine used for Swarm/Compose.
func (handler *Handler) deployKubernetesStackInline(deploymentConfiger deployments.StackDeploymentConfiger, stack *portainer.Stack, securityContext *security.RestrictedRequestContext, gitConfig *gittypes.RepoConfig, sourceID portainer.SourceID, postDeploy postDeployFunc) *httperror.HandlerError {
	handler.stackCreationMutex.Lock()
	defer handler.stackCreationMutex.Unlock()

	deployCtx, cancel := context.WithTimeout(context.Background(), stackutils.InlineDeployTimeout)
	defer cancel()

	if err := deploymentConfiger.Deploy(deployCtx); err != nil {
		if postDeploy != nil {
			postDeploy(deployCtx, err)
		}

		return httperror.InternalServerError("Failed to deploy stack", err)
	}

	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		stackutils.UpdateStackStatusFromDeploymentResult(stack, nil)
		if err := tx.Stack().Update(stack.ID, stack); err != nil {
			return err
		}

		userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
		if err := saveStackGitConfig(tx, userContext, stack.WorkflowID, stack.ID, sourceID, 0, gitConfig); err != nil {
			return err
		}

		if err := workflows.SaveSourceStatus(tx, userContext, sourceID, nil); err != nil {
			return err
		}

		return fillStackGitConfig(tx, userContext, stack)
	}); err != nil {
		return httperror.InternalServerError("Unable to persist the stack changes inside the database", errors.Wrap(err, "failed to update the stack"))
	}

	if postDeploy != nil {
		postDeploy(deployCtx, nil)
	}

	return nil
}

func resolveGitAuthFromRedeployPayload(gitConfig *gittypes.RepoConfig, payload stackGitRedeployPayload) gittypes.GitAuthentication {
	auth := gittypes.GitAuthentication{}
	if gitConfig.Authentication != nil {
		auth = *gitConfig.Authentication
	}

	// only overload source auth if provided
	if payload.RepositoryAuthentication && payload.RepositoryPassword != "" {
		auth.Username = payload.RepositoryUsername
		auth.Password = payload.RepositoryPassword
	}
	return auth
}
