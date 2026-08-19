package sdk

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	chart "helm.sh/helm/v4/pkg/chart/v2"
	release "helm.sh/helm/v4/pkg/release"
	"helm.sh/helm/v4/pkg/release/common"
	releasev1 "helm.sh/helm/v4/pkg/release/v1"
)

func Test_ConvertToReleaseElements(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	// Create mock releases
	releases := []*releasev1.Release{
		{
			Name:      "release1",
			Namespace: "default",
			Version:   1,
			Info: &releasev1.Info{
				Status:       common.StatusDeployed,
				LastDeployed: time.Now(),
			},
			Chart: &chart.Chart{
				Metadata: &chart.Metadata{
					Name:       "chart1",
					Version:    "1.0.0",
					AppVersion: "1.0.0",
				},
			},
		},
		{
			Name:      "release2",
			Namespace: "kube-system",
			Version:   2,
			Info: &releasev1.Info{
				Status:       common.StatusFailed,
				LastDeployed: time.Now(),
			},
			Chart: &chart.Chart{
				Metadata: &chart.Metadata{
					Name:       "chart2",
					Version:    "2.0.0",
					AppVersion: "2.0.0",
				},
			},
		},
	}

	// Convert to release elements using the releasor interface
	var releasors []release.Releaser
	for _, r := range releases {
		releasors = append(releasors, r)
	}
	elements, err := convertToReleaseElements(releasors)
	require.NoError(t, err)

	// Verify conversion
	is.Len(elements, 2, "should return 2 release elements")

	// Verify first release
	is.Equal("release1", elements[0].Name, "first release name should be release1")
	is.Equal("default", elements[0].Namespace, "first release namespace should be default")
	is.Equal("1", elements[0].Revision, "first release revision should be 1")
	is.Equal(string(common.StatusDeployed), elements[0].Status, "first release status should be deployed")
	is.Equal("chart1-1.0.0", elements[0].Chart, "first release chart should be chart1-1.0.0")
	is.Equal("1.0.0", elements[0].AppVersion, "first release app version should be 1.0.0")

	// Verify second release
	is.Equal("release2", elements[1].Name, "second release name should be release2")
	is.Equal("kube-system", elements[1].Namespace, "second release namespace should be kube-system")
	is.Equal("2", elements[1].Revision, "second release revision should be 2")
	is.Equal(string(common.StatusFailed), elements[1].Status, "second release status should be failed")
	is.Equal("chart2-2.0.0", elements[1].Chart, "second release chart should be chart2-2.0.0")
	is.Equal("2.0.0", elements[1].AppVersion, "second release app version should be 2.0.0")
}
