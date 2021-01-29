package exec

import (
	"bytes"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"os/exec"
	"path"
	"runtime"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"
)

// KubernetesDeployer represents a service to deploy resources inside a Kubernetes environment.
type KubernetesDeployer struct {
	binaryPath           string
	dataStore            portainer.DataStore
	reverseTunnelService portainer.ReverseTunnelService
	signatureService     portainer.DigitalSignatureService
}

// NewKubernetesDeployer initializes a new KubernetesDeployer service.
func NewKubernetesDeployer(datastore portainer.DataStore, reverseTunnelService portainer.ReverseTunnelService, signatureService portainer.DigitalSignatureService, binaryPath string) *KubernetesDeployer {
	return &KubernetesDeployer{
		binaryPath:           binaryPath,
		dataStore:            datastore,
		reverseTunnelService: reverseTunnelService,
		signatureService:     signatureService,
	}
}

// Deploy will deploy a Kubernetes manifest inside a specific namespace in a Kubernetes endpoint.
// Otherwise it will use kubectl to deploy the manifest.
func (deployer *KubernetesDeployer) Deploy(endpoint *portainer.Endpoint, stackConfig string, namespace string) (string, error) {
	endpointURL := endpoint.URL
	if endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment {
		tunnel := deployer.reverseTunnelService.GetTunnelDetails(endpoint.ID)
		if tunnel.Status == portainer.EdgeAgentIdle {

			err := deployer.reverseTunnelService.SetTunnelStatusToRequired(endpoint.ID)
			if err != nil {
				return "", err
			}

			settings, err := deployer.dataStore.Settings().Settings()
			if err != nil {
				return "", err
			}

			waitForAgentToConnect := time.Duration(settings.EdgeAgentCheckinInterval) * time.Second
			time.Sleep(waitForAgentToConnect * 2)
		}

		endpointURL = fmt.Sprintf("http://127.0.0.1:%d", tunnel.Port)
	}

	if !strings.HasPrefix(endpointURL, "http") {
		endpointURL = fmt.Sprintf("https://%s", endpointURL)
	}

	endpointURL = endpointURL + "/kubernetes"

	token, err := ioutil.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/token")
	if err != nil {
		return "", err
	}

	command := path.Join(deployer.binaryPath, "kubectl")
	if runtime.GOOS == "windows" {
		command = path.Join(deployer.binaryPath, "kubectl.exe")
	}

	args := make([]string, 0)
	args = append(args, "-v", "8")
	args = append(args, "--server", endpointURL)
	args = append(args, "--insecure-skip-tls-verify")
	args = append(args, "--token", string(token))
	args = append(args, "--namespace", namespace)
	// args = append(args, "--certificate-authority", endpoint.TLSConfig.TLSCACertPath)
	// args = append(args, "--client-certificate", endpoint.TLSConfig.TLSCertPath)
	// args = append(args, "--client-key", endpoint.TLSConfig.TLSKeyPath)
	args = append(args, "apply", "-f", "-")

	var stderr bytes.Buffer
	cmd := exec.Command(command, args...)
	cmd.Stderr = &stderr
	cmd.Stdin = strings.NewReader(stackConfig)

	log.Printf("executing %s", cmd.String())

	output, err := cmd.Output()
	if err != nil {
		return "", errors.New(stderr.String())
	}

	return string(output), nil
}

// ConvertCompose leverages the kompose binary to deploy a compose compliant manifest.
func (deployer *KubernetesDeployer) ConvertCompose(data string) ([]byte, error) {
	command := path.Join(deployer.binaryPath, "kompose")
	if runtime.GOOS == "windows" {
		command = path.Join(deployer.binaryPath, "kompose.exe")
	}

	args := make([]string, 0)
	args = append(args, "convert", "-f", "-", "--stdout")

	var stderr bytes.Buffer
	cmd := exec.Command(command, args...)
	cmd.Stderr = &stderr
	cmd.Stdin = strings.NewReader(data)

	output, err := cmd.Output()
	if err != nil {
		return nil, errors.New(stderr.String())
	}

	return output, nil
}
