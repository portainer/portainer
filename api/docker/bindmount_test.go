package docker

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/client"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestIsBindMount(t *testing.T) {
	t.Parallel()

	f := func(m MountDescriptor, want bool) {
		t.Helper()
		require.Equal(t, want, IsBindMount(m))
	}

	// explicit "bind" Type, case-insensitively
	f(MountDescriptor{Type: "bind"}, true)
	f(MountDescriptor{Type: "Bind"}, true)
	f(MountDescriptor{Type: "BIND"}, true)

	// local driver's documented bind-mount trick: type=none,o=bind
	f(MountDescriptor{Type: "none", DriverOpts: map[string]string{"type": "none", "o": "bind", "device": "/etc"}}, true)

	// local driver's rbind variant, found among comma-separated "o" options
	f(MountDescriptor{DriverOpts: map[string]string{"o": "rbind,ro"}}, true)

	// driver_opts "type": "bind" is case-insensitive
	f(MountDescriptor{DriverOpts: map[string]string{"type": "Bind"}}, true)

	// a plain named volume is not a bind mount
	f(MountDescriptor{Type: "volume"}, false)

	// unrelated driver_opts (e.g. a tmpfs size) don't trigger a false positive
	f(MountDescriptor{Type: "volume", DriverOpts: map[string]string{"o": "size=100m"}}, false)

	// local driver mounting a real filesystem type via a device is as dangerous as a bind mount
	f(MountDescriptor{Type: "volume", DriverOpts: map[string]string{"type": "ext4", "device": "/dev/sda1"}}, true)

	// local driver mounting a remote NFS share via a device
	f(MountDescriptor{Type: "volume", DriverOpts: map[string]string{"type": "nfs", "o": "addr=192.168.1.1,rw", "device": ":/path/to/dir"}}, true)

	// "device" key match is case-insensitive
	f(MountDescriptor{DriverOpts: map[string]string{"type": "xfs", "Device": "/dev/sdb1"}}, true)

	// an unspecified driver defaults to "local", so "device" is still flagged
	f(MountDescriptor{DriverOpts: map[string]string{"type": "ext4", "device": "/dev/sda1"}}, true)

	// third-party volume drivers define their own "device" semantics, so it is not flagged
	f(MountDescriptor{Driver: "some-cloud-csi-plugin", DriverOpts: map[string]string{"device": "vol-12345"}}, false)

	// tmpfs without a device is not a bind mount
	f(MountDescriptor{DriverOpts: map[string]string{"type": "tmpfs"}}, false)

	// Windows named-pipe mount is bind-equivalent, case-insensitively
	f(MountDescriptor{Type: "npipe"}, true)
	f(MountDescriptor{Type: "NPipe"}, true)
}

func TestIsBindPath(t *testing.T) {
	t.Parallel()

	f := func(bind string, want bool) {
		t.Helper()
		require.Equal(t, want, IsBindPath(bind))
	}

	// Unix absolute host path
	f("/host:/data", true)

	// Windows drive-letter absolute host path, backslash form
	f(`C:\Users\Public:C:\data`, true)

	// Windows drive-letter absolute host path, forward-slash form
	f("C:/data:C:/container", true)

	// named volume, not a host path
	f("myvolume:/data", false)

	// Windows named-pipe UNC path
	f(`\\.\pipe\docker_engine:\\.\pipe\docker_engine`, true)

	// Windows network-share UNC path
	f(`\\fileserver\share:/data`, true)
}

func newVolumeInspectClient(t *testing.T, handler http.HandlerFunc) *client.Client {
	t.Helper()

	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)

	cli, err := client.NewClientWithOpts(client.WithHost(srv.URL), client.WithHTTPClient(http.DefaultClient))
	require.NoError(t, err)

	return cli
}

func TestInspectVolumeIsBindMount(t *testing.T) {
	t.Parallel()

	f := func(handler http.HandlerFunc, volumeName string, wantBind, wantErr bool) {
		t.Helper()

		cli := newVolumeInspectClient(t, handler)

		isBind, err := InspectVolumeIsBindMount(t.Context(), cli, volumeName)
		if wantErr {
			require.Error(t, err)
		} else {
			require.NoError(t, err)
		}

		require.Equal(t, wantBind, isBind)
	}

	// a volume backed by the local driver's bind-mount trick is flagged
	f(func(w http.ResponseWriter, r *http.Request) {
		vol := volume.Volume{Name: "evilvol", Driver: "local", Options: map[string]string{"type": "none", "o": "bind", "device": "/etc"}}

		w.Header().Set("Content-Type", "application/json")
		assert.NoError(t, json.NewEncoder(w).Encode(vol))
	}, "evilvol", true, false)

	// a normal volume is not flagged
	f(func(w http.ResponseWriter, r *http.Request) {
		vol := volume.Volume{Name: "normalvol", Driver: "local"}

		w.Header().Set("Content-Type", "application/json")
		assert.NoError(t, json.NewEncoder(w).Encode(vol))
	}, "normalvol", false, false)

	// a volume that does not exist is not flagged, and is not an error
	f(func(w http.ResponseWriter, r *http.Request) {
		http.NotFound(w, r)
	}, "missingvol", false, false)

	// any other API error is propagated
	f(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "boom", http.StatusInternalServerError)
	}, "brokenvol", false, true)
}
