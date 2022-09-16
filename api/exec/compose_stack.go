package exec

import (
	"context"
	"fmt"
	"io"
	"os"
	"path"
	"strings"

	"github.com/pkg/errors"

	libstack "github.com/portainer/docker-compose-wrapper"
	"github.com/portainer/docker-compose-wrapper/compose"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/http/proxy/factory"
	"github.com/portainer/portainer/api/internal/stackutils"
)

// ComposeStackManager is a wrapper for docker-compose binary
type ComposeStackManager struct {
	deployer     libstack.Deployer
	proxyManager *proxy.Manager
}

// NewComposeStackManager returns a docker-compose wrapper if corresponding binary present, otherwise nil
func NewComposeStackManager(binaryPath string, configPath string, proxyManager *proxy.Manager) (*ComposeStackManager, error) {
	deployer, err := compose.NewComposeDeployer(binaryPath, configPath)
	if err != nil {
		return nil, err
	}

	return &ComposeStackManager{
		deployer:     deployer,
		proxyManager: proxyManager,
	}, nil
}

// ComposeSyntaxMaxVersion returns the maximum supported version of the docker compose syntax
func (manager *ComposeStackManager) ComposeSyntaxMaxVersion() string {
	return portainer.ComposeSyntaxMaxVersion
}

// Up builds, (re)creates and starts containers in the background. Wraps `docker-compose up -d` command
func (manager *ComposeStackManager) Up(ctx context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint, forceRereate bool) error {
	url, proxy, err := manager.fetchEndpointProxy(endpoint)
	if err != nil {
		return errors.Wrap(err, "failed to fetch environment proxy")
	}

	if proxy != nil {
		defer proxy.Close()
	}

	envFile, err := createEnvFile(stack)
	if err != nil {
		return errors.Wrap(err, "failed to create env file")
	}

	filePaths := stackutils.GetStackFilePaths(stack)
	err = manager.deployer.Deploy(ctx, stack.ProjectPath, url, stack.Name, filePaths, envFile, forceRereate)
	return errors.Wrap(err, "failed to deploy a stack")
}

// Down stops and removes containers, networks, images, and volumes. Wraps `docker-compose down --remove-orphans` command
func (manager *ComposeStackManager) Down(ctx context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	url, proxy, err := manager.fetchEndpointProxy(endpoint)
	if err != nil {
		return err
	}
	if proxy != nil {
		defer proxy.Close()
	}

	envFile, err := createEnvFile(stack)
	if err != nil {
		return errors.Wrap(err, "failed to create env file")
	}

	filePaths := stackutils.GetStackFilePaths(stack)

	err = manager.deployer.Remove(ctx, stack.ProjectPath, url, stack.Name, filePaths, envFile)
	return errors.Wrap(err, "failed to remove a stack")
}

// Pull an image associated with a service defined in a docker-compose.yml or docker-stack.yml file,
// but does not start containers based on those images.
func (manager *ComposeStackManager) Pull(ctx context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	url, proxy, err := manager.fetchEndpointProxy(endpoint)
	if err != nil {
		return err
	}
	if proxy != nil {
		defer proxy.Close()
	}

	envFile, err := createEnvFile(stack)
	if err != nil {
		return errors.Wrap(err, "failed to create env file")
	}

	filePaths := stackutils.GetStackFilePaths(stack)
	err = manager.deployer.Pull(ctx, stack.ProjectPath, url, stack.Name, filePaths, envFile)
	return errors.Wrap(err, "failed to pull images of the stack")
}

// NormalizeStackName returns a new stack name with unsupported characters replaced
func (manager *ComposeStackManager) NormalizeStackName(name string) string {
	return stackNameNormalizeRegex.ReplaceAllString(strings.ToLower(name), "")
}

func (manager *ComposeStackManager) fetchEndpointProxy(endpoint *portainer.Endpoint) (string, *factory.ProxyServer, error) {
	if strings.HasPrefix(endpoint.URL, "unix://") || strings.HasPrefix(endpoint.URL, "npipe://") {
		return "", nil, nil
	}

	proxy, err := manager.proxyManager.CreateAgentProxyServer(endpoint)
	if err != nil {
		return "", nil, err
	}

	return fmt.Sprintf("tcp://127.0.0.1:%d", proxy.Port), proxy, nil
}

// createEnvFile creates a file that would hold both "in-place" and default environment variables.
// It will return the name of the file if the stack has "in-place" env vars, otherwise empty string.
func createEnvFile(stack *portainer.Stack) (string, error) {
	if stack.Env == nil || len(stack.Env) == 0 {
		return "", nil
	}

	envFilePath := path.Join(stack.ProjectPath, "stack.env")
	envfile, err := os.OpenFile(envFilePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return "", err
	}
	defer envfile.Close()

	copyDefaultEnvFile(stack, envfile)

	for _, v := range stack.Env {
		envfile.WriteString(fmt.Sprintf("%s=%s\n", v.Name, v.Value))
	}

	return "stack.env", nil
}

// copyDefaultEnvFile copies the default .env file if it exists to the provided writer
func copyDefaultEnvFile(stack *portainer.Stack, w io.Writer) {
	defaultEnvFile, err := os.Open(path.Join(path.Join(stack.ProjectPath, path.Dir(stack.EntryPoint)), ".env"))
	if err != nil {
		// If cannot open a default file, then don't need to copy it.
		// We could as well stat it and check if it exists, but this is more efficient.
		return
	}

	defer defaultEnvFile.Close()

	if _, err = io.Copy(w, defaultEnvFile); err == nil {
		io.WriteString(w, "\n")
	}
	// If couldn't copy the .env file, then ignore the error and try to continue
}
