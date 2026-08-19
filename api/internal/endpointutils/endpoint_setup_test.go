package endpointutils

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestCreateOfflineUnsecuredEndpoint(t *testing.T) {
	t.Parallel()
	err := createUnsecuredEndpoint("tcp://localhost:1", nil, nil)
	require.Error(t, err)
}
