package libhttp

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsLocalRequestAllowsLoopback(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/api/metrics", nil)
	r.RemoteAddr = "127.0.0.1:43210"

	assert.True(t, IsLocalRequest(r))
}

func TestIsLocalRequestAllowsSelfDialToBoundAddress(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/api/metrics", nil)
	r.RemoteAddr = "10.0.0.5:43210"
	r = r.WithContext(context.WithValue(r.Context(), http.LocalAddrContextKey, &net.TCPAddr{IP: net.ParseIP("10.0.0.5"), Port: 9001}))

	assert.True(t, IsLocalRequest(r))
}

func TestIsLocalRequestRejectsRemotePeer(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/api/metrics", nil)
	r.RemoteAddr = "10.0.0.6:43210"
	r = r.WithContext(context.WithValue(r.Context(), http.LocalAddrContextKey, &net.TCPAddr{IP: net.ParseIP("10.0.0.5"), Port: 9001}))

	assert.False(t, IsLocalRequest(r))
}
