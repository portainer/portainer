package test

import (
	"slices"
	"strings"

	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
	"github.com/portainer/portainer/pkg/libhelm/types"

	"github.com/pkg/errors"
	"github.com/segmentio/encoding/json"
	"go.yaml.in/yaml/v3"
)

const (
	MockDataIndex  = "mock-index"
	MockDataChart  = "mock-chart"
	MockDataReadme = "mock-readme"
	MockDataValues = "mock-values"
)

const (
	MockReleaseHooks    = "mock-release-hooks"
	MockReleaseManifest = "mock-release-manifest"
	MockReleaseNotes    = "mock-release-notes"
	MockReleaseValues   = "mock-release-values"
)

// helmMockPackageManager is a test package for helm related http handler testing
// Note: this package currently uses a slice in a way that is not thread safe.
// Do not use this package for concurrent tests.
type helmMockPackageManager struct{}

// NewMockHelmPackageManager initializes a new HelmPackageManager service (a mock instance)
func NewMockHelmPackageManager() types.HelmPackageManager {
	return helmMockPackageManager{}
}

var mockCharts = []release.ReleaseElement{}

func newMockReleaseElement(installOpts options.InstallOptions) *release.ReleaseElement {
	return &release.ReleaseElement{
		Name:       installOpts.Name,
		Namespace:  installOpts.Namespace,
		Updated:    "date/time",
		Status:     "deployed",
		Chart:      installOpts.Chart,
		AppVersion: "1.2.3",
	}
}

func newMockRelease(re *release.ReleaseElement) *release.Release {
	return &release.Release{
		Name:      re.Name,
		Namespace: re.Namespace,
	}
}

// Install a helm chart (not thread safe)
func (hpm helmMockPackageManager) Install(installOpts options.InstallOptions) (*release.Release, error) {
	releaseElement := newMockReleaseElement(installOpts)

	// Enforce only one chart with the same name per namespace
	for i, rel := range mockCharts {
		if rel.Name == installOpts.Name && rel.Namespace == installOpts.Namespace {
			mockCharts[i] = *releaseElement

			return newMockRelease(releaseElement), nil
		}
	}

	mockCharts = append(mockCharts, *releaseElement)

	return newMockRelease(releaseElement), nil
}

// Upgrade a helm chart (not thread safe)
func (hpm helmMockPackageManager) Upgrade(upgradeOpts options.InstallOptions) (*release.Release, error) {
	return hpm.Install(upgradeOpts)
}

// Rollback a helm chart (not thread safe)
func (hpm helmMockPackageManager) Rollback(rollbackOpts options.RollbackOptions) (*release.Release, error) {
	return nil, nil
}

// Show values/readme/chart etc
func (hpm helmMockPackageManager) Show(showOpts options.ShowOptions) ([]byte, error) {
	switch showOpts.OutputFormat {
	case options.ShowChart:
		return []byte(MockDataChart), nil
	case options.ShowReadme:
		return []byte(MockDataReadme), nil
	case options.ShowValues:
		return []byte(MockDataValues), nil
	}

	return nil, nil
}

// Uninstall a helm chart (not thread safe)
func (hpm helmMockPackageManager) Uninstall(uninstallOpts options.UninstallOptions) error {
	for i, rel := range mockCharts {
		if rel.Name == uninstallOpts.Name && rel.Namespace == uninstallOpts.Namespace {
			mockCharts = slices.Delete(mockCharts, i, i+1)
		}
	}

	return nil
}

// ForceRemoveRelease removes release history without deleting resources (not thread safe)
func (hpm helmMockPackageManager) ForceRemoveRelease(uninstallOpts options.UninstallOptions) error {
	return hpm.Uninstall(uninstallOpts)
}

// List a helm chart (not thread safe)
func (hpm helmMockPackageManager) List(listOpts options.ListOptions) ([]release.ReleaseElement, error) {
	return mockCharts, nil
}

// Get a helm release (not thread safe)
func (hpm helmMockPackageManager) Get(getOpts options.GetOptions) (*release.Release, error) {
	index := slices.IndexFunc(mockCharts, func(re release.ReleaseElement) bool {
		return re.Name == getOpts.Name && re.Namespace == getOpts.Namespace
	})

	if index == -1 {
		return nil, errors.Errorf("release %s not found in namespace %s", getOpts.Name, getOpts.Namespace)
	}

	return newMockRelease(&mockCharts[index]), nil
}

func (hpm helmMockPackageManager) GetHistory(historyOpts options.HistoryOptions) ([]*release.Release, error) {
	var result []*release.Release
	for i, v := range mockCharts {
		if v.Name == historyOpts.Name && v.Namespace == historyOpts.Namespace {
			result = append(result, newMockRelease(&mockCharts[i]))
		}
	}

	return result, nil
}

const mockPortainerIndex = `apiVersion: v1
entries:
  portainer:
  - apiVersion: v2
    appVersion: 2.0.0
    created: "2020-12-01T21:51:37.367634957Z"
    description: Helm chart used to deploy the Portainer for Kubernetes
    digest: f0e13dd3e7a05d17cb35c7879ffa623fd43b2c10ca968203e302b7a6c2764ddb
    home: https://www.portainer.io
    icon: https://github.com/portainer/portainer/raw/develop/app/assets/ico/apple-touch-icon.png
    maintainers:
    - email: davidy@funkypenguin.co.nz
      name: funkypenguin
      url: https://www.funkypenguin.co.nz
    name: portainer
    sources:
    - https://github.com/portainer/k8s
    type: application
    urls:
    - https://github.com/portainer/k8s/releases/download/portainer-1.0.6/portainer-1.0.6.tgz
    version: 1.0.6
generated: "2020-08-19T00:00:46.754739363Z"`

func (hbpm helmMockPackageManager) SearchRepo(searchRepoOpts options.SearchRepoOptions) ([]byte, error) {
	// Always return the same repo data no matter what
	reader := strings.NewReader(mockPortainerIndex)

	var file release.File
	if err := yaml.NewDecoder(reader).Decode(&file); err != nil {
		return nil, errors.Wrap(err, "failed to decode index file")
	}

	result, err := json.Marshal(file)
	if err != nil {
		return nil, errors.Wrap(err, "failed to marshal index file")
	}

	return result, nil
}
