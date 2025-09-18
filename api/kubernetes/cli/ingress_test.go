package cli

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestGetIngresses(t *testing.T) {
	kcl := &KubeClient{}

	ingresses, err := kcl.GetIngresses("default")
	require.NoError(t, err)
	require.Empty(t, ingresses)
}
