package stackutils

import (
	"fmt"
	"io/ioutil"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	k "github.com/portainer/portainer/api/kubernetes"
)

// ResourceControlID returns the stack resource control id
func ResourceControlID(endpointID portainer.EndpointID, name string) string {
	return fmt.Sprintf("%d_%s", endpointID, name)
}

// GetStackFilePaths returns a list of file paths based on stack project path
func GetStackFilePaths(stack *portainer.Stack) []string {
	var filePaths []string
	for _, file := range append([]string{stack.EntryPoint}, stack.AdditionalFiles...) {
		filePaths = append(filePaths, filesystem.JoinPaths(stack.ProjectPath, file))
	}
	return filePaths
}

// CreateTempK8SDeploymentFiles reads manifest files from original stack project path
// then add app labels into the file contents and create temp files for deployment
// return temp file paths and temp dir
func CreateTempK8SDeploymentFiles(stack *portainer.Stack, kubeDeployer portainer.KubernetesDeployer, appLabels k.KubeAppLabels) ([]string, string, error) {
	fileNames := append([]string{stack.EntryPoint}, stack.AdditionalFiles...)
	var manifestFilePaths []string
	tmpDir, err := ioutil.TempDir("", "kub_deployment")
	if err != nil {
		return nil, "", errors.Wrap(err, "failed to create temp kub deployment directory")
	}

	for _, fileName := range fileNames {
		manifestFilePath := filesystem.JoinPaths(tmpDir, fileName)
		manifestContent, err := ioutil.ReadFile(filesystem.JoinPaths(stack.ProjectPath, fileName))
		if err != nil {
			return nil, "", errors.Wrap(err, "failed to read manifest file")
		}
		if stack.IsComposeFormat {
			manifestContent, err = kubeDeployer.ConvertCompose(manifestContent)
			if err != nil {
				return nil, "", errors.Wrap(err, "failed to convert docker compose file to a kube manifest")
			}
		}
		manifestContent, err = k.AddAppLabels(manifestContent, appLabels.ToMap())
		if err != nil {
			return nil, "", errors.Wrap(err, "failed to add application labels")
		}
		err = filesystem.WriteToFile(manifestFilePath, []byte(manifestContent))
		if err != nil {
			return nil, "", errors.Wrap(err, "failed to create temp manifest file")
		}
		manifestFilePaths = append(manifestFilePaths, manifestFilePath)
	}
	return manifestFilePaths, tmpDir, nil
}
