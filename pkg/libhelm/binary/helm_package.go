package binary

import (
	"bytes"
	"os"
	"os/exec"
	"path"
	"runtime"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/options"
)

// helmBinaryPackageManager is a wrapper for the helm binary which implements HelmPackageManager
type helmBinaryPackageManager struct {
	binaryPath string
}

// NewHelmBinaryPackageManager initializes a new HelmPackageManager service.
func NewHelmBinaryPackageManager(binaryPath string) *helmBinaryPackageManager {
	return &helmBinaryPackageManager{binaryPath: binaryPath}
}

// runWithKubeConfig will execute run against the provided Kubernetes cluster with kubeconfig as cli arguments.
func (hbpm *helmBinaryPackageManager) runWithKubeConfig(command string, args []string, kca *options.KubernetesClusterAccess, env []string) ([]byte, error) {
	cmdArgs := make([]string, 0)
	if kca != nil {
		cmdArgs = append(cmdArgs, "--kube-apiserver", kca.ClusterServerURL)
		cmdArgs = append(cmdArgs, "--kube-token", kca.AuthToken)
		cmdArgs = append(cmdArgs, "--kube-ca-file", kca.CertificateAuthorityFile)
	}
	cmdArgs = append(cmdArgs, args...)
	return hbpm.run(command, cmdArgs, env)
}

// run will execute helm command against the provided Kubernetes cluster.
// The endpointId and authToken are dynamic params (based on the user) that allow helm to execute commands
// in the context of the current user against specified k8s cluster.
func (hbpm *helmBinaryPackageManager) run(command string, args []string, env []string) ([]byte, error) {
	cmdArgs := make([]string, 0)
	cmdArgs = append(cmdArgs, command)
	cmdArgs = append(cmdArgs, args...)

	helmPath := path.Join(hbpm.binaryPath, "helm")
	if runtime.GOOS == "windows" {
		helmPath = path.Join(hbpm.binaryPath, "helm.exe")
	}

	var stderr bytes.Buffer
	cmd := exec.Command(helmPath, cmdArgs...)
	cmd.Stderr = &stderr

	cmd.Env = os.Environ()
	cmd.Env = append(cmd.Env, env...)

	output, err := cmd.Output()
	if err != nil {
		return nil, errors.Wrap(err, stderr.String())
	}

	return output, nil
}
