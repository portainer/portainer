package composeplugin

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libstack"
	"github.com/portainer/portainer/pkg/libstack/compose/internal/utils"
	"github.com/rs/zerolog/log"
)

var (
	MissingDockerComposePluginErr = errors.New("docker-compose plugin is missing from config path")
)

// PluginWrapper provide a type for managing docker compose commands
type PluginWrapper struct {
	binaryPath string
	configPath string
}

// NewPluginWrapper initializes a new ComposeWrapper service with local docker-compose binary.
func NewPluginWrapper(binaryPath, configPath string) (libstack.Deployer, error) {
	if !utils.IsBinaryPresent(utils.ProgramPath(binaryPath, "docker-compose")) {
		return nil, MissingDockerComposePluginErr
	}

	return &PluginWrapper{binaryPath: binaryPath, configPath: configPath}, nil
}

// Up create and start containers
func (wrapper *PluginWrapper) Deploy(ctx context.Context, filePaths []string, options libstack.DeployOptions) error {
	output, err := wrapper.command(newUpCommand(filePaths, upOptions{
		forceRecreate:        options.ForceRecreate,
		abortOnContainerExit: options.AbortOnContainerExit,
	}), options.Options)

	if len(output) != 0 {
		if err != nil {
			return err
		}

		log.Info().Msg("Stack deployment successful")

		log.Debug().
			Str("output", string(output)).
			Msg("docker compose")
	}

	return err
}

// Down stop and remove containers
func (wrapper *PluginWrapper) Remove(ctx context.Context, projectName string, filePaths []string, options libstack.Options) error {
	output, err := wrapper.command(newDownCommand(projectName, filePaths), options)
	if len(output) != 0 {
		if err != nil {
			return err
		}

		log.Info().Msg("Stack removal successful")

		log.Debug().
			Str("output", string(output)).
			Msg("docker compose")

	}

	return err
}

// Pull images
func (wrapper *PluginWrapper) Pull(ctx context.Context, filePaths []string, options libstack.Options) error {
	output, err := wrapper.command(newPullCommand(filePaths), options)
	if len(output) != 0 {
		if err != nil {
			return err
		}

		log.Info().Msg("Stack pull successful")

		log.Debug().
			Str("output", string(output)).
			Msg("docker compose")
	}

	return err
}

// Validate stack file
func (wrapper *PluginWrapper) Validate(ctx context.Context, filePaths []string, options libstack.Options) error {
	output, err := wrapper.command(newValidateCommand(filePaths), options)
	if len(output) != 0 {
		if err != nil {
			return err
		}

		log.Info().Msg("Valid stack format")

		log.Debug().
			Str("output", string(output)).
			Msg("docker compose")
	}

	return err
}

// Command execute a docker-compose command
func (wrapper *PluginWrapper) command(command composeCommand, options libstack.Options) ([]byte, error) {
	program := utils.ProgramPath(wrapper.binaryPath, "docker-compose")

	if options.ProjectName != "" {
		command.WithProjectName(options.ProjectName)
	}

	if options.EnvFilePath != "" {
		command.WithEnvFilePath(options.EnvFilePath)
	}

	if options.Host != "" {
		command.WithHost(options.Host)
	}

	var stderr bytes.Buffer

	args := []string{}
	args = append(args, command.ToArgs()...)

	cmd := exec.Command(program, args...)
	cmd.Dir = options.WorkingDir

	if wrapper.configPath != "" || len(options.Env) > 0 {
		cmd.Env = os.Environ()
	}

	if wrapper.configPath != "" {
		cmd.Env = append(cmd.Env, "DOCKER_CONFIG="+wrapper.configPath)
	}

	cmd.Env = append(cmd.Env, options.Env...)

	log.Debug().
		Str("command", program).
		Strs("args", args).
		Interface("env", cmd.Env).
		Msg("run command")

	cmd.Stderr = &stderr

	output, err := cmd.Output()
	if err != nil {
		errOutput := stderr.String()
		log.Warn().
			Str("output", string(output)).
			Str("error_output", errOutput).
			Err(err).
			Msg("docker compose command failed")

		if errOutput != "" {
			return nil, errors.New(errOutput)
		}

		return nil, fmt.Errorf("docker compose command failed: %w", err)
	}

	return output, nil
}

type composeCommand struct {
	globalArgs        []string // docker-compose global arguments: --host host -f file.yaml
	subCommandAndArgs []string // docker-compose subcommand:  up, down folllowed by subcommand arguments
}

func newCommand(command []string, filePaths []string) composeCommand {
	args := []string{}
	for _, path := range filePaths {
		args = append(args, "-f")
		args = append(args, strings.TrimSpace(path))
	}
	return composeCommand{
		globalArgs:        args,
		subCommandAndArgs: command,
	}
}

type upOptions struct {
	forceRecreate        bool
	abortOnContainerExit bool
}

func newUpCommand(filePaths []string, options upOptions) composeCommand {
	args := []string{"up"}

	if options.abortOnContainerExit {
		args = append(args, "--abort-on-container-exit")
	} else { // detach by default, not working with --abort-on-container-exit
		args = append(args, "-d")
	}

	if options.forceRecreate {
		args = append(args, "--force-recreate")
	}
	return newCommand(args, filePaths)
}

func newDownCommand(projectName string, filePaths []string) composeCommand {
	cmd := newCommand([]string{"down", "--remove-orphans"}, filePaths)
	cmd.WithProjectName(projectName)

	return cmd
}

func newPullCommand(filePaths []string) composeCommand {
	return newCommand([]string{"pull"}, filePaths)
}

func newValidateCommand(filePaths []string) composeCommand {
	return newCommand([]string{"config", "--quiet"}, filePaths)
}

func (command *composeCommand) WithHost(host string) {
	// prepend compatibility flags such as this one as they must appear before the
	// regular global args otherwise docker-compose will throw an error
	command.globalArgs = append([]string{"--host", host}, command.globalArgs...)
}

func (command *composeCommand) WithProjectName(projectName string) {
	command.globalArgs = append(command.globalArgs, "--project-name", projectName)
}

func (command *composeCommand) WithEnvFilePath(envFilePath string) {
	command.globalArgs = append(command.globalArgs, "--env-file", envFilePath)
}

func (command *composeCommand) ToArgs() []string {
	return append(command.globalArgs, command.subCommandAndArgs...)
}
