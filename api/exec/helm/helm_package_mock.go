package helm

import (

	// "errors"

	"time"

	"github.com/portainer/portainer/api/exec/helm/release"
	"github.com/portainer/portainer/api/kubernetes"
)

type helmMockPackageManager struct{}

// NewMockHelmBinaryPackageManager initializes a new HelmPackageManager service (a mock instance)
func NewMockHelmBinaryPackageManager(kubeConfigService kubernetes.KubeConfigService, binaryPath string) HelmPackageManager {
	return &helmMockPackageManager{}
}

// Run will execute helm command against the provided Kubernetes cluster.
func (hpm *helmMockPackageManager) Run(command string, args []string, serverURL, authToken string) (string, error) {
	return "", nil
}

type mockChart struct {
	Name       string    `json:"name"`
	Namespace  string    `json:"namespace"`
	Updated    time.Time `json:"updated"`
	Status     string    `json:"status"`
	Chart      string    `json:"chart"`
	AppVersion string    `json:"app_version"`
}

var mock_charts = []*mockChart{}

func newMockChart(installOpts InstallOptions) *mockChart {
	return &mockChart{
		Name:       installOpts.Name,
		Namespace:  installOpts.Namespace,
		Updated:    time.Now(),
		Status:     "deployed",
		Chart:      installOpts.Chart + "9.4.2",
		AppVersion: "1.21.1",
	}
}

func mockChartAsRelease(mc *mockChart) *release.Release {
	return &release.Release{
		Name:      mc.Name,
		Namespace: mc.Namespace,
	}
}

func (hpm *helmMockPackageManager) Install(installOpts InstallOptions, serverURL, authToken string) (*release.Release, error) {

	release := newMockChart(installOpts)

	// Enforce only one chart with the same name per namespace
	for i, rel := range mock_charts {
		if rel.Name == installOpts.Name && rel.Namespace == installOpts.Namespace {
			mock_charts[i] = release
			return mockChartAsRelease(release), nil
		}
	}

	mock_charts = append(mock_charts, release)
	return mockChartAsRelease(release), nil
}

// Show values/readme/chart etc
func (hpm *helmMockPackageManager) Show(showOpts ShowOptions) (string, error) {
	switch showOpts.OutputFormat {
	case ShowChart:
		return MockDataChart, nil
	case ShowReadme:
		return MockDataReadme, nil
	case ShowValues:
		return MockDataValues, nil
	}
	return "", nil
}

// Show a mock index.yaml
func (hpm *helmMockPackageManager) SearchRepo(searchOpts SearchRepoOptions) (string, error) {
	return MockDataIndex, nil
}
