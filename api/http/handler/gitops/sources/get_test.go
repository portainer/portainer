package sources

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetSource_NotFound(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildGetReq(t, 1, "999"))
	assert.Equal(t, http.StatusNotFound, rr.Code)
}

func TestGetSource_ReturnsDetail(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	cfg := &gittypes.GitSource{
		URL:           "https://github.com/org/repo",
		TLSSkipVerify: true,
	}

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		stack := &portainer.Stack{ID: 1, Name: "my-stack"}
		srcID = createGitWorkflow(t, tx, stack, cfg)
		require.NoError(t, tx.Stack().Create(stack))
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildGetReq(t, 1, strconv.Itoa(int(srcID))))

	detail := decodeSourceDetail(t, rr)
	assert.Equal(t, srcID, detail.ID)
	assert.Equal(t, "repo", detail.Name)
	assert.True(t, detail.Connection.TLSSkipVerify)
}
