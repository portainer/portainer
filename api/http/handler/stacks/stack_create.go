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
	"github.com/portainer/portainer/api/http/security"
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

// POST request on /api/stacks?type=<type>&method=<method>&endpointId=<endpointId>
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

	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	if !settings.AllowStackManagementForRegularUsers {
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

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint, true)
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

func (handler *Handler) isValidStackFile(stackFileContent []byte, settings *portainer.Settings) error {
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
		if !settings.AllowBindMountsForRegularUsers {
			for _, volume := range service.Volumes {
				if volume.Type == "bind" {
					return errors.New("bind-mount disabled for non administrator users")
				}
			}
		}

		if !settings.AllowPrivilegedModeForRegularUsers && service.Privileged == true {
			return errors.New("privileged mode disabled for non administrator users")
		}

		if !settings.AllowHostNamespaceForRegularUsers && service.Pid == "host" {
			return errors.New("pid host disabled for non administrator users")
		}

		if !settings.AllowDeviceMappingForRegularUsers && service.Devices != nil && len(service.Devices) > 0 {
			return errors.New("device mapping disabled for non administrator users")
		}

		if !settings.AllowContainerCapabilitiesForRegularUsers && (len(service.CapAdd) > 0 || len(service.CapDrop) > 0) {
			return errors.New("container capabilities disabled for non administrator users")
		}
	}

	return nil
}

func (handler *Handler) decorateStackResponse(w http.ResponseWriter, stack *portainer.Stack, userID portainer.UserID) *httperror.HandlerError {
	resourceControl := portainer.NewPrivateResourceControl(stack.Name, portainer.StackResourceControl, userID)

	err := handler.ResourceControlService.CreateResourceControl(resourceControl)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist resource control inside the database", err}
	}

	stack.ResourceControl = resourceControl
	return response.JSON(w, stack)
}
