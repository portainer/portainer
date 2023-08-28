package stacks

import (
	"fmt"
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/pkg/errors"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/git/update"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/internal/registryutils"
	k "github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackbuilders"
	"github.com/portainer/portainer/api/stacks/stackutils"
)

type kubernetesStringDeploymentPayload struct {
	StackName        string
	ComposeFormat    bool
	Namespace        string
	StackFileContent string
	// Whether the stack is from a app template
	FromAppTemplate bool `example:"false"`
}

func createStackPayloadFromK8sFileContentPayload(name, namespace, fileContent string, composeFormat, fromAppTemplate bool) stackbuilders.StackPayload {
	return stackbuilders.StackPayload{
		StackName:        name,
		Namespace:        namespace,
		StackFileContent: fileContent,
		ComposeFormat:    composeFormat,
		FromAppTemplate:  fromAppTemplate,
	}
}

type kubernetesGitDeploymentPayload struct {
	StackName                string
	ComposeFormat            bool
	Namespace                string
	RepositoryURL            string
	RepositoryReferenceName  string
	RepositoryAuthentication bool
	RepositoryUsername       string
	RepositoryPassword       string
	ManifestFile             string
	AdditionalFiles          []string
	AutoUpdate               *portainer.AutoUpdateSettings
	// TLSSkipVerify skips SSL verification when cloning the Git repository
	TLSSkipVerify bool `example:"false"`
}

func createStackPayloadFromK8sGitPayload(name, repoUrl, repoReference, repoUsername, repoPassword string, repoAuthentication, composeFormat bool, namespace, manifest string, additionalFiles []string, autoUpdate *portainer.AutoUpdateSettings, repoSkipSSLVerify bool) stackbuilders.StackPayload {
	return stackbuilders.StackPayload{
		StackName: name,
		RepositoryConfigPayload: stackbuilders.RepositoryConfigPayload{
			URL:            repoUrl,
			ReferenceName:  repoReference,
			Authentication: repoAuthentication,
			Username:       repoUsername,
			Password:       repoPassword,
			TLSSkipVerify:  repoSkipSSLVerify,
		},
		Namespace:       namespace,
		ComposeFormat:   composeFormat,
		ManifestFile:    manifest,
		AdditionalFiles: additionalFiles,
		AutoUpdate:      autoUpdate,
	}
}

type kubernetesManifestURLDeploymentPayload struct {
	StackName     string
	Namespace     string
	ComposeFormat bool
	ManifestURL   string
}

func createStackPayloadFromK8sUrlPayload(name, namespace, manifestUrl string, composeFormat bool) stackbuilders.StackPayload {
	return stackbuilders.StackPayload{
		StackName:     name,
		Namespace:     namespace,
		ManifestURL:   manifestUrl,
		ComposeFormat: composeFormat,
	}
}

func (payload *kubernetesStringDeploymentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.StackFileContent) {
		return errors.New("Invalid stack file content")
	}
	if govalidator.IsNull(payload.StackName) {
		return errors.New("Invalid stack name")
	}
	return nil
}

func (payload *kubernetesGitDeploymentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.RepositoryURL) || !govalidator.IsURL(payload.RepositoryURL) {
		return errors.New("Invalid repository URL. Must correspond to a valid URL format")
	}
	if payload.RepositoryAuthentication && govalidator.IsNull(payload.RepositoryPassword) {
		return errors.New("Invalid repository credentials. Password must be specified when authentication is enabled")
	}
	if govalidator.IsNull(payload.ManifestFile) {
		return errors.New("Invalid manifest file in repository")
	}
	if err := update.ValidateAutoUpdateSettings(payload.AutoUpdate); err != nil {
		return err
	}
	if govalidator.IsNull(payload.StackName) {
		return errors.New("Invalid stack name")
	}
	return nil
}

func (payload *kubernetesManifestURLDeploymentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.ManifestURL) || !govalidator.IsURL(payload.ManifestURL) {
		return errors.New("Invalid manifest URL")
	}
	if govalidator.IsNull(payload.StackName) {
		return errors.New("Invalid stack name")
	}
	return nil
}

type createKubernetesStackResponse struct {
	Output string `json:"Output"`
}

// @id StackCreateKubernetesFile
// @summary Deploy a new kubernetes stack from a file
// @description Deploy a new stack into a Docker environment specified via the environment identifier.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param body body kubernetesStringDeploymentPayload true "stack config"
// @param endpointId query int true "Identifier of the environment that will be used to deploy the stack"
// @success 200 {object} portainer.Stack
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /stacks/create/kubernetes/string [post]
func (handler *Handler) createKubernetesStackFromFileContent(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	if !endpointutils.IsKubernetesEndpoint(endpoint) {
		return httperror.BadRequest("Environment type does not match", errors.New("Environment type does not match"))
	}

	var payload kubernetesStringDeploymentPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	user, err := handler.DataStore.User().Read(userID)
	if err != nil {
		return httperror.InternalServerError("Unable to load user information from the database", err)
	}
	isUnique, err := handler.checkUniqueStackNameInKubernetes(endpoint, payload.StackName, 0, payload.Namespace)
	if err != nil {
		return httperror.InternalServerError("Unable to check for name collision", err)
	}
	if !isUnique {
		return &httperror.HandlerError{StatusCode: http.StatusConflict, Message: fmt.Sprintf("A stack with the name '%s' already exists", payload.StackName), Err: stackutils.ErrStackAlreadyExists}
	}

	stackPayload := createStackPayloadFromK8sFileContentPayload(payload.StackName, payload.Namespace, payload.StackFileContent, payload.ComposeFormat, payload.FromAppTemplate)

	k8sStackBuilder := stackbuilders.CreateK8sStackFileContentBuilder(handler.DataStore,
		handler.FileService,
		handler.StackDeployer,
		handler.KubernetesDeployer,
		user)

	// Refresh ECR registry secret if needed
	// RefreshEcrSecret method checks if the namespace has any ECR registry
	// otherwise return nil
	cli, err := handler.KubernetesClientFactory.GetKubeClient(endpoint)
	if err == nil {
		registryutils.RefreshEcrSecret(cli, endpoint, handler.DataStore, payload.Namespace)
	}

	stackBuilderDirector := stackbuilders.NewStackBuilderDirector(k8sStackBuilder)
	_, httpErr := stackBuilderDirector.Build(&stackPayload, endpoint)
	if httpErr != nil {
		return httpErr
	}

	resp := &createKubernetesStackResponse{
		Output: k8sStackBuilder.GetResponse(),
	}

	return response.JSON(w, resp)
}

// @id StackCreateKubernetesGit
// @summary Deploy a new kubernetes stack from a git repository
// @description Deploy a new stack into a Docker environment specified via the environment identifier.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param body body kubernetesGitDeploymentPayload true "stack config"
// @param endpointId query int true "Identifier of the environment that will be used to deploy the stack"
// @success 200 {object} portainer.Stack
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /stacks/create/kubernetes/repository [post]
func (handler *Handler) createKubernetesStackFromGitRepository(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	if !endpointutils.IsKubernetesEndpoint(endpoint) {
		return httperror.BadRequest("Environment type does not match", errors.New("Environment type does not match"))
	}

	var payload kubernetesGitDeploymentPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	user, err := handler.DataStore.User().Read(userID)
	if err != nil {
		return httperror.InternalServerError("Unable to load user information from the database", err)
	}
	isUnique, err := handler.checkUniqueStackNameInKubernetes(endpoint, payload.StackName, 0, payload.Namespace)
	if err != nil {
		return httperror.InternalServerError("Unable to check for name collision", err)
	}
	if !isUnique {
		return &httperror.HandlerError{StatusCode: http.StatusConflict, Message: fmt.Sprintf("A stack with the name '%s' already exists", payload.StackName), Err: stackutils.ErrStackAlreadyExists}
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

	stackPayload := createStackPayloadFromK8sGitPayload(payload.StackName,
		payload.RepositoryURL,
		payload.RepositoryReferenceName,
		payload.RepositoryUsername,
		payload.RepositoryPassword,
		payload.RepositoryAuthentication,
		payload.ComposeFormat,
		payload.Namespace,
		payload.ManifestFile,
		payload.AdditionalFiles,
		payload.AutoUpdate,
		payload.TLSSkipVerify,
	)

	k8sStackBuilder := stackbuilders.CreateKubernetesStackGitBuilder(handler.DataStore,
		handler.FileService,
		handler.GitService,
		handler.Scheduler,
		handler.StackDeployer,
		handler.KubernetesDeployer,
		user)

	stackBuilderDirector := stackbuilders.NewStackBuilderDirector(k8sStackBuilder)
	_, httpErr := stackBuilderDirector.Build(&stackPayload, endpoint)
	if httpErr != nil {
		return httpErr
	}

	resp := &createKubernetesStackResponse{
		Output: k8sStackBuilder.GetResponse(),
	}

	return response.JSON(w, resp)
}

// @id StackCreateKubernetesUrl
// @summary Deploy a new kubernetes stack from a url
// @description Deploy a new stack into a Docker environment specified via the environment identifier.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param body body kubernetesManifestURLDeploymentPayload true "stack config"
// @param endpointId query int true "Identifier of the environment that will be used to deploy the stack"
// @success 200 {object} portainer.Stack
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /stacks/create/kubernetes/url [post]
func (handler *Handler) createKubernetesStackFromManifestURL(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	var payload kubernetesManifestURLDeploymentPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	user, err := handler.DataStore.User().Read(userID)
	if err != nil {
		return httperror.InternalServerError("Unable to load user information from the database", err)
	}
	isUnique, err := handler.checkUniqueStackNameInKubernetes(endpoint, payload.StackName, 0, payload.Namespace)
	if err != nil {
		return httperror.InternalServerError("Unable to check for name collision", err)
	}
	if !isUnique {
		return &httperror.HandlerError{StatusCode: http.StatusConflict, Message: fmt.Sprintf("A stack with the name '%s' already exists", payload.StackName), Err: stackutils.ErrStackAlreadyExists}
	}

	stackPayload := createStackPayloadFromK8sUrlPayload(payload.StackName,
		payload.Namespace,
		payload.ManifestURL,
		payload.ComposeFormat)

	k8sStackBuilder := stackbuilders.CreateKubernetesStackUrlBuilder(handler.DataStore,
		handler.FileService,
		handler.StackDeployer,
		handler.KubernetesDeployer,
		user)

	stackBuilderDirector := stackbuilders.NewStackBuilderDirector(k8sStackBuilder)
	_, httpErr := stackBuilderDirector.Build(&stackPayload, endpoint)
	if httpErr != nil {
		return httpErr
	}

	resp := &createKubernetesStackResponse{
		Output: k8sStackBuilder.GetResponse(),
	}

	return response.JSON(w, resp)
}

func (handler *Handler) deployKubernetesStack(userID portainer.UserID, endpoint *portainer.Endpoint, stack *portainer.Stack, appLabels k.KubeAppLabels) (string, error) {
	handler.stackCreationMutex.Lock()
	defer handler.stackCreationMutex.Unlock()

	user := &portainer.User{
		ID: userID,
	}
	k8sDeploymentConfig, err := deployments.CreateKubernetesStackDeploymentConfig(stack, handler.KubernetesDeployer, appLabels, user, endpoint)
	if err != nil {
		return "", errors.Wrap(err, "failed to create temp kub deployment files")
	}

	err = k8sDeploymentConfig.Deploy()
	if err != nil {
		return "", err
	}

	return k8sDeploymentConfig.GetResponse(), nil
}
