package upgrade

import (
	"os"
	"testing"

	portainer "github.com/portainer/portainer/api"
)

func TestGetUpdaterImage(t *testing.T) {
	t.Run("updater image Environment Variable is set", func(t *testing.T) {
		os.Setenv(updaterImageEnvVar, "portainer/portainer-updater:pr111")

		expect := "portainer/portainer-updater:pr111"
		updaterImage := getUpdaterImage()
		if updaterImage != expect {
			t.Fatalf("expected %v, got %v", expect, updaterImage)
		}
	})

	t.Run("updater image Environment Variable not set", func(t *testing.T) {
		os.Unsetenv(updaterImageEnvVar)
		expect := "portainer/portainer-updater:" + portainer.APIVersion
		updaterImage := getUpdaterImage()
		if updaterImage != expect {
			t.Fatalf("expected %v, got %v", expect, updaterImage)
		}
	})
}
