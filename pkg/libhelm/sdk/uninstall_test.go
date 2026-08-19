package sdk

import (
	"testing"

	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/test"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_Uninstall(t *testing.T) {
	t.Parallel()
	test.EnsureIntegrationTest(t)
	is := assert.New(t)

	// Create a new SDK package manager
	hspm := NewHelmSDKPackageManager()

	t.Run("uninstall requires a release name", func(t *testing.T) {
		// Try to uninstall without a release name
		uninstallOpts := options.UninstallOptions{
			Name: "",
		}
		err := hspm.Uninstall(uninstallOpts)
		require.Error(t, err, "should return error when release name is empty")
		is.Contains(err.Error(), "release name is required", "error message should indicate release name is required")
	})

	t.Run("uninstall a non-existent release", func(t *testing.T) {
		// Try to uninstall a release that doesn't exist
		uninstallOpts := options.UninstallOptions{
			Name: "non-existent-release",
		}
		err := hspm.Uninstall(uninstallOpts)

		// The function should not fail by design, even when not running in a k8s environment
		// However, it should return an error for a non-existent release
		require.Error(t, err, "should return error when release doesn't exist")
		is.Contains(err.Error(), "not found", "error message should indicate release not found")
	})

	// This test is commented out as it requires a real release to be installed first
	t.Run("successfully uninstall an existing release", func(t *testing.T) {
		// First install a release
		installOpts := options.InstallOptions{
			Name:  "test-uninstall",
			Chart: "nginx",
			Repo:  "https://kubernetes.github.io/ingress-nginx",
		}

		// Install the release
		_, err := hspm.Upgrade(installOpts)
		if err != nil {
			t.Logf("Error installing release: %v", err)
			t.Skip("Skipping uninstall test because install failed")
			return
		}

		// Now uninstall it
		uninstallOpts := options.UninstallOptions{
			Name: "test-uninstall",
		}
		err = hspm.Uninstall(uninstallOpts)
		require.NoError(t, err, "should successfully uninstall release")
	})
}
