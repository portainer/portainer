package stacks

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/pkg/errors"

	"github.com/asaskevich/govalidator"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/client"
	"github.com/portainer/portainer/api/internal/stackutils"
	k "github.com/portainer/portainer/api/kubernetes"
)

type kubernetesStringDeploymentPayload struct {
	StackName        string
	ComposeFormat    bool
	Namespace        string
	StackFileContent string
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
	AutoUpdate               *portainer.StackAutoUpdate
}

type kubernetesManifestURLDeploymentPayload struct {
	StackName     string
	Namespace     string
	ComposeFormat bool
	ManifestURL   string
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
	if govalidator.IsNull(payload.RepositoryReferenceName) {
		payload.RepositoryReferenceName = defaultGitReferenceName
	}
	if err := validateStackAutoUpdate(payload.AutoUpdate); err != nil {
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

func (handler *Handler) createKubernetesStackFromFileContent(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	var payload kubernetesStringDeploymentPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	user, err := handler.DataStore.User().User(userID)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to load user information from the database", Err: err}
	}
	isUnique, err := handler.checkUniqueStackNameInKubernetes(endpoint, payload.StackName, 0, payload.Namespace)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to check for name collision", Err: err}
	}
	if !isUnique {
		return &httperror.HandlerError{StatusCode: http.StatusConflict, Message: fmt.Sprintf("A stack with the name '%s' already exists", payload.StackName), Err: errStackAlreadyExists}
	}

	stackID := handler.DataStore.Stack().GetNextIdentifier()
	stack := &portainer.Stack{
		ID:              portainer.StackID(stackID),
		Type:            portainer.KubernetesStack,
		EndpointID:      endpoint.ID,
		EntryPoint:      filesystem.ManifestFileDefaultName,
		Name:            payload.StackName,
		Namespace:       payload.Namespace,
		Status:          portainer.StackStatusActive,
		CreationDate:    time.Now().Unix(),
		CreatedBy:       user.Username,
		IsComposeFormat: payload.ComposeFormat,
	}

	stackFolder := strconv.Itoa(int(stack.ID))
	projectPath, err := handler.FileService.StoreStackFileFromBytes(stackFolder, stack.EntryPoint, []byte(payload.StackFileContent))
	if err != nil {
		fileType := "Manifest"
		if stack.IsComposeFormat {
			fileType = "Compose"
		}
		errMsg := fmt.Sprintf("Unable to persist Kubernetes %s file on disk", fileType)
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: errMsg, Err: err}
	}
	stack.ProjectPath = projectPath

	doCleanUp := true
	defer handler.cleanUp(stack, &doCleanUp)

	output, err := handler.deployKubernetesStack(user.ID, endpoint, stack, k.KubeAppLabels{
		StackID:   stackID,
		StackName: stack.Name,
		Owner:     stack.CreatedBy,
		Kind:      "content",
	})

	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to deploy Kubernetes stack", Err: err}
	}

	err = handler.DataStore.Stack().Create(stack)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist the Kubernetes stack inside the database", Err: err}
	}

	resp := &createKubernetesStackResponse{
		Output: output,
	}

	doCleanUp = false
	return response.JSON(w, resp)
}

func (handler *Handler) createKubernetesStackFromGitRepository(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	var payload kubernetesGitDeploymentPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	user, err := handler.DataStore.User().User(userID)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to load user information from the database", Err: err}
	}
	isUnique, err := handler.checkUniqueStackNameInKubernetes(endpoint, payload.StackName, 0, payload.Namespace)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to check for name collision", Err: err}
	}
	if !isUnique {
		return &httperror.HandlerError{StatusCode: http.StatusConflict, Message: fmt.Sprintf("A stack with the name '%s' already exists", payload.StackName), Err: errStackAlreadyExists}
	}

	//make sure the webhook ID is unique
	if payload.AutoUpdate != nil && payload.AutoUpdate.Webhook != "" {
		isUnique, err := handler.checkUniqueWebhookID(payload.AutoUpdate.Webhook)
		if err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to check for webhook ID collision", Err: err}
		}
		if !isUnique {
			return &httperror.HandlerError{StatusCode: http.StatusConflict, Message: fmt.Sprintf("Webhook ID: %s already exists", payload.AutoUpdate.Webhook), Err: errWebhookIDAlreadyExists}
		}
	}

	stackID := handler.DataStore.Stack().GetNextIdentifier()
	stack := &portainer.Stack{
		ID:         portainer.StackID(stackID),
		Type:       portainer.KubernetesStack,
		EndpointID: endpoint.ID,
		EntryPoint: payload.ManifestFile,
		GitConfig: &gittypes.RepoConfig{
			URL:            payload.RepositoryURL,
			ReferenceName:  payload.RepositoryReferenceName,
			ConfigFilePath: payload.ManifestFile,
		},
		Namespace:       payload.Namespace,
		Name:            payload.StackName,
		Status:          portainer.StackStatusActive,
		CreationDate:    time.Now().Unix(),
		CreatedBy:       user.Username,
		IsComposeFormat: payload.ComposeFormat,
		AutoUpdate:      payload.AutoUpdate,
		AdditionalFiles: payload.AdditionalFiles,
	}

	if payload.RepositoryAuthentication {
		stack.GitConfig.Authentication = &gittypes.GitAuthentication{
			Username: payload.RepositoryUsername,
			Password: payload.RepositoryPassword,
		}
	}

	projectPath := handler.FileService.GetStackProjectPath(strconv.Itoa(int(stack.ID)))
	stack.ProjectPath = projectPath

	doCleanUp := true
	defer handler.cleanUp(stack, &doCleanUp)

	commitID, err := handler.latestCommitID(payload.RepositoryURL, payload.RepositoryReferenceName, payload.RepositoryAuthentication, payload.RepositoryUsername, payload.RepositoryPassword)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to fetch git repository id", Err: err}
	}
	stack.GitConfig.ConfigHash = commitID

	repositoryUsername := payload.RepositoryUsername
	repositoryPassword := payload.RepositoryPassword
	if !payload.RepositoryAuthentication {
		repositoryUsername = ""
		repositoryPassword = ""
	}

	err = handler.GitService.CloneRepository(projectPath, payload.RepositoryURL, payload.RepositoryReferenceName, repositoryUsername, repositoryPassword)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to clone git repository", Err: err}
	}

	output, err := handler.deployKubernetesStack(user.ID, endpoint, stack, k.KubeAppLabels{
		StackID:   stackID,
		StackName: stack.Name,
		Owner:     stack.CreatedBy,
		Kind:      "git",
	})

	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to deploy Kubernetes stack", Err: err}
	}

	if payload.AutoUpdate != nil && payload.AutoUpdate.Interval != "" {
		jobID, e := startAutoupdate(stack.ID, stack.AutoUpdate.Interval, handler.Scheduler, handler.StackDeployer, handler.DataStore, handler.GitService)
		if e != nil {
			return e
		}

		stack.AutoUpdate.JobID = jobID
	}

	err = handler.DataStore.Stack().Create(stack)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist the stack inside the database", Err: err}
	}

	resp := &createKubernetesStackResponse{
		Output: output,
	}

	doCleanUp = false
	return response.JSON(w, resp)
}

func (handler *Handler) createKubernetesStackFromManifestURL(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, userID portainer.UserID) *httperror.HandlerError {
	var payload kubernetesManifestURLDeploymentPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	user, err := handler.DataStore.User().User(userID)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to load user information from the database", Err: err}
	}
	isUnique, err := handler.checkUniqueStackNameInKubernetes(endpoint, payload.StackName, 0, payload.Namespace)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to check for name collision", Err: err}
	}
	if !isUnique {
		return &httperror.HandlerError{StatusCode: http.StatusConflict, Message: fmt.Sprintf("A stack with the name '%s' already exists", payload.StackName), Err: errStackAlreadyExists}
	}

	stackID := handler.DataStore.Stack().GetNextIdentifier()
	stack := &portainer.Stack{
		ID:              portainer.StackID(stackID),
		Type:            portainer.KubernetesStack,
		EndpointID:      endpoint.ID,
		EntryPoint:      filesystem.ManifestFileDefaultName,
		Namespace:       payload.Namespace,
		Name:            payload.StackName,
		Status:          portainer.StackStatusActive,
		CreationDate:    time.Now().Unix(),
		CreatedBy:       user.Username,
		IsComposeFormat: payload.ComposeFormat,
	}

	var manifestContent []byte
	manifestContent, err = client.Get(payload.ManifestURL, 30)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve manifest from URL", Err: err}
	}

	stackFolder := strconv.Itoa(int(stack.ID))
	projectPath, err := handler.FileService.StoreStackFileFromBytes(stackFolder, stack.EntryPoint, manifestContent)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist Kubernetes manifest file on disk", Err: err}
	}
	stack.ProjectPath = projectPath

	doCleanUp := true
	defer handler.cleanUp(stack, &doCleanUp)

	output, err := handler.deployKubernetesStack(user.ID, endpoint, stack, k.KubeAppLabels{
		StackID:   stackID,
		StackName: stack.Name,
		Owner:     stack.CreatedBy,
		Kind:      "url",
	})
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to deploy Kubernetes stack", Err: err}
	}

	err = handler.DataStore.Stack().Create(stack)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist the Kubernetes stack inside the database", Err: err}
	}

	doCleanUp = false

	resp := &createKubernetesStackResponse{
		Output: output,
	}

	return response.JSON(w, resp)
}

func (handler *Handler) deployKubernetesStack(userID portainer.UserID, endpoint *portainer.Endpoint, stack *portainer.Stack, appLabels k.KubeAppLabels) (string, error) {
	handler.stackCreationMutex.Lock()
	defer handler.stackCreationMutex.Unlock()

	manifestFilePaths, tempDir, err := stackutils.CreateTempK8SDeploymentFiles(stack, handler.KubernetesDeployer, appLabels)
	if err != nil {
		return "", errors.Wrap(err, "failed to create temp kub deployment files")
	}
	defer os.RemoveAll(tempDir)
	return handler.KubernetesDeployer.Deploy(userID, endpoint, manifestFilePaths, stack.Namespace)
}
