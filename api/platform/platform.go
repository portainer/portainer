package platform

import (
	"os"
)

const (
	PodmanMode            = "PODMAN"
	KubernetesServiceHost = "KUBERNETES_SERVICE_HOST"
)

// ContainerPlatform represent the platform on which the container is running (Docker, Kubernetes)
type ContainerPlatform string

const (
	// PlatformDocker represent the Docker platform (Unknown)
	PlatformDocker = ContainerPlatform("Docker")
	// PlatformDockerStandalone represent the Docker platform (Standalone)
	PlatformDockerStandalone = ContainerPlatform("Docker Standalone")
	// PlatformDockerSwarm represent the Docker platform (Swarm)
	PlatformDockerSwarm = ContainerPlatform("Docker Swarm")
	// PlatformKubernetes represent the Kubernetes platform
	PlatformKubernetes = ContainerPlatform("Kubernetes")
	// PlatformPodman represent the Podman platform (Standalone)
	PlatformPodman = ContainerPlatform("Podman")
)

// DetermineContainerPlatform will check for the existence of the PODMAN_MODE
// or KUBERNETES_SERVICE_HOST environment variable to determine if
// the container is running on Podman or inside the Kubernetes platform.
// Defaults to Docker otherwise.
func DetermineContainerPlatform() ContainerPlatform {
	podmanModeEnvVar := os.Getenv(PodmanMode)
	if podmanModeEnvVar == "1" {
		return PlatformPodman
	}

	serviceHostKubernetesEnvVar := os.Getenv(KubernetesServiceHost)
	if serviceHostKubernetesEnvVar != "" {
		return PlatformKubernetes
	}

	if !isRunningInContainer() {
		return ""
	}

	return PlatformDocker
}

// isRunningInContainer returns true if the process is running inside a container
// this code is taken from https://github.com/moby/libnetwork/blob/master/drivers/bridge/setup_bridgenetfiltering.go
func isRunningInContainer() bool {
	_, err := os.Stat("/.dockerenv")

	return !os.IsNotExist(err)
}
