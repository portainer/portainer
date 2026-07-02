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
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Each test below primes the source cache with a read before mutating, then
// reads again and asserts the change is reflected. The handler is built with a
// non-expiring cache (newTestHandlerNoCacheExpiry), so a fresh result can only
// come from invalidation on the write — not from the TTL elapsing.

func TestGitSourceCreate_InvalidatesCache(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	user := &portainer.User{ID: 1, Role: portainer.AdministratorRole}
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(user)
	}))

	h := newTestHandlerNoCacheExpiry(t, store)

	// prime the cache with the (empty) list
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildListReq(t, user.ID, ""))
	require.Empty(t, decodeSources(t, rr))

	body, err := json.Marshal(GitSourceCreatePayload{
		URL:  "https://github.com/org/repo.git",
		Name: "my-source",
	})
	require.NoError(t, err)

	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildCreateReq(t, user.ID, body))
	require.Equal(t, http.StatusCreated, rr.Code)

	// the new source must appear despite the primed empty cache
	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildListReq(t, user.ID, ""))
	got := decodeSources(t, rr)
	require.Len(t, got, 1)
	require.Equal(t, "my-source", got[0].Name)
}

func TestSourceDelete_InvalidatesCache(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	user := &portainer.User{ID: 1, Role: portainer.AdministratorRole}
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Name: "to-delete", Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "https://github.com/org/repo"}}
		require.NoError(t, tx.Source().Create(adminUserContext, src))
		srcID = src.ID

		return tx.User().Create(user)
	}))

	h := newTestHandlerNoCacheExpiry(t, store)

	// prime the cache with the source present
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildListReq(t, user.ID, ""))
	require.Len(t, decodeSources(t, rr), 1)

	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildDeleteReq(t, user.ID, int(srcID)))
	require.Equal(t, http.StatusNoContent, rr.Code)

	// the deleted source must be gone despite the primed cache
	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildListReq(t, user.ID, ""))
	require.Empty(t, decodeSources(t, rr))
}

func TestGitSourceUpdate_InvalidatesCache(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	user := &portainer.User{ID: 1, Role: portainer.AdministratorRole}
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Name: "old-name", Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "https://github.com/org/repo"}}
		require.NoError(t, tx.Source().Create(adminUserContext, src))
		srcID = src.ID

		return tx.User().Create(user)
	}))

	h := newTestHandlerNoCacheExpiry(t, store)

	// prime the cache with the original name
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildListReq(t, user.ID, ""))
	primed := decodeSources(t, rr)
	require.Len(t, primed, 1)
	require.Equal(t, "old-name", primed[0].Name)

	body, err := json.Marshal(GitSourceUpdatePayload{Name: new("new-name")})
	require.NoError(t, err)

	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildUpdateReq(t, user.ID, int(srcID), body))
	require.Equal(t, http.StatusOK, rr.Code)

	// the updated name must be reflected despite the primed cache
	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildListReq(t, user.ID, ""))
	got := decodeSources(t, rr)
	require.Len(t, got, 1)
	require.Equal(t, "new-name", got[0].Name)
}

// TestSourceMutation_InvalidatesSummaryCache verifies the summary endpoint, which
// shares the cache entry with the list via getSources, also sees fresh data.
func TestSourceMutation_InvalidatesSummaryCache(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	user := &portainer.User{ID: 1, Role: portainer.AdministratorRole}
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(user)
	}))

	h := newTestHandlerNoCacheExpiry(t, store)

	// prime the cache with the empty summary
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildSummaryReq(t, user.ID))
	require.Equal(t, 0, summaryTotal(t, rr))

	body, err := json.Marshal(GitSourceCreatePayload{
		URL:  "https://github.com/org/repo.git",
		Name: "my-source",
	})
	require.NoError(t, err)

	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildCreateReq(t, user.ID, body))
	require.Equal(t, http.StatusCreated, rr.Code)

	// the summary count must reflect the new source despite the primed cache
	rr = httptest.NewRecorder()
	h.ServeHTTP(rr, buildSummaryReq(t, user.ID))
	assert.Equal(t, 1, summaryTotal(t, rr))
}

func summaryTotal(t *testing.T, rr *httptest.ResponseRecorder) int {
	t.Helper()
	require.Equal(t, http.StatusOK, rr.Code, "unexpected status: %s", rr.Body.String())

	var summary map[string]int
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&summary))

	total := 0
	for _, count := range summary {
		total += count
	}
	return total
}
