package stacks

import (
	"context"
	"os"
	"sync"

	"github.com/pkg/errors"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/stackutils"
	k "github.com/portainer/portainer/api/kubernetes"
)

type StackDeployer interface {
	DeploySwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune bool) error
	DeployComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, forceRereate bool) error
	DeployKubernetesStack(stack *portainer.Stack, endpoint *portainer.Endpoint, user *portainer.User) error
}

type stackDeployer struct {
	lock                *sync.Mutex
	swarmStackManager   portainer.SwarmStackManager
	composeStackManager portainer.ComposeStackManager
	kubernetesDeployer  portainer.KubernetesDeployer
}

// NewStackDeployer inits a stackDeployer struct with a SwarmStackManager, a ComposeStackManager and a KubernetesDeployer
func NewStackDeployer(swarmStackManager portainer.SwarmStackManager, composeStackManager portainer.ComposeStackManager, kubernetesDeployer portainer.KubernetesDeployer) *stackDeployer {
	return &stackDeployer{
		lock:                &sync.Mutex{},
		swarmStackManager:   swarmStackManager,
		composeStackManager: composeStackManager,
		kubernetesDeployer:  kubernetesDeployer,
	}
}

func (d *stackDeployer) DeploySwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune bool) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	d.swarmStackManager.Login(registries, endpoint)
	defer d.swarmStackManager.Logout(endpoint)

	return d.swarmStackManager.Deploy(stack, prune, endpoint)
}

func (d *stackDeployer) DeployComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, forceRereate bool) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	d.swarmStackManager.Login(registries, endpoint)
	defer d.swarmStackManager.Logout(endpoint)

	return d.composeStackManager.Up(context.TODO(), stack, endpoint, forceRereate)
}

func (d *stackDeployer) DeployKubernetesStack(stack *portainer.Stack, endpoint *portainer.Endpoint, user *portainer.User) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	appLabels := k.KubeAppLabels{
		StackID:   int(stack.ID),
		StackName: stack.Name,
		Owner:     user.Username,
	}

	if stack.GitConfig == nil {
		appLabels.Kind = "content"
	} else {
		appLabels.Kind = "git"
	}

	manifestFilePaths, tempDir, err := stackutils.CreateTempK8SDeploymentFiles(stack, d.kubernetesDeployer, appLabels)
	if err != nil {
		return errors.Wrap(err, "failed to create temp kub deployment files")
	}
	defer os.RemoveAll(tempDir)

	_, err = d.kubernetesDeployer.Deploy(user.ID, endpoint, manifestFilePaths, stack.Namespace)
	if err != nil {
		return errors.Wrap(err, "failed to deploy kubernetes application")
	}

	return nil
}
