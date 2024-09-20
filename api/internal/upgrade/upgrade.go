package upgrade

import (
	"fmt"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/platform"
	"github.com/portainer/portainer/pkg/libstack"
)

const (
	// mustacheUpgradeDockerTemplateFile represents the name of the template file for the docker upgrade
	mustacheUpgradeDockerTemplateFile = "upgrade-docker.yml.mustache"

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
	Upgrade(environment *portainer.Endpoint, licenseKey string) error
}

type service struct {
	composeDeployer         libstack.Deployer
	kubernetesClientFactory *cli.ClientFactory

	isUpdating bool
	platform   platform.ContainerPlatform

	assetsPath string
}

func NewService(
	assetsPath string,
	composeDeployer libstack.Deployer,
	kubernetesClientFactory *cli.ClientFactory,
) (Service, error) {
	platform, err := platform.DetermineContainerPlatform()
	if err != nil {
		return nil, errors.Wrap(err, "failed to determine container platform")
	}

	return &service{
		assetsPath:              assetsPath,
		composeDeployer:         composeDeployer,
		kubernetesClientFactory: kubernetesClientFactory,
		platform:                platform,
	}, nil
}

func (service *service) Upgrade(environment *portainer.Endpoint, licenseKey string) error {
	service.isUpdating = true

	switch service.platform {
	case platform.PlatformDockerStandalone:
		return service.upgradeDocker(licenseKey, portainer.APIVersion, "standalone")
	case platform.PlatformDockerSwarm:
		return service.upgradeDocker(licenseKey, portainer.APIVersion, "swarm")
	case platform.PlatformKubernetes:
		return service.upgradeKubernetes(environment, licenseKey, portainer.APIVersion)
	}

	return fmt.Errorf("unsupported platform %s", service.platform)
}
