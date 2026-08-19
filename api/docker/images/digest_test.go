package images

import (
	"testing"

	"github.com/docker/docker/api/types/image"
	"github.com/stretchr/testify/require"
)

func TestParseLocalImage(t *testing.T) {
	t.Parallel()
	// Test with a regular image

	img, err := ParseLocalImage(image.InspectResponse{
		ID:          "sha256:9234e8fb04c47cfe0f49931e4ac7eb76fa904e33b7f8576aec0501c085f02516",
		RepoTags:    []string{"myimage:latest"},
		RepoDigests: []string{"myimage@sha256:4bcff63911fcb4448bd4fdacec207030997caf25e9bea4045fa6c8c44de311d1"},
	})
	require.NoError(t, err)
	require.NotNil(t, img)
	require.Equal(t, "library/myimage", img.Path)
	require.Equal(t, "latest", img.Tag)
	require.Equal(t, "sha256:4bcff63911fcb4448bd4fdacec207030997caf25e9bea4045fa6c8c44de311d1", img.Digest.String())

	// Test with a dangling image

	img, err = ParseLocalImage(image.InspectResponse{
		ID:          "sha256:abcdef1234567890",
		RepoTags:    []string{"<none>:<none>"},
		RepoDigests: []string{"<none>@<none>"},
	})
	require.Error(t, err)
	require.Nil(t, img)
}
