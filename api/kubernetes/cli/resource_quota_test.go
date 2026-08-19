package cli

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestGetResourceQuotas(t *testing.T) {
	t.Parallel()
	kcl := &KubeClient{}

	resourceQuotas, err := kcl.GetResourceQuotas("default")
	require.NoError(t, err)
	require.Empty(t, resourceQuotas)
}
