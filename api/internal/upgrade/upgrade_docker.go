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
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/stackbuilders"

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

	composeFile, err := mustache.RenderFile(templateName, map[string]string{
		"image":           image,
		"skip_pull_image": skipPullImageEnv,
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

	composeStackBuilder := stackbuilders.CreateComposeStackFileContentBuilder(
		&security.RestrictedRequestContext{IsAdmin: true},
		service.dataStore,
		service.fileService,
		service.stackDeployer,
	)
	stackBuilderDirector := stackbuilders.NewStackBuilderDirector(composeStackBuilder)

	timeId := time.Now().Unix()

	projectName := fmt.Sprintf(
		"portainer-upgrade-%d-%s",
		timeId,
		strings.ReplaceAll(version, ".", "-"),
	)

	_, httpErr := stackBuilderDirector.Build(&stackbuilders.StackPayload{
		Name:             projectName,
		StackFileContent: composeFile,
		ComposeFormat:    true,
	}, environment)
	if httpErr != nil {
		return errors.Wrap(httpErr.Err, "failed to deploy upgrade stack")
	}

	return errors.New("upgrade failed: server should have been restarted by the updater")
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
