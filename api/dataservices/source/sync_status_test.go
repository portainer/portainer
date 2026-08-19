package source_test

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/stretchr/testify/require"
)

func TestService_UpdateSyncStatus_HealthyBumpsLastSyncAndClearsError(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	adminContext := source.InsecureNewAdminContext()

	src := &portainer.Source{
		Type:        portainer.SourceTypeGit,
		Git:         &gittypes.GitSource{URL: "https://example.com"},
		Status:      portainer.SourceStatusError,
		StatusError: "previous failure",
	}
	err := store.Source().Create(adminContext, src)
	require.NoError(t, err)

	err = store.Source().UpdateSyncStatus(adminContext, src.ID, portainer.SourceStatusHealthy, "")
	require.NoError(t, err)

	updated, err := store.Source().Read(adminContext, src.ID)
	require.NoError(t, err)
	require.Equal(t, portainer.SourceStatusHealthy, updated.Status)
	require.Empty(t, updated.StatusError)
	require.NotZero(t, updated.LastSync)
}

func TestService_UpdateSyncStatus_ErrorPreservesPriorLastSync(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	adminContext := source.InsecureNewAdminContext()

	src := &portainer.Source{
		Type:     portainer.SourceTypeGit,
		Git:      &gittypes.GitSource{URL: "https://example.com"},
		LastSync: 12345,
	}
	err := store.Source().Create(adminContext, src)
	require.NoError(t, err)

	err = store.Source().UpdateSyncStatus(adminContext, src.ID, portainer.SourceStatusError, "git fetch failed")
	require.NoError(t, err)

	updated, err := store.Source().Read(adminContext, src.ID)
	require.NoError(t, err)
	require.Equal(t, portainer.SourceStatusError, updated.Status)
	require.Equal(t, "git fetch failed", updated.StatusError)
	require.Equal(t, int64(12345), updated.LastSync)
}

// A standard user without any access to the source must not be able to persist a sync
// status onto it, even though UpdateSyncStatus only requires read (not write) access.
func TestService_UpdateSyncStatus_UserWithoutReadAccessIsDenied(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	adminContext := source.InsecureNewAdminContext()
	standardUserContext := source.NewUserContext(&portainer.User{ID: 2, Role: portainer.StandardUserRole}, []portainer.TeamMembership{})

	src := &portainer.Source{
		Type:               portainer.SourceTypeGit,
		Git:                &gittypes.GitSource{URL: "https://example.com"},
		AdministratorsOnly: true,
	}
	err := store.Source().Create(adminContext, src)
	require.NoError(t, err)

	err = store.Source().UpdateSyncStatus(standardUserContext, src.ID, portainer.SourceStatusHealthy, "")
	require.ErrorIs(t, err, source.ErrNotEnoughPermission)
}

func TestService_UpdateSyncStatus_UnknownSourceReturnsError(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	adminContext := source.InsecureNewAdminContext()

	err := store.Source().UpdateSyncStatus(adminContext, portainer.SourceID(999), portainer.SourceStatusHealthy, "")
	require.Error(t, err)
}

func TestService_UpdateSyncStatus_NilUserContextIsRejected(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	err := store.Source().UpdateSyncStatus(nil, portainer.SourceID(1), portainer.SourceStatusHealthy, "")
	require.ErrorIs(t, err, source.ErrInvalidUserContext)
}
