package edgestacks

import (
	"net/http"

	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperrors "github.com/portainer/portainer/api/http/errors"

	"github.com/pkg/errors"
)

type edgeStackFromFileUploadPayload struct {
	Name             string
	StackFileContent []byte
	EdgeGroups       []portainer.EdgeGroupID
	// Deployment type to deploy this stack
	// Valid values are: 0 - 'compose', 1 - 'kubernetes'
	// compose is enabled only for docker environments
	// kubernetes is enabled only for kubernetes environments
	DeploymentType portainer.EdgeStackDeploymentType `example:"0" enums:"0,1"`
	Registries     []portainer.RegistryID
	// Uses the manifest's namespaces instead of the default one
	UseManifestNamespaces bool
}

func (payload *edgeStackFromFileUploadPayload) Validate(r *http.Request) error {
	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return httperrors.NewInvalidPayloadError("Invalid stack name")
	}
	payload.Name = name

	composeFileContent, _, err := request.RetrieveMultiPartFormFile(r, "file")
	if err != nil {
		return httperrors.NewInvalidPayloadError("Invalid Compose file. Ensure that the Compose file is uploaded correctly")
	}
	payload.StackFileContent = composeFileContent

	var edgeGroups []portainer.EdgeGroupID
	err = request.RetrieveMultiPartFormJSONValue(r, "EdgeGroups", &edgeGroups, false)
	if err != nil || len(edgeGroups) == 0 {
		return httperrors.NewInvalidPayloadError("Edge Groups are mandatory for an Edge stack")
	}
	payload.EdgeGroups = edgeGroups

	deploymentType, err := request.RetrieveNumericMultiPartFormValue(r, "DeploymentType", false)
	if err != nil {
		return httperrors.NewInvalidPayloadError("Invalid deployment type")
	}
	payload.DeploymentType = portainer.EdgeStackDeploymentType(deploymentType)
	if payload.DeploymentType != portainer.EdgeStackDeploymentCompose && payload.DeploymentType != portainer.EdgeStackDeploymentKubernetes {
		return httperrors.NewInvalidPayloadError("Invalid deployment type")
	}

	var registries []portainer.RegistryID
	err = request.RetrieveMultiPartFormJSONValue(r, "Registries", &registries, true)
	if err != nil {
		return httperrors.NewInvalidPayloadError("Invalid registry type")
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
func (handler *Handler) createEdgeStackFromFileUpload(r *http.Request, tx dataservices.DataStoreTx, dryrun bool) (*portainer.EdgeStack, error) {
	payload := &edgeStackFromFileUploadPayload{}
	err := payload.Validate(r)
	if err != nil {
		return nil, err
	}

	stack, err := handler.edgeStacksService.BuildEdgeStack(tx, payload.Name, payload.DeploymentType, payload.EdgeGroups, payload.Registries, payload.UseManifestNamespaces)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create edge stack object")
	}

	if dryrun {
		return stack, nil
	}

	return handler.edgeStacksService.PersistEdgeStack(tx, stack, func(stackFolder string, relatedEndpointIds []portainer.EndpointID) (composePath string, manifestPath string, projectPath string, err error) {
		return handler.storeFileContent(tx, stackFolder, payload.DeploymentType, relatedEndpointIds, payload.StackFileContent)
	})
}
