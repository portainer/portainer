package upgrade

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"time"

	"github.com/cbroglie/mustache"
	"github.com/pkg/errors"
	libstack "github.com/portainer/docker-compose-wrapper"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/platform"
	"github.com/rs/zerolog/log"
)

const (
	// mustacheUpgradeStandaloneTemplateFile represents the name of the template file for the standalone upgrade
	mustacheUpgradeStandaloneTemplateFile = "upgrade-standalone.yml.mustache"

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
	Upgrade(licenseKey string) error
}

type service struct {
	composeDeployer libstack.Deployer
	isUpdating      bool
	platform        platform.ContainerPlatform
	assetsPath      string
}

func NewService(assetsPath string, composeDeployer libstack.Deployer) (Service, error) {
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

func (service *service) Upgrade(licenseKey string) error {
	service.isUpdating = true

	switch service.platform {
	case platform.PlatformDockerStandalone:
		return service.UpgradeDockerStandalone(licenseKey, portainer.APIVersion)
		// case platform.PlatformDockerSwarm:
		// case platform.PlatformKubernetes:
		// case platform.PlatformPodman:
		// case platform.PlatformNomad:
		// 	default:
	}

	return errors.New("unsupported platform")
}

func (service *service) UpgradeDockerStandalone(licenseKey, version string) error {
	templateName := filesystem.JoinPaths(service.assetsPath, "mustache-templates", mustacheUpgradeStandaloneTemplateFile)

	portainerImagePrefix := os.Getenv(portainerImagePrefixEnvVar)
	if portainerImagePrefix == "" {
		portainerImagePrefix = "portainer/portainer-ee"
	}

	image := fmt.Sprintf("%s:%s", portainerImagePrefix, version)

	skipPullImage := os.Getenv(skipPullImageEnvVar)

	composeFile, err := mustache.RenderFile(templateName, map[string]string{
		"image":           image,
		"skip_pull_image": skipPullImage,
		"updater_image":   os.Getenv(updaterImageEnvVar),
		"license":         licenseKey,
	})

	log.Debug().
		Str("composeFile", composeFile).
		Msg("Compose file for upgrade")

	if err != nil {
		return errors.Wrap(err, "failed to render upgrade template")
	}

	tmpDir := os.TempDir()
	filePath := filesystem.JoinPaths(tmpDir, fmt.Sprintf("upgrade-%d.yml", time.Now().Unix()))

	r := bytes.NewReader([]byte(composeFile))

	err = filesystem.CreateFile(filePath, r)
	if err != nil {
		return errors.Wrap(err, "failed to create upgrade compose file")
	}

	err = service.composeDeployer.Deploy(
		context.Background(),
		[]string{filePath},
		libstack.DeployOptions{
			ForceRecreate:        true,
			AbortOnContainerExit: true,
		},
	)

	if err != nil {
		return errors.Wrap(err, "failed to deploy upgrade stack")
	}

	return nil
}
