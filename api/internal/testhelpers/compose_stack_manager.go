package testhelpers

import (
	"context"

	portainer "github.com/portainer/portainer/api"
)

type composeStackManager struct{}

func NewComposeStackManager() *composeStackManager {
	return &composeStackManager{}
}

func (manager *composeStackManager) ComposeSyntaxMaxVersion() string {
	return ""
}

func (manager *composeStackManager) NormalizeStackName(name string) string {
	return name
}

func (manager *composeStackManager) Up(ctx context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint, forceRereate bool) error {
	return nil
}

func (manager *composeStackManager) Down(ctx context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return nil
}

func (manager *composeStackManager) Pull(ctx context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return nil
}
