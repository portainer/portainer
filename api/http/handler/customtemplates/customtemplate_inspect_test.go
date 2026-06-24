package customtemplates

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

// newTestHandler creates a handler with a test datastore, filesystem service, and common fixtures:
// admin user (ID=1), standard users (ID=2,3,4), endpoint (ID=1) with access for users 2 and 3,
// team (ID=1), and team membership for user 3.
func newTestHandler(t *testing.T) (*Handler, dataservices.DataStore, portainer.FileService) {
	t.Helper()

	_, ds := datastore.MustNewTestStore(t, true, false)

	fs, err := filesystem.NewService(t.TempDir(), t.TempDir())
	require.NoError(t, err)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}))
		require.NoError(t, tx.User().Create(&portainer.User{ID: 2, Username: "std2", Role: portainer.StandardUserRole}))
		require.NoError(t, tx.User().Create(&portainer.User{ID: 3, Username: "std3", Role: portainer.StandardUserRole}))
		require.NoError(t, tx.User().Create(&portainer.User{ID: 4, Username: "std4", Role: portainer.StandardUserRole}))
		require.NoError(t, tx.Endpoint().Create(&portainer.Endpoint{
			ID: 1,
			UserAccessPolicies: portainer.UserAccessPolicies{
				2: portainer.AccessPolicy{RoleID: 0},
				3: portainer.AccessPolicy{RoleID: 0},
			},
		}))
		require.NoError(t, tx.Team().Create(&portainer.Team{ID: 1}))
		require.NoError(t, tx.TeamMembership().Create(&portainer.TeamMembership{ID: 1, UserID: 3, TeamID: 1, Role: portainer.TeamMember}))
		return nil
	}))

	handler := NewHandler(testhelpers.NewTestRequestBouncer(), ds, fs, nil)

	return handler, ds, fs
}

func TestInspectHandler(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 1}))
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 2}))
		require.NoError(t, tx.ResourceControl().Create(&portainer.ResourceControl{
			ID: 1, ResourceID: "2", Type: portainer.CustomTemplateResourceControl,
			UserAccesses: []portainer.UserResourceAccess{{UserID: 2}},
			TeamAccesses: []portainer.TeamResourceAccess{{TeamID: 1}},
		}))
		return nil
	}))

	test := func(templateID string, restrictedContext *security.RestrictedRequestContext) (*httptest.ResponseRecorder, *httperror.HandlerError) {
		r := httptest.NewRequest(http.MethodGet, "/custom_templates/"+templateID, nil)
		r = mux.SetURLVars(r, map[string]string{"id": templateID})
		ctx := security.StoreRestrictedRequestContext(r, restrictedContext)
		r = r.WithContext(ctx)
		rr := httptest.NewRecorder()
		return rr, handler.customTemplateInspect(rr, r)
	}

	t.Run("unknown id should get not found error", func(t *testing.T) {
		_, r := test("0", &security.RestrictedRequestContext{UserID: 1, User: &portainer.User{ID: 1, Role: portainer.AdministratorRole}})
		require.NotNil(t, r)
		require.Equal(t, http.StatusNotFound, r.StatusCode)
	})

	t.Run("admin should access adminonly template", func(t *testing.T) {
		rr, r := test("1", &security.RestrictedRequestContext{UserID: 1, IsAdmin: true, User: &portainer.User{ID: 1, Role: portainer.AdministratorRole}})
		require.Nil(t, r)
		require.Equal(t, http.StatusOK, rr.Result().StatusCode)

		var template portainer.CustomTemplate
		require.NoError(t, json.NewDecoder(rr.Body).Decode(&template))
		require.Equal(t, portainer.CustomTemplateID(1), template.ID)
	})

	t.Run("std should not access adminonly template", func(t *testing.T) {
		_, r := test("1", &security.RestrictedRequestContext{UserID: 2, User: &portainer.User{ID: 2, Role: portainer.StandardUserRole}})
		require.NotNil(t, r)
		require.Equal(t, http.StatusForbidden, r.StatusCode)
	})

	t.Run("std should access template via direct user access", func(t *testing.T) {
		rr, r := test("2", &security.RestrictedRequestContext{UserID: 2, User: &portainer.User{ID: 2, Role: portainer.StandardUserRole}})
		require.Nil(t, r)
		require.Equal(t, http.StatusOK, rr.Result().StatusCode)

		var template portainer.CustomTemplate
		require.NoError(t, json.NewDecoder(rr.Body).Decode(&template))
		require.Equal(t, portainer.CustomTemplateID(2), template.ID)
	})

	t.Run("std should access template via team access", func(t *testing.T) {
		rr, r := test("2", &security.RestrictedRequestContext{UserID: 3, User: &portainer.User{ID: 3, Role: portainer.StandardUserRole}, UserMemberships: []portainer.TeamMembership{{ID: 1, UserID: 3, TeamID: 1}}})
		require.Nil(t, r)
		require.Equal(t, http.StatusOK, rr.Result().StatusCode)

		var template portainer.CustomTemplate
		require.NoError(t, json.NewDecoder(rr.Body).Decode(&template))
		require.Equal(t, portainer.CustomTemplateID(2), template.ID)
	})

	t.Run("std should not access template without access", func(t *testing.T) {
		_, r := test("2", &security.RestrictedRequestContext{UserID: 4, User: &portainer.User{ID: 4, Role: portainer.StandardUserRole}})
		require.NotNil(t, r)
		require.Equal(t, http.StatusForbidden, r.StatusCode)
	})
}

func TestInspectHandler_CreatorDeniedWhenAdminOnly(t *testing.T) {
	t.Parallel()

	handler, store, _ := newTestHandler(t)

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		err := tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID:              5,
			CreatedByUserID: 2,
		})
		require.NoError(t, err)

		err = tx.ResourceControl().Create(&portainer.ResourceControl{
			ID:                 5,
			ResourceID:         "5",
			Type:               portainer.CustomTemplateResourceControl,
			AdministratorsOnly: true,
		})
		require.NoError(t, err)

		return nil
	})
	require.NoError(t, err)

	r := httptest.NewRequest(http.MethodGet, "/custom_templates/5", nil)
	r = mux.SetURLVars(r, map[string]string{"id": "5"})
	r = r.WithContext(security.StoreRestrictedRequestContext(r, &security.RestrictedRequestContext{UserID: 2, User: &portainer.User{ID: 2, Role: portainer.StandardUserRole}}))
	rr := httptest.NewRecorder()

	herr := handler.customTemplateInspect(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusForbidden, herr.StatusCode)
}

func TestInspectHandler_GitConfigPopulatedFromSource(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	var srcID portainer.SourceID
	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
				URL:           "https://github.com/example/repo",
				TLSSkipVerify: true,
			},
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)

		srcID = src.ID

		return tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID: 10,
			Artifact: &portainer.Artifact{
				Files: []portainer.ArtifactFile{{
					Ref:      "refs/heads/main",
					Path:     "docker-compose.yml",
					Hash:     "abc123",
					SourceID: srcID,
				}},
			},
		})
	}))

	r := httptest.NewRequest(http.MethodGet, "/custom_templates/10", nil)
	r = mux.SetURLVars(r, map[string]string{"id": "10"})
	ctx := security.StoreRestrictedRequestContext(r, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true, User: &portainer.User{ID: 1, Role: portainer.AdministratorRole}})
	r = r.WithContext(ctx)
	rr := httptest.NewRecorder()
	herr := handler.customTemplateInspect(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Result().StatusCode)

	var template portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&template))
	require.NotNil(t, template.GitConfig)
	require.Equal(t, "https://github.com/example/repo", template.GitConfig.URL)
	require.True(t, template.GitConfig.TLSSkipVerify)
	require.Equal(t, "refs/heads/main", template.GitConfig.ReferenceName)
	require.Equal(t, "docker-compose.yml", template.GitConfig.ConfigFilePath)
	require.Equal(t, "abc123", template.GitConfig.ConfigHash)
}
