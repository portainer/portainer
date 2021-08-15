package helm

import (
	"bytes"
	// "errors"
	"fmt"
	"log"
	"os/exec"
	"path"
	"runtime"
	"strings"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/api/exec/helm/release"
	"github.com/portainer/portainer/api/kubernetes"
)

// HelmPackageManager represents a service that interfaces with Helm
type HelmPackageManager interface {
	Run(command string, args []string, serverURL, authToken string) (string, error) // TODO remove
	Install(installOpts InstallOptions, serverURL, authToken string) (*release.Release, error)
	Show(showOpts ShowOptions) (string, error)
	SearchRepo(searchOpts SearchRepoOptions) (string, error)
}

// helmBinaryPackageManager is a wrapper for the helm binary which implements HelmPackageManager
type helmBinaryPackageManager struct {
	kubeConfigService kubernetes.KubeConfigService
	binaryPath        string
}

// NewHelmBinaryPackageManager initializes a new HelmPackageManager service.
func NewHelmBinaryPackageManager(kubeConfigService kubernetes.KubeConfigService, binaryPath string) HelmPackageManager {
	return &helmBinaryPackageManager{
		kubeConfigService: kubeConfigService,
		binaryPath:        binaryPath,
	}
}

// Run will execute helm command against the provided Kubernetes cluster.
// The serverURL and authToken are dynamic params (based on the user) that allow helm to execute commands
// in the context of the current user against specified k8s cluster.
func (hbpm *helmBinaryPackageManager) Run(command string, args []string, serverURL, authToken string) (string, error) {
	helmPath := path.Join(hbpm.binaryPath, "helm")
	if runtime.GOOS == "windows" {
		helmPath = path.Join(hbpm.binaryPath, "helm.exe")
	}

	clusterAccess := hbpm.kubeConfigService.GetKubeConfigCore(serverURL, authToken)

	cmdArgs := make([]string, 0)
	if hbpm.kubeConfigService.IsSecure() {
		cmdArgs = append(cmdArgs, "--kube-apiserver", clusterAccess.ClusterServerURL)
		cmdArgs = append(cmdArgs, "--kube-token", clusterAccess.AuthToken)
		cmdArgs = append(cmdArgs, "--kube-ca-file", clusterAccess.CertificateAuthorityFile)
	}
	cmdArgs = append(cmdArgs, command)
	cmdArgs = append(cmdArgs, args...)

	log.Printf("[DEBUG] [internal,helm] [message: executing helm command: %s]", fmt.Sprintf("%s %s", helmPath, strings.Join(cmdArgs, " ")))

	var stderr bytes.Buffer
	cmd := exec.Command(helmPath, cmdArgs...)
	cmd.Stderr = &stderr

	output, err := cmd.Output()
	if err != nil {
		log.Println("Failed:", err.Error())
		return "", errors.Wrap(err, stderr.String())
	}

	return string(output), nil
}
