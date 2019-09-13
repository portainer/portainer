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

// TODO: add kompose parameter to trigger a convert
func (deployer *KubernetesDeployer) Deploy(endpoint *portainer.Endpoint, data string) ([]byte, error) {
	// TODO: relocate
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
