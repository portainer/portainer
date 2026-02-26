package sdk

import (
	"testing"

	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/test"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_Show(t *testing.T) {
	test.EnsureIntegrationTest(t)
	is := assert.New(t)

	// Create a new SDK package manager
	hspm := NewHelmSDKPackageManager()

	// install the ingress-nginx chart to test the show command
	installOpts := options.InstallOptions{
		Name:  "ingress-nginx",
		Chart: "ingress-nginx",
		Repo:  "https://kubernetes.github.io/ingress-nginx",
	}
	release, err := hspm.Upgrade(installOpts)
	if release != nil || err != nil {
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: "ingress-nginx"})
			require.NoError(t, err)
		}()
	}

	t.Run("show requires chart, output format and repo or registry", func(t *testing.T) {
		showOpts := options.ShowOptions{
			Chart:        "",
			Repo:         "",
			OutputFormat: "",
		}
		_, err := hspm.Show(showOpts)
		require.Error(t, err, "should return error when required options are missing")
		is.Contains(err.Error(), "chart, output format and either repo or registry are required", "error message should indicate required options")
	})

	t.Run("show chart values", func(t *testing.T) {
		showOpts := options.ShowOptions{
			Chart:        "ingress-nginx",
			Repo:         "https://kubernetes.github.io/ingress-nginx",
			OutputFormat: options.ShowValues,
		}
		values, err := hspm.Show(showOpts)

		require.NoError(t, err, "should not return error when not in k8s environment")
		is.NotEmpty(values, "should return non-empty values")
	})

	t.Run("show chart readme", func(t *testing.T) {
		showOpts := options.ShowOptions{
			Chart:        "ingress-nginx",
			Repo:         "https://kubernetes.github.io/ingress-nginx",
			OutputFormat: options.ShowReadme,
		}
		readme, err := hspm.Show(showOpts)

		require.NoError(t, err, "should not return error when not in k8s environment")
		is.NotEmpty(readme, "should return non-empty readme")
	})

	t.Run("show chart definition", func(t *testing.T) {
		showOpts := options.ShowOptions{
			Chart:        "ingress-nginx",
			Repo:         "https://kubernetes.github.io/ingress-nginx",
			OutputFormat: options.ShowChart,
		}
		chart, err := hspm.Show(showOpts)

		require.NoError(t, err, "should not return error when not in k8s environment")
		is.NotNil(chart, "should return non-nil chart definition")
	})

	t.Run("show all chart info", func(t *testing.T) {
		showOpts := options.ShowOptions{
			Chart:        "ingress-nginx",
			Repo:         "https://kubernetes.github.io/ingress-nginx",
			OutputFormat: options.ShowAll,
		}
		info, err := hspm.Show(showOpts)

		require.NoError(t, err, "should not return error when not in k8s environment")
		is.NotEmpty(info, "should return non-empty chart info")
	})

	t.Run("show with invalid output format", func(t *testing.T) {
		// Show with invalid output format
		showOpts := options.ShowOptions{
			Chart:        "ingress-nginx",
			Repo:         "https://kubernetes.github.io/ingress-nginx",
			OutputFormat: "invalid",
		}
		_, err := hspm.Show(showOpts)

		require.Error(t, err, "should return error with invalid output format")
		is.Contains(err.Error(), "unsupported output format", "error message should indicate invalid output format")
	})
}
