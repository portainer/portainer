package upgrade

import (
	"fmt"

	"github.com/pkg/errors"
	libstack "github.com/portainer/docker-compose-wrapper"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/platform"
)

const (
	// mustacheUpgradeDockerTemplateFile represents the name of the template file for the docker upgrade
	mustacheUpgradeDockerTemplateFile = "upgrade-docker.yml.mustache"
	// mustacheUpgradeKubernetesTemplateFile represents the name of the template file for the kubernetes upgrade
	mustacheUpgradeKubernetesTemplateFile = "upgrade-kubernetes.yml.mustache"

	// portainerImagePrefixEnvVar represents the name of the environment variable used to define the image prefix for portainer-updater
	// useful if there's a need to test PR images
	portainerImagePrefixEnvVar = "UPGRADE_PORTAINER_IMAGE_PREFIX"
	// skipPullImageEnvVar represents the name of the environment variable used to define if the image pull should be skipped
	// useful if there's a need to test local images
	skipPullImageEnvVar = "UPGRADE_SKIP_PULL_PORTAINER_IMAGE"
	// updaterImageEnvVar represents the name of the environment variable used to define the updater image
	// useful if there's a need to test a different updater
	updaterImageEnvVar = "UPGRADE_UPDATER_IMAGE"
)

type Service interface {
	Upgrade(userID portainer.UserID, environment *portainer.Endpoint, licenseKey string) error
}

type service struct {
	composeDeployer libstack.Deployer
	kubeDeployer    portainer.KubernetesDeployer
	isUpdating      bool
	platform        platform.ContainerPlatform
	assetsPath      string
}

func NewService(
	assetsPath string,
	composeDeployer libstack.Deployer,
) (Service, error) {
	platform, err := platform.DetermineContainerPlatform()
	if err != nil {
		return nil, errors.Wrap(err, "failed to determine container platform")
	}

	return &service{
		assetsPath:      assetsPath,
		composeDeployer: composeDeployer,
		platform:        platform,
	}, nil
}

func (service *service) Upgrade(userID portainer.UserID, environment *portainer.Endpoint, licenseKey string) error {
	service.isUpdating = true

	switch service.platform {
	case platform.PlatformDockerStandalone:
		return service.upgradeDocker(licenseKey, portainer.APIVersion, "standalone")
	case platform.PlatformDockerSwarm:
		return service.upgradeDocker(licenseKey, portainer.APIVersion, "swarm")
	case platform.PlatformKubernetes:
		return service.upgradeKubernetes(userID, environment, licenseKey, portainer.APIVersion)
		// case platform.PlatformPodman:
		// case platform.PlatformNomad:
		// 	default:
	}

	return fmt.Errorf("unsupported platform %s", service.platform)
}
