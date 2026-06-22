package sources

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestGitSourceUpdate_Success(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Name: "old-name", Type: portainer.SourceTypeGit, Git: &gittypes.RepoConfig{URL: "http://github.com/org/repo"}}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	body, err := json.Marshal(GitSourceUpdatePayload{
		URL:  new("https://github.com/org/new.git"),
		Name: new("new-name"),
	})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildUpdateReq(t, 1, int(srcID), body))

	require.Equal(t, http.StatusOK, rr.Code)

	var src portainer.Source
	err = json.NewDecoder(rr.Body).Decode(&src)
	require.NoError(t, err)
	require.Equal(t, "new-name", src.Name)
	require.NotNil(t, src.Git)
	require.Equal(t, "https://github.com/org/new", src.Git.URL)
}

func TestGitSourceUpdate_PreservesAuthWhenNotProvided(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Name: "auth-source",
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
				URL: "https://github.com/org/repo.git",
				Authentication: &gittypes.GitAuthentication{
					Username: "alice",
					Password: "secret",
				},
			},
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	body, err := json.Marshal(GitSourceUpdatePayload{
		URL:  new("https://github.com/org/repo.git"),
		Name: new("renamed"),
	})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildUpdateReq(t, 1, int(srcID), body))

	require.Equal(t, http.StatusOK, rr.Code)

	var stored *portainer.Source
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		stored, err = tx.Source().Read(adminUserContext, srcID)
		return err
	}))
	require.NotNil(t, stored.Git)
	require.NotNil(t, stored.Git.Authentication)
	require.Equal(t, "alice", stored.Git.Authentication.Username)
	require.Equal(t, "secret", stored.Git.Authentication.Password)
}

func TestGitSourceUpdate_ClearsAuthWhenRequested(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Name: "auth-source",
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
				URL: "https://github.com/org/repo.git",
				Authentication: &gittypes.GitAuthentication{
					Username: "alice",
					Password: "secret",
				},
			},
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	body, err := json.Marshal(GitSourceUpdatePayload{
		URL:            new("https://github.com/org/repo.git"),
		Authentication: &GitAuthenticationUpdatePayload{},
	})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildUpdateReq(t, 1, int(srcID), body))

	require.Equal(t, http.StatusOK, rr.Code)

	var stored *portainer.Source
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		stored, err = tx.Source().Read(adminUserContext, srcID)
		return err
	}))
	require.NotNil(t, stored.Git)
	require.Nil(t, stored.Git.Authentication)
}

func TestGitSourceUpdate_ReplacesAuthWhenProvided(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Name: "auth-source",
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
				URL: "https://github.com/org/repo.git",
				Authentication: &gittypes.GitAuthentication{
					Username: "alice",
					Password: "secret",
				},
			},
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	body, err := json.Marshal(GitSourceUpdatePayload{
		URL: new("https://github.com/org/repo.git"),
		Authentication: &GitAuthenticationUpdatePayload{
			Username: new("bob"),
			Password: new("new-secret"),
		},
	})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildUpdateReq(t, 1, int(srcID), body))

	require.Equal(t, http.StatusOK, rr.Code)

	var stored *portainer.Source
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		stored, err = tx.Source().Read(adminUserContext, srcID)
		return err
	}))
	require.NotNil(t, stored.Git)
	require.NotNil(t, stored.Git.Authentication)
	require.Equal(t, "bob", stored.Git.Authentication.Username)
	require.Equal(t, "new-secret", stored.Git.Authentication.Password)
}

func TestGitSourceUpdate_NotFound(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	body, err := json.Marshal(GitSourceUpdatePayload{URL: new("https://github.com/org/repo.git")})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildUpdateReq(t, 1, 99, body))

	require.Equal(t, http.StatusNotFound, rr.Code)
}

func TestGitSourceUpdate_ConflictOnDuplicateURL(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		existing := &portainer.Source{
			Name: "existing",
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
				URL: "https://github.com/org/existing.git",
			},
		}
		err := tx.Source().Create(adminUserContext, existing)
		require.NoError(t, err)

		src := &portainer.Source{Name: "other", Type: portainer.SourceTypeGit, Git: &gittypes.RepoConfig{URL: "http://github.com/org/repo"}}
		err = tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	body, err := json.Marshal(GitSourceUpdatePayload{
		URL: new("https://github.com/org/existing.git"),
	})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildUpdateReq(t, 1, int(srcID), body))

	require.Equal(t, http.StatusConflict, rr.Code)
}

func TestGitSourceUpdate_MalformedJSON(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Name: "src", Type: portainer.SourceTypeGit, Git: &gittypes.RepoConfig{URL: "http://github.com/org/repo"}}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildUpdateReq(t, 1, int(srcID), []byte("not-valid-json{")))

	require.Equal(t, http.StatusBadRequest, rr.Code)
}

func TestGitSourceUpdate_ConflictWhenAuthChangesMatchAnotherSource(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		existing := &portainer.Source{
			Name: "existing",
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
				URL: "https://github.com/org/repo.git",
				Authentication: &gittypes.GitAuthentication{
					Username: "alice",
					Password: "secret",
				},
			},
		}
		if err := tx.Source().Create(adminUserContext, existing); err != nil {
			return err
		}

		other := &portainer.Source{
			Name: "other",
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.RepoConfig{URL: "https://github.com/org/repo.git"},
		}
		if err := tx.Source().Create(adminUserContext, other); err != nil {
			return err
		}
		srcID = other.ID

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	alice := "alice"
	secret := "secret"
	body, err := json.Marshal(GitSourceUpdatePayload{
		Authentication: &GitAuthenticationUpdatePayload{
			Username: &alice,
			Password: &secret,
		},
	})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildUpdateReq(t, 1, int(srcID), body))
	require.Equal(t, http.StatusConflict, rr.Code)
}

func TestGitSourceUpdate_NonNumericID(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	body, err := json.Marshal(GitSourceUpdatePayload{URL: new("https://github.com/org/repo.git")})
	require.NoError(t, err)

	req := buildUpdateReqWithRawID(t, 1, "not-a-number", body)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	require.Equal(t, http.StatusBadRequest, rr.Code)
}
