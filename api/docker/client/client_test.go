package client

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/fips"

	"github.com/stretchr/testify/require"
)

func TestHttpClient(t *testing.T) {
	fips.InitFIPS(false)

	// Valid TLS configuration
	endpoint := &portainer.Endpoint{}
	endpoint.TLSConfig = portainer.TLSConfiguration{TLS: true}

	cli, err := httpClient(endpoint, nil)
	require.NoError(t, err)
	require.NotNil(t, cli)

	// Invalid TLS configuration
	endpoint.TLSConfig.TLSCertPath = "/invalid/path/client.crt"
	endpoint.TLSConfig.TLSKeyPath = "/invalid/path/client.key"

	cli, err = httpClient(endpoint, nil)
	require.Error(t, err)
	require.Nil(t, cli)
}
