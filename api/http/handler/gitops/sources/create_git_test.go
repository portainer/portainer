package sources

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestBuildGitSource_DerivesNameFromURL(t *testing.T) {
	t.Parallel()

	src, err := BuildGitSource(GitSourceCreatePayload{
		URL: "https://github.com/org/my-repo.git",
	})
	require.NoError(t, err)

	require.Equal(t, "my-repo", src.Name)
	require.Equal(t, portainer.SourceTypeGit, src.Type)
	require.Nil(t, src.Git.Authentication)
}

func TestBuildGitSource_UsesExplicitName(t *testing.T) {
	t.Parallel()

	src, err := BuildGitSource(GitSourceCreatePayload{
		Name: "custom-name",
		URL:  "https://github.com/org/repo.git",
	})
	require.NoError(t, err)

	require.Equal(t, "custom-name", src.Name)
}

func TestBuildGitSource_WithAuthentication(t *testing.T) {
	t.Parallel()

	src, err := BuildGitSource(GitSourceCreatePayload{
		URL: "https://github.com/org/repo.git",
		Authentication: &GitAuthenticationPayload{
			Username: "alice",
			Password: "secret",
		},
	})
	require.NoError(t, err)

	require.NotNil(t, src.Git.Authentication)
	require.Equal(t, "alice", src.Git.Authentication.Username)
	require.Equal(t, "secret", src.Git.Authentication.Password)
}

func TestGitSourceCreatePayload_Validate_EmptyURL(t *testing.T) {
	t.Parallel()

	err := (&GitSourceCreatePayload{}).Validate(nil)
	require.Error(t, err)
}

func TestGitSourceCreatePayload_Validate_ValidURL(t *testing.T) {
	t.Parallel()

	err := (&GitSourceCreatePayload{URL: "https://github.com/org/repo.git"}).Validate(nil)
	require.NoError(t, err)
}

func TestGitSourceCreate_Success(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	body, err := json.Marshal(GitSourceCreatePayload{
		URL:  "https://github.com/org/repo.git",
		Name: "my-source",
	})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildCreateReq(t, 1, body))

	require.Equal(t, http.StatusCreated, rr.Code)

	var src portainer.Source
	err = json.NewDecoder(rr.Body).Decode(&src)
	require.NoError(t, err)
	require.Equal(t, "my-source", src.Name)
	require.Equal(t, portainer.SourceTypeGit, src.Type)
	require.NotZero(t, src.ID)
	require.NotNil(t, src.Git)
	require.Equal(t, "https://github.com/org/repo", src.Git.URL)
}

func TestGitSourceCreate_SanitizesCredentials(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	body, err := json.Marshal(GitSourceCreatePayload{
		URL: "https://github.com/org/repo.git",
		Authentication: &GitAuthenticationPayload{
			Username: "alice",
			Password: "secret",
		},
	})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildCreateReq(t, 1, body))

	require.Equal(t, http.StatusCreated, rr.Code)

	var src portainer.Source
	err = json.NewDecoder(rr.Body).Decode(&src)
	require.NoError(t, err)
	require.NotNil(t, src.Git)
	require.NotNil(t, src.Git.Authentication)
	require.Equal(t, "alice", src.Git.Authentication.Username)
	require.Empty(t, src.Git.Authentication.Password)
}

func TestGitSourceCreate_MissingURL(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	body, err := json.Marshal(GitSourceCreatePayload{Name: "no-url"})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildCreateReq(t, 1, body))

	require.Equal(t, http.StatusBadRequest, rr.Code)
}

func TestGitSourceCreate_ConflictOnDuplicateURLAndCredentials(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	body, err := json.Marshal(GitSourceCreatePayload{
		URL: "https://github.com/org/repo.git",
		Authentication: &GitAuthenticationPayload{
			Username: "alice",
			Password: "secret",
		},
	})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildCreateReq(t, 1, body))
	require.Equal(t, http.StatusCreated, rr.Code)

	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildCreateReq(t, 1, body))
	require.Equal(t, http.StatusConflict, rr.Code)
}

func TestGitSourceCreate_AllowsDuplicateURLWithDifferentCredentials(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	first, err := json.Marshal(GitSourceCreatePayload{
		URL: "https://github.com/org/repo.git",
		Authentication: &GitAuthenticationPayload{
			Username: "alice",
			Password: "secret",
		},
	})
	require.NoError(t, err)

	second, err := json.Marshal(GitSourceCreatePayload{
		URL: "https://github.com/org/repo.git",
		Authentication: &GitAuthenticationPayload{
			Username: "bob",
			Password: "other",
		},
	})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildCreateReq(t, 1, first))
	require.Equal(t, http.StatusCreated, rr.Code)

	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildCreateReq(t, 1, second))
	require.Equal(t, http.StatusCreated, rr.Code)
}

func TestGitSourceCreate_ConflictOnDuplicateAuthlessSource(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	body, err := json.Marshal(GitSourceCreatePayload{
		URL: "https://github.com/org/repo.git",
	})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildCreateReq(t, 1, body))
	require.Equal(t, http.StatusCreated, rr.Code)

	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildCreateReq(t, 1, body))
	require.Equal(t, http.StatusConflict, rr.Code)
}

func TestGitSourceCreate_AllowsAuthlessAndAuthenticatedSameURL(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	authless, err := json.Marshal(GitSourceCreatePayload{
		URL: "https://github.com/org/repo.git",
	})
	require.NoError(t, err)

	authenticated, err := json.Marshal(GitSourceCreatePayload{
		URL: "https://github.com/org/repo.git",
		Authentication: &GitAuthenticationPayload{
			Username: "alice",
			Password: "secret",
		},
	})
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildCreateReq(t, 1, authless))
	require.Equal(t, http.StatusCreated, rr.Code)

	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildCreateReq(t, 1, authenticated))
	require.Equal(t, http.StatusCreated, rr.Code)
}

func TestGitSourceCreate_MalformedJSON(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildCreateReq(t, 1, []byte("not-valid-json{")))

	require.Equal(t, http.StatusBadRequest, rr.Code)
}
