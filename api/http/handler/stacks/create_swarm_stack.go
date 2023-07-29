package stacks

import (
	"fmt"
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/pkg/errors"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/git/update"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/stackbuilders"
	"github.com/portainer/portainer/api/stacks/stackutils"
)

type swarmStackFromFileContentPayload struct {
	// Name of the stack
	Name string `example:"myStack" validate:"required"`
	// Swarm cluster identifier
	SwarmID string `example:"jpofkc0i9uo9wtx1zesuk649w" validate:"required"`
	// Content of the Stack file
	StackFileContent string `example:"version: 3\n services:\n web:\n image:nginx" validate:"required"`
	// A list of environment variables used during stack deployment
	Env []portainer.Pair
	// Whether the stack is from a app template
	FromAppTemplate bool `example:"false"`
}

func (payload *swarmStackFromFileContentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("Invalid stack name")
	}
	if govalidator.IsNull(payload.SwarmID) {
		return errors.New("Invalid Swarm ID")
	}
	if govalidator.IsNull(payload.StackFileContent) {
		return errors.New("Invalid stack file content")
	}
	return nil
}

func createStackPayloadFromSwarmFileContentPayload(name string, swarmID string, fileContent string, env []portainer.Pair, fromAppTemplate bool) stackbuilders.StackPayload {
	return stackbuilders.StackPayload{
		Name:             name,
		SwarmID:          swarmID,
		StackFileContent: fileContent,
		Env:              env,
		FromAppTemplate:  fromAppTemplate,
	}
}

// @id StackCreateDockerSwarmString
// @summary Deploy a new swarm stack from a text
// @description Deploy a new stack into a Docker environment specified via the environment identifier.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body swarmStackFromFileContentPayload true "stack config"
// @param endpointId query int true "Identifier of the environment that will be used to deploy the stack"
// @success 200 {object} portainer.Stack
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /stacks/create/swarm/string [post]
func (handler *Handler) createSwarmStackFromFileContent(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	var payload swarmStackFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	payload.Name = handler.SwarmStackManager.NormalizeStackName(payload.Name)

	isUnique, err := handler.checkUniqueStackNameInDocker(endpoint, payload.Name, 0, true)

	if err != nil {
		return httperror.InternalServerError("Unable to check for name collision", err)
	}
	if !isUnique {
		return stackExistsError(payload.Name)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	stackPayload := createStackPayloadFromSwarmFileContentPayload(payload.Name, payload.SwarmID, payload.StackFileContent, payload.Env, payload.FromAppTemplate)

	swarmStackBuilder := stackbuilders.CreateSwarmStackFileContentBuilder(securityContext,
		handler.DataStore,
		handler.FileService,
		handler.StackDeployer)

	stackBuilderDirector := stackbuilders.NewStackBuilderDirector(swarmStackBuilder)
	stack, httpErr := stackBuilderDirector.Build(&stackPayload, endpoint)
	if httpErr != nil {
		return httpErr
	}

	return handler.decorateStackResponse(w, stack, userID)
}

type swarmStackFromGitRepositoryPayload struct {
	// Name of the stack
	Name string `example:"myStack" validate:"required"`
	// Swarm cluster identifier
	SwarmID string `example:"jpofkc0i9uo9wtx1zesuk649w" validate:"required"`
	// A list of environment variables used during stack deployment
	Env []portainer.Pair

	// URL of a Git repository hosting the Stack file
	RepositoryURL string `example:"https://github.com/openfaas/faas" validate:"required"`
	// Reference name of a Git repository hosting the Stack file
	RepositoryReferenceName string `example:"refs/heads/master"`
	// Use basic authentication to clone the Git repository
	RepositoryAuthentication bool `example:"true"`
	// Username used in basic authentication. Required when RepositoryAuthentication is true.
	RepositoryUsername string `example:"myGitUsername"`
	// Password used in basic authentication. Required when RepositoryAuthentication is true.
	RepositoryPassword string `example:"myGitPassword"`
	// Whether the stack is from a app template
	FromAppTemplate bool `example:"false"`
	// Path to the Stack file inside the Git repository
	ComposeFile string `example:"docker-compose.yml" default:"docker-compose.yml"`
	// Applicable when deploying with multiple stack files
	AdditionalFiles []string `example:"[nz.compose.yml, uat.compose.yml]"`
	// Optional GitOps update configuration
	AutoUpdate *portainer.AutoUpdateSettings
	// TLSSkipVerify skips SSL verification when cloning the Git repository
	TLSSkipVerify bool `example:"false"`
}

func (payload *swarmStackFromGitRepositoryPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("Invalid stack name")
	}
	if govalidator.IsNull(payload.SwarmID) {
		return errors.New("Invalid Swarm ID")
	}
	if govalidator.IsNull(payload.RepositoryURL) || !govalidator.IsURL(payload.RepositoryURL) {
		return errors.New("Invalid repository URL. Must correspond to a valid URL format")
	}
	if payload.RepositoryAuthentication && govalidator.IsNull(payload.RepositoryPassword) {
		return errors.New("Invalid repository credentials. Password must be specified when authentication is enabled")
	}
	if err := update.ValidateAutoUpdateSettings(payload.AutoUpdate); err != nil {
		return err
	}
	return nil
}

func createStackPayloadFromSwarmGitPayload(name, swarmID, repoUrl, repoReference, repoUsername, repoPassword string, repoAuthentication bool, composeFile string, additionalFiles []string, autoUpdate *portainer.AutoUpdateSettings, env []portainer.Pair, fromAppTemplate bool, repoSkipSSLVerify bool) stackbuilders.StackPayload {
	return stackbuilders.StackPayload{
		Name:    name,
		SwarmID: swarmID,
		RepositoryConfigPayload: stackbuilders.RepositoryConfigPayload{
			URL:            repoUrl,
			ReferenceName:  repoReference,
			Authentication: repoAuthentication,
			Username:       repoUsername,
			Password:       repoPassword,
			TLSSkipVerify:  repoSkipSSLVerify,
		},
		ComposeFile:     composeFile,
		AdditionalFiles: additionalFiles,
		AutoUpdate:      autoUpdate,
		Env:             env,
		FromAppTemplate: fromAppTemplate,
	}
}

// @id StackCreateDockerSwarmRepository
// @summary Deploy a new swarm stack from a git repository
// @description Deploy a new stack into a Docker environment specified via the environment identifier.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @accept json
// @param endpointId query int true "Identifier of the environment that will be used to deploy the stack"
// @param body body swarmStackFromGitRepositoryPayload true "stack config"
// @success 200 {object} portainer.Stack
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /stacks/create/swarm/repository [post]
func (handler *Handler) createSwarmStackFromGitRepository(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	var payload swarmStackFromGitRepositoryPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	payload.Name = handler.SwarmStackManager.NormalizeStackName(payload.Name)

	isUnique, err := handler.checkUniqueStackNameInDocker(endpoint, payload.Name, 0, true)
	if err != nil {
		return httperror.InternalServerError("Unable to check for name collision", err)
	}
	if !isUnique {
		return stackExistsError(payload.Name)
	}

	//make sure the webhook ID is unique
	if payload.AutoUpdate != nil && payload.AutoUpdate.Webhook != "" {
		isUnique, err := handler.checkUniqueWebhookID(payload.AutoUpdate.Webhook)
		if err != nil {
			return httperror.InternalServerError("Unable to check for webhook ID collision", err)
		}
		if !isUnique {
			return &httperror.HandlerError{StatusCode: http.StatusConflict, Message: fmt.Sprintf("Webhook ID: %s already exists", payload.AutoUpdate.Webhook), Err: stackutils.ErrWebhookIDAlreadyExists}
		}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	stackPayload := createStackPayloadFromSwarmGitPayload(payload.Name,
		payload.SwarmID,
		payload.RepositoryURL,
		payload.RepositoryReferenceName,
		payload.RepositoryUsername,
		payload.RepositoryPassword,
		payload.RepositoryAuthentication,
		payload.ComposeFile,
		payload.AdditionalFiles,
		payload.AutoUpdate,
		payload.Env,
		payload.FromAppTemplate,
		payload.TLSSkipVerify,
	)

	swarmStackBuilder := stackbuilders.CreateSwarmStackGitBuilder(securityContext,
		handler.DataStore,
		handler.FileService,
		handler.GitService,
		handler.Scheduler,
		handler.StackDeployer)

	stackBuilderDirector := stackbuilders.NewStackBuilderDirector(swarmStackBuilder)
	stack, httpErr := stackBuilderDirector.Build(&stackPayload, endpoint)
	if httpErr != nil {
		return httpErr
	}

	return handler.decorateStackResponse(w, stack, userID)
}

type swarmStackFromFileUploadPayload struct {
	Name             string
	SwarmID          string
	StackFileContent []byte
	Env              []portainer.Pair
}

func createStackPayloadFromSwarmFileUploadPayload(name, swarmID string, fileContentBytes []byte, env []portainer.Pair) stackbuilders.StackPayload {
	return stackbuilders.StackPayload{
		Name:                  name,
		SwarmID:               swarmID,
		StackFileContentBytes: fileContentBytes,
		Env:                   env,
	}
}

func (payload *swarmStackFromFileUploadPayload) Validate(r *http.Request) error {
	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return errors.New("Invalid stack name")
	}
	payload.Name = name

	swarmID, err := request.RetrieveMultiPartFormValue(r, "SwarmID", false)
	if err != nil {
		return errors.New("Invalid Swarm ID")
	}
	payload.SwarmID = swarmID

	composeFileContent, _, err := request.RetrieveMultiPartFormFile(r, "file")
	if err != nil {
		return errors.New("Invalid Compose file. Ensure that the Compose file is uploaded correctly")
	}
	payload.StackFileContent = composeFileContent

	var env []portainer.Pair
	err = request.RetrieveMultiPartFormJSONValue(r, "Env", &env, true)
	if err != nil {
		return errors.New("Invalid Env parameter")
	}
	payload.Env = env
	return nil
}

// @id StackCreateDockerSwarmFile
// @summary Deploy a new swarm stack from a file
// @description Deploy a new stack into a Docker environment specified via the environment identifier.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @accept multipart/form-data
// @produce json
// @param Name formData string false "Name of the stack"
// @param SwarmID formData string false "Swarm cluster identifier."
// @param Env formData string false "Environment variables passed during deployment, represented as a JSON array [{'name': 'name', 'value': 'value'}]. Optional"
// @param file formData file false "Stack file"
// @param endpointId query int true "Identifier of the environment that will be used to deploy the stack"
// @success 200 {object} portainer.Stack
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /stacks/create/swarm/file [post]
func (handler *Handler) createSwarmStackFromFileUpload(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	var payload swarmStackFromFileUploadPayload
	err := payload.Validate(r)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	payload.Name = handler.SwarmStackManager.NormalizeStackName(payload.Name)

	isUnique, err := handler.checkUniqueStackNameInDocker(endpoint, payload.Name, 0, true)

	if err != nil {
		return httperror.InternalServerError("Unable to check for name collision", err)
	}
	if !isUnique {
		return stackExistsError(payload.Name)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	stackPayload := createStackPayloadFromSwarmFileUploadPayload(payload.Name, payload.SwarmID, payload.StackFileContent, payload.Env)

	swarmStackBuilder := stackbuilders.CreateSwarmStackFileUploadBuilder(securityContext,
		handler.DataStore,
		handler.FileService,
		handler.StackDeployer)

	stackBuilderDirector := stackbuilders.NewStackBuilderDirector(swarmStackBuilder)
	stack, httpErr := stackBuilderDirector.Build(&stackPayload, endpoint)
	if httpErr != nil {
		return httpErr
	}

	return handler.decorateStackResponse(w, stack, userID)
}
