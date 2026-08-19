package url

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestParseURL_NoPrefix(t *testing.T) {
	t.Parallel()

	u, err := ParseURL("192.168.1.1:9000")
	require.NoError(t, err)
	require.Equal(t, "192.168.1.1:9000", u.Host)
}

func TestParseURL_HTTPPrefix(t *testing.T) {
	t.Parallel()

	u, err := ParseURL("http://example.com:8080")
	require.NoError(t, err)
	require.Equal(t, "http", u.Scheme)
	require.Equal(t, "example.com:8080", u.Host)
}

func TestParseURL_HTTPSPrefix(t *testing.T) {
	t.Parallel()

	u, err := ParseURL("https://example.com")
	require.NoError(t, err)
	require.Equal(t, "https", u.Scheme)
	require.Equal(t, "example.com", u.Host)
}

func TestParseURL_TCPPrefix(t *testing.T) {
	t.Parallel()

	u, err := ParseURL("tcp://192.168.1.1:2376")
	require.NoError(t, err)
	require.Equal(t, "tcp", u.Scheme)
	require.Equal(t, "192.168.1.1:2376", u.Host)
}

func TestParseURL_SlashSlashPrefix(t *testing.T) {
	t.Parallel()

	u, err := ParseURL("//192.168.1.1:2376")
	require.NoError(t, err)
	require.Equal(t, "192.168.1.1:2376", u.Host)
}

func TestParseURL_UnixPrefix(t *testing.T) {
	t.Parallel()

	u, err := ParseURL("unix:///var/run/docker.sock")
	require.NoError(t, err)
	require.Equal(t, "unix", u.Scheme)
	require.Equal(t, "/var/run/docker.sock", u.Path)
}

func TestParseURL_NpipePrefix(t *testing.T) {
	t.Parallel()

	u, err := ParseURL("npipe:////./pipe/docker_engine")
	require.NoError(t, err)
	require.Equal(t, "npipe", u.Scheme)
}
