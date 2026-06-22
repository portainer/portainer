package testhelpers

import (
	"context"

	portainer "github.com/portainer/portainer/api"
)

type TestStackDeployer struct {
	DeployComposeCallCount int
	DeploySwarmCallCount   int
	LastPrune              bool
}

func NewTestStackDeployer() *TestStackDeployer {
	return &TestStackDeployer{}
}

func (d *TestStackDeployer) DeployComposeStack(_ context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune, forcePullImage, forceRecreate bool) error {
	d.DeployComposeCallCount++
	d.LastPrune = prune
	return nil
}

func (d *TestStackDeployer) UndeployComposeStack(ctx context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return nil
}

func (d *TestStackDeployer) DeploySwarmStack(_ context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune, pullImage bool) error {
	d.DeploySwarmCallCount++
	d.LastPrune = prune
	return nil
}

func (d *TestStackDeployer) DeployKubernetesStack(_ context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint, user *portainer.User) error {
	return nil
}

func (d *TestStackDeployer) DeployRemoteComposeStack(_ context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune, forcePullImage, forceRecreate bool) error {
	return nil
}

func (d *TestStackDeployer) UndeployRemoteComposeStack(_ context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return nil
}

func (d *TestStackDeployer) StartRemoteComposeStack(_ context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry) error {
	return nil
}

func (d *TestStackDeployer) StopRemoteComposeStack(_ context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return nil
}

func (d *TestStackDeployer) DeployRemoteSwarmStack(_ context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune, pullImage bool) error {
	return nil
}

func (d *TestStackDeployer) UndeployRemoteSwarmStack(_ context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return nil
}

func (d *TestStackDeployer) StartRemoteSwarmStack(_ context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry) error {
	return nil
}

func (d *TestStackDeployer) StopRemoteSwarmStack(_ context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return nil
}
