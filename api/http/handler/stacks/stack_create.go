package stacks

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/pkg/errors"
)

func (handler *Handler) stackCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackType, err := request.RetrieveRouteVariableValue(r, "type")
	if err != nil {
		return httperror.BadRequest("Invalid path parameter: type", err)
	}

	method, err := request.RetrieveRouteVariableValue(r, "method")
	if err != nil {
		return httperror.BadRequest("Invalid path parameter: method", err)
	}

	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: endpointId", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user info from request context", err)
	}

	canManage, err := handler.userCanManageStacks(securityContext, endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to verify user authorizations to validate stack deletion", err)
	}
	if !canManage {
		errMsg := "Stack creation is disabled for non-admin users"
		return httperror.Forbidden(errMsg, errors.New(errMsg))
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return httperror.Forbidden("Permission denied to access environment", err)
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user details from authentication token", err)
	}

	switch stackType {
	case "swarm":
		return handler.createSwarmStack(w, r, method, endpoint, tokenData.ID)
	case "standalone":
		return handler.createComposeStack(w, r, method, endpoint, tokenData.ID)
	case "kubernetes":
		return handler.createKubernetesStack(w, r, method, endpoint, tokenData.ID)
	}

	return httperror.BadRequest("Invalid value for query parameter: type. Value must be one of: 1 (Swarm stack) or 2 (Compose stack)", errors.New(request.ErrInvalidQueryParameter))
}

func (handler *Handler) createComposeStack(w http.ResponseWriter, r *http.Request, method string, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	switch method {
	case "string":
		return handler.createComposeStackFromFileContent(w, r, endpoint, userID)
	case "repository":
		return handler.createComposeStackFromGitRepository(w, r, endpoint, userID)
	case "file":
		return handler.createComposeStackFromFileUpload(w, r, endpoint, userID)
	}

	return httperror.BadRequest("Invalid value for query parameter: method. Value must be one of: string, repository or file", errors.New(request.ErrInvalidQueryParameter))
}

func (handler *Handler) createSwarmStack(w http.ResponseWriter, r *http.Request, method string, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	switch method {
	case "string":
		return handler.createSwarmStackFromFileContent(w, r, endpoint, userID)
	case "repository":
		return handler.createSwarmStackFromGitRepository(w, r, endpoint, userID)
	case "file":
		return handler.createSwarmStackFromFileUpload(w, r, endpoint, userID)
	}

	return httperror.BadRequest("Invalid value for query parameter: method. Value must be one of: string, repository or file", errors.New(request.ErrInvalidQueryParameter))
}

func (handler *Handler) createKubernetesStack(w http.ResponseWriter, r *http.Request, method string, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	switch method {
	case "string":
		return handler.createKubernetesStackFromFileContent(w, r, endpoint, userID)
	case "repository":
		return handler.createKubernetesStackFromGitRepository(w, r, endpoint, userID)
	case "url":
		return handler.createKubernetesStackFromManifestURL(w, r, endpoint, userID)
	}

	return httperror.BadRequest("Invalid value for query parameter: method. Value must be one of: string or repository", errors.New(request.ErrInvalidQueryParameter))
}

func (handler *Handler) decorateStackResponse(w http.ResponseWriter, stack *portainer.Stack, userID portainer.UserID) *httperror.HandlerError {
	var resourceControl *portainer.ResourceControl

	isAdmin, err := handler.userIsAdmin(userID)
	if err != nil {
		return httperror.InternalServerError("Unable to load user information from the database", err)
	}

	if isAdmin {
		resourceControl = authorization.NewAdministratorsOnlyResourceControl(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
	} else {
		resourceControl = authorization.NewPrivateResourceControl(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl, userID)
	}

	err = handler.DataStore.ResourceControl().Create(resourceControl)
	if err != nil {
		return httperror.InternalServerError("Unable to persist resource control inside the database", err)
	}

	stack.ResourceControl = resourceControl

	if stack.GitConfig != nil && stack.GitConfig.Authentication != nil && stack.GitConfig.Authentication.Password != "" {
		// sanitize password in the http response to minimise possible security leaks
		stack.GitConfig.Authentication.Password = ""
	}

	return response.JSON(w, stack)
}
