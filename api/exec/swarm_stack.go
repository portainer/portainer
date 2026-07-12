package exec

import (
	"context"
	"fmt"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/stacks/stackutils"
	"github.com/portainer/portainer/pkg/libstack"
	"github.com/portainer/portainer/pkg/libstack/swarm"
)

// postDeployFailureCheckTimeout bounds how long Deploy waits for tasks to start or fail after being accepted by Swarm.
const postDeployFailureCheckTimeout = 30 * time.Second

// SwarmStackManager represents a service for managing stacks.
type SwarmStackManager struct {
	deployer     swarm.Deployer
	proxyManager *proxy.Manager
}

// NewSwarmStackManager creates a new SwarmStackManager.
func NewSwarmStackManager(
	deployer swarm.Deployer,
	proxyManager *proxy.Manager,
) *SwarmStackManager {
	return &SwarmStackManager{
		deployer:     deployer,
		proxyManager: proxyManager,
	}
}

// Deploy creates or updates a Docker Swarm stack.
func (manager *SwarmStackManager) Deploy(
	ctx context.Context,
	stack *portainer.Stack,
	prune bool,
	pullImage bool,
	endpoint *portainer.Endpoint,
	registries []portainer.Registry,
) error {
	url, proxy, err := fetchEndpointProxy(manager.proxyManager, endpoint)
	if err != nil {
		return fmt.Errorf("failed to fetch environment proxy: %w", err)
	}

	if proxy != nil {
		defer proxy.Close()
	}

	filePaths := stackutils.GetStackFilePaths(stack, true)

	env := make([]string, 0, len(stack.Env))
	for _, ev := range stack.Env {
		env = append(env, ev.Name+"="+ev.Value)
	}

	options := swarm.Options{
		ProjectName: stack.Name,
		Host:        url,
		Env:         env,
		WorkingDir:  stack.ProjectPath,
		Registries:  portainerRegistriesToAuthConfigs(registries),
	}

	if err := manager.deployer.Deploy(context.TODO(), filePaths, swarm.DeployOptions{
		Options:       options,
		RemoveOrphans: prune,
		PullImage:     pullImage,
	}); err != nil {
		return err
	}

	// Swarm schedules and pulls images asynchronously, so check for early failures before reporting success.
	waitCtx, cancel := context.WithTimeout(ctx, postDeployFailureCheckTimeout)
	defer cancel()

	result := manager.deployer.WaitForStatus(waitCtx, stack.Name, options, libstack.StatusRunning)
	if result.Status == libstack.StatusError {
		return fmt.Errorf("deployment failed: %s", result.ErrorMsg)
	}

	return nil
}

// Remove deletes all resources belonging to a Swarm stack.
func (manager *SwarmStackManager) Remove(
	ctx context.Context,
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
) error {
	url, proxy, err := fetchEndpointProxy(manager.proxyManager, endpoint)
	if err != nil {
		return fmt.Errorf("failed to fetch environment proxy: %w", err)
	}

	if proxy != nil {
		defer proxy.Close()
	}

	return manager.deployer.Remove(context.TODO(), stack.Name, swarm.RemoveOptions{
		Options: swarm.Options{
			Host: url,
		},
	})
}

// NormalizeStackName returns a new stack name with unsupported characters replaced.
func (manager *SwarmStackManager) NormalizeStackName(name string) string {
	return normalizeStackName(name)
}
