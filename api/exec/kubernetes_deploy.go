package exec

import (
	"bytes"
	"errors"
	"io/ioutil"
	"os/exec"
	"path"
	"runtime"
	"strings"

	portainer "github.com/portainer/portainer/api"
)

// KubernetesDeployer represents a service to deploy resources inside a Kubernetes environment.
type KubernetesDeployer struct {
	binaryPath string
}

// NewKubernetesDeployer initializes a new KubernetesDeployer service.
func NewKubernetesDeployer(binaryPath string) *KubernetesDeployer {
	return &KubernetesDeployer{
		binaryPath: binaryPath,
	}
}

// Deploy will deploy a Kubernetes manifest inside a specific namespace in a Kubernetes endpoint.
// If composeFormat is set to true, it will leverage the kompose binary to deploy a compose compliant manifest.
// Otherwise it will use kubectl to deploy the manifest.
func (deployer *KubernetesDeployer) Deploy(endpoint *portainer.Endpoint, data string, composeFormat bool, namespace string) ([]byte, error) {
	if composeFormat {
		convertedData, err := deployer.ConvertCompose(data)
		if err != nil {
			return nil, err
		}
		data = string(convertedData)
	}

	token, err := ioutil.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/token")
	if err != nil {
		return nil, err
	}

	command := path.Join(deployer.binaryPath, "kubectl")
	if runtime.GOOS == "windows" {
		command = path.Join(deployer.binaryPath, "kubectl.exe")
	}

	args := make([]string, 0)
	args = append(args, "--server", endpoint.URL)
	args = append(args, "--insecure-skip-tls-verify")
	args = append(args, "--token", string(token))
	args = append(args, "--namespace", namespace)
	args = append(args, "apply", "-f", "-")

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
