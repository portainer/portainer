package endpointproxy

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/portainer/portainer/api/http/security"

	"github.com/stretchr/testify/assert"
)

// routeTaggingBouncer answers every request with the name of the access policy
// guarding the route, without reaching the proxy handler behind it.
type routeTaggingBouncer struct {
	security.BouncerService
}

func tagWith(tag string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(tag))
	})
}

func (routeTaggingBouncer) AuthenticatedAccess(http.Handler) http.Handler {
	return tagWith("session")
}

func (routeTaggingBouncer) AuthenticatedAccessAllowingKubeconfig(http.Handler) http.Handler {
	return tagWith("kubernetes-proxy")
}

func TestProxyRoutes_OnlyKubernetesAcceptsAKubeconfigToken(t *testing.T) {
	t.Parallel()

	h := NewHandler(routeTaggingBouncer{})

	tests := []struct {
		path string
		want string
	}{
		{path: "/1/kubernetes/api/v1/namespaces", want: "kubernetes-proxy"},
		{path: "/1/docker/containers/json", want: "session"},
		{path: "/1/azure/subscriptions", want: "session"},
		{path: "/1/agent/kubernetes/v2/browse", want: "session"},
		{path: "/1/agent/docker/containers/json", want: "session"},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			rw := httptest.NewRecorder()

			h.ServeHTTP(rw, httptest.NewRequest(http.MethodGet, tt.path, nil))

			assert.Equal(t, tt.want, rw.Body.String())
		})
	}
}
