package allowlist_test

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/stretchr/testify/require"
)

func TestAllowListReadTx(t *testing.T) {
	t.Parallel()
	_, ds := datastore.MustNewTestStore(t, false, false)

	var got *portainer.AllowList
	require.NoError(t, ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		got, err = tx.AllowList().Read(portainer.AllowListSSRF)
		return err
	}))

	expected := &portainer.AllowList{
		ID:      portainer.AllowListSSRF,
		Mode:    portainer.SSRFModeOff,
		Entries: []string{},
	}

	require.Equal(t, expected, got)
}

func TestAllowListReadAllEmptyTx(t *testing.T) {
	t.Parallel()
	_, ds := datastore.MustNewTestStore(t, false, false)

	var got []portainer.AllowList
	require.NoError(t, ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		got, err = tx.AllowList().ReadAll()
		return err
	}))

	require.Equal(t, []portainer.AllowList{}, got)
}

func TestAllowListReadAllAfterUpdateTx(t *testing.T) {
	t.Parallel()
	_, ds := datastore.MustNewTestStore(t, false, false)

	expected := portainer.AllowList{
		ID:      portainer.AllowListSSRF,
		Mode:    portainer.SSRFModeEnforce,
		Entries: []string{"example.com"},
	}

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.AllowList().Update(portainer.AllowListSSRF, &expected)
	}))

	var got []portainer.AllowList
	require.NoError(t, ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		got, err = tx.AllowList().ReadAll()
		return err
	}))

	require.Equal(t, []portainer.AllowList{expected}, got)
}

func TestAllowListUpdateTx(t *testing.T) {
	t.Parallel()
	_, ds := datastore.MustNewTestStore(t, false, false)

	expected := &portainer.AllowList{
		ID:      portainer.AllowListSSRF,
		Mode:    portainer.SSRFModeEnforce,
		Entries: []string{"example.com"},
	}

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.AllowList().Update(portainer.AllowListSSRF, expected)
	}))

	var got *portainer.AllowList
	require.NoError(t, ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		got, err = tx.AllowList().Read(portainer.AllowListSSRF)
		return err
	}))

	require.Equal(t, expected, got)
}
