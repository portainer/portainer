package platform

import (
	"context"
	"os"

	"github.com/docker/docker/client"
	"github.com/pkg/errors"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/rs/zerolog/log"
)

const (
	PodmanMode            = "PODMAN"
	KubernetesServiceHost = "KUBERNETES_SERVICE_HOST"
	NomadJobName          = "NOMAD_JOB_NAME"
)

// ContainerPlatform represent the platform on which the container is running (Docker, Kubernetes, Nomad)
type ContainerPlatform string

const (
	// PlatformDockerStandalone represent the Docker platform (Standalone)
	PlatformDockerStandalone = ContainerPlatform("Docker Standalone")
	// PlatformDockerSwarm represent the Docker platform (Swarm)
	PlatformDockerSwarm = ContainerPlatform("Docker Swarm")
	// PlatformKubernetes represent the Kubernetes platform
	PlatformKubernetes = ContainerPlatform("Kubernetes")
	// PlatformPodman represent the Podman platform (Standalone)
	PlatformPodman = ContainerPlatform("Podman")
	// PlatformNomad represent the Nomad platform (Standalone)
	PlatformNomad = ContainerPlatform("Nomad")
)

// DetermineContainerPlatform will check for the existence of the PODMAN_MODE
// or KUBERNETES_SERVICE_HOST environment variable to determine if
// the container is running on Podman or inside the Kubernetes platform.
// Defaults to Docker otherwise.
func DetermineContainerPlatform() (ContainerPlatform, error) {
	podmanModeEnvVar := os.Getenv(PodmanMode)
	if podmanModeEnvVar == "1" {
		return PlatformPodman, nil
	}

	serviceHostKubernetesEnvVar := os.Getenv(KubernetesServiceHost)
	if serviceHostKubernetesEnvVar != "" {
		return PlatformKubernetes, nil
	}

	nomadJobName := os.Getenv(NomadJobName)
	if nomadJobName != "" {
		return PlatformNomad, nil
	}

	if !isRunningInContainer() {
		return "", nil
	}

	dockerCli, err := dockerclient.CreateSimpleClient()
	if err != nil {
		return "", errors.WithMessage(err, "failed to create docker client")
	}
	defer dockerCli.Close()

	info, err := dockerCli.Info(context.Background())
	if err != nil {
		if client.IsErrConnectionFailed(err) {
			log.Warn().
				Err(err).
				Msg("failed to retrieve docker info")
			return "", nil
		}

		return "", errors.WithMessage(err, "failed to retrieve docker info")
	}

	if info.Swarm.NodeID == "" {
		return PlatformDockerStandalone, nil
	}

	return PlatformDockerSwarm, nil
}

// isRunningInContainer returns true if the process is running inside a container
// this code is taken from https://github.com/moby/libnetwork/blob/master/drivers/bridge/setup_bridgenetfiltering.go
func isRunningInContainer() bool {
	_, err := os.Stat("/.dockerenv")
	return !os.IsNotExist(err)
}
