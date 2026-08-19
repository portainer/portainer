package stacks

import (
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/require"
)

func TestKubernetesGitDeploymentPayloadValidate_WithSourceID_URLNotRequired(t *testing.T) {
	t.Parallel()

	p := kubernetesGitDeploymentPayload{
		SourceID:     portainer.SourceID(1),
		ManifestFile: "manifest.yaml",
	}
	err := p.Validate(nil)
	require.NoError(t, err)
}

func TestKubernetesGitDeploymentPayloadValidate_WithSourceID_AuthNotRequired(t *testing.T) {
	t.Parallel()

	p := kubernetesGitDeploymentPayload{
		SourceID:                 portainer.SourceID(1),
		RepositoryAuthentication: true,
		// Password intentionally omitted — should not fail when SourceID is set
		ManifestFile: "manifest.yaml",
	}
	err := p.Validate(nil)
	require.NoError(t, err)
}

func TestKubernetesGitDeploymentPayloadValidate_WithoutSourceID_URLRequired(t *testing.T) {
	t.Parallel()

	p := kubernetesGitDeploymentPayload{
		ManifestFile: "manifest.yaml",
		// SourceID and RepositoryURL both omitted
	}
	err := p.Validate(nil)
	require.Error(t, err)
}

func TestCreateStackPayloadFromK8sGitPayload_WithSourceID(t *testing.T) {
	t.Parallel()

	p := createStackPayloadFromK8sGitPayload(
		"k8s-stack",
		"",
		"",
		"",
		"",
		false,
		false,
		"default",
		"manifest.yaml",
		nil,
		nil,
		false,
		portainer.SourceID(7),
	)

	require.Equal(t, portainer.SourceID(7), p.SourceID)
	require.Equal(t, "manifest.yaml", p.ManifestFile)
}
