package exec

import (
	"context"
	"fmt"
	"io"
	"os"
	"path"
	"regexp"
	"strings"

	"github.com/pkg/errors"

	libstack "github.com/portainer/docker-compose-wrapper"
	"github.com/portainer/docker-compose-wrapper/compose"

	"github.com/docker/cli/cli/compose/loader"
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

	envFilePath, err := createEnvFile(stack)
	if err != nil {
		return errors.Wrap(err, "failed to create env file")
	}

	filePaths := stackutils.GetStackFilePaths(stack)
	err = manager.deployer.Deploy(ctx, stack.ProjectPath, url, stack.Name, filePaths, envFilePath, forceRereate)
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

	if err := updateNetworkEnvFile(stack); err != nil {
		return err
	}

	filePaths := stackutils.GetStackFilePaths(stack)
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
	// workaround for EE-1862. It will have to be removed when
	// docker/compose upgraded to v2.x.
	if err := createNetworkEnvFile(stack); err != nil {
		return "", errors.Wrap(err, "failed to create network env file")
	}

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

func fileNotExist(filePath string) bool {
	if _, err := os.Stat(filePath); errors.Is(err, os.ErrNotExist) {
		return true
	}

	return false
}

func updateNetworkEnvFile(stack *portainer.Stack) error {
	envFilePath := path.Join(stack.ProjectPath, ".env")
	stackFilePath := path.Join(stack.ProjectPath, "stack.env")
	if fileNotExist(envFilePath) {
		if fileNotExist(stackFilePath) {
			return nil
		}

		flags := os.O_WRONLY | os.O_SYNC | os.O_CREATE
		envFile, err := os.OpenFile(envFilePath, flags, 0666)
		if err != nil {
			return err
		}

		defer envFile.Close()

		stackFile, err := os.Open(stackFilePath)
		if err != nil {
			return err
		}

		defer stackFile.Close()

		_, err = io.Copy(envFile, stackFile)
		return err
	}

	return nil
}

func createNetworkEnvFile(stack *portainer.Stack) error {
	networkNameSet := NewStringSet()

	for _, filePath := range stackutils.GetStackFilePaths(stack) {
		networkNames, err := extractNetworkNames(filePath)
		if err != nil {
			return errors.Wrap(err, "failed to extract network name")
		}

		if networkNames == nil || networkNames.Len() == 0 {
			continue
		}

		networkNameSet.Union(networkNames)
	}

	for _, s := range networkNameSet.List() {
		if _, ok := os.LookupEnv(s); ok {
			networkNameSet.Remove(s)
		}
	}

	if networkNameSet.Len() == 0 && stack.Env == nil {
		return nil
	}

	envfile, err := os.OpenFile(path.Join(stack.ProjectPath, ".env"),
		os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return errors.Wrap(err, "failed to open env file")
	}

	defer envfile.Close()

	var scanEnvSettingFunc = func(name string) (string, bool) {
		if stack.Env != nil {
			for _, v := range stack.Env {
				if name == v.Name {
					return v.Value, true
				}
			}
		}

		return "", false
	}

	for _, s := range networkNameSet.List() {
		if _, ok := scanEnvSettingFunc(s); !ok {
			stack.Env = append(stack.Env, portainer.Pair{
				Name:  s,
				Value: "None",
			})
		}
	}

	if stack.Env != nil {
		for _, v := range stack.Env {
			envfile.WriteString(
				fmt.Sprintf("%s=%s\n", v.Name, v.Value))
		}
	}

	return nil
}

func extractNetworkNames(filePath string) (StringSet, error) {
	if info, err := os.Stat(filePath); errors.Is(err,
		os.ErrNotExist) || info.IsDir() {
		return nil, nil
	}

	stackFileContent, err := os.ReadFile(filePath)
	if err != nil {
		return nil, errors.Wrap(err, "failed to open yaml file")
	}

	config, err := loader.ParseYAML(stackFileContent)
	if err != nil {
		// invalid stack file
		return nil, errors.Wrap(err, "invalid stack file")
	}

	var version string
	if _, ok := config["version"]; ok {
		version, _ = config["version"].(string)
	}

	var networks map[string]interface{}
	if value, ok := config["networks"]; ok {
		if value == nil {
			return nil, nil
		}

		if networks, ok = value.(map[string]interface{}); !ok {
			return nil, nil
		}
	} else {
		return nil, nil
	}

	networkContent, err := loader.LoadNetworks(networks, version)
	if err != nil {
		return nil, nil // skip the error
	}

	re := regexp.MustCompile(`^\$\{?([^\}]+)\}?$`)
	networkNames := NewStringSet()

	for _, v := range networkContent {
		matched := re.FindAllStringSubmatch(v.Name, -1)
		if matched != nil && matched[0] != nil {
			if strings.Contains(matched[0][1], ":-") {
				continue
			}

			if strings.Contains(matched[0][1], "?") {
				continue
			}

			if strings.Contains(matched[0][1], "-") {
				continue
			}

			networkNames.Add(matched[0][1])
		}
	}

	if networkNames.Len() == 0 {
		return nil, nil
	}

	return networkNames, nil
}
