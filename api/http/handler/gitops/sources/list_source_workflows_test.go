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
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestListSourceWorkflows_NotFound(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildGetWorkflowsReq(t, 1, "999"))
	assert.Equal(t, http.StatusNotFound, rr.Code)
}

func TestListSourceWorkflows_Forbidden(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Name:               "private-repo",
			Type:               portainer.SourceTypeGit,
			Git:                &gittypes.GitSource{URL: "https://github.com/org/private-repo"},
			AdministratorsOnly: true,
		}
		require.NoError(t, tx.Source().Create(adminUserContext, src))
		srcID = src.ID

		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return tx.User().Create(&portainer.User{ID: 2, Role: portainer.StandardUserRole})
	}))

	h := newTestHandler(t, store)
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/gitops/sources/"+strconv.Itoa(int(srcID))+"/workflows", nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: 2}))
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		UserID: 2,
		User:   &portainer.User{ID: 2, Role: portainer.StandardUserRole},
	}))
	h.ServeHTTP(rr, req)
	assert.Equal(t, http.StatusForbidden, rr.Code)
}

func TestListSourceWorkflows_ReturnsWorkflows(t *testing.T) {
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
	h.ServeHTTP(rr, buildGetWorkflowsReq(t, 1, strconv.Itoa(int(srcID))))

	items := decodeSourceWorkflows(t, rr)
	require.Len(t, items, 1)
	assert.Equal(t, "my-stack", items[0].Name)
	assert.Equal(t, srcID, items[0].SourceID)
}

func TestListSourceWorkflows_RedactsCredentials(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	cfg := &gittypes.GitSource{
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
	h.ServeHTTP(rr, buildGetWorkflowsReq(t, 1, strconv.Itoa(int(srcID))))

	items := decodeSourceWorkflows(t, rr)
	require.Len(t, items, 1)
	require.NotNil(t, items[0].GitConfig)
	require.NotNil(t, items[0].GitConfig.Authentication)
	assert.Equal(t, "user", items[0].GitConfig.Authentication.Username)
	assert.Empty(t, items[0].GitConfig.Authentication.Password)
}

func TestListSourceWorkflows_FiltersStacksByEnvironmentAccess(t *testing.T) {
	t.Parallel()

	const (
		adminID           portainer.UserID     = 1
		userID            portainer.UserID     = 2
		accessibleEnvID   portainer.EndpointID = 1
		inaccessibleEnvID portainer.EndpointID = 2
		missingEnvID      portainer.EndpointID = 99
	)

	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.User().Create(&portainer.User{ID: adminID, Role: portainer.AdministratorRole}))
		require.NoError(t, tx.User().Create(&portainer.User{ID: userID, Role: portainer.StandardUserRole}))

		group := &portainer.EndpointGroup{Name: "Unassigned"}
		require.NoError(t, tx.EndpointGroup().Create(group))

		require.NoError(t, tx.Endpoint().Create(&portainer.Endpoint{
			ID:                 accessibleEnvID,
			Name:               "accessible",
			Type:               portainer.DockerEnvironment,
			GroupID:            group.ID,
			UserAccessPolicies: portainer.UserAccessPolicies{userID: {}},
		}))
		require.NoError(t, tx.Endpoint().Create(&portainer.Endpoint{
			ID:      inaccessibleEnvID,
			Name:    "inaccessible",
			Type:    portainer.DockerEnvironment,
			GroupID: group.ID,
		}))

		src := &portainer.Source{
			Name:   "public-repo",
			Type:   portainer.SourceTypeGit,
			Git:    gitCfg("https://github.com/org/public-repo"),
			Public: true,
		}
		require.NoError(t, tx.Source().Create(adminUserContext, src))
		srcID = src.ID

		for i, s := range []struct {
			name       string
			endpointID portainer.EndpointID
		}{
			{"accessible", accessibleEnvID},
			{"inaccessible", inaccessibleEnvID},
			{"orphaned", missingEnvID},
		} {
			stack := &portainer.Stack{
				ID:         portainer.StackID(i + 1),
				Name:       s.name,
				EndpointID: s.endpointID,
				Type:       portainer.DockerComposeStack,
			}
			wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{
				StackID: stack.ID,
				Files:   []portainer.ArtifactFile{{SourceID: src.ID}},
			}}}
			require.NoError(t, tx.Workflow().Create(wf))
			stack.WorkflowID = wf.ID
			require.NoError(t, tx.Stack().Create(stack))
			require.NoError(t, tx.ResourceControl().Create(authorization.NewPublicResourceControl(
				stackutils.ResourceControlID(s.endpointID, s.name),
				portainer.StackResourceControl,
			)))
		}

		return nil
	}))

	h := newTestHandler(t, store)

	tests := []struct {
		name              string
		role              portainer.UserRole
		id                portainer.UserID
		expectedWorkflows []string
	}{
		{
			"standard user sees only stacks on accessible environments",
			portainer.StandardUserRole,
			userID,
			[]string{"accessible"},
		},
		{
			"admin sees every stack, including orphaned ones",
			portainer.AdministratorRole,
			adminID,
			[]string{"accessible", "inaccessible", "orphaned"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/gitops/sources/"+strconv.Itoa(int(srcID))+"/workflows", nil)
			rr := httptest.NewRecorder()
			h.ServeHTTP(rr, withRoleSecurityContext(req, tt.id, tt.role))

			gotWorkflows := make([]string, 0, len(tt.expectedWorkflows))
			for _, item := range decodeSourceWorkflows(t, rr) {
				gotWorkflows = append(gotWorkflows, item.Name)
			}
			require.ElementsMatch(t, tt.expectedWorkflows, gotWorkflows)
		})
	}
}
