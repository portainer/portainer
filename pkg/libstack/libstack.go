package libstack

import (
	"context"
)

type Deployer interface {
	Deploy(ctx context.Context, filePaths []string, options DeployOptions) error
	// Remove stops and removes containers
	//
	// projectName or filePaths are required
	// if projectName is supplied filePaths will be ignored
	Remove(ctx context.Context, projectName string, filePaths []string, options Options) error
	Pull(ctx context.Context, filePaths []string, options Options) error
	Run(ctx context.Context, filePaths []string, serviceName string, options RunOptions) error
	Validate(ctx context.Context, filePaths []string, options Options) error
	WaitForStatus(ctx context.Context, name string, status Status) <-chan WaitResult
	Config(ctx context.Context, filePaths []string, options Options) ([]byte, error)
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
}

type DeployOptions struct {
	Options
	ForceRecreate bool
	// AbortOnContainerExit will stop the deployment if a container exits.
	// This is useful when running a onetime task.
	//
	// When this is set, docker compose will output its logs to stdout
	AbortOnContainerExit bool ``
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
