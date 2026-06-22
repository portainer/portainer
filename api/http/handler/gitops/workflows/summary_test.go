package workflows

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	ce "github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/http/security"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func buildSummaryReq(t *testing.T, userID portainer.UserID, role portainer.UserRole) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/gitops/workflows/summary", nil)
	ctx := security.StoreTokenData(req, &portainer.TokenData{ID: userID})
	req = req.WithContext(ctx)
	ctx = security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		UserID:  userID,
		IsAdmin: security.IsAdminRole(role),
		User:    &portainer.User{ID: userID, Role: role},
	})
	return req.WithContext(ctx)
}

func decodeSummary(t *testing.T, rr *httptest.ResponseRecorder) ce.StatusSummary {
	t.Helper()
	require.Equal(t, http.StatusOK, rr.Code, "unexpected status: %s", rr.Body.String())
	var s ce.StatusSummary
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&s))
	return s
}

func TestWorkflowsSummary_Empty(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildSummaryReq(t, 1, portainer.AdministratorRole))

	s := decodeSummary(t, rr)
	require.Equal(t, ce.StatusSummary{}, s)
}

func TestWorkflowsSummary_CountsHealthyAndError(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		// No deployment status, target healthy, effective status = healthy.
		createGitStack(t, tx, &portainer.Stack{
			ID: 1, Name: "healthy-stack",
			GitConfig: gitConfig("https://github.com/x/1"),
		})

		// Error deployment status, target error, effective status = error.
		createGitStack(t, tx, &portainer.Stack{
			ID: 2, Name: "error-stack",
			GitConfig:        gitConfig("https://github.com/x/2"),
			DeploymentStatus: []portainer.StackDeploymentStatus{{Status: portainer.StackStatusError}},
		})

		// Deploying deployment status, target syncing, effective status = syncing.
		createGitStack(t, tx, &portainer.Stack{
			ID: 3, Name: "syncing-stack",
			GitConfig:        gitConfig("https://github.com/x/3"),
			DeploymentStatus: []portainer.StackDeploymentStatus{{Status: portainer.StackStatusDeploying}},
		})

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildSummaryReq(t, 1, portainer.AdministratorRole))

	s := decodeSummary(t, rr)
	require.Equal(t, 1, s.Healthy)
	require.Equal(t, 1, s.Error)
	require.Equal(t, 1, s.Syncing)
	require.Zero(t, s.Paused)
	require.Zero(t, s.Unknown)
}
