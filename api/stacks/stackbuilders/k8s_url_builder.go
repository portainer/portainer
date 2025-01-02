package stackbuilders

import (
	"strconv"
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/client"
	k "github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
)

type KubernetesStackUrlBuilder struct {
	UrlMethodStackBuilder
	stackCreateMut    *sync.Mutex
	KuberneteDeployer portainer.KubernetesDeployer
	user              *portainer.User
}

// CreateKuberntesStackGitBuilder creates a builder for the Kubernetes stack that will be deployed by git repository method
func CreateKubernetesStackUrlBuilder(dataStore dataservices.DataStore,
	fileService portainer.FileService,
	stackDeployer deployments.StackDeployer,
	kuberneteDeployer portainer.KubernetesDeployer,
	user *portainer.User) *KubernetesStackUrlBuilder {

	return &KubernetesStackUrlBuilder{
		UrlMethodStackBuilder: UrlMethodStackBuilder{
			StackBuilder: CreateStackBuilder(dataStore, fileService, stackDeployer),
		},
		stackCreateMut:    &sync.Mutex{},
		KuberneteDeployer: kuberneteDeployer,
		user:              user,
	}
}

func (b *KubernetesStackUrlBuilder) SetGeneralInfo(payload *StackPayload, endpoint *portainer.Endpoint) UrlMethodStackBuildProcess {
	b.UrlMethodStackBuilder.SetGeneralInfo(payload, endpoint)

	return b
}

func (b *KubernetesStackUrlBuilder) SetUniqueInfo(payload *StackPayload) UrlMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	b.stack.Type = portainer.KubernetesStack
	b.stack.Namespace = payload.Namespace
	b.stack.Name = payload.StackName
	b.stack.EntryPoint = filesystem.ManifestFileDefaultName
	b.stack.CreatedBy = b.user.Username

	return b
}

func (b *KubernetesStackUrlBuilder) SetURL(payload *StackPayload) UrlMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	manifestContent, err := client.Get(payload.ManifestURL, 30)
	if err != nil {
		b.err = httperror.InternalServerError("Unable to retrieve manifest from URL", err)

		return b
	}

	stackFolder := strconv.Itoa(int(b.stack.ID))
	projectPath, err := b.fileService.StoreStackFileFromBytes(stackFolder, b.stack.EntryPoint, manifestContent)
	if err != nil {
		b.err = httperror.InternalServerError("Unable to persist Kubernetes manifest file on disk", err)

		return b
	}
	b.stack.ProjectPath = projectPath

	return b
}

func (b *KubernetesStackUrlBuilder) Deploy(payload *StackPayload, endpoint *portainer.Endpoint) UrlMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	b.stackCreateMut.Lock()
	defer b.stackCreateMut.Unlock()

	k8sAppLabel := k.KubeAppLabels{
		StackID:   int(b.stack.ID),
		StackName: b.stack.Name,
		Owner:     stackutils.SanitizeLabel(b.stack.CreatedBy),
		Kind:      "url",
	}

	k8sDeploymentConfig, err := deployments.CreateKubernetesStackDeploymentConfig(b.stack, b.KuberneteDeployer, k8sAppLabel, b.user, endpoint)
	if err != nil {
		b.err = httperror.InternalServerError("failed to create temp kub deployment files", err)

		return b
	}

	b.deploymentConfiger = k8sDeploymentConfig

	return b.UrlMethodStackBuilder.Deploy(payload, endpoint)
}

func (b *KubernetesStackUrlBuilder) GetResponse() string {
	return b.UrlMethodStackBuilder.deploymentConfiger.GetResponse()
}
