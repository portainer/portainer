package stacks

import (
	"cmp"
	"context"
	"net/http"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/git/update"
	"github.com/portainer/portainer/api/gitops/sources"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/pkg/errors"
)

type stackGitUpdatePayload struct {
	AutoUpdate              *portainer.AutoUpdateSettings
	Env                     []portainer.Pair
	Prune                   bool
	ConfigFilePath          string
	AdditionalFiles         []string
	RepositoryReferenceName string
	// SourceID references an existing Source for git credentials/URL.
	// When set, the inline URL and authentication fields are ignored.
	SourceID portainer.SourceID
	// Deprecated: use SourceID instead. URL of a Git repository hosting the Stack file.
	RepositoryURL string
	// Deprecated: use SourceID instead. Use basic authentication to clone the Git repository.
	RepositoryAuthentication bool
	// Deprecated: use SourceID instead. Username used in basic authentication.
	RepositoryUsername string
	// Deprecated: use SourceID instead. Password used in basic authentication.
	RepositoryPassword string
	// Deprecated: use SourceID instead. Skip TLS verification when cloning the Git repository.
	TLSSkipVerify bool
}

func (payload *stackGitUpdatePayload) Validate(r *http.Request) error {
	return update.ValidateAutoUpdateSettings(payload.AutoUpdate)
}

// @id StackUpdateGit
// @summary Update a stack's Git configs
// @description Update the Git settings in a stack, e.g., RepositoryReferenceName and AutoUpdate. When SourceID is set, URL/auth/TLS are taken from the referenced Source.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Stack identifier"
// @param endpointId query int false "Stacks created before version 1.18.0 might not have an associated environment(endpoint) identifier. Use this optional parameter to set the environment(endpoint) identifier used by the stack."
// @param body body stackGitUpdatePayload true "Git configs for pull and redeploy a stack"
// @success 200 {object} stackResponse "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Not found"
// @failure 500 "Server error"
// @router /stacks/{id}/git [post]
func (handler *Handler) stackUpdateGit(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	var payload stackGitUpdatePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	stack, err := handler.DataStore.Stack().Read(portainer.StackID(stackID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a stack with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a stack with the specified identifier inside the database", err)
	} else if stack.WorkflowID == 0 {
		msg := "No Git config in the found stack"
		return httperror.InternalServerError(msg, errors.New(msg))
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	var gitConfig *gittypes.RepoConfig
	var sourceID portainer.SourceID
	if err := handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
		gitConfig, sourceID, err = loadGitConfigForStack(tx, userContext, stack.WorkflowID, stack.ID)
		if err != nil {
			return httperror.InternalServerError("Unable to load git config for stack", err)
		}

		if gitConfig == nil {
			msg := "No Git config in the found stack source"
			return httperror.InternalServerError(msg, errors.New(msg))
		}

		return nil
	}); err != nil {
		return response.TxErrorResponse(err)
	}

	if payload.AutoUpdate != nil && payload.AutoUpdate.Webhook != "" &&
		(stack.AutoUpdate == nil ||
			(stack.AutoUpdate != nil && stack.AutoUpdate.Webhook != payload.AutoUpdate.Webhook)) {
		if isUnique, err := handler.checkUniqueWebhookID(handler.DataStore, payload.AutoUpdate.Webhook); !isUnique || err != nil {
			return httperror.Conflict("Webhook ID already exists", errors.New("webhook ID already exists"))
		}
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

	user, err := handler.DataStore.User().Read(securityContext.UserID)
	if err != nil {
		return httperror.BadRequest("Cannot find context user", errors.Wrap(err, "failed to fetch the user"))
	}

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
		errMsg := "Stack editing is disabled for non-admin users"
		return httperror.Forbidden(errMsg, errors.New(errMsg))
	}

	//stop the autoupdate job if there is any
	if stack.AutoUpdate != nil {
		deployments.StopAutoupdate(stack.ID, stack.AutoUpdate.JobID, handler.Scheduler)
	}

	// Record the current git config as the deployment baseline if it was never set (legacy stacks).
	if stack.CurrentDeploymentInfo == nil {
		stack.CurrentDeploymentInfo = &portainer.StackDeploymentInfo{
			RepositoryURL:   gitConfig.URL,
			ReferenceName:   gitConfig.ReferenceName,
			ConfigFilePath:  gitConfig.ConfigFilePath,
			AdditionalFiles: stack.AdditionalFiles,
			ConfigHash:      gitConfig.ConfigHash,
			SourceID:        sourceID,
		}
	}

	// Update gitConfig based on payload; the updated config is saved to Source (not stack.GitConfig).
	gitConfig.ReferenceName = payload.RepositoryReferenceName
	if payload.ConfigFilePath != "" {
		gitConfig.ConfigFilePath = payload.ConfigFilePath
	}
	if payload.AdditionalFiles != nil {
		stack.AdditionalFiles = payload.AdditionalFiles
	}

	stack.EntryPoint = cmp.Or(payload.ConfigFilePath, stack.EntryPoint)

	stack.AutoUpdate = payload.AutoUpdate
	stack.Env = payload.Env
	stack.UpdatedBy = user.Username
	stack.UpdateDate = time.Now().Unix()

	if stack.Type == portainer.DockerSwarmStack {
		stack.Option = &portainer.StackOption{Prune: payload.Prune}
	}

	userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)

	if payload.SourceID != 0 {
		src, httpErr := sources.ValidateGitSourceAccess(handler.DataStore, userContext, payload.SourceID)
		if httpErr != nil {
			return httpErr
		}

		if src.Git == nil {
			return httperror.BadRequest("Source has no git configuration", errors.New("source has no git config"))
		}
	} else {
		gitConfig.TLSSkipVerify = payload.TLSSkipVerify
		if payload.RepositoryURL != "" {
			gitConfig.URL = payload.RepositoryURL
		}

		if payload.RepositoryAuthentication {
			password := payload.RepositoryPassword

			// When the existing stack is using the custom username/password and the password is not updated,
			// the stack should keep using the saved username/password
			if password == "" && gitConfig.Authentication != nil {
				password = gitConfig.Authentication.Password
			}

			gitConfig.Authentication = &gittypes.GitAuthentication{
				Username: payload.RepositoryUsername,
				Password: password,
			}

			if _, err := handler.GitService.LatestCommitID(
				context.TODO(),
				gitConfig.URL,
				gitConfig.ReferenceName,
				gitConfig.Authentication.Username,
				gitConfig.Authentication.Password,
				gitConfig.TLSSkipVerify,
			); err != nil {
				return httperror.InternalServerError("Unable to fetch git repository", err)
			}
		} else {
			gitConfig.Authentication = nil
		}
	}

	if payload.AutoUpdate != nil && payload.AutoUpdate.Interval != "" {
		if jobID, err := deployments.StartAutoupdate(context.TODO(), stack.ID, stack.AutoUpdate.Interval, handler.Scheduler, handler.StackDeployer, handler.DataStore, handler.GitService); err != nil {
			return err
		} else {
			stack.AutoUpdate.JobID = jobID
		}
	}

	var resp *stackResponse
	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := tx.Stack().Update(stack.ID, stack); err != nil {
			return err
		}
		userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
		if err := saveStackGitConfig(tx, userContext, stack.WorkflowID, stack.ID, sourceID, payload.SourceID, gitConfig); err != nil {
			return err
		}
		var err error
		resp, err = newStackResponse(tx, userContext, stack)
		return err
	}); err != nil {
		return httperror.InternalServerError("Unable to persist the stack changes inside the database", err)
	}

	return response.JSON(w, resp)
}
