package exec

import (
	"context"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/pkg/errors"

	libstack "github.com/portainer/docker-compose-wrapper"
	"github.com/portainer/docker-compose-wrapper/compose"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/http/proxy/factory"
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
func (manager *ComposeStackManager) Up(ctx context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	url, proxy, err := manager.fetchEndpointProxy(endpoint)
	if err != nil {
		return errors.Wrap(err, "failed to fetch environment proxy")
	}

	if proxy != nil {
		defer proxy.Close()
	}

	envFilePath, err := createEnvFile(stack)
	if err != nil {
		return errors.Wrap(err, "failed to create env file")
	}

	filePaths := getStackFiles(stack)
	err = manager.deployer.Deploy(ctx, stack.ProjectPath, url, stack.Name, filePaths, envFilePath)
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

	filePaths := getStackFiles(stack)
	err = manager.deployer.Remove(ctx, stack.ProjectPath, url, stack.Name, filePaths)
	return errors.Wrap(err, "failed to remove a stack")
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

func createEnvFile(stack *portainer.Stack) (string, error) {
	if stack.Env == nil || len(stack.Env) == 0 {
		return "", nil
	}

	envFilePath := path.Join(stack.ProjectPath, "stack.env")

	envfile, err := os.OpenFile(envFilePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return "", err
	}

	for _, v := range stack.Env {
		envfile.WriteString(fmt.Sprintf("%s=%s\n", v.Name, v.Value))
	}
	envfile.Close()

	return "stack.env", nil
}

// getStackFiles returns list of stack's confile file paths.
// items in the list would be sanitized according to following criterias:
// 1. no empty paths
// 2. no "../xxx" paths that are trying to escape stack folder
// 3. no dir paths
// 4. root paths would be made relative
func getStackFiles(stack *portainer.Stack) []string {
	paths := make([]string, 0, len(stack.AdditionalFiles)+1)

	for _, p := range append([]string{stack.EntryPoint}, stack.AdditionalFiles...) {
		if strings.HasPrefix(p, "/") {
			p = `.` + p
		}

		if p == `` || p == `.` || strings.HasPrefix(p, `..`) || strings.HasSuffix(p, string(filepath.Separator)) {
			continue
		}

		paths = append(paths, p)
	}

	return paths
}
