package exec

import (
	"os/exec"
	"path"

	"github.com/portainer/portainer"
)

// StackManager represents a service for managing stacks.
type StackManager struct {
}

// NewStackManager initializes a new StackManager service.
func NewStackManager() *StackManager {
	return &StackManager{}
}

// Deploy will execute the Docker stack deploy command
func (manager *StackManager) Deploy(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	stackFilePath := path.Join(stack.ProjectPath, "docker-compose.yml")
	cmd := exec.Command("/docker", "-H", endpoint.URL, "stack", "deploy", "--compose-file", stackFilePath, stack.Name)
	return cmd.Run()
}

// Remove will execute the Docker stack rm command
func (manager *StackManager) Remove(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	cmd := exec.Command("/docker", "-H", endpoint.URL, "stack", "rm", stack.Name)
	return cmd.Run()
}

// Should support TLS options for endpoint
// Based on OS.Version, should use docker.exe or docker
