package sdk

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/portainer/portainer/api/filesystem"

	"sigs.k8s.io/yaml"
)

const (
	helmChartFileName         = "Chart.yaml"
	helmRequirementsFileName  = "requirements.yaml" // dependencies of legacy (apiVersion: v1) charts, still loaded by Helm
	helmLocalRepositoryPrefix = "file://"
)

// HelmDependencyFileNames are the chart files that can declare dependencies
var HelmDependencyFileNames = []string{helmChartFileName, helmRequirementsFileName}

// ErrLocalDependencyOutsideRoot is returned when a relative file:// chart dependency resolves outside the root
// directory.
var ErrLocalDependencyOutsideRoot = errors.New("helm chart dependency is outside the repository")

// helmChartDependencies holds the dependency repositories declared in a chart's Chart.yaml or requirements.yaml, e.g.
//
//	dependencies:
//	  - name: common
//	    version: 1.0.0
//	    repository: file://../common                    # local chart, resolved relative to this chart
//	  - name: redis
//	    version: 18.x.x
//	    repository: https://charts.bitnami.com/bitnami  # remote chart, downloaded by the agent
//
// Only the file:// dependencies are local charts. The JSON tags and sigs.k8s.io/yaml match Helm's chart loader, so
// keys are matched case-insensitively and a duplicate key keeps its last value, as in Helm.
type helmChartDependencies struct {
	Dependencies []helmChartDependency `json:"dependencies"`
}

type helmChartDependency struct {
	Repository string `json:"repository"`
}

// ValidateLocalDependencies returns an error wrapping ErrLocalDependencyOutsideRoot when a relative file:// dependency
// resolves outside rootDir. Helm would otherwise load whatever exists at that path.
//
// Absolute file:// dependencies are allowed, as they are chosen on purpose. Missing or invalid chart files are skipped:
// Helm reports them on load.
func ValidateLocalDependencies(rootDir, chartDir string) error {
	return validateLocalDependencies(rootDir, chartDir, map[string]struct{}{})
}

func validateLocalDependencies(rootDir, chartDir string, visited map[string]struct{}) error {
	if _, ok := visited[chartDir]; ok {
		return nil // also stops dependency cycles
	}
	visited[chartDir] = struct{}{}

	for _, dependencyPath := range chartLocalDependencyPaths(chartDir) {
		// not filesystem.JoinPaths, which would clamp ".." to chartDir and hide the escape checked below
		dependencyDir := filepath.Clean(chartDir + string(filepath.Separator) + dependencyPath)
		if !IsInsideDir(rootDir, dependencyDir) {
			return fmt.Errorf("%w: file://%s", ErrLocalDependencyOutsideRoot, dependencyPath)
		}

		if err := validateLocalDependencies(rootDir, dependencyDir, visited); err != nil {
			return err
		}
	}

	return nil
}

func chartLocalDependencyPaths(chartDir string) []string {
	var paths []string
	for _, fileName := range HelmDependencyFileNames {
		content, err := os.ReadFile(filesystem.JoinPaths(chartDir, fileName))
		if err != nil {
			continue
		}

		chartPaths, err := ParseLocalDependencyPaths(content)
		if err != nil {
			continue
		}

		paths = append(paths, chartPaths...)
	}

	return paths
}

// ParseLocalDependencyPaths returns the paths of the relative file:// dependencies declared in the content of a
// Chart.yaml or requirements.yaml. Remote and absolute file:// dependencies are left out.
func ParseLocalDependencyPaths(content []byte) ([]string, error) {
	var chart helmChartDependencies
	if err := yaml.Unmarshal(content, &chart); err != nil {
		return nil, fmt.Errorf("failed to parse chart dependencies: %w", err)
	}

	var paths []string
	for _, dependency := range chart.Dependencies {
		path, ok := strings.CutPrefix(dependency.Repository, helmLocalRepositoryPrefix)
		if ok && !filepath.IsAbs(path) {
			paths = append(paths, path)
		}
	}

	return paths, nil
}

// IsInsideDir reports whether path is dir or anything under it. It checks for ".." plus a separator, not a bare ".."
// prefix, so a directory named "..charts" is inside.
func IsInsideDir(dir, path string) bool {
	relativePath, err := filepath.Rel(dir, path)
	if err != nil {
		return false
	}

	return relativePath != ".." && !strings.HasPrefix(relativePath, ".."+string(filepath.Separator))
}
