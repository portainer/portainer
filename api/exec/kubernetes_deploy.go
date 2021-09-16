package exec

import (
	"bytes"
	"fmt"
	"os/exec"
	"path"
	"runtime"
	"strings"

	"github.com/pkg/errors"

	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/http/proxy/factory"
	"github.com/portainer/portainer/api/http/proxy/factory/kubernetes"
	"github.com/portainer/portainer/api/kubernetes/cli"

	portainer "github.com/portainer/portainer/api"
)

// KubernetesDeployer represents a service to deploy resources inside a Kubernetes environment.
type KubernetesDeployer struct {
	binaryPath                  string
	dataStore                   portainer.DataStore
	reverseTunnelService        portainer.ReverseTunnelService
	signatureService            portainer.DigitalSignatureService
	kubernetesClientFactory     *cli.ClientFactory
	kubernetesTokenCacheManager *kubernetes.TokenCacheManager
	proxyManager                *proxy.Manager
}

// NewKubernetesDeployer initializes a new KubernetesDeployer service.
func NewKubernetesDeployer(kubernetesTokenCacheManager *kubernetes.TokenCacheManager, kubernetesClientFactory *cli.ClientFactory, datastore portainer.DataStore, reverseTunnelService portainer.ReverseTunnelService, signatureService portainer.DigitalSignatureService, proxyManager *proxy.Manager, binaryPath string) *KubernetesDeployer {
	return &KubernetesDeployer{
		binaryPath:                  binaryPath,
		dataStore:                   datastore,
		reverseTunnelService:        reverseTunnelService,
		signatureService:            signatureService,
		kubernetesClientFactory:     kubernetesClientFactory,
		kubernetesTokenCacheManager: kubernetesTokenCacheManager,
		proxyManager:                proxyManager,
	}
}

func (deployer *KubernetesDeployer) getToken(userID portainer.UserID, endpoint *portainer.Endpoint, setLocalAdminToken bool) (string, error) {
	kubeCLI, err := deployer.kubernetesClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return "", err
	}

	tokenCache := deployer.kubernetesTokenCacheManager.GetOrCreateTokenCache(int(endpoint.ID))

	tokenManager, err := kubernetes.NewTokenManager(kubeCLI, deployer.dataStore, tokenCache, setLocalAdminToken)
	if err != nil {
		return "", err
	}

	user, err := deployer.dataStore.User().User(userID)
	if err != nil {
		return "", errors.Wrap(err, "failed to fetch the user")
	}

	if user.Role == portainer.AdministratorRole {
		return tokenManager.GetAdminServiceAccountToken(), nil
	}

	token, err := tokenManager.GetUserServiceAccountToken(int(user.ID), endpoint.ID)
	if err != nil {
		return "", err
	}

	if token == "" {
		return "", fmt.Errorf("can not get a valid user service account token")
	}
	return token, nil
}

// Deploy will deploy Kubernetes manifest(s) inside a specific namespace in a Kubernetes endpoint.
// Otherwise it will use kubectl to deploy the manifest.
func (deployer *KubernetesDeployer) Deploy(userID portainer.UserID, endpoint *portainer.Endpoint, manifestFiles []string, namespace string) (string, error) {
	token, err := deployer.getToken(userID, endpoint, endpoint.Type == portainer.KubernetesLocalEnvironment)
	if err != nil {
		return "", err
	}

	command := path.Join(deployer.binaryPath, "kubectl")
	if runtime.GOOS == "windows" {
		command = path.Join(deployer.binaryPath, "kubectl.exe")
	}

	args, proxy, err := deployer.initCommandArgsAndProxy(token, endpoint, namespace)
	if err != nil {
		return "", errors.Wrap(err, "failed to compose kubectl args")
	}
	if proxy != nil {
		defer proxy.Close()
	}

	var fileArgs []string
	for _, path := range manifestFiles {
		fileArgs = append(fileArgs, "-f")
		fileArgs = append(fileArgs, strings.TrimSpace(path))
	}
	args = append(args, "apply")
	args = append(args, fileArgs...)

	var stderr bytes.Buffer
	cmd := exec.Command(command, args...)
	cmd.Stderr = &stderr

	output, err := cmd.Output()
	if err != nil {
		return "", errors.Wrapf(err, "failed to execute kubectl command: %q", stderr.String())
	}

	return string(output), nil
}

// Remove will delete a Kubernetes manifest(s) with kubectl
func (deployer *KubernetesDeployer) Remove(userID portainer.UserID, endpoint *portainer.Endpoint, manifestFiles []string, namespace string) (string, error) {
	token, err := deployer.getToken(userID, endpoint, endpoint.Type == portainer.KubernetesLocalEnvironment)
	if err != nil {
		return "", err
	}

	command := path.Join(deployer.binaryPath, "kubectl")
	if runtime.GOOS == "windows" {
		command = path.Join(deployer.binaryPath, "kubectl.exe")
	}

	args, proxy, err := deployer.initCommandArgsAndProxy(token, endpoint, namespace)
	if err != nil {
		return "", errors.Wrap(err, "failed to compose kubectl args")
	}
	if proxy != nil {
		defer proxy.Close()
	}

	var fileArgs []string
	for _, path := range manifestFiles {
		fileArgs = append(fileArgs, "-f")
		fileArgs = append(fileArgs, strings.TrimSpace(path))
	}
	args = append(args, "delete")
	args = append(args, fileArgs...)

	var stderr bytes.Buffer
	cmd := exec.Command(command, args...)
	cmd.Stderr = &stderr

	output, err := cmd.Output()
	if err != nil {
		return "", errors.Wrapf(err, "failed to execute kubectl command: %q", stderr.String())
	}

	return string(output), nil
}

// ConvertCompose leverages the kompose binary to deploy a compose compliant manifest.
func (deployer *KubernetesDeployer) ConvertCompose(data []byte) ([]byte, error) {
	command := path.Join(deployer.binaryPath, "kompose")
	if runtime.GOOS == "windows" {
		command = path.Join(deployer.binaryPath, "kompose.exe")
	}

	args := make([]string, 0)
	args = append(args, "convert", "-f", "-", "--stdout")

	var stderr bytes.Buffer
	cmd := exec.Command(command, args...)
	cmd.Stderr = &stderr
	cmd.Stdin = bytes.NewReader(data)

	output, err := cmd.Output()
	if err != nil {
		return nil, errors.New(stderr.String())
	}

	return output, nil
}

func (deployer *KubernetesDeployer) getAgentURL(endpoint *portainer.Endpoint) (string, *factory.ProxyServer, error) {
	proxy, err := deployer.proxyManager.CreateAgentProxyServer(endpoint)
	if err != nil {
		return "", nil, err
	}

	return fmt.Sprintf("http://127.0.0.1:%d/kubernetes", proxy.Port), proxy, nil
}

func (deployer *KubernetesDeployer) initCommandArgsAndProxy(token string, endpoint *portainer.Endpoint, namespace string) ([]string, *factory.ProxyServer, error) {

	args := make([]string, 0)

	var proxy *factory.ProxyServer

	if endpoint.Type == portainer.AgentOnKubernetesEnvironment || endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment {
		var url string
		var err error
		url, proxy, err = deployer.getAgentURL(endpoint)
		if err != nil {
			return nil, nil, errors.WithMessage(err, "failed generating endpoint URL")
		}
		args = append(args, "--server", url)
		args = append(args, "--insecure-skip-tls-verify")
	}

	args = append(args, "--token", token)
	args = append(args, "--namespace", namespace)

	return args, proxy, nil
}
