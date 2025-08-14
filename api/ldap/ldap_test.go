package ldap

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/fips"

	"github.com/stretchr/testify/require"
)

func TestCreateConnectionForURL(t *testing.T) {
	fips.InitFIPS(false)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	defer srv.Close()

	tlsSrv := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	defer tlsSrv.Close()

	srvURL, err := url.Parse(tlsSrv.URL)
	require.NoError(t, err)

	// TCP

	settings := &portainer.LDAPSettings{
		URL: srvURL.Host,
	}

	conn, err := createConnectionForURL(settings.URL, settings)
	require.NoError(t, err)
	require.NotNil(t, conn)
	conn.Close()

	// TLS

	settings.TLSConfig = portainer.TLSConfiguration{
		TLS:           true,
		TLSSkipVerify: true,
	}

	conn, err = createConnectionForURL(settings.URL, settings)
	require.NoError(t, err)
	require.NotNil(t, conn)
	conn.Close()

	// Invalid TLS

	settings.TLSConfig = portainer.TLSConfiguration{
		TLS:           true,
		TLSSkipVerify: true,
		TLSCertPath:   "/invalid/path/cert",
		TLSKeyPath:    "/invalid/path/key",
	}

	conn, err = createConnectionForURL(settings.URL, settings)
	require.Error(t, err)
	require.Nil(t, conn)

	// StartTLS

	settings.TLSConfig.TLS = false
	settings.StartTLS = true

	conn, err = createConnectionForURL(settings.URL, settings)
	require.Error(t, err)
	require.Nil(t, conn)
}

func TestFailures(t *testing.T) {
	s := Service{}

	err := s.AuthenticateUser("username", "password", &portainer.LDAPSettings{})
	require.Error(t, err)

	uGroups, err := s.GetUserGroups("username", &portainer.LDAPSettings{})
	require.Error(t, err)
	require.Empty(t, uGroups)

	users, err := s.SearchUsers(&portainer.LDAPSettings{})
	require.Error(t, err)
	require.Empty(t, users)

	groups, err := s.SearchGroups(&portainer.LDAPSettings{})
	require.Error(t, err)
	require.Empty(t, groups)

	err = s.TestConnectivity(&portainer.LDAPSettings{})
	require.Error(t, err)
}
