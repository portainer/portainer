package sdk

import (
	"os"
	"testing"

	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/test"
	"github.com/stretchr/testify/require"
)

func TestUpgrade(t *testing.T) {
	t.Parallel()
	test.EnsureIntegrationTest(t)
	is := require.New(t)

	// Create a new SDK package manager
	hspm := NewHelmSDKPackageManager()

	t.Run("when no release exists, the chart should be installed", func(t *testing.T) {
		// SDK equivalent of: helm upgrade --install test-new-nginx --repo https://kubernetes.github.io/ingress-nginx ingress-nginx
		upgradeOpts := options.InstallOptions{
			Name:      "test-new-nginx",
			Namespace: "default",
			Chart:     "ingress-nginx",
			Repo:      "https://kubernetes.github.io/ingress-nginx",
		}

		// Ensure the release doesn't exist before test
		err := hspm.Uninstall(options.UninstallOptions{Name: upgradeOpts.Name})
		require.NoError(t, err)

		release, err := hspm.Upgrade(upgradeOpts)
		require.NoError(t, err, "should successfully install release via upgrade")
		is.NotNil(release, "should return non-nil release")
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: upgradeOpts.Name})
			require.NoError(t, err)
		}()

		is.Equal(upgradeOpts.Name, release.Name, "release name should match")
		is.Equal(1, release.Version, "release version should be 1 for new install")
		is.NotEmpty(release.Manifest, "release manifest should not be empty")

		// Cleanup
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: upgradeOpts.Name})
			require.NoError(t, err)
		}()
	})

	t.Run("when release exists, the chart should be upgraded", func(t *testing.T) {
		// First install a release
		installOpts := options.InstallOptions{
			Name:      "test-upgrade-nginx",
			Chart:     "ingress-nginx",
			Namespace: "default",
			Repo:      "https://kubernetes.github.io/ingress-nginx",
		}

		// Ensure the release doesn't exist before test
		err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		release, err := hspm.Upgrade(installOpts)
		require.NoError(t, err, "should successfully install release")
		is.NotNil(release, "should return non-nil release")
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
			require.NoError(t, err)
		}()

		// Upgrade the release with the same options
		upgradedRelease, err := hspm.Upgrade(installOpts)

		require.NoError(t, err, "should successfully upgrade release")
		is.NotNil(upgradedRelease, "should return non-nil release")
		is.Equal("test-upgrade-nginx", upgradedRelease.Name, "release name should match")
		is.Equal(2, upgradedRelease.Version, "release version should be incremented to 2")
		is.NotEmpty(upgradedRelease.Manifest, "release manifest should not be empty")
	})

	t.Run("should be able to upgrade with override values", func(t *testing.T) {
		// First install a release
		installOpts := options.InstallOptions{
			Name:      "test-values-nginx",
			Chart:     "ingress-nginx",
			Namespace: "default",
			Repo:      "https://kubernetes.github.io/ingress-nginx",
		}

		// Ensure the release doesn't exist before test
		err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		release, err := hspm.Upgrade(installOpts) // Cleanup
		require.NoError(t, err, "should successfully install release")
		is.NotNil(release, "should return non-nil release")
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
			require.NoError(t, err)
		}()

		// Create values file
		values, err := test.CreateValuesFile("service:\n  port:  8083")
		require.NoError(t, err, "should create a values file")
		defer func() {
			err := os.Remove(values)
			require.NoError(t, err)
		}()

		// Now upgrade with values
		upgradeOpts := options.InstallOptions{
			Name:       "test-values-nginx",
			Chart:      "ingress-nginx",
			Namespace:  "default",
			Repo:       "https://kubernetes.github.io/ingress-nginx",
			ValuesFile: values,
		}

		upgradedRelease, err := hspm.Upgrade(upgradeOpts)

		require.NoError(t, err, "should successfully upgrade release with values")
		is.NotNil(upgradedRelease, "should return non-nil release")
		is.Equal("test-values-nginx", upgradedRelease.Name, "release name should match")
		is.Equal(2, upgradedRelease.Version, "release version should be incremented to 2")
		is.NotEmpty(upgradedRelease.Manifest, "release manifest should not be empty")
	})

	t.Run("should give an error if the override values are invalid", func(t *testing.T) {
		// First install a release
		installOpts := options.InstallOptions{
			Name:      "test-invalid-values",
			Chart:     "ingress-nginx",
			Namespace: "default",
			Repo:      "https://kubernetes.github.io/ingress-nginx",
		}

		// Ensure the release doesn't exist before test
		err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		release, err := hspm.Upgrade(installOpts)
		require.NoError(t, err, "should successfully install release")
		is.NotNil(release, "should return non-nil release")
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
			require.NoError(t, err)
		}()

		// Create invalid values file
		values, err := test.CreateValuesFile("this is not valid yaml")
		require.NoError(t, err, "should create a values file")
		defer func() {
			err := os.Remove(values)
			require.NoError(t, err)
		}()

		// Now upgrade with invalid values
		upgradeOpts := options.InstallOptions{
			Name:       "test-invalid-values",
			Chart:      "ingress-nginx",
			Namespace:  "default",
			Repo:       "https://kubernetes.github.io/ingress-nginx",
			ValuesFile: values,
		}

		_, err = hspm.Upgrade(upgradeOpts)

		require.Error(t, err, "should return error with invalid values")
	})

	t.Run("should return error when name is not provided", func(t *testing.T) {
		upgradeOpts := options.InstallOptions{
			Chart:     "ingress-nginx",
			Namespace: "default",
			Repo:      "https://kubernetes.github.io/ingress-nginx",
		}

		_, err := hspm.Upgrade(upgradeOpts)

		require.Error(t, err, "should return an error when name is not provided")
		is.Equal("name is required for helm release upgrade", err.Error(), "should return correct error message")
	})
}
