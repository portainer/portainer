package platform

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/stretchr/testify/require"
)

func TestDetermineContainerPlatform_Podman(t *testing.T) {
	t.Setenv(PodmanMode, "1")

	require.Equal(t, PlatformPodman, DetermineContainerPlatform())
}

func TestDetermineContainerPlatform_Kubernetes(t *testing.T) {
	t.Setenv(KubernetesServiceHost, "10.96.0.1")

	require.Equal(t, PlatformKubernetes, DetermineContainerPlatform())
}

func TestDetermineContainerPlatform_PodmanTakesPrecedenceOverKubernetes(t *testing.T) {
	t.Setenv(PodmanMode, "1")
	t.Setenv(KubernetesServiceHost, "10.96.0.1")

	require.Equal(t, PlatformPodman, DetermineContainerPlatform())
}

func TestCheckDockerEnvTypeForUpgrade_UnixSocket(t *testing.T) {
	t.Parallel()

	endpoint := &portainer.Endpoint{URL: "unix:///var/run/docker.sock"}
	require.Equal(t, PlatformDockerStandalone, checkDockerEnvTypeForUpgrade(endpoint))
}

func TestCheckDockerEnvTypeForUpgrade_Npipe(t *testing.T) {
	t.Parallel()

	endpoint := &portainer.Endpoint{URL: "npipe:////./pipe/docker_engine", Type: portainer.DockerEnvironment}
	require.Equal(t, PlatformDockerStandalone, checkDockerEnvTypeForUpgrade(endpoint))
}

func TestCheckDockerEnvTypeForUpgrade_Swarm(t *testing.T) {
	t.Parallel()

	endpoint := &portainer.Endpoint{URL: "tcp://tasks.portainer_agent:9001"}
	require.Equal(t, PlatformDockerSwarm, checkDockerEnvTypeForUpgrade(endpoint))
}

func TestCheckDockerEnvTypeForUpgrade_RemoteTCP(t *testing.T) {
	t.Parallel()

	endpoint := &portainer.Endpoint{URL: "tcp://192.168.1.100:2376"}
	require.Equal(t, ContainerPlatform(""), checkDockerEnvTypeForUpgrade(endpoint))
}

func TestDetectLocalEnvironment_UnsupportedPlatform(t *testing.T) {
	t.Setenv(PodmanMode, "1")
	t.Setenv(KubernetesServiceHost, "")

	ds := testhelpers.NewDatastore(testhelpers.WithEndpoints([]portainer.Endpoint{
		{ID: 1, Type: portainer.DockerEnvironment},
	}))

	endpoint, platform, err := detectLocalEnvironment(ds)
	require.NoError(t, err)
	require.Nil(t, endpoint)
	require.Empty(t, platform)
}

func TestDetectLocalEnvironment_NoEndpoints(t *testing.T) {
	t.Setenv(KubernetesServiceHost, "10.96.0.1")
	t.Setenv(PodmanMode, "")

	ds := testhelpers.NewDatastore(testhelpers.WithEndpoints([]portainer.Endpoint{}))

	endpoint, platform, err := detectLocalEnvironment(ds)
	require.NoError(t, err)
	require.Nil(t, endpoint)
	require.Empty(t, platform)
}

func TestDetectLocalEnvironment_KubernetesEndpointFound(t *testing.T) {
	t.Setenv(KubernetesServiceHost, "10.96.0.1")
	t.Setenv(PodmanMode, "")

	kube := portainer.Endpoint{ID: 1, Name: "local-k8s", Type: portainer.KubernetesLocalEnvironment}
	ds := testhelpers.NewDatastore(testhelpers.WithEndpoints([]portainer.Endpoint{kube}))

	endpoint, platform, err := detectLocalEnvironment(ds)
	require.NoError(t, err)
	require.NotNil(t, endpoint)
	require.Equal(t, portainer.EndpointID(1), endpoint.ID)
	require.Equal(t, PlatformKubernetes, platform)
}

func TestDetectLocalEnvironment_NoMatchingEndpointType(t *testing.T) {
	t.Setenv(KubernetesServiceHost, "10.96.0.1")
	t.Setenv(PodmanMode, "")

	docker := portainer.Endpoint{ID: 1, Type: portainer.DockerEnvironment}
	ds := testhelpers.NewDatastore(testhelpers.WithEndpoints([]portainer.Endpoint{docker}))

	_, _, err := detectLocalEnvironment(ds)
	require.ErrorIs(t, err, ErrNoLocalEnvironment)
}

func TestService_GetPlatform(t *testing.T) {
	t.Setenv(KubernetesServiceHost, "10.96.0.1")
	t.Setenv(PodmanMode, "")

	kube := portainer.Endpoint{ID: 1, Type: portainer.KubernetesLocalEnvironment}
	ds := testhelpers.NewDatastore(testhelpers.WithEndpoints([]portainer.Endpoint{kube}))

	svc := NewService(ds)

	platform, err := svc.GetPlatform()
	require.NoError(t, err)
	require.Equal(t, PlatformKubernetes, platform)
}

func TestService_GetLocalEnvironment(t *testing.T) {
	t.Setenv(KubernetesServiceHost, "10.96.0.1")
	t.Setenv(PodmanMode, "")

	kube := portainer.Endpoint{ID: 1, Type: portainer.KubernetesLocalEnvironment}
	ds := testhelpers.NewDatastore(testhelpers.WithEndpoints([]portainer.Endpoint{kube}))

	svc := NewService(ds)

	env, err := svc.GetLocalEnvironment()
	require.NoError(t, err)
	require.NotNil(t, env)
	require.Equal(t, portainer.EndpointID(1), env.ID)
}

func TestService_CachesLoadedEnvironment(t *testing.T) {
	t.Setenv(KubernetesServiceHost, "10.96.0.1")
	t.Setenv(PodmanMode, "")

	kube := portainer.Endpoint{ID: 1, Type: portainer.KubernetesLocalEnvironment}
	ds := testhelpers.NewDatastore(testhelpers.WithEndpoints([]portainer.Endpoint{kube}))

	svc := NewService(ds)

	env1, err := svc.GetLocalEnvironment()
	require.NoError(t, err)

	env2, err := svc.GetLocalEnvironment()
	require.NoError(t, err)

	require.Same(t, env1, env2)
}
