package customtemplates

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"

	"github.com/gorilla/mux"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestCustomTemplateFile_NotFound(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	r := httptest.NewRequest(http.MethodGet, "/custom_templates/99/file", nil)
	r = mux.SetURLVars(r, map[string]string{"id": "99"})
	r = r.WithContext(security.StoreRestrictedRequestContext(
		r,
		&security.RestrictedRequestContext{UserID: 1, IsAdmin: true},
	))
	rr := httptest.NewRecorder()

	herr := handler.customTemplateFile(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusNotFound, herr.StatusCode)
}

func TestCustomTemplateFile_AccessControl(t *testing.T) {
	t.Parallel()

	const templateContent = "some template content"
	const templateEntrypoint = "entrypoint"

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
			context:         &security.RestrictedRequestContext{UserID: 2},
			expectedStatus:  http.StatusForbidden,
		},
		{
			name:            "creator is forbidden without resource control",
			createdByUserID: 2,
			context:         &security.RestrictedRequestContext{UserID: 2},
			expectedStatus:  http.StatusForbidden,
		},
		{
			name:            "creator is forbidden when an admin restricted the template to administrators",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{AdministratorsOnly: true},
			context:         &security.RestrictedRequestContext{UserID: 2},
			expectedStatus:  http.StatusForbidden,
		},
		{
			name:            "creator is forbidden when the resource control only grants access to another user",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{
				UserAccesses: []portainer.UserResourceAccess{{UserID: 3}},
				TeamAccesses: []portainer.TeamResourceAccess{{TeamID: 1}},
			},
			context:        &security.RestrictedRequestContext{UserID: 2},
			expectedStatus: http.StatusForbidden,
		},
		{
			name:            "non-creator is forbidden when the resource control only grants access to the creator",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{
				UserAccesses: []portainer.UserResourceAccess{{UserID: 2}},
				TeamAccesses: []portainer.TeamResourceAccess{{TeamID: 1}},
			},
			context:        &security.RestrictedRequestContext{UserID: 3},
			expectedStatus: http.StatusForbidden,
		},
		{
			name:            "creator with access can access template",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{UserAccesses: []portainer.UserResourceAccess{{UserID: 2}}},
			context:         &security.RestrictedRequestContext{UserID: 2},
			expectedStatus:  http.StatusOK,
		},
		{
			name:            "non-creator with access can access template",
			createdByUserID: 3,
			resourceControl: &portainer.ResourceControl{UserAccesses: []portainer.UserResourceAccess{{UserID: 2}}},
			context:         &security.RestrictedRequestContext{UserID: 2},
			expectedStatus:  http.StatusOK,
		},
		{
			name:            "creator can access template via team access",
			createdByUserID: 3,
			resourceControl: &portainer.ResourceControl{TeamAccesses: []portainer.TeamResourceAccess{{TeamID: 1}}},
			context: &security.RestrictedRequestContext{
				UserID:          3,
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
				UserMemberships: []portainer.TeamMembership{{ID: 1, UserID: 3, TeamID: 1}},
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:            "admin can access template without resource control",
			createdByUserID: 2,
			context:         &security.RestrictedRequestContext{UserID: 1, IsAdmin: true},
			expectedStatus:  http.StatusOK,
		},
		{
			name:            "admin can access template restricted to administrators",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{AdministratorsOnly: true},
			context:         &security.RestrictedRequestContext{UserID: 1, IsAdmin: true},
			expectedStatus:  http.StatusOK,
		},
		{
			name:            "any user can access public template",
			createdByUserID: 1,
			resourceControl: &portainer.ResourceControl{Public: true},
			context:         &security.RestrictedRequestContext{UserID: 4},
			expectedStatus:  http.StatusOK,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			handler, store, fs := newTestHandler(t)

			err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
				path, err := fs.StoreCustomTemplateFileFromBytes("1", templateEntrypoint, []byte(templateContent))
				require.NoError(t, err)

				err = tx.CustomTemplate().Create(&portainer.CustomTemplate{
					ID:              1,
					EntryPoint:      templateEntrypoint,
					ProjectPath:     path,
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

			r := httptest.NewRequest(http.MethodGet, "/custom_templates/1/file", nil)
			r = mux.SetURLVars(r, map[string]string{"id": "1"})
			r = r.WithContext(security.StoreRestrictedRequestContext(r, tc.context))
			rr := httptest.NewRecorder()

			herr := handler.customTemplateFile(rr, r)

			if tc.expectedStatus == http.StatusOK {
				require.Nil(t, herr)
				require.Equal(t, http.StatusOK, rr.Code)

				var res struct{ FileContent string }
				require.NoError(t, json.NewDecoder(rr.Body).Decode(&res))
				require.Equal(t, templateContent, res.FileContent)
			} else {
				require.NotNil(t, herr)
				require.Equal(t, tc.expectedStatus, herr.StatusCode)
				return
			}
		})
	}
}

func TestCustomTemplateFile_GitTemplate(t *testing.T) {
	t.Parallel()

	handler, ds, fs := newTestHandler(t)

	templateContent := "git template content"
	configFilePath := "docker-compose.yml"

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.GitSource{URL: "https://github.com/example/repo"},
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)

		path, err := fs.StoreCustomTemplateFileFromBytes("10", configFilePath, []byte(templateContent))
		require.NoError(t, err)

		return tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID:          10,
			EntryPoint:  "should-not-be-used.yml",
			ProjectPath: path,
			Artifact: &portainer.Artifact{
				Files: []portainer.ArtifactFile{{Path: configFilePath, SourceID: src.ID}},
			},
		})
	}))

	r := httptest.NewRequest(http.MethodGet, "/custom_templates/10/file", nil)
	r = mux.SetURLVars(r, map[string]string{"id": "10"})
	ctx := security.StoreRestrictedRequestContext(r, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	r = r.WithContext(ctx)
	rr := httptest.NewRecorder()
	herr := handler.customTemplateFile(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Result().StatusCode)

	var res struct{ FileContent string }
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&res))
	require.Equal(t, templateContent, res.FileContent)
}
