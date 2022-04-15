package testhelpers

import (
	"context"

	portaineree "github.com/portainer/portainer-ee/api"
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

func (manager *composeStackManager) Up(ctx context.Context, stack *portaineree.Stack, endpoint *portaineree.Endpoint, forceRereate bool) error {
	return nil
}

func (manager *composeStackManager) Down(ctx context.Context, stack *portaineree.Stack, endpoint *portaineree.Endpoint) error {
	return nil
}

func (manager *composeStackManager) Pull(ctx context.Context, stack *portaineree.Stack, endpoint *portaineree.Endpoint) error {
	return nil
}
