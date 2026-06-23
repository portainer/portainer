package exec

import (
	"context"
	"fmt"
	"io"
	"os"
	"path"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/api/stacks/stackutils"
	"github.com/portainer/portainer/pkg/libstack"
)

// ComposeStackManager is a wrapper for docker-compose binary
type ComposeStackManager struct {
	deployer     libstack.Deployer
	proxyManager *proxy.Manager
}

// NewComposeStackManager returns a Compose stack manager
func NewComposeStackManager(deployer libstack.Deployer, proxyManager *proxy.Manager) *ComposeStackManager {
	return &ComposeStackManager{
		deployer:     deployer,
		proxyManager: proxyManager,
	}
}

// ComposeSyntaxMaxVersion returns the maximum supported version of the docker compose syntax
func (manager *ComposeStackManager) ComposeSyntaxMaxVersion() string {
	return portainer.ComposeSyntaxMaxVersion
}

// Up builds, (re)creates and starts containers in the background. Wraps `docker-compose up -d` command
func (manager *ComposeStackManager) Up(ctx context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint, options portainer.ComposeUpOptions) error {
	url, proxy, err := fetchEndpointProxy(manager.proxyManager, endpoint)
	if err != nil {
		return fmt.Errorf("failed to fetch environment proxy: %w", err)
	}

	if proxy != nil {
		defer proxy.Close()
	}

	envFilePath, err := createEnvFile(stack)
	if err != nil {
		return fmt.Errorf("failed to create env file: %w", err)
	}

	filePaths := stackutils.GetStackFilePaths(stack, true)
	if err = manager.deployer.Deploy(ctx, filePaths, libstack.DeployOptions{
		Options: libstack.Options{
			WorkingDir:  stack.ProjectPath,
			EnvFilePath: envFilePath,
			Host:        url,
			ProjectName: stack.Name,
			Registries:  portainerRegistriesToAuthConfigs(options.Registries),
		},
		ForceRecreate:        options.ForceRecreate,
		AbortOnContainerExit: options.AbortOnContainerExit,
		RemoveOrphans:        options.Prune,
	}); err != nil {
		return fmt.Errorf("failed to deploy a stack: %w", err)
	}
	return nil
}

// Run runs a one-off command on a service. Wraps `docker-compose run` command
func (manager *ComposeStackManager) Run(ctx context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint, serviceName string, options portainer.ComposeRunOptions) error {
	url, proxy, err := fetchEndpointProxy(manager.proxyManager, endpoint)
	if err != nil {
		return fmt.Errorf("failed to fetch environment proxy: %w", err)
	}

	if proxy != nil {
		defer proxy.Close()
	}

	envFilePath, err := createEnvFile(stack)
	if err != nil {
		return fmt.Errorf("failed to create env file: %w", err)
	}

	filePaths := stackutils.GetStackFilePaths(stack, true)
	if err = manager.deployer.Run(ctx, filePaths, serviceName, libstack.RunOptions{
		Options: libstack.Options{
			WorkingDir:  stack.ProjectPath,
			EnvFilePath: envFilePath,
			Host:        url,
			ProjectName: stack.Name,
			Registries:  portainerRegistriesToAuthConfigs(options.Registries),
		},
		Remove:   options.Remove,
		Args:     options.Args,
		Detached: options.Detached,
	}); err != nil {
		return fmt.Errorf("failed to deploy a stack: %w", err)
	}
	return nil
}

// Down stops and removes containers, networks, images, and volumes
func (manager *ComposeStackManager) Down(ctx context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	url, proxy, err := fetchEndpointProxy(manager.proxyManager, endpoint)
	if err != nil {
		return fmt.Errorf("failed to fetch environment proxy: %w", err)
	} else if proxy != nil {
		defer proxy.Close()
	}

	if err = manager.deployer.Remove(ctx, stack.Name, nil, libstack.RemoveOptions{
		Options: libstack.Options{
			WorkingDir: "",
			Host:       url,
		},
	}); err != nil {
		return fmt.Errorf("failed to remove a stack: %w", err)
	}
	return nil
}

// Pull an image associated with a service defined in a docker-compose.yml or docker-stack.yml file,
// but does not start containers based on those images.
func (manager *ComposeStackManager) Pull(ctx context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint, options portainer.ComposeOptions) error {
	url, proxy, err := fetchEndpointProxy(manager.proxyManager, endpoint)
	if err != nil {
		return fmt.Errorf("failed to fetch environment proxy: %w", err)
	} else if proxy != nil {
		defer proxy.Close()
	}

	envFilePath, err := createEnvFile(stack)
	if err != nil {
		return fmt.Errorf("failed to create env file: %w", err)
	}

	filePaths := stackutils.GetStackFilePaths(stack, true)
	if err = manager.deployer.Pull(ctx, filePaths, libstack.Options{
		WorkingDir:  stack.ProjectPath,
		EnvFilePath: envFilePath,
		Host:        url,
		ProjectName: stack.Name,
		Registries:  portainerRegistriesToAuthConfigs(options.Registries),
	}); err != nil {
		return fmt.Errorf("failed to pull images of the stack: %w", err)
	}
	return nil
}

// NormalizeStackName returns a new stack name with unsupported characters replaced
func (manager *ComposeStackManager) NormalizeStackName(name string) string {
	return normalizeStackName(name)
}

// createEnvFile creates a file that would hold both "in-place" and default environment variables.
// It will return the name of the file if the stack has "in-place" env vars, otherwise empty string.
func createEnvFile(stack *portainer.Stack) (string, error) {
	if len(stack.Env) == 0 {
		return "", nil
	}

	envFilePath := path.Join(stack.ProjectPath, "stack.env")
	envfile, err := os.OpenFile(envFilePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o600)
	if err != nil {
		return "", err
	}
	defer logs.CloseAndLogErr(envfile)

	// Copy from default .env file
	defaultEnvPath := path.Join(stack.ProjectPath, path.Dir(stack.EntryPoint), ".env")
	if err := copyDefaultEnvFile(envfile, defaultEnvPath); err != nil {
		return "", err
	}

	// Copy from stack env vars
	if err := copyConfigEnvVars(envfile, stack.Env); err != nil {
		return "", err
	}

	return envFilePath, nil
}

// copyDefaultEnvFile copies the default .env file if it exists to the provided writer
func copyDefaultEnvFile(w io.Writer, defaultEnvFilePath string) error {
	defaultEnvFile, err := os.Open(defaultEnvFilePath)
	if err != nil {
		// If cannot open a default file, then don't need to copy it.
		// We could as well stat it and check if it exists, but this is more efficient.
		return nil
	}

	defer logs.CloseAndLogErr(defaultEnvFile)

	if _, err = io.Copy(w, defaultEnvFile); err == nil {
		if _, err = fmt.Fprintf(w, "\n"); err != nil {
			return fmt.Errorf("failed to copy default env file: %w", err)
		}
	}

	return nil
	// If couldn't copy the .env file, then ignore the error and try to continue
}

// copyConfigEnvVars write the environment variables from stack configuration to the writer
func copyConfigEnvVars(w io.Writer, envs []portainer.Pair) error {
	for _, v := range envs {
		if _, err := fmt.Fprintf(w, "%s=%s\n", v.Name, v.Value); err != nil {
			return fmt.Errorf("failed to copy config env vars: %w", err)
		}
	}

	return nil
}
