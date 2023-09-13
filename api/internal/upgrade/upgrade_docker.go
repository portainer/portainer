package upgrade

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/pkg/libstack"

	"github.com/cbroglie/mustache"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

func (service *service) upgradeDocker(licenseKey, version, envType string) error {
	ctx := context.TODO()
	templateName := filesystem.JoinPaths(service.assetsPath, "mustache-templates", mustacheUpgradeDockerTemplateFile)

	portainerImagePrefix := os.Getenv(portainerImagePrefixEnvVar)
	if portainerImagePrefix == "" {
		portainerImagePrefix = "portainer/portainer-ee"
	}

	image := fmt.Sprintf("%s:%s", portainerImagePrefix, version)

	skipPullImage := os.Getenv(skipPullImageEnvVar)

	if err := service.checkImageForDocker(ctx, image, skipPullImage != ""); err != nil {
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
		strings.ReplaceAll(version, ".", "-"))

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

func (service *service) checkImageForDocker(ctx context.Context, image string, skipPullImage bool) error {
	cli, err := client.NewClientWithOpts(
		client.FromEnv,
		client.WithAPIVersionNegotiation(),
	)
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
