package sdk

import (
	"testing"

	libhelmrelease "github.com/portainer/portainer/pkg/libhelm/release"
	"github.com/stretchr/testify/assert"
	chartv2 "helm.sh/helm/v4/pkg/chart/v2"
	releasev1 "helm.sh/helm/v4/pkg/release/v1"
)

func Test_Convert(t *testing.T) {
	t.Parallel()
	t.Run("successfully maps a sdk release to a release", func(t *testing.T) {
		is := assert.New(t)

		release := releasev1.Release{
			Name:    "releaseName",
			Version: 1,
			Info: &releasev1.Info{
				Status: "deployed",
			},
			Chart: &chartv2.Chart{
				Metadata: &chartv2.Metadata{
					Name:       "chartName",
					Version:    "chartVersion",
					AppVersion: "chartAppVersion",
				},
			},
		}

		values := libhelmrelease.Values{
			UserSuppliedValues: `{"key": "value"}`,
			ComputedValues:     `{"key": "value"}`,
		}

		result := convert(&release, values)
		is.Equal(release.Name, result.Name)
	})

	t.Run("extracts stack ID from annotations", func(t *testing.T) {
		is := assert.New(t)

		release := releasev1.Release{
			Name:      "stack-release",
			Namespace: "app-namespace",
			Version:   2,
			Info: &releasev1.Info{
				Status: "deployed",
			},
			Chart: &chartv2.Chart{
				Metadata: &chartv2.Metadata{
					Name:    "myapp",
					Version: "2.1.0",
					Annotations: map[string]string{
						StackIDAnnotation:   "123",
						ChartPathAnnotation: "charts/myapp",
						RepoURLAnnotation:   "https://github.com/company/charts",
					},
				},
			},
		}

		result := convert(&release, libhelmrelease.Values{})

		is.NotNil(result)
		is.Equal(123, result.StackID)
		is.Equal("charts/myapp", result.ChartReference.ChartPath)
		is.Equal("https://github.com/company/charts", result.ChartReference.RepoURL)
	})

	t.Run("handles invalid stack ID gracefully", func(t *testing.T) {
		is := assert.New(t)

		release := releasev1.Release{
			Name:      "release",
			Namespace: "default",
			Version:   1,
			Info: &releasev1.Info{
				Status: "deployed",
			},
			Chart: &chartv2.Chart{
				Metadata: &chartv2.Metadata{
					Name:    "chart",
					Version: "1.0.0",
					Annotations: map[string]string{
						StackIDAnnotation: "not-a-number",
					},
				},
			},
		}

		result := convert(&release, libhelmrelease.Values{})

		is.NotNil(result)
		// Should default to 0 when parsing fails
		is.Equal(0, result.StackID)
	})

	t.Run("handles empty stack ID annotation", func(t *testing.T) {
		is := assert.New(t)

		release := releasev1.Release{
			Name:      "release",
			Namespace: "default",
			Version:   1,
			Info: &releasev1.Info{
				Status: "deployed",
			},
			Chart: &chartv2.Chart{
				Metadata: &chartv2.Metadata{
					Name:    "chart",
					Version: "1.0.0",
					Annotations: map[string]string{
						StackIDAnnotation: "",
					},
				},
			},
		}

		result := convert(&release, libhelmrelease.Values{})

		is.NotNil(result)
		is.Equal(0, result.StackID)
	})

	t.Run("handles missing annotations", func(t *testing.T) {
		is := assert.New(t)

		release := releasev1.Release{
			Name:      "release",
			Namespace: "default",
			Version:   1,
			Info: &releasev1.Info{
				Status: "deployed",
			},
			Chart: &chartv2.Chart{
				Metadata: &chartv2.Metadata{
					Name:        "chart",
					Version:     "1.0.0",
					Annotations: nil,
				},
			},
		}

		result := convert(&release, libhelmrelease.Values{})

		is.NotNil(result)
		is.Equal(0, result.StackID)
	})

	// Note: We don't test nil chart metadata or nil chart cases because
	// the Helm SDK never returns releases in those states. The convert function
	// assumes valid Helm SDK releases, which is acceptable for internal use.

	t.Run("extracts registry ID from annotations", func(t *testing.T) {
		is := assert.New(t)

		release := releasev1.Release{
			Name:      "release",
			Namespace: "default",
			Version:   1,
			Info: &releasev1.Info{
				Status: "deployed",
			},
			Chart: &chartv2.Chart{
				Metadata: &chartv2.Metadata{
					Name:    "chart",
					Version: "1.0.0",
					Annotations: map[string]string{
						RegistryIDAnnotation: "42",
						ChartPathAnnotation:  "oci://registry.example.com/charts/myapp",
					},
				},
			},
		}

		result := convert(&release, libhelmrelease.Values{})

		is.NotNil(result)
		is.Equal(int64(42), result.ChartReference.RegistryID)
		is.Equal("oci://registry.example.com/charts/myapp", result.ChartReference.ChartPath)
	})
}
