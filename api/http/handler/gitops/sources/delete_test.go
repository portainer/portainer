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
		src := &portainer.Source{Name: "to-delete", Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "http://github.com/org/repo"}}
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
		src := &portainer.Source{Name: "in-use", Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "http://github.com/org/repo"}}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		stack := &portainer.Stack{ID: 1, Name: "in-use-stack"}
		err = tx.Stack().Create(stack)
		require.NoError(t, err)

		wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{StackID: stack.ID, Files: []portainer.ArtifactFile{{SourceID: src.ID}}}}}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildDeleteReq(t, 1, int(srcID)))

	require.Equal(t, http.StatusConflict, rr.Code)
}

// TestSourceDelete_OrphanedArtifactDoesNotBlock covers BE-13300: a workflow artifact whose
// backing stack was deleted through a path that skipped workflow cleanup must not block deletion
// of the source it still references.
func TestSourceDelete_OrphanedArtifactDoesNotBlock(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Name: "orphaned", Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "http://github.com/org/repo"}}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{StackID: 999, Files: []portainer.ArtifactFile{{SourceID: src.ID}}}}}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildDeleteReq(t, 1, int(srcID)))

	require.Equal(t, http.StatusNoContent, rr.Code)
}

// TestSourceDelete_InUseByEdgeStack covers BE-13300: a workflow artifact backed by a live edge
// stack must block source deletion, exercising the edge stack existence check alongside the
// stack one.
func TestSourceDelete_InUseByEdgeStack(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Name: "in-use-edge", Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "http://github.com/org/repo"}}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		edgeStack := &portainer.EdgeStack{ID: 1, Name: "in-use-edgestack"}
		err = tx.EdgeStack().Create(edgeStack.ID, edgeStack)
		require.NoError(t, err)

		wf := &portainer.Workflow{Artifacts: []portainer.Artifact{
			// Does not reference this source: must be skipped rather than block deletion.
			{StackID: 1, Files: []portainer.ArtifactFile{{SourceID: 999}}},
			{EdgeStackID: edgeStack.ID, Files: []portainer.ArtifactFile{{SourceID: src.ID}}},
		}}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildDeleteReq(t, 1, int(srcID)))

	require.Equal(t, http.StatusConflict, rr.Code)
}

// TestSourceDelete_OrphanedEdgeStackArtifactDoesNotBlock covers BE-13300: a workflow artifact
// whose backing edge stack was deleted through a path that skipped workflow cleanup must not
// block deletion of the source it still references.
func TestSourceDelete_OrphanedEdgeStackArtifactDoesNotBlock(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Name: "orphaned-edge", Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "http://github.com/org/repo"}}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{EdgeStackID: 999, Files: []portainer.ArtifactFile{{SourceID: src.ID}}}}}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildDeleteReq(t, 1, int(srcID)))

	require.Equal(t, http.StatusNoContent, rr.Code)
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
		src := &portainer.Source{Name: "in-use-by-template", Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "http://github.com/org/repo"}}
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
