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
	Validate(ctx context.Context, filePaths []string, options Options) error
	WaitForStatus(ctx context.Context, name string, status Status) <-chan string
}

type Status string

const (
	StatusUnknown  Status = "unknown"
	StatusStarting Status = "starting"
	StatusRunning  Status = "running"
	StatusStopped  Status = "stopped"
	StatusError    Status = "error"
	StatusRemoving Status = "removing"
	StatusRemoved  Status = "removed"
)

type Options struct {
	WorkingDir  string
	Host        string
	ProjectName string
	// EnvFilePath is the path to a .env file
	EnvFilePath string
	// Env is a list of environment variables to pass to the command, example: "FOO=bar"
	Env []string
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
