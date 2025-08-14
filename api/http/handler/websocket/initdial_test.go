package websocket

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/fips"

	"github.com/stretchr/testify/require"
)

func TestInitDial(t *testing.T) {
	fips.InitFIPS(false)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	defer srv.Close()

	tlsSrv := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	defer tlsSrv.Close()

	f := func(srvURL string) {
		u, err := url.Parse(srvURL)
		require.NoError(t, err)

		isTLS := u.Scheme == "https"

		u.Scheme = "tcp"

		endpoint := &portainer.Endpoint{
			URL: u.String(),
			TLSConfig: portainer.TLSConfiguration{
				TLS:           isTLS,
				TLSSkipVerify: true,
			},
		}

		// Valid configuration
		conn, err := initDial(endpoint)
		require.NoError(t, err)
		require.NotNil(t, conn)

		err = conn.Close()
		require.NoError(t, err)

		if !isTLS {
			return
		}

		// Invalid TLS configuration
		endpoint.TLSConfig.TLSCertPath = "/invalid/path/client.crt"
		endpoint.TLSConfig.TLSKeyPath = "/invalid/path/client.key"

		conn, err = initDial(endpoint)
		require.Error(t, err)
		require.Nil(t, conn)
	}

	f(srv.URL)
	f(tlsSrv.URL)
}
