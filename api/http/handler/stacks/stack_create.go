package stacks

import (
	"errors"
	"log"
	"net/http"

	"github.com/docker/cli/cli/compose/loader"
	"github.com/docker/cli/cli/compose/types"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
)

func (handler *Handler) cleanUp(stack *portainer.Stack, doCleanUp *bool) error {
	if !*doCleanUp {
		return nil
	}

	err := handler.FileService.RemoveDirectory(stack.ProjectPath)
	if err != nil {
		log.Printf("http error: Unable to cleanup stack creation (err=%s)\n", err)
	}
	return nil
}

// @summary Create a Stack
// @description
// @tags Stacks
// @security ApiKeyAuth
// @accept json
// @produce json
// @param method query string true "Creation Method" Enums(file,string,repository)
// @param type query int true "Stack Type 1 - swarm, 2 - compose, 3 - kubernetes" Enums(1,2,3)
// @param endpointId query int true "Endpoint id"
// @param body_string body swarmStackFromFileContentPayload true "Required when using method=string"
// @param body_file body swarmStackFromFileUploadPayload true "Required when using method=file"
// @param body_repository body swarmStackFromGitRepositoryPayload true "Required when using method=repository"
// @success 200 {object} portainer.Stack
// @failure 400,403,409,500
// @router /stacks [post]
func (handler *Handler) stackCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackType, err := request.RetrieveNumericQueryParameter(r, "type", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: type", err}
	}

	method, err := request.RetrieveQueryParameter(r, "method", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: method", err}
	}

	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: endpointId", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	if !endpoint.SecuritySettings.AllowStackManagementForRegularUsers {
		securityContext, err := security.RetrieveRestrictedRequestContext(r)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user info from request context", err}
		}

		canCreate, err := handler.userCanCreateStack(securityContext, portainer.EndpointID(endpointID))

		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to verify user authorizations to validate stack creation", err}
		}

		if !canCreate {
			errMsg := "Stack creation is disabled for non-admin users"
			return &httperror.HandlerError{http.StatusForbidden, errMsg, errors.New(errMsg)}
		}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", err}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user details from authentication token", err}
	}

	switch portainer.StackType(stackType) {
	case portainer.DockerSwarmStack:
		return handler.createSwarmStack(w, r, method, endpoint, tokenData.ID)
	case portainer.DockerComposeStack:
		return handler.createComposeStack(w, r, method, endpoint, tokenData.ID)
	case portainer.KubernetesStack:
		if tokenData.Role != portainer.AdministratorRole {
			return &httperror.HandlerError{http.StatusForbidden, "Access denied", httperrors.ErrUnauthorized}
		}

		return handler.createKubernetesStack(w, r, endpoint)
	}

	return &httperror.HandlerError{http.StatusBadRequest, "Invalid value for query parameter: type. Value must be one of: 1 (Swarm stack) or 2 (Compose stack)", errors.New(request.ErrInvalidQueryParameter)}
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

	return &httperror.HandlerError{http.StatusBadRequest, "Invalid value for query parameter: method. Value must be one of: string, repository or file", errors.New(request.ErrInvalidQueryParameter)}
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

	return &httperror.HandlerError{http.StatusBadRequest, "Invalid value for query parameter: method. Value must be one of: string, repository or file", errors.New(request.ErrInvalidQueryParameter)}
}

func (handler *Handler) isValidStackFile(stackFileContent []byte, securitySettings *portainer.EndpointSecuritySettings) error {
	composeConfigYAML, err := loader.ParseYAML(stackFileContent)
	if err != nil {
		return err
	}

	composeConfigFile := types.ConfigFile{
		Config: composeConfigYAML,
	}

	composeConfigDetails := types.ConfigDetails{
		ConfigFiles: []types.ConfigFile{composeConfigFile},
		Environment: map[string]string{},
	}

	composeConfig, err := loader.Load(composeConfigDetails, func(options *loader.Options) {
		options.SkipValidation = true
		options.SkipInterpolation = true
	})
	if err != nil {
		return err
	}

	for key := range composeConfig.Services {
		service := composeConfig.Services[key]
		if !securitySettings.AllowBindMountsForRegularUsers {
			for _, volume := range service.Volumes {
				if volume.Type == "bind" {
					return errors.New("bind-mount disabled for non administrator users")
				}
			}
		}

		if !securitySettings.AllowPrivilegedModeForRegularUsers && service.Privileged == true {
			return errors.New("privileged mode disabled for non administrator users")
		}

		if !securitySettings.AllowHostNamespaceForRegularUsers && service.Pid == "host" {
			return errors.New("pid host disabled for non administrator users")
		}

		if !securitySettings.AllowDeviceMappingForRegularUsers && service.Devices != nil && len(service.Devices) > 0 {
			return errors.New("device mapping disabled for non administrator users")
		}

		if !securitySettings.AllowContainerCapabilitiesForRegularUsers && (len(service.CapAdd) > 0 || len(service.CapDrop) > 0) {
			return errors.New("container capabilities disabled for non administrator users")
		}
	}

	return nil
}

func (handler *Handler) decorateStackResponse(w http.ResponseWriter, stack *portainer.Stack, userID portainer.UserID) *httperror.HandlerError {
	var resourceControl *portainer.ResourceControl

	isAdmin, err := handler.userIsAdmin(userID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to load user information from the database", err}
	}

	if isAdmin {
		resourceControl = authorization.NewAdministratorsOnlyResourceControl(stack.Name, portainer.StackResourceControl)
	} else {
		resourceControl = authorization.NewPrivateResourceControl(stack.Name, portainer.StackResourceControl, userID)
	}

	err = handler.DataStore.ResourceControl().CreateResourceControl(resourceControl)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist resource control inside the database", err}
	}

	stack.ResourceControl = resourceControl
	return response.JSON(w, stack)
}
