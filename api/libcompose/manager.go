package libcompose

import (
	"github.com/portainer/portainer"

	"github.com/portainer/libcompose/project/options"
	"golang.org/x/net/context"
)

// StackManager represents a service for managing stacks.
type StackManager struct {
	projectManager *ProjectManager
}

// NewStackManager initializes a new StackManager service.
func NewStackManager() *StackManager {
	return &StackManager{
		projectManager: NewProjectManager(),
	}
}

// Up will execute the Up operation against a stack inside the specified endpoint.
func (manager *StackManager) Up(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	project, err := manager.projectManager.GetProject(stack, endpoint)
	if err != nil {
		return err
	}
	return project.Up(context.Background(), options.Up{})
}

// Down will execute the Down operation against a stack inside the specified endpoint.
func (manager *StackManager) Down(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	project, err := manager.projectManager.GetProject(stack, endpoint)
	if err != nil {
		return err
	}
	return project.Down(context.Background(), options.Down{})
}

// Scale will execute the scale operation against a stack service inside the specified endpoint.
func (manager *StackManager) Scale(stack *portainer.Stack, endpoint *portainer.Endpoint, service string, scale int) error {
	project, err := manager.projectManager.GetProject(stack, endpoint)
	if err != nil {
		return err
	}
	serviceScale := map[string]int{service: scale}
	return project.Scale(context.Background(), 30, serviceScale)
}
