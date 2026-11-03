package stackutils

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/pkg/authorization"

	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func newNetworkInspectClient(t *testing.T, networks ...network.Inspect) *client.Client {
	t.Helper()

	byReference := make(map[string]network.Inspect, len(networks)*2)
	for _, n := range networks {
		byReference[n.ID] = n
		byReference[n.Name] = n
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodHead && r.URL.Path == "/_ping" {
			w.Header().Add("Api-Version", "1.51")
			_, _ = w.Write([]byte{})

			return
		}

		if n, ok := byReference[strings.TrimPrefix(r.URL.Path, "/v1.51/networks/")]; ok {
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(n)

			return
		}

		http.NotFound(w, r)
	}))
	t.Cleanup(srv.Close)

	cli, err := client.NewClientWithOpts(client.WithHost(srv.URL), client.WithHTTPClient(http.DefaultClient), client.WithVersion("1.51"))
	require.NoError(t, err)

	return cli
}

var unrestrictedNetworks = &NetworkAccess{Unrestricted: true}

const (
	networkTestEndpointID = portainer.EndpointID(1)
	networkTestUserID     = portainer.UserID(2)
	networkTestOtherID    = portainer.UserID(3)
	networkTestTeamID     = portainer.TeamID(7)
)

func newNetworkTestFixtures(t *testing.T) (*client.Client, *NetworkAccess) {
	t.Helper()

	dockerClient := newNetworkInspectClient(t,
		network.Inspect{ID: "bridgeid", Name: "bridge"},
		network.Inspect{ID: "ownnetid", Name: "ownnet"},
		network.Inspect{ID: "othernetid", Name: "othernet"},
		network.Inspect{ID: "orphannetid", Name: "orphannet"},
		network.Inspect{ID: "teamnetid", Name: "teamnet"},
		network.Inspect{ID: "publicnetid", Name: "publicnet"},
		network.Inspect{ID: "ownstacknetid", Name: "ownstack_backend", Labels: map[string]string{consts.ComposeStackNameLabel: "ownstack"}},
		network.Inspect{ID: "otherstacknetid", Name: "otherstack_backend", Labels: map[string]string{consts.SwarmStackNameLabel: "otherstack"}},
		network.Inspect{ID: "mystacktakenid", Name: "mystack_taken"},
		network.Inspect{ID: "mystackownid", Name: "mystack_own", Labels: map[string]string{consts.ComposeStackNameLabel: "mystack"}},
	)

	access := &NetworkAccess{
		EndpointID:  networkTestEndpointID,
		UserID:      networkTestUserID,
		UserTeamIDs: []portainer.TeamID{networkTestTeamID},
		ResourceControls: []portainer.ResourceControl{
			*authorization.NewPrivateResourceControl("ownnetid", portainer.NetworkResourceControl, networkTestUserID),
			*authorization.NewPrivateResourceControl("othernetid", portainer.NetworkResourceControl, networkTestOtherID),
			*authorization.NewRestrictedResourceControl("teamnetid", portainer.NetworkResourceControl, nil, []portainer.TeamID{networkTestTeamID}),
			*authorization.NewPublicResourceControl("publicnetid", portainer.NetworkResourceControl),
			*authorization.NewPrivateResourceControl(ResourceControlID(networkTestEndpointID, "ownstack"), portainer.StackResourceControl, networkTestUserID),
			*authorization.NewPrivateResourceControl(ResourceControlID(networkTestEndpointID, "otherstack"), portainer.StackResourceControl, networkTestOtherID),
			*authorization.NewPrivateResourceControl("mystacktakenid", portainer.NetworkResourceControl, networkTestOtherID),
			*authorization.NewPrivateResourceControl(ResourceControlID(networkTestEndpointID, "mystack"), portainer.StackResourceControl, networkTestUserID),
		},
	}

	return dockerClient, access
}

func TestNetworkAccess_AuthorizeNetworks(t *testing.T) {
	t.Parallel()

	dockerClient, access := newNetworkTestFixtures(t)

	f := func(access *NetworkAccess, networkNames []string, allowMissing bool, wantForbidden bool) {
		t.Helper()

		err := access.AuthorizeNetworks(t.Context(), dockerClient, networkNames, allowMissing)
		if wantForbidden {
			require.ErrorIs(t, err, ErrNetworkAccessForbidden)

			return
		}

		require.NoError(t, err)
	}

	// a network the user owns is allowed, by name and by ID
	f(access, []string{"ownnet", "ownnetid"}, false, false)

	// a network privately owned by another user is forbidden
	f(access, []string{"othernet"}, false, true)

	// referencing that network by ID is forbidden too
	f(access, []string{"othernetid"}, false, true)

	// one forbidden network among allowed ones is enough to forbid the request
	f(access, []string{"ownnet", "othernet"}, false, true)

	// a network without any resource control is forbidden
	f(access, []string{"orphannet"}, false, true)

	// Docker's built-in networks are allowed, even when referenced by ID
	f(access, []string{"bridgeid"}, false, false)

	// a network shared with one of the user's teams is allowed
	f(access, []string{"teamnet"}, false, false)

	// a public network is allowed
	f(access, []string{"publicnet"}, false, false)

	// a network inherits the access of the compose stack that created it
	f(access, []string{"ownstack_backend"}, false, false)

	// a network created by another user's swarm stack is forbidden
	f(access, []string{"otherstack_backend"}, false, true)

	// a missing network is skipped when it is allowed to be missing
	f(access, []string{"missingnet"}, true, false)

	// unrestricted access allows any network
	f(&NetworkAccess{Unrestricted: true}, []string{"othernet", "orphannet"}, false, false)

	// a missing network fails when it must exist, without being reported as forbidden
	err := access.AuthorizeNetworks(t.Context(), dockerClient, []string{"missingnet"}, false)
	require.Error(t, err)
	require.NotErrorIs(t, err, ErrNetworkAccessForbidden)
}

func TestReferencedNetworkNames(t *testing.T) {
	t.Parallel()

	f := func(candidates []string, want []string) {
		t.Helper()

		require.Equal(t, want, ReferencedNetworkNames(candidates))
	}

	// named networks are kept once, in order
	f([]string{"net1", "net2", "net1"}, []string{"net1", "net2"})

	// empty and default network modes need no authorization
	f([]string{"", "default"}, nil)

	// Docker's built-in networks need no authorization
	f([]string{"bridge", "host", "none", "nat", "ingress"}, nil)

	// another container's or compose service's network namespace is not a network
	f([]string{"container:abc123", "service:db"}, nil)
}
