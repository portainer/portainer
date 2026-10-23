package allowlist_test

import (
	"net"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/stretchr/testify/require"
)

func TestAllowListReadEmpty(t *testing.T) {
	t.Parallel()
	_, ds := datastore.MustNewTestStore(t, false, false)
	got, err := ds.AllowList().Read(portainer.AllowListSSRF)
	expected := &portainer.AllowList{
		ID:      portainer.AllowListSSRF,
		Mode:    portainer.SSRFModeOff,
		Entries: []string{},
	}
	require.NoError(t, err)
	require.Equal(t, expected, got)
}

func TestAllowListUpdate(t *testing.T) {
	t.Parallel()
	_, ds := datastore.MustNewTestStore(t, false, false)

	expected := &portainer.AllowList{
		ID:      portainer.AllowListSSRF,
		Mode:    portainer.SSRFModeEnforce,
		Entries: []string{"example.com", "10.0.0.0/8"},
	}

	require.NoError(t, ds.AllowList().Update(portainer.AllowListSSRF, expected))

	got, err := ds.AllowList().Read(portainer.AllowListSSRF)
	require.NoError(t, err)
	require.Equal(t, expected, got)
}

func TestAllowListReadAllEmpty(t *testing.T) {
	t.Parallel()
	_, ds := datastore.MustNewTestStore(t, false, false)

	got, err := ds.AllowList().ReadAll()
	require.NoError(t, err)
	require.Equal(t, []portainer.AllowList{}, got)
}

func TestAllowListReadAllAfterUpdate(t *testing.T) {
	t.Parallel()
	_, ds := datastore.MustNewTestStore(t, false, false)

	expected := portainer.AllowList{
		ID:      portainer.AllowListSSRF,
		Mode:    portainer.SSRFModeEnforce,
		Entries: []string{"example.com", "10.0.0.0/8"},
	}

	require.NoError(t, ds.AllowList().Update(portainer.AllowListSSRF, &expected))

	got, err := ds.AllowList().ReadAll()
	require.NoError(t, err)
	require.Equal(t, []portainer.AllowList{expected}, got)
}

func TestAllowListReadParsedAfterUpdate(t *testing.T) {
	t.Parallel()
	_, ds := datastore.MustNewTestStore(t, false, false)

	require.NoError(t, ds.AllowList().Update(portainer.AllowListSSRF, &portainer.AllowList{
		ID:      portainer.AllowListSSRF,
		Mode:    portainer.SSRFModeEnforce,
		Entries: []string{"example.com"},
	}))

	expected := &portainer.ParsedAllowList{
		Mode: portainer.SSRFModeEnforce,
		Nets: []*net.IPNet{},
		Hosts: map[string]bool{
			"example.com": true,
		},
	}

	got, err := ds.AllowList().ReadParsed(portainer.AllowListSSRF)
	require.NoError(t, err)
	require.Equal(t, expected, got)
}
