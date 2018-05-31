package stacks

import (
	"net/http"
	"strings"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/filesystem"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
	"github.com/portainer/portainer/http/security"
)

type swarmStackFromFileContentPayload struct {
	Name             string
	EndpointID       int
	SwarmID          string
	StackFileContent string
	Env              []portainer.Pair
}

func (payload *swarmStackFromFileContentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid stack name")
	}
	if payload.EndpointID == 0 {
		return portainer.Error("Invalid endpoint identifier. Must be a positive number")
	}
	if govalidator.IsNull(payload.SwarmID) {
		return portainer.Error("Invalid Swarm ID")
	}
	if govalidator.IsNull(payload.StackFileContent) {
		return portainer.Error("Invalid stack file content")
	}
	return nil
}

func (handler *Handler) createSwarmStackFromFileContent(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload swarmStackFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	stacks, err := handler.StackService.Stacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve stacks from the database", err}
	}

	for _, stack := range stacks {
		if strings.EqualFold(stack.Name, payload.Name) {
			return &httperror.HandlerError{http.StatusConflict, "A stack with this name already exists", portainer.ErrStackAlreadyExists}
		}
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(payload.EndpointID))
	if err == portainer.ErrEndpointNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	stackIdentifier := buildStackIdentifier(payload.Name, payload.EndpointID)
	stack := &portainer.Stack{
		ID:         portainer.StackID(stackIdentifier),
		Name:       payload.Name,
		Type:       portainer.DockerSwarmStack,
		SwarmID:    payload.SwarmID,
		EndpointID: portainer.EndpointID(payload.EndpointID),
		EntryPoint: filesystem.ComposeFileDefaultName,
		Env:        payload.Env,
	}

	projectPath, err := handler.FileService.StoreStackFileFromBytes(string(stack.ID), stack.EntryPoint, []byte(payload.StackFileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist Compose file on disk", err}
	}
	stack.ProjectPath = projectPath

	doCleanUp := true
	defer handler.cleanUp(stack, &doCleanUp)

	config, configErr := handler.createSwarmDeployConfig(r, stack, endpoint, false)
	if configErr != nil {
		return configErr
	}

	err = handler.deploySwarmStack(config)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to deploy stack", err}
	}

	err = handler.StackService.CreateStack(stack)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the stack inside the database", err}
	}

	doCleanUp = false
	return response.JSON(w, stack)
}

type swarmStackFromGitRepositoryPayload struct {
	Name                        string
	EndpointID                  int
	SwarmID                     string
	Env                         []portainer.Pair
	RepositoryURL               string
	RepositoryAuthentication    bool
	RepositoryUsername          string
	RepositoryPassword          string
	ComposeFilePathInRepository string
}

func (payload *swarmStackFromGitRepositoryPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid stack name")
	}
	if payload.EndpointID == 0 {
		return portainer.Error("Invalid endpoint identifier. Must be a positive number")
	}
	if govalidator.IsNull(payload.SwarmID) {
		return portainer.Error("Invalid Swarm ID")
	}
	if govalidator.IsNull(payload.RepositoryURL) || !govalidator.IsURL(payload.RepositoryURL) {
		return portainer.Error("Invalid repository URL. Must correspond to a valid URL format")
	}
	if payload.RepositoryAuthentication && (govalidator.IsNull(payload.RepositoryUsername) || govalidator.IsNull(payload.RepositoryPassword)) {
		return portainer.Error("Invalid repository credentials. Username and password must be specified when authentication is enabled")
	}
	if govalidator.IsNull(payload.ComposeFilePathInRepository) {
		payload.ComposeFilePathInRepository = filesystem.ComposeFileDefaultName
	}
	return nil
}

func (handler *Handler) createSwarmStackFromGitRepository(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload swarmStackFromGitRepositoryPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	stacks, err := handler.StackService.Stacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve stacks from the database", err}
	}

	for _, stack := range stacks {
		if strings.EqualFold(stack.Name, payload.Name) {
			return &httperror.HandlerError{http.StatusConflict, "A stack with this name already exists", portainer.ErrStackAlreadyExists}
		}
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(payload.EndpointID))
	if err == portainer.ErrEndpointNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	stackIdentifier := buildStackIdentifier(payload.Name, payload.EndpointID)
	stack := &portainer.Stack{
		ID:         portainer.StackID(stackIdentifier),
		Name:       payload.Name,
		Type:       portainer.DockerSwarmStack,
		SwarmID:    payload.SwarmID,
		EndpointID: portainer.EndpointID(payload.EndpointID),
		EntryPoint: payload.ComposeFilePathInRepository,
		Env:        payload.Env,
	}

	projectPath := handler.FileService.GetStackProjectPath(string(stack.ID))
	stack.ProjectPath = projectPath

	gitCloneParams := &cloneRepositoryParameters{
		url:            payload.RepositoryURL,
		path:           projectPath,
		authentication: payload.RepositoryAuthentication,
		username:       payload.RepositoryUsername,
		password:       payload.RepositoryPassword,
	}
	err = handler.cloneGitRepository(gitCloneParams)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to clone git repository", err}
	}

	doCleanUp := true
	defer handler.cleanUp(stack, &doCleanUp)

	config, configErr := handler.createSwarmDeployConfig(r, stack, endpoint, false)
	if configErr != nil {
		return configErr
	}

	err = handler.deploySwarmStack(config)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to deploy stack", err}
	}

	err = handler.StackService.CreateStack(stack)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the stack inside the database", err}
	}

	doCleanUp = false
	return response.JSON(w, stack)
}

type swarmStackFromFileUploadPayload struct {
	Name             string
	EndpointID       int
	SwarmID          string
	StackFileContent []byte
	Env              []portainer.Pair
}

func (payload *swarmStackFromFileUploadPayload) Validate(r *http.Request) error {
	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return portainer.Error("Invalid stack name")
	}
	payload.Name = name

	endpointID, err := request.RetrieveNumericMultiPartFormValue(r, "EndpointID", false)
	if err != nil || endpointID == 0 {
		return portainer.Error("Invalid endpoint identifier. Must be a positive number")
	}
	payload.EndpointID = endpointID

	swarmID, err := request.RetrieveMultiPartFormValue(r, "SwarmID", false)
	if err != nil {
		return portainer.Error("Invalid Swarm ID")
	}
	payload.SwarmID = swarmID

	composeFileContent, err := request.RetrieveMultiPartFormFile(r, "file")
	if err != nil {
		return portainer.Error("Invalid Compose file. Ensure that the Compose file is uploaded correctly")
	}
	payload.StackFileContent = composeFileContent

	var env []portainer.Pair
	err = request.RetrieveMultiPartFormJSONValue(r, "Env", &env, true)
	if err != nil {
		return portainer.Error("Invalid Env parameter")
	}
	payload.Env = env
	return nil
}

func (handler *Handler) createSwarmStackFromFileUpload(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload := &swarmStackFromFileUploadPayload{}
	err := payload.Validate(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	stacks, err := handler.StackService.Stacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve stacks from the database", err}
	}

	for _, stack := range stacks {
		if strings.EqualFold(stack.Name, payload.Name) {
			return &httperror.HandlerError{http.StatusConflict, "A stack with this name already exists", portainer.ErrStackAlreadyExists}
		}
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(payload.EndpointID))
	if err == portainer.ErrEndpointNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	stackIdentifier := buildStackIdentifier(payload.Name, payload.EndpointID)
	stack := &portainer.Stack{
		ID:         portainer.StackID(stackIdentifier),
		Name:       payload.Name,
		Type:       portainer.DockerSwarmStack,
		SwarmID:    payload.SwarmID,
		EndpointID: portainer.EndpointID(payload.EndpointID),
		EntryPoint: filesystem.ComposeFileDefaultName,
		Env:        payload.Env,
	}

	projectPath, err := handler.FileService.StoreStackFileFromBytes(string(stack.ID), stack.EntryPoint, []byte(payload.StackFileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist Compose file on disk", err}
	}
	stack.ProjectPath = projectPath

	doCleanUp := true
	defer handler.cleanUp(stack, &doCleanUp)

	config, configErr := handler.createSwarmDeployConfig(r, stack, endpoint, false)
	if configErr != nil {
		return configErr
	}

	err = handler.deploySwarmStack(config)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to deploy stack", err}
	}

	err = handler.StackService.CreateStack(stack)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the stack inside the database", err}
	}

	doCleanUp = false
	return response.JSON(w, stack)
}

type swarmStackDeploymentConfig struct {
	stack      *portainer.Stack
	endpoint   *portainer.Endpoint
	dockerhub  *portainer.DockerHub
	registries []portainer.Registry
	prune      bool
}

func (handler *Handler) createSwarmDeployConfig(r *http.Request, stack *portainer.Stack, endpoint *portainer.Endpoint, prune bool) (*swarmStackDeploymentConfig, *httperror.HandlerError) {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	dockerhub, err := handler.DockerHubService.DockerHub()
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve DockerHub details from the database", err}
	}

	registries, err := handler.RegistryService.Registries()
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve registries from the database", err}
	}
	filteredRegistries := security.FilterRegistries(registries, securityContext)

	config := &swarmStackDeploymentConfig{
		stack:      stack,
		endpoint:   endpoint,
		dockerhub:  dockerhub,
		registries: filteredRegistries,
		prune:      prune,
	}

	return config, nil
}

func (handler *Handler) deploySwarmStack(config *swarmStackDeploymentConfig) error {
	handler.stackCreationMutex.Lock()
	defer handler.stackCreationMutex.Unlock()

	handler.SwarmStackManager.Login(config.dockerhub, config.registries, config.endpoint)

	err := handler.SwarmStackManager.Deploy(config.stack, config.prune, config.endpoint)
	if err != nil {
		return err
	}

	err = handler.SwarmStackManager.Logout(config.endpoint)
	if err != nil {
		return err
	}

	return nil
}
