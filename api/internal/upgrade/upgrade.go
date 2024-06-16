package upgrade

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"
	plf "github.com/portainer/portainer/api/platform"
	"github.com/portainer/portainer/pkg/libstack"
	"github.com/rs/zerolog/log"
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
	Upgrade(platform plf.ContainerPlatform, environment *portainer.Endpoint, licenseKey string) error
}

type service struct {
	composeDeployer           libstack.Deployer
	kubernetesClientFactory   *kubecli.ClientFactory
	dockerClientFactory       *dockerclient.ClientFactory
	dockerComposeStackManager portainer.ComposeStackManager

	isUpdating bool

	assetsPath string
}

func NewService(
	assetsPath string,
	composeDeployer libstack.Deployer,
	kubernetesClientFactory *kubecli.ClientFactory,
	dockerClientFactory *dockerclient.ClientFactory,
	dockerComposeStackManager portainer.ComposeStackManager,

) (Service, error) {

	return &service{
		assetsPath:                assetsPath,
		composeDeployer:           composeDeployer,
		kubernetesClientFactory:   kubernetesClientFactory,
		dockerClientFactory:       dockerClientFactory,
		dockerComposeStackManager: dockerComposeStackManager,
	}, nil
}

func (service *service) Upgrade(platform plf.ContainerPlatform, environment *portainer.Endpoint, licenseKey string) error {
	service.isUpdating = true
	log.Debug().
		Str("platform", string(platform)).
		Msg("Starting upgrade process")

	switch platform {
	case plf.PlatformDockerStandalone:
		return service.upgradeDocker(environment, licenseKey, portainer.APIVersion, "standalone")
	case plf.PlatformDockerSwarm:
		return service.upgradeDocker(environment, licenseKey, portainer.APIVersion, "swarm")
	case plf.PlatformKubernetes:
		return service.upgradeKubernetes(environment, licenseKey, portainer.APIVersion)
	}

	service.isUpdating = false
	return fmt.Errorf("unsupported platform %s", platform)
}
