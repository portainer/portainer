package stackbuilders

import (
	"context"
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/client"
	k "github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
)

type KubernetesStackBuilder struct {
	StackBuilder
	kubernetesDeployer portainer.KubernetesDeployer
	user               *portainer.User
	kind               string
	contentFn          func(*StackPayload) ([]byte, error)
}

// CreateK8sStackFileContentBuilder creates a builder for the Kubernetes stack deployed from file content.
func CreateK8sStackFileContentBuilder(dataStore dataservices.DataStore,
	fileService portainer.FileService,
	stackDeployer deployments.StackDeployer,
	kubernetesDeployer portainer.KubernetesDeployer,
	user *portainer.User) *KubernetesStackBuilder {

	return &KubernetesStackBuilder{
		StackBuilder:       CreateStackBuilder(dataStore, fileService, stackDeployer),
		kubernetesDeployer: kubernetesDeployer,
		user:               user,
		kind:               "content",
		contentFn: func(p *StackPayload) ([]byte, error) {
			return p.StackFileContent, nil
		},
	}
}

// CreateKubernetesStackUrlBuilder creates a builder for the Kubernetes stack deployed from a URL.
func CreateKubernetesStackUrlBuilder(dataStore dataservices.DataStore,
	fileService portainer.FileService,
	stackDeployer deployments.StackDeployer,
	kubernetesDeployer portainer.KubernetesDeployer,
	user *portainer.User) *KubernetesStackBuilder {

	return &KubernetesStackBuilder{
		StackBuilder:       CreateStackBuilder(dataStore, fileService, stackDeployer),
		kubernetesDeployer: kubernetesDeployer,
		user:               user,
		kind:               "url",
		contentFn: func(p *StackPayload) ([]byte, error) {
			return client.Get(p.ManifestURL, 30)
		},
	}
}

func (b *KubernetesStackBuilder) prepare(_ context.Context, payload *StackPayload, userID portainer.UserID) error {
	b.stack.Name = payload.StackName
	b.stack.Type = portainer.KubernetesStack
	b.stack.EntryPoint = filesystem.ManifestFileDefaultName
	b.stack.Namespace = payload.Namespace
	b.stack.FromAppTemplate = payload.FromAppTemplate

	if err := b.initCreatedBy(userID); err != nil {
		return err
	}

	content, err := b.contentFn(payload)
	if err != nil {
		return fmt.Errorf("unable to retrieve manifest content: %w", err)
	}

	if err := b.storeStackFile(content); err != nil {
		return err
	}

	b.deploymentConfiger = newKubernetesDeploymentConfig(b.stack, b.kubernetesDeployer, b.kind, b.user, b.endpoint)

	return nil
}

func (b *KubernetesStackBuilder) deploy(ctx context.Context, endpoint *portainer.Endpoint) error {
	return b.deploymentConfiger.Deploy(ctx)
}

func (b *KubernetesStackBuilder) GetResponse() string {
	return b.deploymentConfiger.GetResponse()
}

func newKubernetesDeploymentConfig(stack *portainer.Stack, deployer portainer.KubernetesDeployer, kind string, user *portainer.User, endpoint *portainer.Endpoint) deployments.StackDeploymentConfiger {
	k8sAppLabel := k.KubeAppLabels{
		StackID:   int(stack.ID),
		StackName: stack.Name,
		Owner:     stackutils.SanitizeLabel(stack.CreatedBy),
		Kind:      kind,
	}

	return deployments.CreateKubernetesStackDeploymentConfig(stack, deployer, k8sAppLabel, user, endpoint)
}
