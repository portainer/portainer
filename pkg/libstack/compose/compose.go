package compose

import (
	"github.com/portainer/portainer/pkg/libstack"
	"github.com/portainer/portainer/pkg/libstack/compose/internal/composeplugin"
)

// NewComposeDeployer will try to create a wrapper for docker-compose plugin
func NewComposeDeployer(binaryPath, configPath string) (libstack.Deployer, error) {
	return composeplugin.NewPluginWrapper(binaryPath, configPath)
}
