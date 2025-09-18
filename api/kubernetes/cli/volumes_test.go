package cli

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestGetVolumes(t *testing.T) {
	kcl := &KubeClient{}

	volumes, err := kcl.GetVolumes("default")
	require.NoError(t, err)
	require.Empty(t, volumes)
}
