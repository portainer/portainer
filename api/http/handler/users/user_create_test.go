package users

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"

	"github.com/stretchr/testify/require"
	"golang.org/x/sync/errgroup"
)

type mockPasswordStrengthChecker struct{}

func (m mockPasswordStrengthChecker) Check(string) bool {
	return true
}

func newTestHandler(t *testing.T, store *datastore.Store) (*Handler, *jwt.Service, apikey.APIKeyService) {
	t.Helper()

	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err)

	apiKeyService := apikey.NewAPIKeyService(store.APIKeyRepository(), store.User())
	requestBouncer := security.NewRequestBouncer(t.Context(), store, jwtService, apiKeyService)
	rateLimiter := security.NewRateLimiter(10, 1*time.Second, 1*time.Hour, nil)
	passwordChecker := security.NewPasswordStrengthChecker(store.SettingsService)

	h := NewHandler(requestBouncer, rateLimiter, apiKeyService, passwordChecker)
	h.DataStore = store

	return h, jwtService, apiKeyService
}

func TestConcurrentUserCreation(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)

	h := &Handler{
		passwordStrengthChecker: mockPasswordStrengthChecker{},
		CryptoService:           crypto.Service{},
		DataStore:               store,
	}

	ucp := userCreatePayload{
		Username: "portainer",
		Password: "password",
		Role:     int(portainer.AdministratorRole),
	}

	m, err := json.Marshal(ucp)
	require.NoError(t, err)

	errGroup := &errgroup.Group{}

	n := 100

	for range n {
		errGroup.Go(func() error {
			req, err := http.NewRequest(http.MethodPost, "/users", bytes.NewReader(m))
			if err != nil {
				return err
			}

			if err := h.userCreate(httptest.NewRecorder(), req); err != nil {
				return err
			}

			return nil
		})
	}

	err = errGroup.Wait()
	require.Error(t, err)

	users, err := store.User().ReadAll()
	require.NotEmpty(t, users)
	require.NoError(t, err)

	userCreated := false
	for _, u := range users {
		if u.Username == ucp.Username {
			require.False(t, userCreated)
			userCreated = true
		}
	}

	require.True(t, userCreated)
}
