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

func TestInspectHandler_NotFound(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	r := httptest.NewRequest(http.MethodGet, "/custom_templates/99", nil)
	r = mux.SetURLVars(r, map[string]string{"id": "99"})
	r = r.WithContext(security.StoreRestrictedRequestContext(
		r,
		&security.RestrictedRequestContext{
			UserID:  1,
			IsAdmin: true,
			User:    &portainer.User{ID: 1, Role: portainer.AdministratorRole},
		},
	))
	rr := httptest.NewRecorder()

	herr := handler.customTemplateInspect(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusNotFound, herr.StatusCode)
}

func TestInspectHandler_AccessControl(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name            string
		createdByUserID portainer.UserID
		resourceControl *portainer.ResourceControl
		context         *security.RestrictedRequestContext
		expectedStatus  int
	}{
		{
			name:            "non-creator is forbidden without resource control",
			createdByUserID: 1,
			context: &security.RestrictedRequestContext{
				UserID: 2,
				User:   &portainer.User{ID: 2, Role: portainer.StandardUserRole},
			},
			expectedStatus: http.StatusForbidden,
		},
		{
			name:            "creator is forbidden without resource control",
			createdByUserID: 2,
			context: &security.RestrictedRequestContext{
				UserID: 2,
				User:   &portainer.User{ID: 2, Role: portainer.StandardUserRole},
			},
			expectedStatus: http.StatusForbidden,
		},
		{
			name:            "creator is forbidden when an admin restricted the template to administrators",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{AdministratorsOnly: true},
			context: &security.RestrictedRequestContext{
				UserID: 2,
				User:   &portainer.User{ID: 2, Role: portainer.StandardUserRole},
			},
			expectedStatus: http.StatusForbidden,
		},
		{
			name:            "creator is forbidden when the resource control only grants access to another user",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{
				UserAccesses: []portainer.UserResourceAccess{{UserID: 3}},
			},
			context: &security.RestrictedRequestContext{
				UserID: 2,
				User:   &portainer.User{ID: 2, Role: portainer.StandardUserRole},
			},
			expectedStatus: http.StatusForbidden,
		},
		{
			name:            "non-creator is forbidden when the resource control only grants access to the creator",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{
				UserAccesses: []portainer.UserResourceAccess{{UserID: 2}},
			},
			context: &security.RestrictedRequestContext{
				UserID: 3,
				User:   &portainer.User{ID: 3, Role: portainer.StandardUserRole},
			},
			expectedStatus: http.StatusForbidden,
		},
		{
			name:            "creator with access can access template",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{UserAccesses: []portainer.UserResourceAccess{{UserID: 2}}},
			context: &security.RestrictedRequestContext{
				UserID: 2,
				User:   &portainer.User{ID: 2, Role: portainer.StandardUserRole},
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:            "non-creator with access can access template",
			createdByUserID: 3,
			resourceControl: &portainer.ResourceControl{UserAccesses: []portainer.UserResourceAccess{{UserID: 2}}},
			context: &security.RestrictedRequestContext{
				UserID: 2,
				User:   &portainer.User{ID: 2, Role: portainer.StandardUserRole},
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:            "creator can access template via team access",
			createdByUserID: 3,
			resourceControl: &portainer.ResourceControl{TeamAccesses: []portainer.TeamResourceAccess{{TeamID: 1}}},
			context: &security.RestrictedRequestContext{
				UserID:          3,
				User:            &portainer.User{ID: 3, Role: portainer.StandardUserRole},
				UserMemberships: []portainer.TeamMembership{{ID: 1, UserID: 3, TeamID: 1}},
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:            "non-creator can access template via team access",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{TeamAccesses: []portainer.TeamResourceAccess{{TeamID: 1}}},
			context: &security.RestrictedRequestContext{
				UserID:          3,
				User:            &portainer.User{ID: 3, Role: portainer.StandardUserRole},
				UserMemberships: []portainer.TeamMembership{{ID: 1, UserID: 3, TeamID: 1}},
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:            "admin can access template without resource control",
			createdByUserID: 2,
			context: &security.RestrictedRequestContext{
				UserID:  1,
				IsAdmin: true,
				User:    &portainer.User{ID: 1, Role: portainer.AdministratorRole},
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:            "admin can access template restricted to administrators",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{AdministratorsOnly: true},
			context: &security.RestrictedRequestContext{
				UserID:  1,
				IsAdmin: true,
				User:    &portainer.User{ID: 1, Role: portainer.AdministratorRole},
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:            "any user can access public template",
			createdByUserID: 1,
			resourceControl: &portainer.ResourceControl{Public: true},
			context: &security.RestrictedRequestContext{
				UserID: 4,
				User:   &portainer.User{ID: 4, Role: portainer.StandardUserRole},
			},
			expectedStatus: http.StatusOK,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			handler, store, _ := newTestHandler(t)

			err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
				err := tx.CustomTemplate().Create(&portainer.CustomTemplate{
					ID:              1,
					CreatedByUserID: tc.createdByUserID,
				})
				require.NoError(t, err)

				if tc.resourceControl == nil {
					return nil
				}

				tc.resourceControl.ID = 1
				tc.resourceControl.ResourceID = "1"
				tc.resourceControl.Type = portainer.CustomTemplateResourceControl

				return tx.ResourceControl().Create(tc.resourceControl)
			})
			require.NoError(t, err)

			r := httptest.NewRequest(http.MethodGet, "/custom_templates/1", nil)
			r = mux.SetURLVars(r, map[string]string{"id": "1"})
			r = r.WithContext(security.StoreRestrictedRequestContext(r, tc.context))
			rr := httptest.NewRecorder()

			herr := handler.customTemplateInspect(rr, r)

			if tc.expectedStatus == http.StatusOK {
				require.Nil(t, herr)
				require.Equal(t, http.StatusOK, rr.Code)

				var template portainer.CustomTemplate
				require.NoError(t, json.NewDecoder(rr.Body).Decode(&template))
				require.Equal(t, portainer.CustomTemplateID(1), template.ID)
			} else {
				require.NotNil(t, herr)
				require.Equal(t, tc.expectedStatus, herr.StatusCode)
			}
		})
	}
}

func TestInspectHandler_GitConfigPopulatedFromSource(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	var srcID portainer.SourceID
	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.GitSource{
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
