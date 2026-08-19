package upgrade

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/image"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"

	"github.com/cbroglie/mustache"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

func (service *service) upgradeDocker(environment *portainer.Endpoint, licenseKey, version string, envType string) error {
	ctx := context.TODO()

	templateName := filesystem.JoinPaths(service.assetsPath, "mustache-templates", mustacheUpgradeDockerTemplateFile)

	portainerImagePrefix := os.Getenv(portainerImagePrefixEnvVar)
	if portainerImagePrefix == "" {
		portainerImagePrefix = "portainer/portainer-ee"
	}

	image := fmt.Sprintf("%s:%s", portainerImagePrefix, version)

	skipPullImageEnv := os.Getenv(skipPullImageEnvVar)
	skipPullImage := skipPullImageEnv != ""

	if err := service.checkImageForDocker(ctx, environment, image, skipPullImage); err != nil {
		return err
	}

	updaterImage := getUpdaterImage()

	composeFile, err := mustache.RenderFile(templateName, map[string]string{
		"image":           image,
		"skip_pull_image": skipPullImageEnv,
		"updater_image":   updaterImage,
		"license":         licenseKey,
		"envType":         envType,
	})

	log.Debug().
		Str("composeFile", composeFile).
		Msg("Compose file for upgrade")

	if err != nil {
		return errors.Wrap(err, "failed to render upgrade template")
	}

	timeId := time.Now().Unix()
	fileName := fmt.Sprintf("upgrade-%d.yml", timeId)

	filePath, err := service.fileService.StoreStackFileFromBytes("upgrade", fileName, []byte(composeFile))
	if err != nil {
		return errors.Wrap(err, "failed to create upgrade compose file")
	}

	projectName := fmt.Sprintf(
		"portainer-upgrade-%d-%s",
		timeId,
		strings.ReplaceAll(version, ".", "-"),
	)

	tempStack := &portainer.Stack{
		Name:        projectName,
		ProjectPath: filePath,
		EntryPoint:  fileName,
	}

	err = service.dockerComposeStackManager.Run(ctx, tempStack, environment, "updater", portainer.ComposeRunOptions{
		Remove:   true,
		Detached: true,
	})

	if err != nil {
		return errors.Wrap(err, "failed to deploy upgrade stack")
	}

	return nil
}

func (service *service) checkImageForDocker(ctx context.Context, environment *portainer.Endpoint, imageName string, skipPullImage bool) error {
	cli, err := service.dockerClientFactory.CreateClient(environment, "", nil)
	if err != nil {
		return errors.Wrap(err, "failed to create docker client")
	}

	if skipPullImage {
		filters := filters.NewArgs()
		filters.Add("reference", imageName)
		images, err := cli.ImageList(ctx, image.ListOptions{
			Filters: filters,
		})
		if err != nil {
			return errors.Wrap(err, "failed to list images")
		}

		if len(images) == 0 {
			return errors.Errorf("image %s not found locally", imageName)
		}

		return nil
	} else {
		// check if available on registry
		_, err := cli.DistributionInspect(ctx, imageName, "")
		if err != nil {
			return errors.Errorf("image %s not found on registry", imageName)
		}

		return nil
	}
}

func getUpdaterImage() string {
	updaterImage := os.Getenv(updaterImageEnvVar)
	if updaterImage == "" {
		updaterImage = "portainer/portainer-updater:" + portainer.APIVersion
	}
	return updaterImage
}
