package cli

import (
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/require"
	kfake "k8s.io/client-go/kubernetes/fake"
)

// TestNewTestClientFactory exercises the success path of NewTestClientFactory,
// which is only ever called from other packages' tests, so running this
// package's own test suite alone never covered it before.
func TestNewTestClientFactory(t *testing.T) {
	t.Parallel()

	endpointID := portainer.EndpointID(1)
	kcl := NewTestKubeClient(kfake.NewSimpleClientset())

	factory := NewTestClientFactory(endpointID, kcl)
	require.NotNil(t, factory)

	seeded, err := factory.GetPrivilegedKubeClient(&portainer.Endpoint{ID: endpointID})
	require.NoError(t, err)
	require.Same(t, kcl, seeded)
}
