package git

import (
	"maps"
	"net/http"
	"testing"

	"github.com/go-git/go-git/v5/plumbing/transport"
	"github.com/go-git/go-git/v5/plumbing/transport/client"
	gogithttp "github.com/go-git/go-git/v5/plumbing/transport/http"
	"github.com/stretchr/testify/require"
)

func TestInstallSSRFProtocols(t *testing.T) {
	origProtocols := make(map[string]transport.Transport, len(client.Protocols))
	maps.Copy(origProtocols, client.Protocols)

	origDefaultTransport := http.DefaultTransport
	origGogitDefaultClient := gogithttp.DefaultClient

	t.Cleanup(func() {
		http.DefaultTransport = origDefaultTransport
		gogithttp.DefaultClient = origGogitDefaultClient

		for scheme, tr := range origProtocols {
			client.InstallProtocol(scheme, tr)
		}
	})

	InstallSSRFProtocols()

	f := func(scheme string) {
		t.Helper()

		ep, err := transport.NewEndpoint(scheme + "://example.invalid/repo.git")
		require.NoError(t, err)

		tr, err := client.NewClient(ep)
		require.NoError(t, err)

		_, ok := tr.(*ssrfGitTransport)
		require.True(t, ok)
	}

	f("git")
	f("ssh")
	f("http")
	f("https")

	ep, err := transport.NewEndpoint("file:///repo.git")
	require.NoError(t, err)

	_, err = client.NewClient(ep)
	require.Error(t, err)
}
