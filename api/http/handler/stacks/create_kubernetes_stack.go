package stacks

import (
	"errors"
	"io/ioutil"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/asaskevich/govalidator"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
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
	if payload.RepositoryAuthentication && (govalidator.IsNull(payload.RepositoryUsername) || govalidator.IsNull(payload.RepositoryPassword)) {
		return errors.New("Invalid repository credentials. Username and password must be specified when authentication is enabled")
	}
	if payload.FilePathInRepository == "" {
		return errors.New("Invalid file path in repository")
	}
	return nil
}

type createKubernetesStackResponse struct {
	Output string `json:"Output"`
}

func (handler *Handler) createKubernetesStackFromFileContent(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint) *httperror.HandlerError {
	var payload kubernetesStringDeploymentPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}
	output, err := handler.deployKubernetesStack(endpoint, payload.StackFileContent, payload.ComposeFormat, payload.Namespace)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to deploy Kubernetes stack", Err: err}
	}

	resp := &createKubernetesStackResponse{
		Output: string(output),
	}

	return response.JSON(w, resp)
}

func (handler *Handler) createKubernetesStackFromGitRepository(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint) *httperror.HandlerError {
	var payload kubernetesGitDeploymentPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}
	stackID := handler.DataStore.Stack().GetNextIdentifier()
	stack := &portainer.Stack{
		ID:           portainer.StackID(stackID),
		Type:         portainer.KubernetesStack,
		EndpointID:   endpoint.ID,
		EntryPoint:   payload.FilePathInRepository,
		Status:       portainer.StackStatusActive,
		CreationDate: time.Now().Unix(),
	}

	projectPath := handler.FileService.GetStackProjectPath(strconv.Itoa(int(stack.ID)))
	stack.ProjectPath = projectPath

	doCleanUp := true
	defer handler.cleanUp(stack, &doCleanUp)

	stackFileContent, err := handler.cloneAndConvertGitRepoFile(&payload, projectPath)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to process manifest from Git repository", Err: err}
	}

	output, err := handler.deployKubernetesStack(endpoint, stackFileContent, payload.ComposeFormat, payload.Namespace)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to deploy Kubernetes stack", Err: err}
	}

	resp := &createKubernetesStackResponse{
		Output: string(output),
	}
	return response.JSON(w, resp)
}

func (handler *Handler) deployKubernetesStack(endpoint *portainer.Endpoint, data string, composeFormat bool, namespace string) ([]byte, error) {
	handler.stackCreationMutex.Lock()
	defer handler.stackCreationMutex.Unlock()

	return handler.KubernetesDeployer.Deploy(endpoint, data, composeFormat, namespace)
}

func (handler *Handler) cloneAndConvertGitRepoFile(gitInfo *kubernetesGitDeploymentPayload, projectPath string) (string, error) {
	gitCloneParams := &cloneRepositoryParameters{
		url:            gitInfo.RepositoryURL,
		referenceName:  gitInfo.RepositoryReferenceName,
		path:           projectPath,
		authentication: gitInfo.RepositoryAuthentication,
		username:       gitInfo.RepositoryUsername,
		password:       gitInfo.RepositoryPassword,
	}
	err := handler.cloneGitRepository(gitCloneParams)
	if err != nil {
		return "", err
	}
	content, err := ioutil.ReadFile(filepath.Join(projectPath, gitInfo.FilePathInRepository))
	if err != nil {
		return "", err
	}
	return string(content), nil
}
