package upgrade

import (
	"os"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/require"
)

func TestGetUpdaterImage(t *testing.T) {
	t.Run("updater image Environment Variable is set", func(t *testing.T) {
		t.Setenv(updaterImageEnvVar, "portainer/portainer-updater:pr111")

		expect := "portainer/portainer-updater:pr111"
		updaterImage := getUpdaterImage()
		if updaterImage != expect {
			t.Fatalf("expected %v, got %v", expect, updaterImage)
		}
	})

	t.Run("updater image Environment Variable not set", func(t *testing.T) {
		err := os.Unsetenv(updaterImageEnvVar)
		require.NoError(t, err)

		expect := "portainer/portainer-updater:" + portainer.APIVersion
		updaterImage := getUpdaterImage()
		if updaterImage != expect {
			t.Fatalf("expected %v, got %v", expect, updaterImage)
		}
	})
}
