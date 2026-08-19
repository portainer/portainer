package snapshot

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/docker/docker/api/types"
	dockercontainer "github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/api/types/system"
	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/client"
	portainer "github.com/portainer/portainer/api"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestDockerSnapshotNodes_CountAndResources(t *testing.T) {
	t.Parallel()

	nodes := []swarm.Node{
		{Description: swarm.NodeDescription{Resources: swarm.Resources{
			NanoCPUs:    4_000_000_000,
			MemoryBytes: 8 * 1024 * 1024 * 1024,
		}}},
		{Description: swarm.NodeDescription{Resources: swarm.Resources{
			NanoCPUs:    2_000_000_000,
			MemoryBytes: 4 * 1024 * 1024 * 1024,
		}}},
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(nodes)
	}))
	defer srv.Close()

	cli, err := client.NewClientWithOpts(client.WithHost(srv.URL), client.WithHTTPClient(http.DefaultClient))
	require.NoError(t, err)

	snap := &portainer.DockerSnapshot{}
	err = dockerSnapshotNodes(snap, cli)
	require.NoError(t, err)

	require.Equal(t, 2, snap.NodeCount)
	require.Equal(t, 6, snap.TotalCPU)
	require.Equal(t, int64(12*1024*1024*1024), snap.TotalMemory)
}

func TestCreateDockerSnapshot_StandaloneNodeCount(t *testing.T) {
	t.Parallel()

	srv := newDockerMockServer(t, false, nil)
	defer srv.Close()

	cli, err := client.NewClientWithOpts(client.WithHost(srv.URL), client.WithHTTPClient(http.DefaultClient))
	require.NoError(t, err)

	snap, err := CreateDockerSnapshot(cli)
	require.NoError(t, err)
	require.Equal(t, 1, snap.NodeCount)
	require.False(t, snap.Swarm)
}

func TestCreateDockerSnapshot_SwarmNodeCount(t *testing.T) {
	t.Parallel()

	nodes := []swarm.Node{
		{Description: swarm.NodeDescription{Resources: swarm.Resources{NanoCPUs: 2_000_000_000}}},
		{Description: swarm.NodeDescription{Resources: swarm.Resources{NanoCPUs: 2_000_000_000}}},
		{Description: swarm.NodeDescription{Resources: swarm.Resources{NanoCPUs: 2_000_000_000}}},
	}

	srv := newDockerMockServer(t, true, nodes)
	defer srv.Close()

	cli, err := client.NewClientWithOpts(client.WithHost(srv.URL), client.WithHTTPClient(http.DefaultClient))
	require.NoError(t, err)

	snap, err := CreateDockerSnapshot(cli)
	require.NoError(t, err)
	require.Equal(t, 3, snap.NodeCount)
	require.True(t, snap.Swarm)
}

// newDockerMockServer returns a test HTTP server that mimics the Docker API
// for snapshot-related endpoints. swarmEnabled controls whether /info reports
// Swarm mode active; nodes is returned by the /nodes endpoint.
func newDockerMockServer(t *testing.T, swarmEnabled bool, nodes []swarm.Node) *httptest.Server {
	t.Helper()

	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		path := r.URL.Path

		switch {
		case path == "/_ping":
			w.Header().Set("API-Version", "1.41")
			_, _ = w.Write([]byte("OK"))

		case strings.HasSuffix(path, "/info"):
			_ = json.NewEncoder(w).Encode(system.Info{
				NCPU:     2,
				MemTotal: 4 * 1024 * 1024 * 1024,
				Swarm:    swarm.Info{ControlAvailable: swarmEnabled},
			})

		case strings.HasSuffix(path, "/nodes"):
			_ = json.NewEncoder(w).Encode(nodes)

		case strings.HasSuffix(path, "/services"):
			_ = json.NewEncoder(w).Encode([]swarm.Service{})

		case strings.HasSuffix(path, "/containers/json"):
			_ = json.NewEncoder(w).Encode([]dockercontainer.Summary{})

		case strings.HasSuffix(path, "/images/json"):
			_ = json.NewEncoder(w).Encode([]image.Summary{})

		case strings.HasSuffix(path, "/volumes"):
			_ = json.NewEncoder(w).Encode(volume.ListResponse{})

		case strings.HasSuffix(path, "/networks"):
			_ = json.NewEncoder(w).Encode([]network.Summary{})

		case strings.HasSuffix(path, "/version"):
			_ = json.NewEncoder(w).Encode(types.Version{
				Version:    "20.10.0",
				APIVersion: "1.41",
			})

		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
}
