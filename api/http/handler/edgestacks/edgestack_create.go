package edgestacks

import (
	"fmt"
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	edgestackservice "github.com/portainer/portainer/api/internal/edge/edgestacks"
)

func (handler *Handler) edgeStackCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	method, err := request.RetrieveRouteVariableValue(r, "method")
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: method", err)
	}
	dryrun, _ := request.RetrieveBooleanQueryParameter(r, "dryrun", true)

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user details from authentication token", err)
	}

	edgeStack, err := handler.createSwarmStack(method, dryrun, tokenData.ID, r)
	if err != nil {
		var payloadError *edgestackservice.InvalidPayloadError
		switch {
		case errors.As(err, &payloadError):
			return httperror.BadRequest("Invalid payload", err)
		default:
			return httperror.InternalServerError("Unable to create Edge stack", err)
		}
	}

	return response.JSON(w, edgeStack)
}

func (handler *Handler) createSwarmStack(method string, dryrun bool, userID portainer.UserID, r *http.Request) (*portainer.EdgeStack, error) {

	switch method {
	case "string":
		return handler.createSwarmStackFromFileContent(r, dryrun)
	case "repository":
		return handler.createSwarmStackFromGitRepository(r, dryrun, userID)
	case "file":
		return handler.createSwarmStackFromFileUpload(r, dryrun)
	}
	return nil, edgestackservice.NewInvalidPayloadError("Invalid value for query parameter: method. Value must be one of: string, repository or file")
}

type swarmStackFromFileContentPayload struct {
	// Name of the stack
	Name string `example:"myStack" validate:"required"`
	// Content of the Stack file
	StackFileContent string `example:"version: 3\n services:\n web:\n image:nginx" validate:"required"`
	// List of identifiers of EdgeGroups
	EdgeGroups []portainer.EdgeGroupID `example:"1"`
	// Deployment type to deploy this stack
	// Valid values are: 0 - 'compose', 1 - 'kubernetes', 2 - 'nomad'
	// for compose stacks will use kompose to convert to kubernetes manifest for kubernetes environments(endpoints)
	// kubernetes deploy type is enabled only for kubernetes environments(endpoints)
	// nomad deploy type is enabled only for nomad environments(endpoints)
	DeploymentType portainer.EdgeStackDeploymentType `example:"0" enums:"0,1,2"`
	// List of Registries to use for this stack
	Registries []portainer.RegistryID
	// Uses the manifest's namespaces instead of the default one
	UseManifestNamespaces bool
}

func (payload *swarmStackFromFileContentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return edgestackservice.NewInvalidPayloadError("Invalid stack name")
	}
	if govalidator.IsNull(payload.StackFileContent) {
		return edgestackservice.NewInvalidPayloadError("Invalid stack file content")
	}
	if len(payload.EdgeGroups) == 0 {
		return edgestackservice.NewInvalidPayloadError("Edge Groups are mandatory for an Edge stack")
	}
	return nil
}

// @id EdgeStackCreateString
// @summary Create an EdgeStack from a text
// @description **Access policy**: administrator
// @tags edge_stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param body body swarmStackFromFileContentPayload true "stack config"
// @param dryrun query string false "if true, will not create an edge stack, but just will check the settings and return a non-persisted edge stack object"
// @success 200 {object} portainer.EdgeStack
// @failure 400 "Bad request"
// @failure 500 "Internal server error"
// @failure 503 "Edge compute features are disabled"
// @router /edge_stacks/create/string [post]
func (handler *Handler) createSwarmStackFromFileContent(r *http.Request, dryrun bool) (*portainer.EdgeStack, error) {
	var payload swarmStackFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return nil, err
	}

	stack, err := handler.edgeStacksService.BuildEdgeStack(payload.Name, payload.DeploymentType, payload.EdgeGroups, payload.Registries, payload.UseManifestNamespaces)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create Edge stack object")
	}

	if dryrun {
		return stack, nil
	}

	return handler.edgeStacksService.PersistEdgeStack(stack, func(stackFolder string, relatedEndpointIds []portainer.EndpointID) (composePath string, manifestPath string, projectPath string, err error) {
		return handler.storeFileContent(stackFolder, payload.DeploymentType, relatedEndpointIds, []byte(payload.StackFileContent))
	})

}

func (handler *Handler) storeFileContent(stackFolder string, deploymentType portainer.EdgeStackDeploymentType, relatedEndpointIds []portainer.EndpointID, fileContent []byte) (composePath, manifestPath, projectPath string, err error) {
	if deploymentType == portainer.EdgeStackDeploymentCompose {
		composePath = filesystem.ComposeFileDefaultName

		projectPath, err := handler.FileService.StoreEdgeStackFileFromBytes(stackFolder, composePath, fileContent)
		if err != nil {
			return "", "", "", err
		}

		manifestPath, err = handler.convertAndStoreKubeManifestIfNeeded(stackFolder, projectPath, composePath, relatedEndpointIds)
		if err != nil {
			return "", "", "", fmt.Errorf("Failed creating and storing kube manifest: %w", err)
		}

		return composePath, manifestPath, projectPath, nil

	}

	hasDockerEndpoint, err := hasDockerEndpoint(handler.DataStore.Endpoint(), relatedEndpointIds)
	if err != nil {
		return "", "", "", fmt.Errorf("unable to check for existence of docker environment: %w", err)
	}

	if hasDockerEndpoint {
		return "", "", "", errors.New("edge stack with docker environment cannot be deployed with kubernetes or nomad config")
	}

	if deploymentType == portainer.EdgeStackDeploymentKubernetes {

		manifestPath = filesystem.ManifestFileDefaultName

		projectPath, err := handler.FileService.StoreEdgeStackFileFromBytes(stackFolder, manifestPath, fileContent)
		if err != nil {
			return "", "", "", err
		}

		return "", manifestPath, projectPath, nil

	}

	errMessage := fmt.Sprintf("invalid deployment type: %d", deploymentType)
	return "", "", "", edgestackservice.NewInvalidPayloadError(errMessage)
}

type swarmStackFromGitRepositoryPayload struct {
	// Name of the stack
	Name string `example:"myStack" validate:"required"`
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
	// Path to the Stack file inside the Git repository
	FilePathInRepository string `example:"docker-compose.yml" default:"docker-compose.yml"`
	// List of identifiers of EdgeGroups
	EdgeGroups []portainer.EdgeGroupID `example:"1"`
	// Deployment type to deploy this stack
	// Valid values are: 0 - 'compose', 1 - 'kubernetes', 2 - 'nomad'
	// for compose stacks will use kompose to convert to kubernetes manifest for kubernetes environments(endpoints)
	// kubernetes deploy type is enabled only for kubernetes environments(endpoints)
	// nomad deploy type is enabled only for nomad environments(endpoints)
	DeploymentType portainer.EdgeStackDeploymentType `example:"0" enums:"0,1,2"`
	// List of Registries to use for this stack
	Registries []portainer.RegistryID
	// Uses the manifest's namespaces instead of the default one
	UseManifestNamespaces bool
	// TLSSkipVerify skips SSL verification when cloning the Git repository
	TLSSkipVerify bool `example:"false"`
}

func (payload *swarmStackFromGitRepositoryPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return edgestackservice.NewInvalidPayloadError("Invalid stack name")
	}
	if govalidator.IsNull(payload.RepositoryURL) || !govalidator.IsURL(payload.RepositoryURL) {
		return edgestackservice.NewInvalidPayloadError("Invalid repository URL. Must correspond to a valid URL format")
	}
	if payload.RepositoryAuthentication && (govalidator.IsNull(payload.RepositoryUsername) || govalidator.IsNull(payload.RepositoryPassword)) {
		return edgestackservice.NewInvalidPayloadError("Invalid repository credentials. Username and password must be specified when authentication is enabled")
	}
	if govalidator.IsNull(payload.FilePathInRepository) {
		switch payload.DeploymentType {
		case portainer.EdgeStackDeploymentCompose:
			payload.FilePathInRepository = filesystem.ComposeFileDefaultName
		case portainer.EdgeStackDeploymentKubernetes:
			payload.FilePathInRepository = filesystem.ManifestFileDefaultName
		}
	}
	if len(payload.EdgeGroups) == 0 {
		return edgestackservice.NewInvalidPayloadError("Edge Groups are mandatory for an Edge stack")
	}
	return nil
}

// @id EdgeStackCreateRepository
// @summary Create an EdgeStack from a git repository
// @description **Access policy**: administrator
// @tags edge_stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param method query string true "Creation Method" Enums(file,string,repository)
// @param body body swarmStackFromGitRepositoryPayload true "stack config"
// @param dryrun query string false "if true, will not create an edge stack, but just will check the settings and return a non-persisted edge stack object"
// @success 200 {object} portainer.EdgeStack
// @failure 400 "Bad request"
// @failure 500 "Internal server error"
// @failure 503 "Edge compute features are disabled"
// @router /edge_stacks/create/repository [post]
func (handler *Handler) createSwarmStackFromGitRepository(r *http.Request, dryrun bool, userID portainer.UserID) (*portainer.EdgeStack, error) {
	var payload swarmStackFromGitRepositoryPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return nil, err
	}

	stack, err := handler.edgeStacksService.BuildEdgeStack(payload.Name, payload.DeploymentType, payload.EdgeGroups, payload.Registries, payload.UseManifestNamespaces)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create edge stack object")
	}

	if dryrun {
		return stack, nil
	}

	repoConfig := gittypes.RepoConfig{
		URL:            payload.RepositoryURL,
		ReferenceName:  payload.RepositoryReferenceName,
		ConfigFilePath: payload.FilePathInRepository,
		TLSSkipVerify:  payload.TLSSkipVerify,
	}

	if payload.RepositoryAuthentication {
		repoConfig.Authentication = &gittypes.GitAuthentication{
			Username: payload.RepositoryUsername,
			Password: payload.RepositoryPassword,
		}
	}

	return handler.edgeStacksService.PersistEdgeStack(stack, func(stackFolder string, relatedEndpointIds []portainer.EndpointID) (composePath string, manifestPath string, projectPath string, err error) {
		return handler.storeManifestFromGitRepository(stackFolder, relatedEndpointIds, payload.DeploymentType, userID, repoConfig)
	})
}

type swarmStackFromFileUploadPayload struct {
	Name             string
	StackFileContent []byte
	EdgeGroups       []portainer.EdgeGroupID
	// Deployment type to deploy this stack
	// Valid values are: 0 - 'compose', 1 - 'kubernetes', 2 - 'nomad'
	// for compose stacks will use kompose to convert to kubernetes manifest for kubernetes environments(endpoints)
	// kubernetes deploytype is enabled only for kubernetes environments(endpoints)
	// nomad deploytype is enabled only for nomad environments(endpoints)
	DeploymentType portainer.EdgeStackDeploymentType `example:"0" enums:"0,1,2"`
	Registries     []portainer.RegistryID
	// Uses the manifest's namespaces instead of the default one
	UseManifestNamespaces bool
}

func (payload *swarmStackFromFileUploadPayload) Validate(r *http.Request) error {
	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return edgestackservice.NewInvalidPayloadError("Invalid stack name")
	}
	payload.Name = name

	composeFileContent, _, err := request.RetrieveMultiPartFormFile(r, "file")
	if err != nil {
		return edgestackservice.NewInvalidPayloadError("Invalid Compose file. Ensure that the Compose file is uploaded correctly")
	}
	payload.StackFileContent = composeFileContent

	var edgeGroups []portainer.EdgeGroupID
	err = request.RetrieveMultiPartFormJSONValue(r, "EdgeGroups", &edgeGroups, false)
	if err != nil || len(edgeGroups) == 0 {
		return edgestackservice.NewInvalidPayloadError("Edge Groups are mandatory for an Edge stack")
	}
	payload.EdgeGroups = edgeGroups

	deploymentType, err := request.RetrieveNumericMultiPartFormValue(r, "DeploymentType", false)
	if err != nil {
		return edgestackservice.NewInvalidPayloadError("Invalid deployment type")
	}
	payload.DeploymentType = portainer.EdgeStackDeploymentType(deploymentType)

	var registries []portainer.RegistryID
	err = request.RetrieveMultiPartFormJSONValue(r, "Registries", &registries, true)
	if err != nil {
		return errors.New("Invalid registry type")
	}
	payload.Registries = registries

	useManifestNamespaces, _ := request.RetrieveBooleanMultiPartFormValue(r, "UseManifestNamespaces", true)
	payload.UseManifestNamespaces = useManifestNamespaces

	return nil
}

// @id EdgeStackCreateFile
// @summary Create an EdgeStack from file
// @description **Access policy**: administrator
// @tags edge_stacks
// @security ApiKeyAuth
// @security jwt
// @accept multipart/form-data
// @produce json
// @param Name formData string true "Name of the stack"
// @param file formData file true "Content of the Stack file"
// @param EdgeGroups formData string true "JSON stringified array of Edge Groups ids"
// @param DeploymentType formData int true "deploy type 0 - 'compose', 1 - 'kubernetes', 2 - 'nomad'"
// @param Registries formData string false "JSON stringified array of Registry ids to use for this stack"
// @param UseManifestNamespaces formData bool false "Uses the manifest's namespaces instead of the default one, relevant only for kube environments"
// @param PrePullImage formData bool false "Pre Pull image"
// @param RetryDeploy formData bool false "Retry deploy"
// @param dryrun query string false "if true, will not create an edge stack, but just will check the settings and return a non-persisted edge stack object"
// @success 200 {object} portainer.EdgeStack
// @failure 400 "Bad request"
// @failure 500 "Internal server error"
// @failure 503 "Edge compute features are disabled"
// @router /edge_stacks/create/file [post]
func (handler *Handler) createSwarmStackFromFileUpload(r *http.Request, dryrun bool) (*portainer.EdgeStack, error) {
	payload := &swarmStackFromFileUploadPayload{}
	err := payload.Validate(r)
	if err != nil {
		return nil, err
	}

	stack, err := handler.edgeStacksService.BuildEdgeStack(payload.Name, payload.DeploymentType, payload.EdgeGroups, payload.Registries, payload.UseManifestNamespaces)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create edge stack object")
	}

	if dryrun {
		return stack, nil
	}

	return handler.edgeStacksService.PersistEdgeStack(stack, func(stackFolder string, relatedEndpointIds []portainer.EndpointID) (composePath string, manifestPath string, projectPath string, err error) {
		return handler.storeFileContent(stackFolder, payload.DeploymentType, relatedEndpointIds, payload.StackFileContent)
	})
}

func (handler *Handler) storeManifestFromGitRepository(stackFolder string, relatedEndpointIds []portainer.EndpointID, deploymentType portainer.EdgeStackDeploymentType, currentUserID portainer.UserID, repositoryConfig gittypes.RepoConfig) (composePath, manifestPath, projectPath string, err error) {
	projectPath = handler.FileService.GetEdgeStackProjectPath(stackFolder)
	repositoryUsername := ""
	repositoryPassword := ""
	if repositoryConfig.Authentication != nil && repositoryConfig.Authentication.Password != "" {
		repositoryUsername = repositoryConfig.Authentication.Username
		repositoryPassword = repositoryConfig.Authentication.Password
	}

	err = handler.GitService.CloneRepository(projectPath, repositoryConfig.URL, repositoryConfig.ReferenceName, repositoryUsername, repositoryPassword, repositoryConfig.TLSSkipVerify)
	if err != nil {
		return "", "", "", err
	}

	if deploymentType == portainer.EdgeStackDeploymentCompose {
		composePath := repositoryConfig.ConfigFilePath

		manifestPath, err := handler.convertAndStoreKubeManifestIfNeeded(stackFolder, projectPath, composePath, relatedEndpointIds)
		if err != nil {
			return "", "", "", fmt.Errorf("Failed creating and storing kube manifest: %w", err)
		}

		return composePath, manifestPath, projectPath, nil
	}

	if deploymentType == portainer.EdgeStackDeploymentKubernetes {
		return "", repositoryConfig.ConfigFilePath, projectPath, nil
	}

	errMessage := fmt.Sprintf("unknown deployment type: %d", deploymentType)
	return "", "", "", edgestackservice.NewInvalidPayloadError(errMessage)
}
