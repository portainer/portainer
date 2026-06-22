package stacks

import (
	"fmt"
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/git/update"
	"github.com/portainer/portainer/api/gitops/sources"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackbuilders"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/validate"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

type composeStackFromFileContentPayload struct {
	// Name of the stack
	Name string `example:"myStack" validate:"required"`
	// Content of the Stack file
	StackFileContent string `example:"version: 3\n services:\n web:\n image:nginx" validate:"required"`
	// A list of environment variables used during stack deployment
	Env []portainer.Pair
	// Whether the stack is from a app template
	FromAppTemplate bool `example:"false"`
}

func (payload *composeStackFromFileContentPayload) Validate(r *http.Request) error {
	if len(payload.Name) == 0 {
		return errors.New("Invalid stack name")
	}

	if len(payload.StackFileContent) == 0 {
		return errors.New("Invalid stack file content")
	}
	return nil
}

func createStackPayloadFromComposeFileContentPayload(name string, fileContent string, env []portainer.Pair, fromAppTemplate bool) stackbuilders.StackPayload {
	return stackbuilders.StackPayload{
		Name:             name,
		StackFileContent: []byte(fileContent),
		Env:              env,
		FromAppTemplate:  fromAppTemplate,
	}
}

func (handler *Handler) checkAndCleanStackDupFromSwarm(_ http.ResponseWriter, _ *http.Request, _ *portainer.Endpoint, _ portainer.UserID, stack *portainer.Stack) error {
	resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
	if err != nil {
		return err
	}

	// stop scheduler updates of the stack before removal
	if stack.AutoUpdate != nil {
		deployments.StopAutoupdate(stack.ID, stack.AutoUpdate.JobID, handler.Scheduler)
	}

	err = handler.DataStore.Stack().Delete(stack.ID)
	if err != nil {
		return err
	}

	if resourceControl != nil {
		err = handler.DataStore.ResourceControl().Delete(resourceControl.ID)
		if err != nil {
			log.Error().
				Str("stack", fmt.Sprintf("%+v", stack)).
				Msg("unable to remove the associated resource control from the database for stack")
		}
	}

	if exists, _ := handler.FileService.FileExists(stack.ProjectPath); exists {
		err = handler.FileService.RemoveDirectory(stack.ProjectPath)
		if err != nil {
			log.Warn().
				Str("stack", fmt.Sprintf("%+v", stack)).
				Msg("unable to remove stack files from disk for stack")
		}
	}

	return nil
}

func (handler *Handler) ensureUniqueComposeStackName(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID, name string) *httperror.HandlerError {
	isUnique, err := handler.checkUniqueStackNameInDocker(endpoint, name, 0, false)
	if err != nil {
		return httperror.InternalServerError("Unable to check for name collision", err)
	} else if isUnique {
		return nil
	}

	stacks, err := handler.DataStore.Stack().StacksByName(name)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve the stack from the database", err)
	}

	for _, stack := range stacks {
		if stack.EndpointID != endpoint.ID {
			continue
		}

		if stack.Type != portainer.DockerComposeStack {
			if err := handler.checkAndCleanStackDupFromSwarm(w, r, endpoint, userID, &stack); err != nil {
				return httperror.BadRequest("Invalid request payload", err)
			}

			continue
		}

		return stackExistsError(name)
	}

	return nil
}

// @id StackCreateDockerStandaloneString
// @summary Deploy a new compose stack from a text
// @description Deploy a new stack into a Docker environment specified via the environment identifier.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body composeStackFromFileContentPayload true "stack config"
// @param endpointId query int true "Identifier of the environment that will be used to deploy the stack"
// @success 200 {object} portainer.Stack
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /stacks/create/standalone/string [post]
func (handler *Handler) createComposeStackFromFileContent(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	var payload composeStackFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	payload.Name = handler.ComposeStackManager.NormalizeStackName(payload.Name)

	if err := handler.ensureUniqueComposeStackName(w, r, endpoint, userID, payload.Name); err != nil {
		return err
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	stackPayload := createStackPayloadFromComposeFileContentPayload(payload.Name, payload.StackFileContent, payload.Env, payload.FromAppTemplate)

	composeStackBuilder := stackbuilders.CreateComposeStackFileBuilder(securityContext,
		handler.DataStore,
		handler.FileService,
		handler.StackDeployer)

	stack, httpErr := stackbuilders.Build(r.Context(), handler.DataStore, composeStackBuilder, &stackPayload, endpoint, userID)
	if httpErr != nil {
		return httpErr
	}

	return handler.decorateStackResponse(w, stack, userID)
}

type composeStackFromGitRepositoryPayload struct {
	// Name of the stack
	Name string `example:"myStack" validate:"required"`
	// SourceID references an existing Source for git credentials/URL.
	// When set, the inline URL and authentication fields are ignored.
	SourceID portainer.SourceID `example:"1"`
	// Deprecated: use SourceID instead. URL of a Git repository hosting the Stack file.
	RepositoryURL string `example:"https://github.com/openfaas/faas"`
	// Reference name of a Git repository hosting the Stack file
	RepositoryReferenceName string `example:"refs/heads/master"`
	// Deprecated: use SourceID instead. Use basic authentication to clone the Git repository.
	RepositoryAuthentication bool `example:"true"`
	// Deprecated: use SourceID instead. Username used in basic authentication.
	RepositoryUsername string `example:"myGitUsername"`
	// Deprecated: use SourceID instead. Password used in basic authentication.
	RepositoryPassword string `example:"myGitPassword"`
	// Path to the Stack file inside the Git repository
	ComposeFile string `example:"docker-compose.yml" default:"docker-compose.yml"`
	// Applicable when deploying with multiple stack files
	AdditionalFiles []string `example:"[nz.compose.yml, uat.compose.yml]"`
	// Optional GitOps update configuration
	AutoUpdate *portainer.AutoUpdateSettings
	// A list of environment variables used during stack deployment
	Env []portainer.Pair
	// Whether the stack is from a app template
	FromAppTemplate bool `example:"false"`
	// Deprecated: use SourceID instead. TLSSkipVerify skips SSL verification when cloning the Git repository.
	TLSSkipVerify bool `example:"false"`
}

func createStackPayloadFromComposeGitPayload(name, repoUrl, repoReference, repoUsername, repoPassword string, repoAuthentication bool, composeFile string, additionalFiles []string, autoUpdate *portainer.AutoUpdateSettings, env []portainer.Pair, fromAppTemplate bool, repoSkipSSLVerify bool, sourceID portainer.SourceID) stackbuilders.StackPayload {
	return stackbuilders.StackPayload{
		Name: name,
		RepositoryConfigPayload: stackbuilders.RepositoryConfigPayload{
			SourceID:       sourceID,
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

func (payload *composeStackFromGitRepositoryPayload) Validate(r *http.Request) error {
	if len(payload.Name) == 0 {
		return errors.New("Invalid stack name")
	}

	if payload.SourceID == 0 {
		if len(payload.RepositoryURL) == 0 || !validate.IsURL(payload.RepositoryURL) {
			return errors.New("Invalid repository URL. Must correspond to a valid URL format")
		}
		if payload.RepositoryAuthentication && len(payload.RepositoryPassword) == 0 {
			return errors.New("Invalid repository credentials. Password must be specified when authentication is enabled")
		}
	}

	return update.ValidateAutoUpdateSettings(payload.AutoUpdate)
}

// @id StackCreateDockerStandaloneRepository
// @summary Deploy a new compose stack from repository
// @description Deploy a new stack into a Docker environment specified via the environment identifier.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @accept json
// @param endpointId query int true "Identifier of the environment that will be used to deploy the stack"
// @param body body composeStackFromGitRepositoryPayload true "stack config"
// @success 200 {object} portainer.Stack
// @failure 400 "Invalid request"
// @failure 409 "Stack name or webhook ID already exists"
// @failure 500 "Server error"
// @router /stacks/create/standalone/repository [post]
func (handler *Handler) createComposeStackFromGitRepository(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	var payload composeStackFromGitRepositoryPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	payload.Name = handler.ComposeStackManager.NormalizeStackName(payload.Name)
	if payload.ComposeFile == "" {
		payload.ComposeFile = filesystem.ComposeFileDefaultName
	}

	if err := handler.ensureUniqueComposeStackName(w, r, endpoint, userID, payload.Name); err != nil {
		return err
	}

	//make sure the webhook ID is unique
	if payload.AutoUpdate != nil && payload.AutoUpdate.Webhook != "" {
		isUnique, err := handler.checkUniqueWebhookID(handler.DataStore, payload.AutoUpdate.Webhook)
		if err != nil {
			return httperror.InternalServerError("Unable to check for webhook ID collision", err)
		}
		if !isUnique {
			return httperror.Conflict(fmt.Sprintf("Webhook ID: %s already exists", payload.AutoUpdate.Webhook), stackutils.ErrWebhookIDAlreadyExists)
		}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user info from request context", err)
	}
	userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)

	if payload.SourceID != 0 {
		if _, httpErr := sources.ValidateGitSourceAccess(handler.DataStore, userContext, payload.SourceID); httpErr != nil {
			return httpErr
		}
	}

	stackPayload := createStackPayloadFromComposeGitPayload(payload.Name,
		strings.TrimSuffix(payload.RepositoryURL, "/"),
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
		payload.SourceID,
	)

	composeStackBuilder := stackbuilders.CreateComposeStackGitBuilder(securityContext,
		handler.DataStore,
		handler.FileService,
		handler.GitService,
		handler.Scheduler,
		handler.StackDeployer)

	stack, httpErr := stackbuilders.Build(r.Context(), handler.DataStore, composeStackBuilder, &stackPayload, endpoint, userID)
	if httpErr != nil {
		return httpErr
	}

	return handler.decorateStackResponse(w, stack, userID)
}

type composeStackFromFileUploadPayload struct {
	Name             string
	StackFileContent []byte
	Env              []portainer.Pair
}

func createStackPayloadFromComposeFileUploadPayload(name string, fileContentBytes []byte, env []portainer.Pair) stackbuilders.StackPayload {
	return stackbuilders.StackPayload{
		Name:             name,
		StackFileContent: fileContentBytes,
		Env:              env,
	}
}

func decodeRequestForm(r *http.Request) (*composeStackFromFileUploadPayload, error) {
	payload := &composeStackFromFileUploadPayload{}
	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return nil, errors.New("Invalid stack name")
	}
	payload.Name = name

	composeFileContent, _, err := request.RetrieveMultiPartFormFile(r, "file")
	if err != nil {
		return nil, errors.New("Invalid Compose file. Ensure that the Compose file is uploaded correctly")
	}
	payload.StackFileContent = composeFileContent

	var env []portainer.Pair
	err = request.RetrieveMultiPartFormJSONValue(r, "Env", &env, true)
	if err != nil {
		return nil, errors.New("Invalid Env parameter")
	}
	payload.Env = env
	return payload, nil
}

// @id StackCreateDockerStandaloneFile
// @summary Deploy a new compose stack from a file
// @description Deploy a new stack into a Docker environment specified via the environment identifier.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @accept multipart/form-data
// @produce json
// @param Name formData string true "Name of the stack"
// @param Env formData string false "Environment variables passed during deployment, represented as a JSON array [{'name': 'name', 'value': 'value'}]."
// @param file formData file false "Stack file"
// @param endpointId query int true "Identifier of the environment that will be used to deploy the stack"
// @success 200 {object} portainer.Stack
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /stacks/create/standalone/file [post]
func (handler *Handler) createComposeStackFromFileUpload(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	payload, err := decodeRequestForm(r)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	payload.Name = handler.ComposeStackManager.NormalizeStackName(payload.Name)

	if err := handler.ensureUniqueComposeStackName(w, r, endpoint, userID, payload.Name); err != nil {
		return err
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	stackPayload := createStackPayloadFromComposeFileUploadPayload(payload.Name, payload.StackFileContent, payload.Env)

	composeStackBuilder := stackbuilders.CreateComposeStackFileBuilder(securityContext,
		handler.DataStore,
		handler.FileService,
		handler.StackDeployer)

	stack, httpErr := stackbuilders.Build(r.Context(), handler.DataStore, composeStackBuilder, &stackPayload, endpoint, userID)
	if httpErr != nil {
		return httpErr
	}

	return handler.decorateStackResponse(w, stack, userID)
}
