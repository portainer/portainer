package workflows

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	gittypes "github.com/portainer/portainer/api/git/types"
	ce "github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/http/security"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

// buildWorkflowsReq creates an HTTP GET request with security context pre-populated.
func buildWorkflowsReq(t *testing.T, userID portainer.UserID, role portainer.UserRole, query string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/gitops/workflows?"+query, nil)
	ctx := security.StoreTokenData(req, &portainer.TokenData{ID: userID})
	req = req.WithContext(ctx)
	ctx = security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		UserID:  userID,
		IsAdmin: security.IsAdminRole(role),
		User:    &portainer.User{ID: userID, Role: role},
	})
	return req.WithContext(ctx)
}

// decodeWorkflows decodes a 200 JSON response into a slice of ce.Workflow.
func decodeWorkflows(t *testing.T, rr *httptest.ResponseRecorder) []ce.Workflow {
	t.Helper()
	require.Equal(t, http.StatusOK, rr.Code, "unexpected status: %s", rr.Body.String())
	var items []ce.Workflow
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&items))
	return items
}

// gitConfig is a convenience constructor for test RepoConfigs.
func gitConfig(url string) *gittypes.RepoConfig {
	return &gittypes.RepoConfig{URL: url, ConfigFilePath: "docker-compose.yml"}
}

// createGitStack creates Source, Workflow, and Stack records with WorkflowID properly wired.
func createGitStack(t *testing.T, tx dataservices.DataStoreTx, stack *portainer.Stack) {
	t.Helper()

	if stack.GitConfig != nil {
		src := &portainer.Source{Git: stack.GitConfig, Type: portainer.SourceTypeGit}
		require.NoError(t, tx.Source().Create(source.InsecureNewAdminContext(), src))

		wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{
			StackID: stack.ID,
			Files: []portainer.ArtifactFile{{
				SourceID: src.ID,
				Path:     stack.GitConfig.ConfigFilePath,
				Ref:      stack.GitConfig.ReferenceName,
				Hash:     stack.GitConfig.ConfigHash,
			}},
		}}}
		require.NoError(t, tx.Workflow().Create(wf))

		stack.WorkflowID = wf.ID
	}

	require.NoError(t, tx.Stack().Create(stack))
}
