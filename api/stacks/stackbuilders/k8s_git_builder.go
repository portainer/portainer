package stackbuilders

import (
	"context"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/scheduler"
	"github.com/portainer/portainer/api/stacks/deployments"
)

type KubernetesStackGitBuilder struct {
	GitMethodStackBuilder
	kubernetesDeployer portainer.KubernetesDeployer
	user               *portainer.User
}

// CreateKubernetesStackGitBuilder creates a builder for the Kubernetes stack that will be deployed by git repository method
func CreateKubernetesStackGitBuilder(dataStore dataservices.DataStore,
	fileService portainer.FileService,
	gitService portainer.GitService,
	scheduler *scheduler.Scheduler,
	stackDeployer deployments.StackDeployer,
	kubernetesDeployer portainer.KubernetesDeployer,
	user *portainer.User) *KubernetesStackGitBuilder {

	return &KubernetesStackGitBuilder{
		GitMethodStackBuilder: GitMethodStackBuilder{
			StackBuilder: CreateStackBuilder(dataStore, fileService, stackDeployer),
			gitService:   gitService,
			scheduler:    scheduler,
		},
		kubernetesDeployer: kubernetesDeployer,
		user:               user,
	}
}

func (b *KubernetesStackGitBuilder) prepare(ctx context.Context, payload *StackPayload, userID portainer.UserID) error {
	b.stack.Type = portainer.KubernetesStack
	b.stack.Namespace = payload.Namespace
	b.stack.Name = payload.StackName
	b.stack.EntryPoint = payload.ManifestFile
	if err := b.GitMethodStackBuilder.prepare(ctx, payload, userID); err != nil {
		return err
	}

	b.deploymentConfiger = newKubernetesDeploymentConfig(b.stack, b.kubernetesDeployer, "git", b.user, b.endpoint)

	return nil
}

func (b *KubernetesStackGitBuilder) deploy(ctx context.Context, endpoint *portainer.Endpoint) error {
	return b.deploymentConfiger.Deploy(ctx)
}

func (b *KubernetesStackGitBuilder) GetResponse() string {
	return b.deploymentConfiger.GetResponse()
}
