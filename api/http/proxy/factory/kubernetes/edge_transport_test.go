package kubernetes

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNewEdgeTransport(t *testing.T) {
	t.Parallel()

	transport := NewEdgeTransport(nil, nil, nil, nil, nil, nil, nil)
	require.NotNil(t, transport)
}
