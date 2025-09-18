package cli

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestGetServices(t *testing.T) {
	kcl := &KubeClient{}

	services, err := kcl.GetServices("default")
	require.NoError(t, err)
	require.Empty(t, services)
}
