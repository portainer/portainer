package stacks

import (
	"errors"
	"net/http"
	"path"
	"strconv"
	"strings"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
)

type swarmStackFromFileContentPayload struct {
	Name             string
	SwarmID          string
	StackFileContent string
	Env              []portainer.Pair
}

func (payload *swarmStackFromFileContentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid stack name")
	}
	if govalidator.IsNull(payload.SwarmID) {
		return portainer.Error("Invalid Swarm ID")
	}
	if govalidator.IsNull(payload.StackFileContent) {
		return portainer.Error("Invalid stack file content")
	}
	return nil
}

func (handler *Handler) createSwarmStackFromFileContent(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint) *httperror.HandlerError {
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

	stackID := handler.StackService.GetNextIdentifier()
	stack := &portainer.Stack{
		ID:         portainer.StackID(stackID),
		Name:       payload.Name,
		Type:       portainer.DockerSwarmStack,
		SwarmID:    payload.SwarmID,
		EndpointID: endpoint.ID,
		EntryPoint: filesystem.ComposeFileDefaultName,
		Env:        payload.Env,
	}

	stackFolder := strconv.Itoa(int(stack.ID))
	projectPath, err := handler.FileService.StoreStackFileFromBytes(stackFolder, stack.EntryPoint, []byte(payload.StackFileContent))
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
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
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
	SwarmID                     string
	Env                         []portainer.Pair
	RepositoryURL               string
	RepositoryReferenceName     string
	RepositoryAuthentication    bool
	RepositoryUsername          string
	RepositoryPassword          string
	ComposeFilePathInRepository string
}

func (payload *swarmStackFromGitRepositoryPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid stack name")
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

func (handler *Handler) createSwarmStackFromGitRepository(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint) *httperror.HandlerError {
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

	stackID := handler.StackService.GetNextIdentifier()
	stack := &portainer.Stack{
		ID:         portainer.StackID(stackID),
		Name:       payload.Name,
		Type:       portainer.DockerSwarmStack,
		SwarmID:    payload.SwarmID,
		EndpointID: endpoint.ID,
		EntryPoint: payload.ComposeFilePathInRepository,
		Env:        payload.Env,
	}

	projectPath := handler.FileService.GetStackProjectPath(strconv.Itoa(int(stack.ID)))
	stack.ProjectPath = projectPath

	gitCloneParams := &cloneRepositoryParameters{
		url:            payload.RepositoryURL,
		referenceName:  payload.RepositoryReferenceName,
		path:           projectPath,
		authentication: payload.RepositoryAuthentication,
		username:       payload.RepositoryUsername,
		password:       payload.RepositoryPassword,
	}

	doCleanUp := true
	defer handler.cleanUp(stack, &doCleanUp)

	err = handler.cloneGitRepository(gitCloneParams)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to clone git repository", err}
	}

	config, configErr := handler.createSwarmDeployConfig(r, stack, endpoint, false)
	if configErr != nil {
		return configErr
	}

	err = handler.deploySwarmStack(config)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
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

	swarmID, err := request.RetrieveMultiPartFormValue(r, "SwarmID", false)
	if err != nil {
		return portainer.Error("Invalid Swarm ID")
	}
	payload.SwarmID = swarmID

	composeFileContent, _, err := request.RetrieveMultiPartFormFile(r, "file")
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

func (handler *Handler) createSwarmStackFromFileUpload(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint) *httperror.HandlerError {
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

	stackID := handler.StackService.GetNextIdentifier()
	stack := &portainer.Stack{
		ID:         portainer.StackID(stackID),
		Name:       payload.Name,
		Type:       portainer.DockerSwarmStack,
		SwarmID:    payload.SwarmID,
		EndpointID: endpoint.ID,
		EntryPoint: filesystem.ComposeFileDefaultName,
		Env:        payload.Env,
	}

	stackFolder := strconv.Itoa(int(stack.ID))
	projectPath, err := handler.FileService.StoreStackFileFromBytes(stackFolder, stack.EntryPoint, []byte(payload.StackFileContent))
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
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
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
	isAdmin    bool
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
		isAdmin:    securityContext.IsAdmin,
	}

	return config, nil
}

func (handler *Handler) deploySwarmStack(config *swarmStackDeploymentConfig) error {
	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return err
	}

	if !settings.AllowBindMountsForRegularUsers && !config.isAdmin {
		composeFilePath := path.Join(config.stack.ProjectPath, config.stack.EntryPoint)

		stackContent, err := handler.FileService.GetFileContent(composeFilePath)
		if err != nil {
			return err
		}

		valid, err := handler.isValidStackFile(stackContent)
		if err != nil {
			return err
		}
		if !valid {
			return errors.New("bind-mount disabled for non administrator users")
		}
	}

	handler.stackCreationMutex.Lock()
	defer handler.stackCreationMutex.Unlock()

	handler.SwarmStackManager.Login(config.dockerhub, config.registries, config.endpoint)

	err = handler.SwarmStackManager.Deploy(config.stack, config.prune, config.endpoint)
	if err != nil {
		return err
	}

	err = handler.SwarmStackManager.Logout(config.endpoint)
	if err != nil {
		return err
	}

	return nil
}
