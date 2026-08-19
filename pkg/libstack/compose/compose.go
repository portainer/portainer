package compose

import (
	"github.com/docker/cli/cli/command"
	"github.com/docker/compose/v2/pkg/api"
	"github.com/docker/compose/v2/pkg/compose"
)

type ComposeDeployer struct {
	createComposeServiceFn func(command.Cli, ...compose.Option) api.Compose
}

// NewComposeDeployer creates a new compose deployer
func NewComposeDeployer() *ComposeDeployer {
	return &ComposeDeployer{
		createComposeServiceFn: compose.NewComposeService,
	}
}
