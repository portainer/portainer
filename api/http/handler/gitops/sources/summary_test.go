package sources

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	ceWorkflows "github.com/portainer/portainer/api/gitops/workflows"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestSourcesSummary_Empty(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildSummaryReq(t, 1))

	require.Equal(t, http.StatusOK, rr.Code)

	var summary ceWorkflows.StatusSummary
	err := json.NewDecoder(rr.Body).Decode(&summary)
	require.NoError(t, err)
	require.Equal(t, ceWorkflows.StatusSummary{}, summary)
}

func TestSourcesSummary_CountsByStatus(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		for idx, name := range []string{"source-a", "source-b", "source-c"} {
			err := tx.Source().Create(adminUserContext, &portainer.Source{Name: name, Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: fmt.Sprintf("http://github.com/org/repo%d", idx)}})
			require.NoError(t, err)
		}

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildSummaryReq(t, 1))

	require.Equal(t, http.StatusOK, rr.Code)

	var summary ceWorkflows.StatusSummary
	err := json.NewDecoder(rr.Body).Decode(&summary)
	require.NoError(t, err)
	require.Equal(t, 3, summary.Unknown)
	require.Zero(t, summary.Healthy)
	require.Zero(t, summary.Error)
	require.Zero(t, summary.Syncing)
	require.Zero(t, summary.Paused)
}
