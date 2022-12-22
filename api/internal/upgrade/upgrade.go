package upgrade

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/cbroglie/mustache"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
	"github.com/pkg/errors"
	libstack "github.com/portainer/docker-compose-wrapper"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/platform"
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
	Upgrade(licenseKey string) error
}

type service struct {
	composeDeployer libstack.Deployer
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

func (service *service) Upgrade(licenseKey string) error {
	service.isUpdating = true

	switch service.platform {
	case platform.PlatformDockerStandalone:
		return service.upgradeDocker(licenseKey, portainer.APIVersion, "standalone")
	case platform.PlatformDockerSwarm:
		return service.upgradeDocker(licenseKey, portainer.APIVersion, "swarm")
		// case platform.PlatformKubernetes:
		// case platform.PlatformPodman:
		// case platform.PlatformNomad:
		// 	default:
	}

	return fmt.Errorf("unsupported platform %s", service.platform)
}

func (service *service) upgradeDocker(licenseKey, version, envType string) error {
	ctx := context.TODO()
	templateName := filesystem.JoinPaths(service.assetsPath, "mustache-templates", mustacheUpgradeDockerTemplateFile)

	portainerImagePrefix := os.Getenv(portainerImagePrefixEnvVar)
	if portainerImagePrefix == "" {
		portainerImagePrefix = "portainer/portainer-ee"
	}

	image := fmt.Sprintf("%s:%s", portainerImagePrefix, version)

	skipPullImage := os.Getenv(skipPullImageEnvVar)

	if err := service.checkImage(ctx, image, skipPullImage != ""); err != nil {
		return err
	}

	composeFile, err := mustache.RenderFile(templateName, map[string]string{
		"image":           image,
		"skip_pull_image": skipPullImage,
		"updater_image":   os.Getenv(updaterImageEnvVar),
		"license":         licenseKey,
		"envType":         envType,
	})

	log.Debug().
		Str("composeFile", composeFile).
		Msg("Compose file for upgrade")

	if err != nil {
		return errors.Wrap(err, "failed to render upgrade template")
	}

	tmpDir := os.TempDir()
	timeId := time.Now().Unix()
	filePath := filesystem.JoinPaths(tmpDir, fmt.Sprintf("upgrade-%d.yml", timeId))

	r := bytes.NewReader([]byte(composeFile))

	err = filesystem.CreateFile(filePath, r)
	if err != nil {
		return errors.Wrap(err, "failed to create upgrade compose file")
	}

	projectName := fmt.Sprintf(
		"portainer-upgrade-%d-%s",
		timeId,
		strings.Replace(version, ".", "-", -1))

	err = service.composeDeployer.Deploy(
		ctx,
		[]string{filePath},
		libstack.DeployOptions{
			ForceRecreate:        true,
			AbortOnContainerExit: true,
			Options: libstack.Options{
				ProjectName: projectName,
			},
		},
	)

	// optimally, server was restarted by the updater, so we should not reach this point

	if err != nil {
		return errors.Wrap(err, "failed to deploy upgrade stack")
	}

	return errors.New("upgrade failed: server should have been restarted by the updater")
}

func (service *service) checkImage(ctx context.Context, image string, skipPullImage bool) error {
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		return errors.Wrap(err, "failed to create docker client")
	}

	if skipPullImage {
		filters := filters.NewArgs()
		filters.Add("reference", image)
		images, err := cli.ImageList(ctx, types.ImageListOptions{
			Filters: filters,
		})
		if err != nil {
			return errors.Wrap(err, "failed to list images")
		}

		if len(images) == 0 {
			return errors.Errorf("image %s not found locally", image)
		}

		return nil
	} else {
		// check if available on registry
		_, err := cli.DistributionInspect(ctx, image, "")
		if err != nil {
			return errors.Errorf("image %s not found on registry", image)
		}

		return nil
	}
}
