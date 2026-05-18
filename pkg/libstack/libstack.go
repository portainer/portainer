package libstack

import (
	"context"
	"os"
	"strings"

	portainer "github.com/portainer/portainer/api"

	configtypes "github.com/docker/cli/cli/config/types"
)

const PortainerEnvVarsPrefix = "PORTAINER_"

// PortainerEnvVars returns all environment variables from os.Environ() that
// start with the PORTAINER_ prefix.
func PortainerEnvVars() []string {
	var vars []string
	for _, e := range os.Environ() {
		if strings.HasPrefix(e, PortainerEnvVarsPrefix) {
			vars = append(vars, e)
		}
	}
	return vars
}

// AggregateStatusCounts derives a single stack Status from a map of per-status
// counts and the total number of services. The priority order matches the
// behaviour of both the compose and swarm deployers.
func AggregateStatusCounts(statusCounts map[Status]int, total int) Status {
	switch {
	case statusCounts[StatusError] > 0:
		return StatusError
	case statusCounts[StatusStarting] > 0:
		return StatusStarting
	case statusCounts[StatusRemoving] > 0:
		return StatusRemoving
	case statusCounts[StatusCompleted] == total:
		return StatusCompleted
	case statusCounts[StatusRunning]+statusCounts[StatusCompleted] == total:
		return StatusRunning
	case statusCounts[StatusStopped] == total:
		return StatusStopped
	case statusCounts[StatusRemoved] == total:
		return StatusRemoved
	default:
		return StatusUnknown
	}
}

type Deployer interface {
	Deploy(ctx context.Context, filePaths []string, options DeployOptions) error
	// Remove stops and removes containers
	//
	// projectName or filePaths are required
	// if projectName is supplied filePaths will be ignored
	Remove(ctx context.Context, projectName string, filePaths []string, options RemoveOptions) error
	Pull(ctx context.Context, filePaths []string, options Options) error
	Run(ctx context.Context, filePaths []string, serviceName string, options RunOptions) error
	Validate(ctx context.Context, filePaths []string, options Options) error
	WaitForStatus(ctx context.Context, name string, status Status) WaitResult
	Config(ctx context.Context, filePaths []string, options Options) ([]byte, error)
	GetExistingEdgeStacks(ctx context.Context) ([]EdgeStack, error)
}

type Status string

const (
	StatusUnknown   Status = "unknown"
	StatusStarting  Status = "starting"
	StatusRunning   Status = "running"
	StatusStopped   Status = "stopped"
	StatusError     Status = "error"
	StatusRemoving  Status = "removing"
	StatusRemoved   Status = "removed"
	StatusCompleted Status = "completed"
)

type WaitResult struct {
	Status   Status
	ErrorMsg string
}

type Options struct {
	// WorkingDir is the working directory for the command execution
	WorkingDir  string
	Host        string
	ProjectName string
	// EnvFilePath is the path to a .env file
	EnvFilePath string
	// Env is a list of environment variables to pass to the command, example: "FOO=bar"
	Env []string
	// ProjectDir is the working directory for containers created by docker compose file.
	// By default, it is an empty string, which means it corresponds to the path of the compose file itself.
	// This is particularly helpful when mounting a relative path.
	ProjectDir string
	// ConfigOptions is a list of options to pass to the docker-compose config command
	ConfigOptions []string
	Registries    []configtypes.AuthConfig
	// BindMountHashEnabled controls whether bind mount hash labels are set for services.
	// This option is primarily used by libstack internals and advanced callers that need
	// to manage bind mount hash behavior explicitly. This is not an option that users can set.
	BindMountHashEnabled bool
}

type DeployOptions struct {
	Options
	ForceRecreate bool
	// AbortOnContainerExit will stop the deployment if a container exits.
	// This is useful when running a onetime task.
	//
	// When this is set, docker compose will output its logs to stdout
	AbortOnContainerExit bool
	RemoveOrphans        bool
	EdgeStackID          portainer.EdgeStackID
}

type RunOptions struct {
	Options
	// Automatically remove the container when it exits
	Remove bool
	// A list of arguments to pass to the container
	Args []string
	// Run the container in detached mode
	Detached bool
}

type RemoveOptions struct {
	Options

	Volumes bool
}

type EdgeStack struct {
	ID       int
	Name     string
	ExitCode int
}
