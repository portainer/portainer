package upgrade

import (
	"bytes"
	"fmt"
	"os"
	"time"

	"github.com/cbroglie/mustache"
	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/rs/zerolog/log"
)

func (service *service) upgradeKubernetes(userID portainer.UserID, environment *portainer.Endpoint, licenseKey, version string) error {
	// ctx := context.TODO()
	templateName := filesystem.JoinPaths(service.assetsPath, "mustache-templates", mustacheUpgradeKubernetesTemplateFile)

	portainerImagePrefix := os.Getenv(portainerImagePrefixEnvVar)
	if portainerImagePrefix == "" {
		portainerImagePrefix = "portainer/portainer-ee"
	}

	image := fmt.Sprintf("%s:%s", portainerImagePrefix, version)

	skipPullImage := os.Getenv(skipPullImageEnvVar)

	// if err := service.checkImage(ctx, image, skipPullImage != ""); err != nil {
	// 	return err
	// }

	manifest, err := mustache.RenderFile(templateName, map[string]string{
		"image":           image,
		"skip_pull_image": skipPullImage,
		"updater_image":   os.Getenv(updaterImageEnvVar),
		"license":         licenseKey,
		"envType":         "kubernetes",
	})

	log.Debug().
		Str("composeFile", manifest).
		Msg("Compose file for upgrade")

	if err != nil {
		return errors.Wrap(err, "failed to render upgrade template")
	}

	tmpDir := os.TempDir()
	timeId := time.Now().Unix()
	filePath := filesystem.JoinPaths(tmpDir, fmt.Sprintf("upgrade-%d.yml", timeId))

	r := bytes.NewReader([]byte(manifest))

	err = filesystem.CreateFile(filePath, r)
	if err != nil {
		return errors.Wrap(err, "failed to create upgrade compose file")
	}

	output, err := service.kubeDeployer.Deploy(
		userID, environment,
		[]string{filePath},
		"portainer",
	)

	log.Debug().
		Str("output", output).
		Msg("Upgrade output")

	// optimally, server was restarted by the updater, so we should not reach this point

	if err != nil {
		return errors.Wrap(err, "failed to deploy upgrade stack")
	}

	return errors.New("upgrade failed: server should have been restarted by the updater")
}
