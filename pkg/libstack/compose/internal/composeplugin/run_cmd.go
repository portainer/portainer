package composeplugin

import (
	"context"

	"github.com/portainer/portainer/pkg/libstack"
	"github.com/rs/zerolog/log"
)

func (wrapper *PluginWrapper) Run(ctx context.Context, filePaths []string, serviceName string, options libstack.RunOptions) error {

	output, err := wrapper.command(newRunCommand(filePaths, serviceName, runOptions{
		remove:   options.Remove,
		args:     options.Args,
		detached: options.Detached,
	}), options.Options)
	if len(output) != 0 {
		if err != nil {
			return err
		}

		log.Info().Msg("Stack run successful")

		log.Debug().
			Str("output", string(output)).
			Msg("docker compose")
	}

	return err
}

type runOptions struct {
	remove   bool
	args     []string
	detached bool
}

func newRunCommand(filePaths []string, serviceName string, options runOptions) composeCommand {
	args := []string{"run"}

	if options.remove {
		args = append(args, "--rm")
	}

	if options.detached {
		args = append(args, "-d")
	}

	args = append(args, serviceName)
	args = append(args, options.args...)

	return newCommand(args, filePaths)
}
