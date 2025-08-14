package kubernetes

import (
	"testing"

	"github.com/portainer/portainer/pkg/fips"

	"github.com/stretchr/testify/require"
)

func TestNewLocalTransport(t *testing.T) {
	fips.InitFIPS(false)

	transport, err := NewLocalTransport(nil, nil, nil, nil, nil)
	require.NoError(t, err)
	require.True(t, transport.httpTransport.TLSClientConfig.InsecureSkipVerify) //nolint:forbidigo
}
