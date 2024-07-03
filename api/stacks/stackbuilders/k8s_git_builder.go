package stackbuilders

import (
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	k "github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/api/scheduler"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
)

type KubernetesStackGitBuilder struct {
	GitMethodStackBuilder
	stackCreateMut    *sync.Mutex
	KuberneteDeployer portainer.KubernetesDeployer
	user              *portainer.User
}

// CreateKuberntesStackGitBuilder creates a builder for the Kubernetes stack that will be deployed by git repository method
func CreateKubernetesStackGitBuilder(dataStore dataservices.DataStore,
	fileService portainer.FileService,
	gitService portainer.GitService,
	scheduler *scheduler.Scheduler,
	stackDeployer deployments.StackDeployer,
	kuberneteDeployer portainer.KubernetesDeployer,
	user *portainer.User) *KubernetesStackGitBuilder {

	return &KubernetesStackGitBuilder{
		GitMethodStackBuilder: GitMethodStackBuilder{
			StackBuilder: CreateStackBuilder(dataStore, fileService, stackDeployer),
			gitService:   gitService,
			scheduler:    scheduler,
		},
		stackCreateMut:    &sync.Mutex{},
		KuberneteDeployer: kuberneteDeployer,
		user:              user,
	}
}

func (b *KubernetesStackGitBuilder) SetGeneralInfo(payload *StackPayload, endpoint *portainer.Endpoint) GitMethodStackBuildProcess {
	b.GitMethodStackBuilder.SetGeneralInfo(payload, endpoint)

	return b
}

func (b *KubernetesStackGitBuilder) SetUniqueInfo(payload *StackPayload) GitMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	b.stack.Type = portainer.KubernetesStack
	b.stack.Namespace = payload.Namespace
	b.stack.Name = payload.StackName
	b.stack.EntryPoint = payload.ManifestFile
	b.stack.CreatedBy = b.user.Username

	return b
}

func (b *KubernetesStackGitBuilder) SetGitRepository(payload *StackPayload) GitMethodStackBuildProcess {
	b.GitMethodStackBuilder.SetGitRepository(payload)

	return b
}

func (b *KubernetesStackGitBuilder) Deploy(payload *StackPayload, endpoint *portainer.Endpoint) GitMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	b.stackCreateMut.Lock()
	defer b.stackCreateMut.Unlock()

	k8sAppLabel := k.KubeAppLabels{
		StackID:   int(b.stack.ID),
		StackName: b.stack.Name,
		Owner:     stackutils.SanitizeLabel(b.stack.CreatedBy),
		Kind:      "git",
	}

	k8sDeploymentConfig, err := deployments.CreateKubernetesStackDeploymentConfig(b.stack, b.KuberneteDeployer, k8sAppLabel, b.user, endpoint)
	if err != nil {
		b.err = httperror.InternalServerError("failed to create temp kub deployment files", err)
		return b
	}

	b.deploymentConfiger = k8sDeploymentConfig

	return b.GitMethodStackBuilder.Deploy(payload, endpoint)
}

func (b *KubernetesStackGitBuilder) SetAutoUpdate(payload *StackPayload) GitMethodStackBuildProcess {
	b.GitMethodStackBuilder.SetAutoUpdate(payload)

	return b
}

func (b *KubernetesStackGitBuilder) GetResponse() string {
	return b.GitMethodStackBuilder.deploymentConfiger.GetResponse()
}
