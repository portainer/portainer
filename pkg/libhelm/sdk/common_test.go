package sdk

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/portainer/portainer/api/filesystem"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"helm.sh/helm/v4/pkg/action"
	v2chart "helm.sh/helm/v4/pkg/chart/v2"
	chartutil "helm.sh/helm/v4/pkg/chart/v2/util"
	repo "helm.sh/helm/v4/pkg/repo/v1"
)

func TestAppendChartReferenceAnnotations(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name       string
		chartPath  string
		repoURL    string
		registryID int
		stackID    int
		existing   map[string]string
		want       map[string]string
	}{
		{
			name:       "with registry ID",
			chartPath:  "charts/nginx",
			registryID: 5,
			stackID:    123,
			want: map[string]string{
				ChartPathAnnotation:  "charts/nginx",
				RegistryIDAnnotation: "5",
				StackIDAnnotation:    "123",
				// repoURL is NOT added when registryID != 0
			},
		},
		{
			name:      "with repo URL (no registry)",
			chartPath: "charts/nginx",
			repoURL:   "https://charts.example.com",
			stackID:   123,
			want: map[string]string{
				ChartPathAnnotation: "charts/nginx",
				RepoURLAnnotation:   "https://charts.example.com",
				StackIDAnnotation:   "123",
			},
		},
		{
			name:      "preserves custom annotations",
			chartPath: "my-chart",
			existing:  map[string]string{"custom": "value"},
			want: map[string]string{
				ChartPathAnnotation: "my-chart",
				"custom":            "value",
			},
		},
		{
			name:      "replaces old chart annotations",
			chartPath: "new-chart",
			repoURL:   "https://new.com",
			existing: map[string]string{
				ChartPathAnnotation: "old-chart",
				RepoURLAnnotation:   "https://old.com",
			},
			want: map[string]string{
				ChartPathAnnotation: "new-chart",
				RepoURLAnnotation:   "https://new.com",
			},
		},
		{
			name:      "omits zero values",
			chartPath: "chart",
			want: map[string]string{
				ChartPathAnnotation: "chart",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := appendChartReferenceAnnotations(
				tt.chartPath, tt.repoURL, tt.registryID, tt.stackID,
				nil, tt.existing,
			)

			assert.Equal(t, tt.want, result)
		})
	}
}

func TestAppendChartReferenceAnnotations_RepoURLLogic(t *testing.T) {
	t.Parallel()
	t.Run("repoURL only added when registryID is zero", func(t *testing.T) {
		// With registry ID - no repoURL
		result := appendChartReferenceAnnotations("chart", "url", 5, 0, nil, nil)
		_, hasRepoURL := result[RepoURLAnnotation]
		assert.False(t, hasRepoURL)

		// Without registry ID - includes repoURL
		result = appendChartReferenceAnnotations("chart", "url", 0, 0, nil, nil)
		assert.Equal(t, "url", result[RepoURLAnnotation])
	})

	t.Run("does not mutate existing map", func(t *testing.T) {
		existing := map[string]string{"key": "value"}
		appendChartReferenceAnnotations("chart", "", 0, 0, nil, existing)
		assert.Equal(t, map[string]string{"key": "value"}, existing)
	})
}

func TestLoadAndValidateChartWithPathOptions(t *testing.T) {
	t.Parallel()

	depTgzPath := saveMinimalDepChart(t, "dep-chart", "0.1.0")
	depTgzName := filepath.Base(depTgzPath)

	server := newHelmHTTPRepoServer(t, depTgzPath)
	parentDir := writeParentChart(t, "parent-chart", "dep-chart", "0.1.0", server.URL)

	hspm := newIsolatedHelmSDKPackageManager(t)

	ch, err := hspm.loadAndValidateChartWithPathOptions(
		new(action.Configuration),
		&action.ChartPathOptions{},
		parentDir, "", "", true, "test",
	)

	require.NoError(t, err)
	require.NotNil(t, ch)
	assert.Equal(t, "parent-chart", ch.Metadata.Name)
	assert.FileExists(t, filesystem.JoinPaths(parentDir, "charts", depTgzName),
		"dependency tarball should have been downloaded into charts/ — proves ContentCache was threaded into downloader.Manager")
}

// saveMinimalDepChart produces a valid dependency chart tarball on disk and returns its path.
func saveMinimalDepChart(t *testing.T, name, version string) string {
	t.Helper()
	tgzPath, err := chartutil.Save(&v2chart.Chart{
		Metadata: &v2chart.Metadata{
			Name:       name,
			Version:    version,
			APIVersion: "v2",
		},
	}, t.TempDir())
	require.NoError(t, err)
	return tgzPath
}

func newHelmHTTPRepoServer(t *testing.T, tgzPath string) *httptest.Server {
	t.Helper()
	tgzName := filepath.Base(tgzPath)

	mux := http.NewServeMux()
	server := httptest.NewServer(mux)
	t.Cleanup(server.Close)

	mux.HandleFunc("/"+tgzName, func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, tgzPath)
	})
	index := fmt.Sprintf(`apiVersion: v1
entries:
  dep-chart:
    - name: dep-chart
      version: 0.1.0
      apiVersion: v2
      urls:
        - %s/%s
`, server.URL, tgzName)
	mux.HandleFunc("/index.yaml", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/yaml")
		_, _ = w.Write([]byte(index))
	})
	return server
}

// writeParentChart writes a Chart.yaml declaring a single HTTP dependency and returns the chart dir.
func writeParentChart(t *testing.T, parentName, depName, depVersion, repoURL string) string {
	t.Helper()
	dir := t.TempDir()
	chartYAML := fmt.Sprintf(`apiVersion: v2
name: %s
version: 0.1.0
dependencies:
  - name: %s
    version: %q
    repository: %q
`, parentName, depName, depVersion, repoURL)
	require.NoError(t, os.WriteFile(filesystem.JoinPaths(dir, "Chart.yaml"), []byte(chartYAML), 0o644))
	return dir
}

func newIsolatedHelmSDKPackageManager(t *testing.T) *HelmSDKPackageManager {
	t.Helper()
	tmp := t.TempDir()
	hspm := NewHelmSDKPackageManager()
	hspm.settings.RepositoryConfig = filesystem.JoinPaths(tmp, "repositories.yaml")
	hspm.settings.RepositoryCache = filesystem.JoinPaths(tmp, "repository")
	hspm.settings.ContentCache = filesystem.JoinPaths(tmp, "content")

	require.NoError(t, os.MkdirAll(hspm.settings.RepositoryCache, 0o700))
	require.NoError(t, os.MkdirAll(hspm.settings.ContentCache, 0o700))

	f := repo.NewFile()
	require.NoError(t, f.WriteFile(hspm.settings.RepositoryConfig, 0o644))

	return hspm
}
