package stacks

import (
	"net/http"
	"time"

	"github.com/asaskevich/govalidator"
	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/stackutils"
)

type stackGitUpdatePayload struct {
	AutoUpdate               *portainer.StackAutoUpdate
	Env                      []portainer.Pair
	RepositoryReferenceName  string
	RepositoryAuthentication bool
	RepositoryUsername       string
	RepositoryPassword       string
}

func (payload *stackGitUpdatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.RepositoryReferenceName) {
		payload.RepositoryReferenceName = defaultGitReferenceName
	}

	if err := validateStackAutoUpdate(payload.AutoUpdate); err != nil {
		return err
	}
	return nil
}

// @id StackUpdateGit
// @summary Update a stack's Git configs
// @description Update the Git settings in a stack, e.g., RepositoryReferenceName and AutoUpdate
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Stack identifier"
// @param endpointId query int false "Stacks created before version 1.18.0 might not have an associated environment(endpoint) identifier. Use this optional parameter to set the environment(endpoint) identifier used by the stack."
// @param body body stackGitUpdatePayload true "Git configs for pull and redeploy a stack"
// @success 200 {object} portainer.Stack "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Not found"
// @failure 500 "Server error"
// @router /stacks/{id}/git [post]
func (handler *Handler) stackUpdateGit(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid stack identifier route variable", Err: err}
	}

	var payload stackGitUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	stack, err := handler.DataStore.Stack().Stack(portainer.StackID(stackID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find a stack with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find a stack with the specified identifier inside the database", Err: err}
	} else if stack.GitConfig == nil {
		msg := "No Git config in the found stack"
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: msg, Err: errors.New(msg)}
	}

	// TODO: this is a work-around for stacks created with Portainer version >= 1.17.1
	// The EndpointID property is not available for these stacks, this API environment(endpoint)
	// can use the optional EndpointID query parameter to associate a valid environment(endpoint) identifier to the stack.
	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", true)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid query parameter: endpointId", Err: err}
	}
	if endpointID != int(stack.EndpointID) {
		stack.EndpointID = portainer.EndpointID(endpointID)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(stack.EndpointID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find the environment associated to the stack inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find the environment associated to the stack inside the database", Err: err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Permission denied to access environment", Err: err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve info from request context", Err: err}
	}

	user, err := handler.DataStore.User().User(securityContext.UserID)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Cannot find context user", Err: errors.Wrap(err, "failed to fetch the user")}
	}

	if stack.Type == portainer.DockerSwarmStack || stack.Type == portainer.DockerComposeStack {
		resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
		if err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve a resource control associated to the stack", Err: err}
		}

		access, err := handler.userCanAccessStack(securityContext, endpoint.ID, resourceControl)
		if err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to verify user authorizations to validate stack access", Err: err}
		}
		if !access {
			return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Access denied to resource", Err: httperrors.ErrResourceAccessDenied}
		}
	}

	//stop the autoupdate job if there is any
	if stack.AutoUpdate != nil {
		stopAutoupdate(stack.ID, stack.AutoUpdate.JobID, *handler.Scheduler)
	}

	//update retrieved stack data based on the payload
	stack.GitConfig.ReferenceName = payload.RepositoryReferenceName
	stack.AutoUpdate = payload.AutoUpdate
	stack.Env = payload.Env
	stack.UpdatedBy = user.Username
	stack.UpdateDate = time.Now().Unix()

	if payload.RepositoryAuthentication {
		password := payload.RepositoryPassword
		if password == "" && stack.GitConfig != nil && stack.GitConfig.Authentication != nil {
			password = stack.GitConfig.Authentication.Password
		}
		stack.GitConfig.Authentication = &gittypes.GitAuthentication{
			Username: payload.RepositoryUsername,
			Password: password,
		}
		_, err = handler.GitService.LatestCommitID(stack.GitConfig.URL, stack.GitConfig.ReferenceName, stack.GitConfig.Authentication.Username, stack.GitConfig.Authentication.Password)
		if err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to fetch git repository", Err: err}
		}
	} else {
		stack.GitConfig.Authentication = nil
	}

	if payload.AutoUpdate != nil && payload.AutoUpdate.Interval != "" {
		jobID, e := startAutoupdate(stack.ID, stack.AutoUpdate.Interval, handler.Scheduler, handler.StackDeployer, handler.DataStore, handler.GitService)
		if e != nil {
			return e
		}

		stack.AutoUpdate.JobID = jobID
	}

	//save the updated stack to DB
	err = handler.DataStore.Stack().UpdateStack(stack.ID, stack)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist the stack changes inside the database", Err: err}
	}

	if stack.GitConfig != nil && stack.GitConfig.Authentication != nil && stack.GitConfig.Authentication.Password != "" {
		// sanitize password in the http response to minimise possible security leaks
		stack.GitConfig.Authentication.Password = ""
	}

	return response.JSON(w, stack)
}
