package customtemplates

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"

	"github.com/gorilla/mux"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func updateTemplateRequest(t *testing.T, templateID string, payload any, ctx *security.RestrictedRequestContext) *http.Request {
	t.Helper()

	body, err := json.Marshal(payload)
	require.NoError(t, err)

	r := httptest.NewRequest(http.MethodPut, "/custom_templates/"+templateID, bytes.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	r = mux.SetURLVars(r, map[string]string{"id": templateID})

	return r.WithContext(security.StoreRestrictedRequestContext(r, ctx))
}

func TestCustomTemplateUpdate_NotFound(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateUpdatePayload{
		Title:       "New Title",
		Description: "New Description",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := updateTemplateRequest(t, "99", payload, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusNotFound, herr.StatusCode)
}

func TestCustomTemplateUpdate_Forbidden(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID:              1,
			Title:           "Original Title",
			EntryPoint:      filesystem.ComposeFileDefaultName,
			CreatedByUserID: 1,
		})
	}))

	payload := customTemplateUpdatePayload{
		Title:       "New Title",
		Description: "New Description",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	// User 2 did not create this template and is not an admin
	r := updateTemplateRequest(t, "1", payload, &security.RestrictedRequestContext{UserID: 2})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusForbidden, herr.StatusCode)
}

func TestCustomTemplateUpdate_DuplicateTitle(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID:    1,
			Title: "Template One",
		}))

		return tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID:    2,
			Title: "Template Two",
		})
	}))

	payload := customTemplateUpdatePayload{
		Title:       "Template One",
		Description: "Renamed",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := updateTemplateRequest(t, "2", payload, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateUpdate_Success_FileContent(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID:              1,
			Title:           "Original Title",
			Description:     "Original Description",
			EntryPoint:      filesystem.ComposeFileDefaultName,
			Type:            portainer.DockerComposeStack,
			Platform:        portainer.CustomTemplatePlatformLinux,
			CreatedByUserID: 1,
		})
	}))

	payload := customTemplateUpdatePayload{
		Title:       "Updated Title",
		Description: "Updated Description",
		FileContent: "version: '3'\nservices:\n  app:\n    image: alpine",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := updateTemplateRequest(t, "1", payload, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Code)

	var tmpl portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&tmpl))
	require.Equal(t, "Updated Title", tmpl.Title)
	require.Equal(t, "Updated Description", tmpl.Description)

	err := ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		stored, err := tx.CustomTemplate().Read(1)
		require.NoError(t, err)
		require.Equal(t, "Updated Title", stored.Title)
		require.Equal(t, "Updated Description", stored.Description)

		return nil
	})
	require.NoError(t, err)
}

func TestCustomTemplateUpdate_OwnerCanUpdate(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID:              1,
			Title:           "User Template",
			EntryPoint:      filesystem.ComposeFileDefaultName,
			Type:            portainer.DockerComposeStack,
			Platform:        portainer.CustomTemplatePlatformLinux,
			CreatedByUserID: 2,
		})
	}))

	payload := customTemplateUpdatePayload{
		Title:       "User Template Updated",
		Description: "Updated by owner",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	// User 2 is the creator, not an admin
	r := updateTemplateRequest(t, "1", payload, &security.RestrictedRequestContext{UserID: 2})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Code)

	var tmpl portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&tmpl))
	require.Equal(t, "User Template Updated", tmpl.Title)
}

func TestCustomTemplateUpdate_SameTitleAllowed(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID:         1,
			Title:      "My Template",
			EntryPoint: filesystem.ComposeFileDefaultName,
		})
	}))

	payload := customTemplateUpdatePayload{
		Title:       "My Template",
		Description: "Updated description",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := updateTemplateRequest(t, "1", payload, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Code)

	err := ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		stored, err := tx.CustomTemplate().Read(1)
		require.NoError(t, err)
		require.Equal(t, "My Template", stored.Title)
		require.Equal(t, "Updated description", stored.Description)

		return nil
	})
	require.NoError(t, err)
}

func TestCustomTemplateUpdate_InvalidPayload(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID:         1,
			Title:      "My Template",
			EntryPoint: filesystem.ComposeFileDefaultName,
		})
	}))

	payload := customTemplateUpdatePayload{
		// Title is empty - invalid
		Description: "A description",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := updateTemplateRequest(t, "1", payload, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusBadRequest, herr.StatusCode)
}

func TestCustomTemplateUpdate_Validation_MissingDescription(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateUpdatePayload{
		Title:       "My Template",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := updateTemplateRequest(t, "99", payload, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusBadRequest, herr.StatusCode)
}

func TestCustomTemplateUpdate_Validation_BothContentAndRepoMissing(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateUpdatePayload{
		Title:       "My Template",
		Description: "A description",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := updateTemplateRequest(t, "99", payload, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusBadRequest, herr.StatusCode)
}

func TestCustomTemplateUpdate_Validation_InvalidPlatform(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateUpdatePayload{
		Title:       "My Template",
		Description: "A description",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    0,
	}

	r := updateTemplateRequest(t, "99", payload, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusBadRequest, herr.StatusCode)
}

func TestCustomTemplateUpdate_Validation_InvalidType(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateUpdatePayload{
		Title:       "My Template",
		Description: "A description",
		FileContent: "version: '3'",
		Type:        0,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := updateTemplateRequest(t, "99", payload, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusBadRequest, herr.StatusCode)
}

func TestCustomTemplateUpdate_Validation_NoteWithImage(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateUpdatePayload{
		Title:       "My Template",
		Description: "A description",
		FileContent: "version: '3'",
		Note:        `Some note <img src="x" onerror="alert(1)">`,
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := updateTemplateRequest(t, "99", payload, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusBadRequest, herr.StatusCode)
}

func TestCustomTemplateUpdate_Validation_AuthWithoutCredentials(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateUpdatePayload{
		Title:                    "My Template",
		Description:              "A description",
		RepositoryURL:            "https://github.com/example/repo",
		Type:                     portainer.DockerComposeStack,
		Platform:                 portainer.CustomTemplatePlatformLinux,
		RepositoryAuthentication: true,
	}

	r := updateTemplateRequest(t, "99", payload, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusBadRequest, herr.StatusCode)
}

func TestCustomTemplateUpdate_ClearsArtifact(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID:              1,
			Title:           "Git Template",
			EntryPoint:      filesystem.ComposeFileDefaultName,
			Type:            portainer.DockerComposeStack,
			Platform:        portainer.CustomTemplatePlatformLinux,
			CreatedByUserID: 1,
			Artifact: &portainer.Artifact{
				Files: []portainer.ArtifactFile{},
			},
		})
	}))

	payload := customTemplateUpdatePayload{
		Title:       "Git Template",
		Description: "Updated with file content",
		FileContent: "version: '3'\nservices:\n  app:\n    image: alpine",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := updateTemplateRequest(t, "1", payload, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Code)

	var tmpl portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&tmpl))
	require.Nil(t, tmpl.Artifact)

	err := ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		stored, err := tx.CustomTemplate().Read(1)
		require.NoError(t, err)
		require.Nil(t, stored.Artifact)

		return nil
	})
	require.NoError(t, err)
}

func TestCustomTemplateUpdate_GitRepository_Success(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)
	handler.GitService = &gitServiceCreatingFile{}

	projectDir := t.TempDir()

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID:              1,
			Title:           "Git Template",
			EntryPoint:      filesystem.ComposeFileDefaultName,
			Type:            portainer.DockerComposeStack,
			Platform:        portainer.CustomTemplatePlatformLinux,
			CreatedByUserID: 1,
			ProjectPath:     projectDir,
		})
	}))

	payload := customTemplateUpdatePayload{
		Title:                       "Git Template",
		Description:                 "Updated via git",
		RepositoryURL:               "https://github.com/example/repo",
		RepositoryReferenceName:     "refs/heads/main",
		ComposeFilePathInRepository: filesystem.ComposeFileDefaultName,
		Type:                        portainer.DockerComposeStack,
		Platform:                    portainer.CustomTemplatePlatformLinux,
	}

	r := updateTemplateRequest(t, "1", payload, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	rr := httptest.NewRecorder()

	herr := handler.customTemplateUpdate(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Code)

	var tmpl portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&tmpl))
	require.NotNil(t, tmpl.Artifact)
	require.Len(t, tmpl.Artifact.Files, 1)
	require.Equal(t, "deadbeef123", tmpl.Artifact.Files[0].Hash)

	err := ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		stored, err := tx.CustomTemplate().Read(1)
		require.NoError(t, err)
		require.NotNil(t, stored.Artifact)

		src, err := tx.Source().Read(stored.Artifact.Files[0].SourceID)
		require.NoError(t, err)
		require.Equal(t, portainer.SourceTypeGit, src.Type)
		require.Equal(t, "https://github.com/example/repo", src.Git.URL)

		return nil
	})
	require.NoError(t, err)
}
