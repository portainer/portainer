package libstack

import (
	"context"
	"fmt"
	"sync"

	"github.com/portainer/portainer/api/logs"

	"github.com/docker/cli/cli/command"
	configtypes "github.com/docker/cli/cli/config/types"
	"github.com/docker/cli/cli/flags"
	"github.com/docker/docker/registry"
	"github.com/rs/zerolog/log"
)

// DockerCliOptions holds the settings required to initialise a DockerCli.
type DockerCliOptions struct {
	Host       string
	Registries []configtypes.AuthConfig
}

// mu serialises calls to cli.Initialize across all deployer types (compose and
// swarm) to prevent concurrent initialisation of the Docker client config.
var mu sync.Mutex

// WithCli creates and initialises a DockerCli, injects registry credentials,
// and calls cliFn with the ready client. The client is closed after cliFn returns.
func WithCli(
	ctx context.Context, //nolint:staticcheck
	options DockerCliOptions,
	cliFn func(context.Context, *command.DockerCli) error,
) error {
	ctx = context.Background() //nolint:staticcheck

	cli, err := command.NewDockerCli(command.WithCombinedStreams(log.Logger))
	if err != nil {
		return fmt.Errorf("unable to create a Docker client: %w", err)
	}

	opts := flags.NewClientOptions()
	if options.Host != "" {
		opts.Hosts = []string{options.Host}
	}

	mu.Lock()
	if err := cli.Initialize(opts); err != nil {
		mu.Unlock()
		return fmt.Errorf("unable to initialize the Docker client: %w", err)
	}
	mu.Unlock()
	defer logs.CloseAndLogErr(cli.Client())

	for _, r := range options.Registries {
		if r.ServerAddress == "" || r.ServerAddress == registry.DefaultNamespace {
			r.ServerAddress = registry.IndexServer
		}

		cli.ConfigFile().AuthConfigs[r.ServerAddress] = r
	}

	// Docker resolves credentials in the following priority:
	// 1. credHelpers – per-registry credential helpers
	// 2. credsStore  – global credential store used for all registries
	// 3. auths       – inline credentials defined in config.json
	//
	// Many Docker Desktop users (Windows/macOS) have a global credsStore configured
	// by default (e.g. "desktop.exe" on Windows or "osxkeychain" on macOS). These
	// global stores often do not include credentials for the custom registries
	// defined in Portainer stacks, leading to authentication failures.
	//
	// To avoid this, when inline credentials are provided for one or more registries,
	// we intentionally clear the global credsStore. This ensures Docker uses the
	// credentials configured in Portainer instead of falling back to an empty global
	// store.
	//
	// If no inline credentials are configured in Portainer, we keep the credsStore
	// so Docker can still use it as a fallback.
	// credHelpers are not affected as they are external services managed by the user.
	// @ref: https://linear.app/portainer/issue/BE-12237
	if len(options.Registries) > 0 {
		cli.ConfigFile().CredentialsStore = ""
	}

	return cliFn(ctx, cli)
}
