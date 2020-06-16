package stacks

import (
	"errors"
	"net/http"
	"path"
	"regexp"
	"strconv"
	"strings"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
)

// this is coming from libcompose
// https://github.com/portainer/libcompose/blob/master/project/context.go#L117-L120
func normalizeStackName(name string) string {
	r := regexp.MustCompile("[^a-z0-9]+")
	return r.ReplaceAllString(strings.ToLower(name), "")
}

type composeStackFromFileContentPayload struct {
	Name             string
	StackFileContent string
	Env              []portainer.Pair
}

func (payload *composeStackFromFileContentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid stack name")
	}
	payload.Name = normalizeStackName(payload.Name)
	if govalidator.IsNull(payload.StackFileContent) {
		return portainer.Error("Invalid stack file content")
	}
	return nil
}

func (handler *Handler) createComposeStackFromFileContent(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	var payload composeStackFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	stacks, err := handler.DataStore.Stack().Stacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve stacks from the database", err}
	}

	for _, stack := range stacks {
		if strings.EqualFold(stack.Name, payload.Name) {
			return &httperror.HandlerError{http.StatusConflict, "A stack with this name already exists", errStackAlreadyExists}
		}
	}

	stackID := handler.DataStore.Stack().GetNextIdentifier()
	stack := &portainer.Stack{
		ID:         portainer.StackID(stackID),
		Name:       payload.Name,
		Type:       portainer.DockerComposeStack,
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

	config, configErr := handler.createComposeDeployConfig(r, stack, endpoint)
	if configErr != nil {
		return configErr
	}

	err = handler.deployComposeStack(config)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
	}

	err = handler.DataStore.Stack().CreateStack(stack)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the stack inside the database", err}
	}

	doCleanUp = false
	return handler.decorateStackResponse(w, stack, userID)
}

type composeStackFromGitRepositoryPayload struct {
	Name                        string
	RepositoryURL               string
	RepositoryReferenceName     string
	RepositoryAuthentication    bool
	RepositoryUsername          string
	RepositoryPassword          string
	ComposeFilePathInRepository string
	Env                         []portainer.Pair
}

func (payload *composeStackFromGitRepositoryPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid stack name")
	}
	payload.Name = normalizeStackName(payload.Name)
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

func (handler *Handler) createComposeStackFromGitRepository(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	var payload composeStackFromGitRepositoryPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	stacks, err := handler.DataStore.Stack().Stacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve stacks from the database", err}
	}

	for _, stack := range stacks {
		if strings.EqualFold(stack.Name, payload.Name) {
			return &httperror.HandlerError{http.StatusConflict, "A stack with this name already exists", errStackAlreadyExists}
		}
	}

	stackID := handler.DataStore.Stack().GetNextIdentifier()
	stack := &portainer.Stack{
		ID:         portainer.StackID(stackID),
		Name:       payload.Name,
		Type:       portainer.DockerComposeStack,
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

	config, configErr := handler.createComposeDeployConfig(r, stack, endpoint)
	if configErr != nil {
		return configErr
	}

	err = handler.deployComposeStack(config)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
	}

	err = handler.DataStore.Stack().CreateStack(stack)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the stack inside the database", err}
	}

	doCleanUp = false
	return handler.decorateStackResponse(w, stack, userID)
}

type composeStackFromFileUploadPayload struct {
	Name             string
	StackFileContent []byte
	Env              []portainer.Pair
}

func (payload *composeStackFromFileUploadPayload) Validate(r *http.Request) error {
	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return portainer.Error("Invalid stack name")
	}
	payload.Name = normalizeStackName(name)

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

func (handler *Handler) createComposeStackFromFileUpload(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	payload := &composeStackFromFileUploadPayload{}
	err := payload.Validate(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	stacks, err := handler.DataStore.Stack().Stacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve stacks from the database", err}
	}

	for _, stack := range stacks {
		if strings.EqualFold(stack.Name, payload.Name) {
			return &httperror.HandlerError{http.StatusConflict, "A stack with this name already exists", errStackAlreadyExists}
		}
	}

	stackID := handler.DataStore.Stack().GetNextIdentifier()
	stack := &portainer.Stack{
		ID:         portainer.StackID(stackID),
		Name:       payload.Name,
		Type:       portainer.DockerComposeStack,
		EndpointID: endpoint.ID,
		EntryPoint: filesystem.ComposeFileDefaultName,
		Env:        payload.Env,
	}

	stackFolder := strconv.Itoa(int(stack.ID))
	projectPath, err := handler.FileService.StoreStackFileFromBytes(stackFolder, stack.EntryPoint, payload.StackFileContent)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist Compose file on disk", err}
	}
	stack.ProjectPath = projectPath

	doCleanUp := true
	defer handler.cleanUp(stack, &doCleanUp)

	config, configErr := handler.createComposeDeployConfig(r, stack, endpoint)
	if configErr != nil {
		return configErr
	}

	err = handler.deployComposeStack(config)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
	}

	err = handler.DataStore.Stack().CreateStack(stack)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the stack inside the database", err}
	}

	doCleanUp = false
	return handler.decorateStackResponse(w, stack, userID)
}

type composeStackDeploymentConfig struct {
	stack      *portainer.Stack
	endpoint   *portainer.Endpoint
	dockerhub  *portainer.DockerHub
	registries []portainer.Registry
	isAdmin    bool
}

func (handler *Handler) createComposeDeployConfig(r *http.Request, stack *portainer.Stack, endpoint *portainer.Endpoint) (*composeStackDeploymentConfig, *httperror.HandlerError) {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	dockerhub, err := handler.DataStore.DockerHub().DockerHub()
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve DockerHub details from the database", err}
	}

	registries, err := handler.DataStore.Registry().Registries()
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve registries from the database", err}
	}
	filteredRegistries := security.FilterRegistries(registries, securityContext)

	config := &composeStackDeploymentConfig{
		stack:      stack,
		endpoint:   endpoint,
		dockerhub:  dockerhub,
		registries: filteredRegistries,
		isAdmin:    securityContext.IsAdmin,
	}

	return config, nil
}

// TODO: libcompose uses credentials store into a config.json file to pull images from
// private registries. Right now the only solution is to re-use the embedded Docker binary
// to login/logout, which will generate the required data in the config.json file and then
// clean it. Hence the use of the mutex.
// We should contribute to libcompose to support authentication without using the config.json file.
func (handler *Handler) deployComposeStack(config *composeStackDeploymentConfig) error {
	settings, err := handler.DataStore.Settings().Settings()
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

	err = handler.ComposeStackManager.Up(config.stack, config.endpoint)
	if err != nil {
		return err
	}

	return handler.SwarmStackManager.Logout(config.endpoint)
}
