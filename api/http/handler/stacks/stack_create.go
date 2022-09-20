package stacks

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/stackutils"

	"github.com/docker/cli/cli/compose/loader"
	"github.com/docker/cli/cli/compose/types"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

func (handler *Handler) cleanUp(stack *portainer.Stack, doCleanUp *bool) error {
	if !*doCleanUp {
		return nil
	}

	err := handler.FileService.RemoveDirectory(stack.ProjectPath)
	if err != nil {
		log.Error().Err(err).Msg("unable to cleanup stack creation")
	}

	return nil
}

// @id StackCreate
// @summary Deploy a new stack
// @description Deploy a new stack into a Docker environment(endpoint) specified via the environment(endpoint) identifier.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @accept json,multipart/form-data
// @produce json
// @param type query int true "Stack deployment type. Possible values: 1 (Swarm stack), 2 (Compose stack) or 3 (Kubernetes stack)." Enums(1,2,3)
// @param method query string true "Stack deployment method. Possible values: file, string, repository or url." Enums(string, file, repository, url)
// @param endpointId query int true "Identifier of the environment(endpoint) that will be used to deploy the stack"
// @param body_swarm_string body swarmStackFromFileContentPayload false "Required when using method=string and type=1"
// @param body_swarm_repository body swarmStackFromGitRepositoryPayload false "Required when using method=repository and type=1"
// @param body_compose_string body composeStackFromFileContentPayload false "Required when using method=string and type=2"
// @param body_compose_repository body composeStackFromGitRepositoryPayload false "Required when using method=repository and type=2"
// @param body_kubernetes_string body kubernetesStringDeploymentPayload false "Required when using method=string and type=3"
// @param body_kubernetes_repository body kubernetesGitDeploymentPayload false "Required when using method=repository and type=3"
// @param body_kubernetes_url body kubernetesManifestURLDeploymentPayload false "Required when using method=url and type=3"
// @param Name formData string false "Name of the stack. required when method is file"
// @param SwarmID formData string false "Swarm cluster identifier. Required when method equals file and type equals 1. required when method is file"
// @param Env formData string false "Environment(Endpoint) variables passed during deployment, represented as a JSON array [{'name': 'name', 'value': 'value'}]. Optional, used when method equals file and type equals 1."
// @param file formData file false "Stack file. required when method is file"
// @success 200 {object} portainer.CustomTemplate
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /stacks [post]
func (handler *Handler) stackCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackType, err := request.RetrieveNumericQueryParameter(r, "type", false)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: type", err)
	}

	method, err := request.RetrieveQueryParameter(r, "method", false)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: method", err)
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

	switch portainer.StackType(stackType) {
	case portainer.DockerSwarmStack:
		return handler.createSwarmStack(w, r, method, endpoint, tokenData.ID)
	case portainer.DockerComposeStack:
		return handler.createComposeStack(w, r, method, endpoint, tokenData.ID)
	case portainer.KubernetesStack:
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

		if !securitySettings.AllowSysctlSettingForRegularUsers && service.Sysctls != nil && len(service.Sysctls) > 0 {
			return errors.New("sysctl setting disabled for non administrator users")
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
