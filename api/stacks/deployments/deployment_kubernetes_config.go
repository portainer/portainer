package deployments

import (
	"fmt"
	"io/ioutil"
	"os"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	k "github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/api/stacks/stackutils"
)

type KubernetesStackDeploymentConfig struct {
	filePaths         []string
	stack             *portainer.Stack
	kuberneteDeployer portainer.KubernetesDeployer
	user              *portainer.User
	endpoint          *portainer.Endpoint
	output            string
}

func CreateKubernetesStackDeploymentConfig(stack *portainer.Stack, kubeDeployer portainer.KubernetesDeployer, appLabels k.KubeAppLabels, user *portainer.User, endpoint *portainer.Endpoint) (*KubernetesStackDeploymentConfig, func(), error) {
	fileNames := stackutils.GetStackFilePaths(stack, false)

	manifestFilePaths := make([]string, len(fileNames))

	tmpDir, err := ioutil.TempDir("", "kub_deployment")
	if err != nil {
		return nil, nil, errors.Wrap(err, "failed to create temp kub deployment directory")
	}

	cleanup := func() {
		os.RemoveAll(tmpDir)
	}

	for _, fileName := range fileNames {
		manifestFilePath := filesystem.JoinPaths(tmpDir, fileName)
		manifestContent, err := ioutil.ReadFile(filesystem.JoinPaths(stack.ProjectPath, fileName))
		if err != nil {
			return nil, cleanup, errors.Wrap(err, "failed to read manifest file")
		}

		if stack.IsComposeFormat {
			manifestContent, err = kubeDeployer.ConvertCompose(manifestContent)
			if err != nil {
				return nil, cleanup, errors.Wrap(err, "failed to convert docker compose file to a kube manifest")
			}
		}

		manifestContent, err = k.AddAppLabels(manifestContent, appLabels.ToMap())
		if err != nil {
			return nil, cleanup, errors.Wrap(err, "failed to add application labels")
		}

		err = filesystem.WriteToFile(manifestFilePath, []byte(manifestContent))
		if err != nil {
			return nil, cleanup, errors.Wrap(err, "failed to create temp manifest file")
		}

		manifestFilePaths = append(manifestFilePaths, manifestFilePath)
	}

	return &KubernetesStackDeploymentConfig{
		filePaths:         manifestFilePaths,
		stack:             stack,
		kuberneteDeployer: kubeDeployer,
		user:              user,
		endpoint:          endpoint,
	}, cleanup, nil
}

func (config *KubernetesStackDeploymentConfig) GetUsername() string {
	return config.user.Username
}

func (config *KubernetesStackDeploymentConfig) Deploy() error {

	output, err := config.kuberneteDeployer.Deploy(config.user.ID, config.endpoint, config.filePaths, config.stack.Namespace)
	if err != nil {
		return fmt.Errorf("failed to deploy kubernete stack: %w", err)
	}

	config.output = output
	return nil
}

func (config *KubernetesStackDeploymentConfig) GetResponse() string {
	return config.output
}
