package sources

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/stretchr/testify/require"
)

func TestSourceDelete_Success(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Name: "to-delete", Type: portainer.SourceTypeGit, Git: &gittypes.RepoConfig{URL: "http://github.com/org/repo"}}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildDeleteReq(t, 1, int(srcID)))

	require.Equal(t, http.StatusNoContent, rr.Code)
}

func TestSourceDelete_NotFound(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildDeleteReq(t, 1, 99))

	require.Equal(t, http.StatusNotFound, rr.Code)
}

func TestSourceDelete_InUse(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Name: "in-use", Type: portainer.SourceTypeGit, Git: &gittypes.RepoConfig{URL: "http://github.com/org/repo"}}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{Files: []portainer.ArtifactFile{{SourceID: src.ID}}}}}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildDeleteReq(t, 1, int(srcID)))

	require.Equal(t, http.StatusConflict, rr.Code)
}

func TestSourceDelete_NonNumericID(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildDeleteReqWithRawID(t, 1, "not-a-number"))

	require.Equal(t, http.StatusBadRequest, rr.Code)
}

func TestSourceDelete_InUseByCustomTemplate(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Name: "in-use-by-template", Type: portainer.SourceTypeGit, Git: &gittypes.RepoConfig{URL: "http://github.com/org/repo"}}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		ct := &portainer.CustomTemplate{
			ID: 1,
			Artifact: &portainer.Artifact{
				Files: []portainer.ArtifactFile{{SourceID: src.ID}},
			},
		}
		err = tx.CustomTemplate().Create(ct)
		require.NoError(t, err)

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildDeleteReq(t, 1, int(srcID)))

	require.Equal(t, http.StatusConflict, rr.Code)
}
