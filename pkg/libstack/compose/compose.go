package compose

import (
	libstack "github.com/portainer/docker-compose-wrapper"
	"github.com/portainer/docker-compose-wrapper/compose/internal/composeplugin"
)

// NewComposeDeployer will try to create a wrapper for docker-compose plugin
func NewComposeDeployer(binaryPath, configPath string) (libstack.Deployer, error) {
	return composeplugin.NewPluginWrapper(binaryPath, configPath)
}
