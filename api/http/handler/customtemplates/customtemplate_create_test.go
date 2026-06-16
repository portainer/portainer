package customtemplates

import (
	"bytes"
	"context"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"

	"github.com/gorilla/mux"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func createTemplateRequest(t *testing.T, method string, payload any, userID portainer.UserID, role portainer.UserRole) *http.Request {
	t.Helper()

	body, err := json.Marshal(payload)
	require.NoError(t, err)

	r := httptest.NewRequest(http.MethodPost, "/custom_templates/create/"+method, bytes.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	r = mux.SetURLVars(r, map[string]string{"method": method})

	return r.WithContext(security.StoreTokenData(r, &portainer.TokenData{ID: userID, Role: role}))
}

func TestCustomTemplateCreate_FromFileContent_Success(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	payload := customTemplateFromFileContentPayload{
		Title:       "My Template",
		Description: "A test template",
		FileContent: "version: '3'\nservices:\n  web:\n    image: nginx",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "string", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Code)

	var tmpl portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&tmpl))
	require.Equal(t, "My Template", tmpl.Title)
	require.Equal(t, "A test template", tmpl.Description)
	require.Equal(t, portainer.UserID(1), tmpl.CreatedByUserID)
	require.NotNil(t, tmpl.ResourceControl)

	err := ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		templates, err := tx.CustomTemplate().ReadAll()
		require.NoError(t, err)
		require.Len(t, templates, 1)
		require.Equal(t, "My Template", templates[0].Title)

		rcs, err := tx.ResourceControl().ReadAll()
		require.NoError(t, err)
		require.Len(t, rcs, 1)

		return nil
	})
	require.NoError(t, err)
}

func TestCustomTemplateCreate_FromFileContent_DuplicateTitle(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID:    1,
			Title: "Existing Template",
		})
	}))

	payload := customTemplateFromFileContentPayload{
		Title:       "Existing Template",
		Description: "Another template",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "string", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileContent_MissingTitle(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateFromFileContentPayload{
		Description: "A test template",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "string", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileContent_MissingDescription(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateFromFileContentPayload{
		Title:       "My Template",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "string", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileContent_MissingFileContent(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateFromFileContentPayload{
		Title:       "My Template",
		Description: "A test template",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "string", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileContent_InvalidPlatform(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateFromFileContentPayload{
		Title:       "My Template",
		Description: "A test template",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    0,
	}

	r := createTemplateRequest(t, "string", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileContent_NoteWithImage(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateFromFileContentPayload{
		Title:       "My Template",
		Description: "A test template",
		FileContent: "version: '3'",
		Note:        `Some note with <img src="x" onerror="alert(1)">`,
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "string", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileContent_KubernetesTypeIgnoresPlatform(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	payload := customTemplateFromFileContentPayload{
		Title:       "K8s Template",
		Description: "A kubernetes template",
		FileContent: "apiVersion: v1\nkind: Pod",
		Type:        portainer.KubernetesStack,
		Platform:    0,
	}

	r := createTemplateRequest(t, "string", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Code)

	var tmpl portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&tmpl))
	require.Equal(t, "K8s Template", tmpl.Title)
	require.Equal(t, portainer.KubernetesStack, tmpl.Type)

	err := ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		templates, err := tx.CustomTemplate().ReadAll()
		require.NoError(t, err)
		require.Len(t, templates, 1)

		return nil
	})
	require.NoError(t, err)
}

func TestCustomTemplateCreate_FromFileUpload_Success(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	err := writer.WriteField("Title", "Uploaded Template")
	require.NoError(t, err)

	err = writer.WriteField("Description", "Uploaded from file")
	require.NoError(t, err)

	err = writer.WriteField("Type", "2")
	require.NoError(t, err)

	err = writer.WriteField("Platform", "1")
	require.NoError(t, err)

	part, err := writer.CreateFormFile("File", "docker-compose.yml")
	require.NoError(t, err)

	_, err = part.Write([]byte("version: '3'\nservices:\n  web:\n    image: nginx"))
	require.NoError(t, err)

	require.NoError(t, writer.Close())

	r := httptest.NewRequest(http.MethodPost, "/custom_templates/create/file", &body)
	r.Header.Set("Content-Type", writer.FormDataContentType())
	r = mux.SetURLVars(r, map[string]string{"method": "file"})
	r = r.WithContext(security.StoreTokenData(r, &portainer.TokenData{ID: 1, Role: portainer.AdministratorRole}))

	rr := httptest.NewRecorder()
	herr := handler.customTemplateCreate(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Code)

	var tmpl portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&tmpl))
	require.Equal(t, "Uploaded Template", tmpl.Title)
	require.Equal(t, filesystem.ComposeFileDefaultName, tmpl.EntryPoint)

	err = ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		templates, err := tx.CustomTemplate().ReadAll()
		require.NoError(t, err)
		require.Len(t, templates, 1)

		return nil
	})
	require.NoError(t, err)
}

func TestCustomTemplateCreate_InvalidMethod(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateFromFileContentPayload{
		Title:       "My Template",
		Description: "A test template",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "invalid", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileContent_InvalidType(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateFromFileContentPayload{
		Title:       "My Template",
		Description: "A test template",
		FileContent: "version: '3'",
		Type:        0,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "string", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileContent_Variables(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	payload := customTemplateFromFileContentPayload{
		Title:       "Template With Variables",
		Description: "A test template",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
		Variables: []portainer.CustomTemplateVariableDefinition{
			{Name: "IMAGE", Label: "Docker image"},
		},
	}

	r := createTemplateRequest(t, "string", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Code)

	var tmpl portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&tmpl))
	require.Len(t, tmpl.Variables, 1)
	require.Equal(t, "IMAGE", tmpl.Variables[0].Name)

	err := ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		stored, err := tx.CustomTemplate().Read(tmpl.ID)
		require.NoError(t, err)
		require.Len(t, stored.Variables, 1)

		return nil
	})
	require.NoError(t, err)
}

func TestCustomTemplateCreate_FromFileContent_InvalidVariables(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateFromFileContentPayload{
		Title:       "My Template",
		Description: "A test template",
		FileContent: "version: '3'",
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
		Variables: []portainer.CustomTemplateVariableDefinition{
			{Label: "Missing name"},
		},
	}

	r := createTemplateRequest(t, "string", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileContent_EdgeTemplate(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	payload := customTemplateFromFileContentPayload{
		Title:        "Edge Template",
		Description:  "For edge stacks",
		FileContent:  "version: '3'\nservices:\n  web:\n    image: nginx",
		Type:         portainer.DockerComposeStack,
		Platform:     portainer.CustomTemplatePlatformLinux,
		EdgeTemplate: true,
	}

	r := createTemplateRequest(t, "string", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Code)

	var tmpl portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&tmpl))
	require.True(t, tmpl.EdgeTemplate)

	err := ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		stored, err := tx.CustomTemplate().Read(tmpl.ID)
		require.NoError(t, err)
		require.True(t, stored.EdgeTemplate)

		return nil
	})
	require.NoError(t, err)
}

func TestCustomTemplateCreate_FromFileUpload_MissingTitle(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	err := writer.WriteField("Description", "A description")
	require.NoError(t, err)

	err = writer.WriteField("Type", "2")
	require.NoError(t, err)

	err = writer.WriteField("Platform", "1")
	require.NoError(t, err)

	part, err := writer.CreateFormFile("File", "docker-compose.yml")
	require.NoError(t, err)

	_, err = part.Write([]byte("version: '3'"))
	require.NoError(t, err)

	require.NoError(t, writer.Close())

	r := httptest.NewRequest(http.MethodPost, "/custom_templates/create/file", &body)
	r.Header.Set("Content-Type", writer.FormDataContentType())
	r = mux.SetURLVars(r, map[string]string{"method": "file"})
	r = r.WithContext(security.StoreTokenData(r, &portainer.TokenData{ID: 1, Role: portainer.AdministratorRole}))

	rr := httptest.NewRecorder()
	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileUpload_MissingDescription(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	err := writer.WriteField("Title", "My Template")
	require.NoError(t, err)

	err = writer.WriteField("Type", "2")
	require.NoError(t, err)

	err = writer.WriteField("Platform", "1")
	require.NoError(t, err)

	part, err := writer.CreateFormFile("File", "docker-compose.yml")
	require.NoError(t, err)

	_, err = part.Write([]byte("version: '3'"))
	require.NoError(t, err)

	require.NoError(t, writer.Close())

	r := httptest.NewRequest(http.MethodPost, "/custom_templates/create/file", &body)
	r.Header.Set("Content-Type", writer.FormDataContentType())
	r = mux.SetURLVars(r, map[string]string{"method": "file"})
	r = r.WithContext(security.StoreTokenData(r, &portainer.TokenData{ID: 1, Role: portainer.AdministratorRole}))

	rr := httptest.NewRecorder()
	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileUpload_MissingFile(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	err := writer.WriteField("Title", "My Template")
	require.NoError(t, err)

	err = writer.WriteField("Description", "A description")
	require.NoError(t, err)

	err = writer.WriteField("Type", "2")
	require.NoError(t, err)

	err = writer.WriteField("Platform", "1")
	require.NoError(t, err)

	require.NoError(t, writer.Close())

	r := httptest.NewRequest(http.MethodPost, "/custom_templates/create/file", &body)
	r.Header.Set("Content-Type", writer.FormDataContentType())
	r = mux.SetURLVars(r, map[string]string{"method": "file"})
	r = r.WithContext(security.StoreTokenData(r, &portainer.TokenData{ID: 1, Role: portainer.AdministratorRole}))

	rr := httptest.NewRecorder()
	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileUpload_InvalidType(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	err := writer.WriteField("Title", "My Template")
	require.NoError(t, err)

	err = writer.WriteField("Description", "A description")
	require.NoError(t, err)

	err = writer.WriteField("Type", "0")
	require.NoError(t, err)

	err = writer.WriteField("Platform", "1")
	require.NoError(t, err)

	part, err := writer.CreateFormFile("File", "docker-compose.yml")
	require.NoError(t, err)

	_, err = part.Write([]byte("version: '3'"))
	require.NoError(t, err)

	require.NoError(t, writer.Close())

	r := httptest.NewRequest(http.MethodPost, "/custom_templates/create/file", &body)
	r.Header.Set("Content-Type", writer.FormDataContentType())
	r = mux.SetURLVars(r, map[string]string{"method": "file"})
	r = r.WithContext(security.StoreTokenData(r, &portainer.TokenData{ID: 1, Role: portainer.AdministratorRole}))

	rr := httptest.NewRecorder()
	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileUpload_InvalidPlatform(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	err := writer.WriteField("Title", "My Template")
	require.NoError(t, err)

	err = writer.WriteField("Description", "A description")
	require.NoError(t, err)

	err = writer.WriteField("Type", "2")
	require.NoError(t, err)

	err = writer.WriteField("Platform", "0")
	require.NoError(t, err)

	part, err := writer.CreateFormFile("File", "docker-compose.yml")
	require.NoError(t, err)

	_, err = part.Write([]byte("version: '3'"))
	require.NoError(t, err)

	require.NoError(t, writer.Close())

	r := httptest.NewRequest(http.MethodPost, "/custom_templates/create/file", &body)
	r.Header.Set("Content-Type", writer.FormDataContentType())
	r = mux.SetURLVars(r, map[string]string{"method": "file"})
	r = r.WithContext(security.StoreTokenData(r, &portainer.TokenData{ID: 1, Role: portainer.AdministratorRole}))

	rr := httptest.NewRecorder()
	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileUpload_NoteWithImage(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	err := writer.WriteField("Title", "My Template")
	require.NoError(t, err)

	err = writer.WriteField("Description", "A description")
	require.NoError(t, err)

	err = writer.WriteField("Note", `Some note <img src="x" onerror="alert(1)">`)
	require.NoError(t, err)

	err = writer.WriteField("Type", "2")
	require.NoError(t, err)

	err = writer.WriteField("Platform", "1")
	require.NoError(t, err)

	part, err := writer.CreateFormFile("File", "docker-compose.yml")
	require.NoError(t, err)

	_, err = part.Write([]byte("version: '3'"))
	require.NoError(t, err)

	require.NoError(t, writer.Close())

	r := httptest.NewRequest(http.MethodPost, "/custom_templates/create/file", &body)
	r.Header.Set("Content-Type", writer.FormDataContentType())
	r = mux.SetURLVars(r, map[string]string{"method": "file"})
	r = r.WithContext(security.StoreTokenData(r, &portainer.TokenData{ID: 1, Role: portainer.AdministratorRole}))

	rr := httptest.NewRecorder()
	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromFileUpload_KubernetesIgnoresPlatform(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	err := writer.WriteField("Title", "K8s Upload Template")
	require.NoError(t, err)

	err = writer.WriteField("Description", "A kubernetes template")
	require.NoError(t, err)

	err = writer.WriteField("Type", "3")
	require.NoError(t, err)

	err = writer.WriteField("Platform", "0")
	require.NoError(t, err)

	part, err := writer.CreateFormFile("File", "deployment.yml")
	require.NoError(t, err)

	_, err = part.Write([]byte("apiVersion: v1\nkind: Pod"))
	require.NoError(t, err)

	require.NoError(t, writer.Close())

	r := httptest.NewRequest(http.MethodPost, "/custom_templates/create/file", &body)
	r.Header.Set("Content-Type", writer.FormDataContentType())
	r = mux.SetURLVars(r, map[string]string{"method": "file"})
	r = r.WithContext(security.StoreTokenData(r, &portainer.TokenData{ID: 1, Role: portainer.AdministratorRole}))

	rr := httptest.NewRecorder()
	herr := handler.customTemplateCreate(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Code)

	var tmpl portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&tmpl))
	require.Equal(t, "K8s Upload Template", tmpl.Title)
	require.Equal(t, filesystem.ComposeFileDefaultName, tmpl.EntryPoint)

	err = ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		templates, err := tx.CustomTemplate().ReadAll()
		require.NoError(t, err)
		require.Len(t, templates, 1)

		return nil
	})
	require.NoError(t, err)
}

func TestCustomTemplateCreate_FromFileUpload_Variables(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	vars, err := json.Marshal([]portainer.CustomTemplateVariableDefinition{{Name: "IMAGE", Label: "Docker image"}})
	require.NoError(t, err)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	err = writer.WriteField("Title", "Template With Variables")
	require.NoError(t, err)

	err = writer.WriteField("Description", "A description")
	require.NoError(t, err)

	err = writer.WriteField("Type", "2")
	require.NoError(t, err)

	err = writer.WriteField("Platform", "1")
	require.NoError(t, err)

	err = writer.WriteField("Variables", string(vars))
	require.NoError(t, err)

	part, err := writer.CreateFormFile("File", "docker-compose.yml")
	require.NoError(t, err)

	_, err = part.Write([]byte("version: '3'"))
	require.NoError(t, err)

	require.NoError(t, writer.Close())

	r := httptest.NewRequest(http.MethodPost, "/custom_templates/create/file", &body)
	r.Header.Set("Content-Type", writer.FormDataContentType())
	r = mux.SetURLVars(r, map[string]string{"method": "file"})
	r = r.WithContext(security.StoreTokenData(r, &portainer.TokenData{ID: 1, Role: portainer.AdministratorRole}))

	rr := httptest.NewRecorder()
	herr := handler.customTemplateCreate(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Code)

	var tmpl portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&tmpl))
	require.Len(t, tmpl.Variables, 1)
	require.Equal(t, "IMAGE", tmpl.Variables[0].Name)

	err = ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		stored, err := tx.CustomTemplate().Read(tmpl.ID)
		require.NoError(t, err)
		require.Len(t, stored.Variables, 1)

		return nil
	})
	require.NoError(t, err)
}

func TestCustomTemplateCreate_FromFileUpload_InvalidVariables(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	err := writer.WriteField("Title", "My Template")
	require.NoError(t, err)

	err = writer.WriteField("Description", "A description")
	require.NoError(t, err)

	err = writer.WriteField("Type", "2")
	require.NoError(t, err)

	err = writer.WriteField("Platform", "1")
	require.NoError(t, err)

	err = writer.WriteField("Variables", "not-valid-json")
	require.NoError(t, err)

	part, err := writer.CreateFormFile("File", "docker-compose.yml")
	require.NoError(t, err)

	_, err = part.Write([]byte("version: '3'"))
	require.NoError(t, err)

	require.NoError(t, writer.Close())

	r := httptest.NewRequest(http.MethodPost, "/custom_templates/create/file", &body)
	r.Header.Set("Content-Type", writer.FormDataContentType())
	r = mux.SetURLVars(r, map[string]string{"method": "file"})
	r = r.WithContext(security.StoreTokenData(r, &portainer.TokenData{ID: 1, Role: portainer.AdministratorRole}))

	rr := httptest.NewRecorder()
	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

type gitServiceCreatingFile struct {
	portainer.GitService
}

func (g *gitServiceCreatingFile) CloneRepository(_ context.Context, destination, _, _, _, _ string, _ bool) error {
	if err := os.MkdirAll(destination, 0700); err != nil {
		return err
	}

	f, err := os.Create(filesystem.JoinPaths(destination, filesystem.ComposeFileDefaultName))
	if err != nil {
		return err
	}

	return f.Close()
}

func (g *gitServiceCreatingFile) LatestCommitID(_ context.Context, _, _, _, _ string, _ bool) (string, error) {
	return "deadbeef123", nil
}

func TestCustomTemplateCreate_FromRepository_Success(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)
	handler.GitService = &gitServiceCreatingFile{}

	payload := customTemplateFromGitRepositoryPayload{
		Title:         "Git Template",
		Description:   "Created from git",
		RepositoryURL: "https://github.com/example/repo",
		Type:          portainer.DockerComposeStack,
		Platform:      portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "repository", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Code)

	var tmpl portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&tmpl))
	require.Equal(t, "Git Template", tmpl.Title)
	require.NotNil(t, tmpl.Artifact)
	require.Len(t, tmpl.Artifact.Files, 1)
	require.Equal(t, "deadbeef123", tmpl.Artifact.Files[0].Hash)

	err := ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		stored, err := tx.CustomTemplate().Read(tmpl.ID)
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

func TestCustomTemplateCreate_FromRepository_DeduplicatesSource(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)
	handler.GitService = &gitServiceCreatingFile{}

	makePayload := func(title string) customTemplateFromGitRepositoryPayload {
		return customTemplateFromGitRepositoryPayload{
			Title:         title,
			Description:   "Created from git",
			RepositoryURL: "https://github.com/example/repo",
			Type:          portainer.DockerComposeStack,
			Platform:      portainer.CustomTemplatePlatformLinux,
		}
	}

	r1 := createTemplateRequest(t, "repository", makePayload("Template One"), 1, portainer.AdministratorRole)
	rr1 := httptest.NewRecorder()
	herr := handler.customTemplateCreate(rr1, r1)
	require.Nil(t, herr)

	r2 := createTemplateRequest(t, "repository", makePayload("Template Two"), 1, portainer.AdministratorRole)
	rr2 := httptest.NewRecorder()
	herr = handler.customTemplateCreate(rr2, r2)
	require.Nil(t, herr)

	err := ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		sources, err := tx.Source().ReadAll()
		require.NoError(t, err)
		require.Len(t, sources, 1, "two templates with the same URL must share one Source")

		return nil
	})
	require.NoError(t, err)
}

func TestCustomTemplateCreate_FromRepository_Validation_MissingTitle(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateFromGitRepositoryPayload{
		Description:   "A description",
		RepositoryURL: "https://github.com/example/repo",
		Type:          portainer.DockerComposeStack,
		Platform:      portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "repository", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromRepository_Validation_MissingDescription(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateFromGitRepositoryPayload{
		Title:         "My Template",
		RepositoryURL: "https://github.com/example/repo",
		Type:          portainer.DockerComposeStack,
		Platform:      portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "repository", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromRepository_Validation_InvalidURL(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateFromGitRepositoryPayload{
		Title:         "My Template",
		Description:   "A description",
		RepositoryURL: "http://",
		Type:          portainer.DockerComposeStack,
		Platform:      portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "repository", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromRepository_Validation_AuthWithoutCredentials(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateFromGitRepositoryPayload{
		Title:                    "My Template",
		Description:              "A description",
		RepositoryURL:            "https://github.com/example/repo",
		RepositoryAuthentication: true,
		Type:                     portainer.DockerComposeStack,
		Platform:                 portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "repository", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromRepository_Validation_InvalidPlatform(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateFromGitRepositoryPayload{
		Title:         "My Template",
		Description:   "A description",
		RepositoryURL: "https://github.com/example/repo",
		Type:          portainer.DockerComposeStack,
		Platform:      0,
	}

	r := createTemplateRequest(t, "repository", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromRepository_Validation_InvalidType(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	payload := customTemplateFromGitRepositoryPayload{
		Title:         "My Template",
		Description:   "A description",
		RepositoryURL: "https://github.com/example/repo",
		Type:          0,
		Platform:      portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "repository", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}

func TestCustomTemplateCreate_FromRepository_WithSourceID_Success(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)
	handler.GitService = &gitServiceCreatingFile{}

	var srcID portainer.SourceID
	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Name: "example/repo",
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
				URL: "https://github.com/example/repo",
			},
		}
		err := tx.Source().Create(src)
		require.NoError(t, err)
		srcID = src.ID
		return nil
	}))

	payload := customTemplateFromGitRepositoryPayload{
		Title:       "Source Template",
		Description: "Created from source ID",
		SourceID:    srcID,
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "repository", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.Nil(t, herr)
	require.Equal(t, http.StatusOK, rr.Code)

	var tmpl portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&tmpl))
	require.NotNil(t, tmpl.Artifact)
	require.Len(t, tmpl.Artifact.Files, 1)
	require.Equal(t, srcID, tmpl.Artifact.Files[0].SourceID)
	require.Equal(t, "deadbeef123", tmpl.Artifact.Files[0].Hash)
}

func TestCustomTemplateCreate_FromRepository_WithSourceID_NonExistentSource(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)
	handler.GitService = &gitServiceCreatingFile{}

	payload := customTemplateFromGitRepositoryPayload{
		Title:       "Source Template",
		Description: "Created from non-existent source ID",
		SourceID:    999,
		Type:        portainer.DockerComposeStack,
		Platform:    portainer.CustomTemplatePlatformLinux,
	}

	r := createTemplateRequest(t, "repository", payload, 1, portainer.AdministratorRole)
	rr := httptest.NewRecorder()

	herr := handler.customTemplateCreate(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusInternalServerError, herr.StatusCode)
}
