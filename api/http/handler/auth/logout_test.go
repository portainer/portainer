package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/kubernetes"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/kubernetes/cli"

	"github.com/stretchr/testify/require"
)

type mockBouncer struct {
	security.BouncerService
}

func NewMockBouncer() *mockBouncer {
	return &mockBouncer{BouncerService: testhelpers.NewTestRequestBouncer()}
}

func (*mockBouncer) CookieAuthLookup(r *http.Request) (*portainer.TokenData, error) {
	return &portainer.TokenData{
		ID:       1,
		Username: "testuser",
		Token:    "valid-token",
	}, nil
}

func TestLogout(t *testing.T) {
	h := NewHandler(NewMockBouncer(), nil, nil, nil)
	h.KubernetesTokenCacheManager = kubernetes.NewTokenCacheManager()
	k, err := cli.NewClientFactory(nil, nil, nil, "", "", "")
	require.NoError(t, err)
	h.KubernetesClientFactory = k

	rr := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/auth/logout", nil)

	h.ServeHTTP(rr, req)
	require.Equal(t, http.StatusNoContent, rr.Code)
}

func TestLogoutNoPanic(t *testing.T) {
	h := NewHandler(testhelpers.NewTestRequestBouncer(), nil, nil, nil)

	rr := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/auth/logout", nil)

	h.ServeHTTP(rr, req)
	require.Equal(t, http.StatusNoContent, rr.Code)
}
