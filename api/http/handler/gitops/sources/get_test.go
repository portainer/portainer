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

	cfg := &gittypes.RepoConfig{
		URL:            "https://github.com/org/repo",
		ReferenceName:  "refs/heads/main",
		ConfigFilePath: "docker-compose.yml",
		TLSSkipVerify:  true,
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
	assert.Equal(t, 1, detail.UsedBy)
	assert.True(t, detail.Connection.TLSSkipVerify)
	require.Len(t, detail.Workflows, 1)
	assert.Equal(t, "my-stack", detail.Workflows[0].Name)
	require.NotNil(t, detail.Workflows[0].GitConfig)
	assert.Equal(t, "docker-compose.yml", detail.Workflows[0].GitConfig.ConfigFilePath)
}

func TestGetSource_RedactsCredentials(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	cfg := &gittypes.RepoConfig{
		URL:            "https://github.com/org/secure",
		Authentication: &gittypes.GitAuthentication{Username: "user", Password: "s3cr3t"},
	}

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		stack := &portainer.Stack{ID: 1, Name: "secure-stack"}
		srcID = createGitWorkflow(t, tx, stack, cfg)
		require.NoError(t, tx.Stack().Create(stack))
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildGetReq(t, 1, strconv.Itoa(int(srcID))))

	detail := decodeSourceDetail(t, rr)
	require.Len(t, detail.Workflows, 1)
	require.NotNil(t, detail.Workflows[0].GitConfig)
	require.NotNil(t, detail.Workflows[0].GitConfig.Authentication)
	assert.Equal(t, "user", detail.Workflows[0].GitConfig.Authentication.Username)
	assert.Empty(t, detail.Workflows[0].GitConfig.Authentication.Password)
}

func TestGetSource_AutoUpdate(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	cfg := gitCfg("https://github.com/org/polled")

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		stack := &portainer.Stack{
			ID:         1,
			Name:       "polled-stack",
			AutoUpdate: &portainer.AutoUpdateSettings{Interval: "5m"},
		}
		srcID = createGitWorkflow(t, tx, stack, cfg)
		require.NoError(t, tx.Stack().Create(stack))
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildGetReq(t, 1, strconv.Itoa(int(srcID))))

	detail := decodeSourceDetail(t, rr)
	require.NotNil(t, detail.AutoUpdate)
	assert.Equal(t, "Interval", detail.AutoUpdate.Mechanism)
	assert.Equal(t, "5m", detail.AutoUpdate.FetchInterval)
}
