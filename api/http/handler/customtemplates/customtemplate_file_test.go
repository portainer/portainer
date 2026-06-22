package customtemplates

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestCustomTemplateFile(t *testing.T) {
	t.Parallel()

	handler, ds, fs := newTestHandler(t)

	templateContent := "some template content"
	templateEntrypoint := "entrypoint"

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		// template 1
		path, err := fs.StoreCustomTemplateFileFromBytes("1", templateEntrypoint, []byte(templateContent))
		require.NoError(t, err)
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 1, EntryPoint: templateEntrypoint, ProjectPath: path}))

		// template 2
		path, err = fs.StoreCustomTemplateFileFromBytes("2", templateEntrypoint, []byte(templateContent))
		require.NoError(t, err)
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 2, EntryPoint: templateEntrypoint, ProjectPath: path}))

		require.NoError(t, tx.ResourceControl().Create(&portainer.ResourceControl{
			ID: 1, ResourceID: "2", Type: portainer.CustomTemplateResourceControl,
			UserAccesses: []portainer.UserResourceAccess{{UserID: 2}},
			TeamAccesses: []portainer.TeamResourceAccess{{TeamID: 1}},
		}))
		return nil
	}))

	test := func(templateID string, restrictedContext *security.RestrictedRequestContext) (*httptest.ResponseRecorder, *httperror.HandlerError) {
		r := httptest.NewRequest(http.MethodGet, "/custom_templates/"+templateID+"/file", nil)
		r = mux.SetURLVars(r, map[string]string{"id": templateID})
		ctx := security.StoreRestrictedRequestContext(r, restrictedContext)
		r = r.WithContext(ctx)
		rr := httptest.NewRecorder()
		return rr, handler.customTemplateFile(rr, r)
	}

	t.Run("unknown id should get not found error", func(t *testing.T) {
		_, r := test("0", &security.RestrictedRequestContext{UserID: 1})
		require.NotNil(t, r)
		require.Equal(t, http.StatusNotFound, r.StatusCode)
	})

	t.Run("admin should access adminonly template", func(t *testing.T) {
		rr, r := test("1", &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
		require.Nil(t, r)
		require.Equal(t, http.StatusOK, rr.Result().StatusCode)

		var res struct{ FileContent string }
		require.NoError(t, json.NewDecoder(rr.Body).Decode(&res))
		require.Equal(t, templateContent, res.FileContent)
	})

	t.Run("std should not access adminonly template", func(t *testing.T) {
		_, r := test("1", &security.RestrictedRequestContext{UserID: 2})
		require.NotNil(t, r)
		require.Equal(t, http.StatusForbidden, r.StatusCode)
	})

	t.Run("std should access template via direct user access", func(t *testing.T) {
		rr, r := test("2", &security.RestrictedRequestContext{UserID: 2})
		require.Nil(t, r)
		require.Equal(t, http.StatusOK, rr.Result().StatusCode)

		var res struct{ FileContent string }
		require.NoError(t, json.NewDecoder(rr.Body).Decode(&res))
		require.Equal(t, templateContent, res.FileContent)
	})

	t.Run("std should access template via team access", func(t *testing.T) {
		rr, r := test("2", &security.RestrictedRequestContext{UserID: 3, UserMemberships: []portainer.TeamMembership{{ID: 1, UserID: 3, TeamID: 1}}})
		require.Nil(t, r)
		require.Equal(t, http.StatusOK, rr.Result().StatusCode)

		var res struct{ FileContent string }
		require.NoError(t, json.NewDecoder(rr.Body).Decode(&res))
		require.Equal(t, templateContent, res.FileContent)
	})

	t.Run("std should not access template without access", func(t *testing.T) {
		_, r := test("2", &security.RestrictedRequestContext{UserID: 4})
		require.NotNil(t, r)
		require.Equal(t, http.StatusForbidden, r.StatusCode)
	})
}

func TestCustomTemplateFile_CreatorDeniedWhenAdminOnly(t *testing.T) {
	t.Parallel()

	handler, store, fs := newTestHandler(t)

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		path, err := fs.StoreCustomTemplateFileFromBytes("5", "entrypoint", []byte("content"))
		require.NoError(t, err)

		err = tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID:              5,
			EntryPoint:      "entrypoint",
			ProjectPath:     path,
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

	r := httptest.NewRequest(http.MethodGet, "/custom_templates/5/file", nil)
	r = mux.SetURLVars(r, map[string]string{"id": "5"})
	r = r.WithContext(security.StoreRestrictedRequestContext(r, &security.RestrictedRequestContext{UserID: 2}))
	rr := httptest.NewRecorder()

	herr := handler.customTemplateFile(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusForbidden, herr.StatusCode)
}

func TestCustomTemplateFile_GitTemplate(t *testing.T) {
	t.Parallel()

	handler, ds, fs := newTestHandler(t)

	templateContent := "git template content"
	configFilePath := "docker-compose.yml"

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.RepoConfig{URL: "https://github.com/example/repo"},
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
