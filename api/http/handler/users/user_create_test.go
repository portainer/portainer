package users

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/datastore"

	"github.com/stretchr/testify/require"
	"golang.org/x/sync/errgroup"
)

type mockPasswordStrengthChecker struct{}

func (m *mockPasswordStrengthChecker) Check(string) bool {
	return true
}

func TestConcurrentUserCreation(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)

	h := &Handler{
		passwordStrengthChecker: &mockPasswordStrengthChecker{},
		CryptoService:           &crypto.Service{},
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
