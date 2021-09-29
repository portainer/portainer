package stacks

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"path/filepath"
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
	k "github.com/portainer/portainer/api/kubernetes"
)

type kubernetesStringDeploymentPayload struct {
	ComposeFormat    bool
	Namespace        string
	StackFileContent string
}

type kubernetesGitDeploymentPayload struct {
	ComposeFormat            bool
	Namespace                string
	RepositoryURL            string
	RepositoryReferenceName  string
	RepositoryAuthentication bool
	RepositoryUsername       string
	RepositoryPassword       string
	FilePathInRepository     string
}

type kubernetesManifestURLDeploymentPayload struct {
	Namespace     string
	ComposeFormat bool
	ManifestURL   string
}

func (payload *kubernetesStringDeploymentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.StackFileContent) {
		return errors.New("Invalid stack file content")
	}
	if govalidator.IsNull(payload.Namespace) {
		return errors.New("Invalid namespace")
	}
	return nil
}

func (payload *kubernetesGitDeploymentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Namespace) {
		return errors.New("Invalid namespace")
	}
	if govalidator.IsNull(payload.RepositoryURL) || !govalidator.IsURL(payload.RepositoryURL) {
		return errors.New("Invalid repository URL. Must correspond to a valid URL format")
	}
	if payload.RepositoryAuthentication && govalidator.IsNull(payload.RepositoryPassword) {
		return errors.New("Invalid repository credentials. Password must be specified when authentication is enabled")
	}
	if govalidator.IsNull(payload.FilePathInRepository) {
		return errors.New("Invalid file path in repository")
	}
	if govalidator.IsNull(payload.RepositoryReferenceName) {
		payload.RepositoryReferenceName = defaultGitReferenceName
	}
	return nil
}

func (payload *kubernetesManifestURLDeploymentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.ManifestURL) || !govalidator.IsURL(payload.ManifestURL) {
		return errors.New("Invalid manifest URL")
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

	stackID := handler.DataStore.Stack().GetNextIdentifier()
	stack := &portainer.Stack{
		ID:              portainer.StackID(stackID),
		Type:            portainer.KubernetesStack,
		EndpointID:      endpoint.ID,
		EntryPoint:      filesystem.ManifestFileDefaultName,
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

	output, err := handler.deployKubernetesStack(r, endpoint, payload.StackFileContent, payload.ComposeFormat, payload.Namespace, k.KubeAppLabels{
		StackID: stackID,
		Name:    stack.Name,
		Owner:   stack.CreatedBy,
		Kind:    "content",
	})

	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to deploy Kubernetes stack", Err: err}
	}

	err = handler.DataStore.Stack().CreateStack(stack)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist the Kubernetes stack inside the database", Err: err}
	}

	doCleanUp = false

	resp := &createKubernetesStackResponse{
		Output: output,
	}

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

	stackID := handler.DataStore.Stack().GetNextIdentifier()
	stack := &portainer.Stack{
		ID:         portainer.StackID(stackID),
		Type:       portainer.KubernetesStack,
		EndpointID: endpoint.ID,
		EntryPoint: payload.FilePathInRepository,
		GitConfig: &gittypes.RepoConfig{
			URL:            payload.RepositoryURL,
			ReferenceName:  payload.RepositoryReferenceName,
			ConfigFilePath: payload.FilePathInRepository,
		},
		Namespace:       payload.Namespace,
		Status:          portainer.StackStatusActive,
		CreationDate:    time.Now().Unix(),
		CreatedBy:       user.Username,
		IsComposeFormat: payload.ComposeFormat,
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

	stackFileContent, err := handler.cloneManifestContentFromGitRepo(&payload, stack.ProjectPath)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to process manifest from Git repository", Err: err}
	}

	output, err := handler.deployKubernetesStack(r, endpoint, stackFileContent, payload.ComposeFormat, payload.Namespace, k.KubeAppLabels{
		StackID: stackID,
		Name:    stack.Name,
		Owner:   stack.CreatedBy,
		Kind:    "git",
	})

	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to deploy Kubernetes stack", Err: err}
	}

	err = handler.DataStore.Stack().CreateStack(stack)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist the stack inside the database", Err: err}
	}

	doCleanUp = false

	resp := &createKubernetesStackResponse{
		Output: output,
	}

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

	stackID := handler.DataStore.Stack().GetNextIdentifier()
	stack := &portainer.Stack{
		ID:              portainer.StackID(stackID),
		Type:            portainer.KubernetesStack,
		EndpointID:      endpoint.ID,
		EntryPoint:      filesystem.ManifestFileDefaultName,
		Namespace:       payload.Namespace,
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

	output, err := handler.deployKubernetesStack(r, endpoint, string(manifestContent), payload.ComposeFormat, payload.Namespace, k.KubeAppLabels{
		StackID: stackID,
		Name:    stack.Name,
		Owner:   stack.CreatedBy,
		Kind:    "url",
	})
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to deploy Kubernetes stack", Err: err}
	}

	err = handler.DataStore.Stack().CreateStack(stack)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist the Kubernetes stack inside the database", Err: err}
	}

	doCleanUp = false

	resp := &createKubernetesStackResponse{
		Output: output,
	}

	return response.JSON(w, resp)
}

func (handler *Handler) deployKubernetesStack(request *http.Request, endpoint *portainer.Endpoint, stackConfig string, composeFormat bool, namespace string, appLabels k.KubeAppLabels) (string, error) {
	handler.stackCreationMutex.Lock()
	defer handler.stackCreationMutex.Unlock()

	manifest := []byte(stackConfig)
	if composeFormat {
		convertedConfig, err := handler.KubernetesDeployer.ConvertCompose(manifest)
		if err != nil {
			return "", errors.Wrap(err, "failed to convert docker compose file to a kube manifest")
		}
		manifest = convertedConfig
	}

	manifest, err := k.AddAppLabels(manifest, appLabels.ToMap())
	if err != nil {
		return "", errors.Wrap(err, "failed to add application labels")
	}

	return handler.KubernetesDeployer.Deploy(request, endpoint, string(manifest), namespace)
}

func (handler *Handler) cloneManifestContentFromGitRepo(gitInfo *kubernetesGitDeploymentPayload, projectPath string) (string, error) {
	repositoryUsername := gitInfo.RepositoryUsername
	repositoryPassword := gitInfo.RepositoryPassword
	if !gitInfo.RepositoryAuthentication {
		repositoryUsername = ""
		repositoryPassword = ""
	}

	err := handler.GitService.CloneRepository(projectPath, gitInfo.RepositoryURL, gitInfo.RepositoryReferenceName, repositoryUsername, repositoryPassword)
	if err != nil {
		return "", err
	}
	content, err := ioutil.ReadFile(filepath.Join(projectPath, gitInfo.FilePathInRepository))
	if err != nil {
		return "", err
	}
	return string(content), nil
}
