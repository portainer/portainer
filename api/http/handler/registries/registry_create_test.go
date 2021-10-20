package registries

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/stretchr/testify/assert"
)

func Test_registryCreatePayload_Validate(t *testing.T) {
	basePayload := registryCreatePayload{Name: "Test registry", URL: "http://example.com"}
	t.Run("Can't create a ProGet registry if BaseURL is empty", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.ProGetRegistry
		err := payload.Validate(nil)
		assert.Error(t, err)
	})
	t.Run("Can create a GitLab registry if BaseURL is empty", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.GitlabRegistry
		err := payload.Validate(nil)
		assert.NoError(t, err)
	})
	t.Run("Can create a ProGet registry if BaseURL is not empty", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.ProGetRegistry
		payload.BaseURL = "http://example.com"
		err := payload.Validate(nil)
		assert.NoError(t, err)
	})
	t.Run("Can't create a AWS ECR registry if authentication required, but access key ID, secret access key or region is empty", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.EcrRegistry
		payload.Authentication = true
		err := payload.Validate(nil)
		assert.Error(t, err)
	})
	t.Run("Do not require access key ID, secret access key, region for public AWS ECR registry", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.EcrRegistry
		payload.Authentication = false
		err := payload.Validate(nil)
		assert.NoError(t, err)
	})
}

type testRegistryService struct {
	dataservices.RegistryService
	createRegistry func(r *portainer.Registry) error
	updateRegistry func(ID portainer.RegistryID, r *portainer.Registry) error
	getRegistry    func(ID portainer.RegistryID) (*portainer.Registry, error)
}

type testDataStore struct {
	dataservices.DataStore
	registry *testRegistryService
}

func (t testDataStore) Registry() dataservices.RegistryService {
	return t.registry
}

func (t testRegistryService) CreateRegistry(r *portainer.Registry) error {
	return t.createRegistry(r)
}

func (t testRegistryService) UpdateRegistry(ID portainer.RegistryID, r *portainer.Registry) error {
	return t.updateRegistry(ID, r)
}

func (t testRegistryService) Registry(ID portainer.RegistryID) (*portainer.Registry, error) {
	return t.getRegistry(ID)
}

func (t testRegistryService) Registries() ([]portainer.Registry, error) {
	return nil, nil
}

func (t testRegistryService) Create(registry *portainer.Registry) error {
	return nil
}

// Not entirely sure what this is intended to test
func deleteTestHandler_registryCreate(t *testing.T) {
	payload := registryCreatePayload{
		Name:           "Test registry",
		Type:           portainer.ProGetRegistry,
		URL:            "http://example.com",
		BaseURL:        "http://example.com",
		Authentication: false,
		Username:       "username",
		Password:       "password",
		Gitlab:         portainer.GitlabRegistryData{},
	}
	payloadBytes, err := json.Marshal(payload)
	assert.NoError(t, err)
	r := httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(payloadBytes))
	w := httptest.NewRecorder()

	restrictedContext := &security.RestrictedRequestContext{
		IsAdmin: true,
		UserID:  portainer.UserID(1),
	}

	ctx := security.StoreRestrictedRequestContext(r, restrictedContext)
	r = r.WithContext(ctx)

	registry := portainer.Registry{}
	handler := Handler{}
	handler.DataStore = testDataStore{
		registry: &testRegistryService{
			createRegistry: func(r *portainer.Registry) error {
				registry = *r
				return nil
			},
		},
	}
	handlerError := handler.registryCreate(w, r)
	assert.Nil(t, handlerError)
	assert.Equal(t, payload.Name, registry.Name)
	assert.Equal(t, payload.Type, registry.Type)
	assert.Equal(t, payload.URL, registry.URL)
	assert.Equal(t, payload.BaseURL, registry.BaseURL)
	assert.Equal(t, payload.Authentication, registry.Authentication)
	assert.Equal(t, payload.Username, registry.Username)
	assert.Equal(t, payload.Password, registry.Password)
}
