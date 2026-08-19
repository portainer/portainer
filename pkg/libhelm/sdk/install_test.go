package sdk

import (
	"os"
	"testing"

	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/test"

	"github.com/stretchr/testify/require"
)

func Test_Install(t *testing.T) {
	t.Parallel()
	test.EnsureIntegrationTest(t)
	is := require.New(t)

	// Create a new SDK package manager
	hspm := NewHelmSDKPackageManager()

	t.Run("successfully installs nginx chart with name test-nginx", func(t *testing.T) {
		// SDK equivalent of: helm install test-nginx --repo https://kubernetes.github.io/ingress-nginx nginx
		installOpts := options.InstallOptions{
			Name:  "test-nginx",
			Chart: "ingress-nginx",
			Repo:  "https://kubernetes.github.io/ingress-nginx",
		}

		err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		release, err := hspm.Upgrade(installOpts)
		require.NoError(t, err, "should successfully install release")
		is.NotNil(release, "should return non-nil release")
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
			require.NoError(t, err)
		}()

		is.Equal("test-nginx", release.Name, "release name should match")
		is.Equal(1, release.Version, "release version should be 1")
		is.NotEmpty(release.Manifest, "release manifest should not be empty")
	})

	t.Run("successfully installs nginx with values", func(t *testing.T) {
		// SDK equivalent of: helm install test-nginx-2 --repo https://kubernetes.github.io/ingress-nginx nginx --values /tmp/helm-values3161785816
		values, err := test.CreateValuesFile("service:\n  port:  8081")
		require.NoError(t, err, "should create a values file")
		defer func() {
			err := os.Remove(values)
			require.NoError(t, err)
		}()

		installOpts := options.InstallOptions{
			Name:       "test-nginx-2",
			Chart:      "ingress-nginx",
			Repo:       "https://kubernetes.github.io/ingress-nginx",
			ValuesFile: values,
		}

		err = hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		release, err := hspm.Upgrade(installOpts)
		require.NoError(t, err, "should successfully install release")
		is.NotNil(release, "should return non-nil release")
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
			require.NoError(t, err)
		}()

		is.Equal("test-nginx-2", release.Name, "release name should match")
		is.Equal(1, release.Version, "release version should be 1")
		is.NotEmpty(release.Manifest, "release manifest should not be empty")
	})

	t.Run("successfully installs portainer chart with name portainer-test", func(t *testing.T) {
		// SDK equivalent of: helm install portainer-test portainer --repo https://portainer.github.io/k8s/
		installOpts := options.InstallOptions{
			Name:  "portainer-test",
			Chart: "portainer",
			Repo:  "https://portainer.github.io/k8s/",
		}

		err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		release, err := hspm.Upgrade(installOpts)
		require.NoError(t, err, "should successfully install release")
		is.NotNil(release, "should return non-nil release")
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
			require.NoError(t, err)
		}()

		is.Equal("portainer-test", release.Name, "release name should match")
		is.Equal(1, release.Version, "release version should be 1")
		is.NotEmpty(release.Manifest, "release manifest should not be empty")
	})

	t.Run("install with values as string", func(t *testing.T) {
		// First create a values file since InstallOptions doesn't support values as string directly
		values, err := test.CreateValuesFile("service:\n  port:  8082")
		require.NoError(t, err, "should create a values file")
		defer func() {
			err := os.Remove(values)
			require.NoError(t, err)
		}()

		// Install with values file
		installOpts := options.InstallOptions{
			Name:       "test-nginx-3",
			Chart:      "ingress-nginx",
			Repo:       "https://kubernetes.github.io/ingress-nginx",
			ValuesFile: values,
		}

		err = hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		release, err := hspm.Upgrade(installOpts)
		require.NoError(t, err, "should successfully install release")
		is.NotNil(release, "should return non-nil release")
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
			require.NoError(t, err)
		}()

		is.Equal("test-nginx-3", release.Name, "release name should match")
	})

	t.Run("install with namespace", func(t *testing.T) {
		// Install with namespace
		installOpts := options.InstallOptions{
			Name:      "test-nginx-4",
			Chart:     "ingress-nginx",
			Repo:      "https://kubernetes.github.io/ingress-nginx",
			Namespace: "default",
		}

		err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		release, err := hspm.Upgrade(installOpts)
		require.NoError(t, err, "should successfully install release")
		is.NotNil(release, "should return non-nil release")
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
			require.NoError(t, err)
		}()

		is.Equal("test-nginx-4", release.Name, "release name should match")
		is.Equal("default", release.Namespace, "release namespace should match")
	})

	t.Run("returns an error when name is not provided", func(t *testing.T) {
		installOpts := options.InstallOptions{
			Chart: "ingress-nginx",
			Repo:  "https://kubernetes.github.io/ingress-nginx",
		}

		err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		_, err = hspm.Upgrade(installOpts)

		require.Error(t, err, "should return an error when name is not provided")
		// is.Equal(err.Error(), "name is required for helm release installation")
	})

	t.Run("install with invalid chart", func(t *testing.T) {
		// Install with invalid chart
		installOpts := options.InstallOptions{
			Name:  "test-invalid",
			Chart: "non-existent-chart",
			Repo:  "https://kubernetes.github.io/ingress-nginx",
		}
		_, err := hspm.Upgrade(installOpts)
		require.Error(t, err, "should return error when chart doesn't exist")
	})

	t.Run("install with invalid repo", func(t *testing.T) {
		// Install with invalid repo
		installOpts := options.InstallOptions{
			Name:  "test-invalid-repo",
			Chart: "nginx",
			Repo:  "https://non-existent-repo.example.com",
		}

		err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		_, err = hspm.Upgrade(installOpts)
		require.Error(t, err, "should return error when repo doesn't exist")
	})
}
