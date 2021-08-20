package helm

import (
	"bytes"
	"fmt"
	"os/exec"
	"path"
	"runtime"
	"strings"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/exec/helm/release"
	"github.com/portainer/portainer/api/kubernetes"
	log "github.com/sirupsen/logrus"
)

// HelmPackageManager represents a service that interfaces with Helm
type HelmPackageManager interface {
	Install(installOpts InstallOptions, endpointId portainer.EndpointID, authToken string) (*release.Release, error)
	Show(showOpts ShowOptions) (string, error)
	SearchRepo(searchOpts SearchRepoOptions) (string, error)
}

// helmBinaryPackageManager is a wrapper for the helm binary which implements HelmPackageManager
type helmBinaryPackageManager struct {
	kubeConfigService kubernetes.KubeConfigService
	binaryPath        string
}

// NewHelmBinaryPackageManager initializes a new HelmPackageManager service.
func NewHelmBinaryPackageManager(kubeConfigService kubernetes.KubeConfigService, binaryPath string) *helmBinaryPackageManager {
	return &helmBinaryPackageManager{
		kubeConfigService: kubeConfigService,
		binaryPath:        binaryPath,
	}
}

// runWithKubeConfig will execute run against the provided Kubernetes cluster with kubeconfig as cli arguments.
func (hbpm *helmBinaryPackageManager) runWithKubeConfig(command string, args []string, endpointId portainer.EndpointID, authToken string) (string, error) {
	cmdArgs := make([]string, 0)
	if hbpm.kubeConfigService.IsSecure() {
		clusterAccess := hbpm.kubeConfigService.GetKubeConfigInternal(endpointId, authToken)
		cmdArgs = append(cmdArgs, "--kube-apiserver", clusterAccess.ClusterServerURL)
		cmdArgs = append(cmdArgs, "--kube-token", clusterAccess.AuthToken)
		cmdArgs = append(cmdArgs, "--kube-ca-file", clusterAccess.CertificateAuthorityFile)
	}
	cmdArgs = append(cmdArgs, args...)
	return hbpm.run(command, cmdArgs)
}

// run will execute helm command against the provided Kubernetes cluster.
// The endpointId and authToken are dynamic params (based on the user) that allow helm to execute commands
// in the context of the current user against specified k8s cluster.
func (hbpm *helmBinaryPackageManager) run(command string, args []string) (string, error) {
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

	log.Debug(fmt.Sprintf("executing helm command: %s %s", helmPath, strings.Join(cmdArgs, " ")))

	output, err := cmd.Output()
	if err != nil {
		log.Println("Failed:", err.Error())
		return "", errors.Wrap(err, stderr.String())
	}

	return string(output), nil
}
