package platform

import "os"

const (
	PodmanMode            = "PODMAN"
	KubernetesServiceHost = "KUBERNETES_SERVICE_HOST"
	NomadJobName          = "NOMAD_JOB_NAME"
)

// ContainerPlatform represent the platform on which the container is running (Docker, Kubernetes, Nomad)
type ContainerPlatform string

const (
	// PlatformDocker represent the Docker platform (Standalone/Swarm)
	PlatformDocker = ContainerPlatform("Docker")
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
func DetermineContainerPlatform() ContainerPlatform {
	podmanModeEnvVar := os.Getenv(PodmanMode)
	if podmanModeEnvVar == "1" {
		return PlatformPodman
	}
	serviceHostKubernetesEnvVar := os.Getenv(KubernetesServiceHost)
	if serviceHostKubernetesEnvVar != "" {
		return PlatformKubernetes
	}
	nomadJobName := os.Getenv(NomadJobName)
	if nomadJobName != "" {
		return PlatformNomad
	}

	return PlatformDocker
}
