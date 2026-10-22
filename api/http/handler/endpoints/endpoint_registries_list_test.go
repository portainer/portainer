package endpoints

import (
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/assert"
)

func TestHideRegistryFields_AccessToken(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name         string
		hideAccesses bool
		wantExpiry   int64
	}{
		{name: "accesses visible", hideAccesses: false, wantExpiry: 1234},
		{name: "accesses hidden", hideAccesses: true, wantExpiry: 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			registry := &portainer.Registry{
				Password:          "secret",
				AccessToken:       "token",
				AccessTokenExpiry: 1234,
			}

			hideRegistryFields(registry, tt.hideAccesses)

			assert.Empty(t, registry.Password)
			assert.Empty(t, registry.AccessToken)
			assert.Equal(t, tt.wantExpiry, registry.AccessTokenExpiry)
		})
	}
}
