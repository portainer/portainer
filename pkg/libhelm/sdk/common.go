package sdk

import (
	"fmt"
	"maps"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/downloader"
	"helm.sh/helm/v3/pkg/getter"
	"helm.sh/helm/v3/pkg/repo"
)

// Helm chart reference label constants
const (
	ChartPathAnnotation  = "portainer/chart-path"
	RepoURLAnnotation    = "portainer/repo-url"
	RegistryIDAnnotation = "portainer/registry-id"
)

// loadAndValidateChartWithPathOptions locates and loads the chart, and validates it.
// it also checks for chart dependencies and updates them if necessary.
// it returns the chart information.
func (hspm *HelmSDKPackageManager) loadAndValidateChartWithPathOptions(chartPathOptions *action.ChartPathOptions, chartName, version string, repoURL string, dependencyUpdate bool, operation string) (*chart.Chart, error) {
	chartPath, err := chartPathOptions.LocateChart(chartName, hspm.settings)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("chart", chartName).
			Err(err).
			Msg("Failed to locate chart for helm " + operation)

		// For OCI charts, chartName already contains the full reference
		if strings.HasPrefix(chartName, options.OCIProtocolPrefix) {
			return nil, errors.Wrapf(err, "failed to find the helm chart: %s", chartName)
		}
		return nil, errors.Wrapf(err, "failed to find the helm chart at the path: %s/%s", repoURL, chartName)
	}

	chartReq, err := loader.Load(chartPath)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("chart_path", chartPath).
			Err(err).
			Msg("Failed to load chart for helm " + operation)
		return nil, errors.Wrap(err, "failed to load chart for helm "+operation)
	}

	// Check chart dependencies to make sure all are present in /charts
	if chartDependencies := chartReq.Metadata.Dependencies; chartDependencies != nil {
		if err := action.CheckDependencies(chartReq, chartDependencies); err != nil {
			err = errors.Wrap(err, "failed to check chart dependencies for helm "+operation)
			if !dependencyUpdate {
				return nil, err
			}

			log.Debug().
				Str("context", "HelmClient").
				Str("chart", chartName).
				Msg("Updating chart dependencies for helm " + operation)

			providers := getter.All(hspm.settings)
			manager := &downloader.Manager{
				Out:              os.Stdout,
				ChartPath:        chartPath,
				Keyring:          chartPathOptions.Keyring,
				SkipUpdate:       false,
				Getters:          providers,
				RepositoryConfig: hspm.settings.RepositoryConfig,
				RepositoryCache:  hspm.settings.RepositoryCache,
				Debug:            hspm.settings.Debug,
			}
			if err := manager.Update(); err != nil {
				log.Error().
					Str("context", "HelmClient").
					Str("chart", chartName).
					Err(err).
					Msg("Failed to update chart dependencies for helm " + operation)
				return nil, errors.Wrap(err, "failed to update chart dependencies for helm "+operation)
			}

			// Reload the chart with the updated Chart.lock file.
			if chartReq, err = loader.Load(chartPath); err != nil {
				log.Error().
					Str("context", "HelmClient").
					Str("chart_path", chartPath).
					Err(err).
					Msg("Failed to reload chart after dependency update for helm " + operation)
				return nil, errors.Wrap(err, "failed to reload chart after dependency update for helm "+operation)
			}
		}
	}

	return chartReq, nil
}

// parseRepoURL parses and validates a Helm repository URL using RFC 3986 standards.
// Used by search and show operations before downloading index.yaml files.
func parseRepoURL(repoURL string) (*url.URL, error) {
	parsedURL, err := url.ParseRequestURI(repoURL)
	if err != nil {
		return nil, errors.Wrap(err, "invalid helm chart URL: "+repoURL)
	}
	return parsedURL, nil
}

// GetRepoNameFromURL generates a unique repository identifier from a URL.
// Combines hostname and path for uniqueness (e.g., "charts.helm.sh/stable" → "charts.helm.sh-stable").
// Used for Helm's repositories.yaml entries, caching, and chart references.
func GetRepoNameFromURL(urlStr string) (string, error) {
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return "", fmt.Errorf("failed to parse URL: %w", err)
	}

	hostname := parsedURL.Hostname()
	path := parsedURL.Path
	path = strings.Trim(path, "/")
	path = strings.ReplaceAll(path, "/", "-")

	if path == "" {
		return hostname, nil
	}
	return fmt.Sprintf("%s-%s", hostname, path), nil
}

// loadIndexFile loads and parses a Helm repository index.yaml file.
// Called after downloading from HTTP repos or generating from OCI registries.
// Contains chart metadata used for discovery, version resolution, and caching.
func loadIndexFile(indexPath string) (*repo.IndexFile, error) {
	log.Debug().
		Str("context", "HelmClient").
		Str("index_path", indexPath).
		Msg("Loading index file")

	indexFile, err := repo.LoadIndexFile(indexPath)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("index_path", indexPath).
			Err(err).
			Msg("Failed to load index file")
		return nil, errors.Wrapf(err, "failed to load downloaded index file: %s", indexPath)
	}
	return indexFile, nil
}

// ensureHelmDirectoriesExist creates required Helm directories and configuration files.
// Creates repository cache, config directories, and ensures repositories.yaml exists.
// Essential for Helm operations to function properly.
func ensureHelmDirectoriesExist(settings *cli.EnvSettings) error {
	log.Debug().
		Str("context", "helm_sdk_dirs").
		Msg("Ensuring Helm directories exist")

	// List of directories to ensure exist
	directories := []string{
		filepath.Dir(settings.RepositoryConfig), // Repository config directory
		settings.RepositoryCache,                // Repository cache directory
		filepath.Dir(settings.RegistryConfig),   // Registry config directory
		settings.PluginsDirectory,               // Plugins directory
	}

	// Create each directory if it doesn't exist
	for _, dir := range directories {
		if dir == "" {
			continue // Skip empty paths
		}

		if _, err := os.Stat(dir); os.IsNotExist(err) {
			if err := os.MkdirAll(dir, 0700); err != nil {
				log.Error().
					Str("context", "helm_sdk_dirs").
					Str("directory", dir).
					Err(err).
					Msg("Failed to create directory")
				return errors.Wrapf(err, "failed to create directory: %s", dir)
			}
		}
	}

	// Ensure registry config file exists
	if settings.RegistryConfig != "" {
		if _, err := os.Stat(settings.RegistryConfig); os.IsNotExist(err) {
			// Create the directory if it doesn't exist
			dir := filepath.Dir(settings.RegistryConfig)
			if err := os.MkdirAll(dir, 0700); err != nil {
				log.Error().
					Str("context", "helm_sdk_dirs").
					Str("directory", dir).
					Err(err).
					Msg("Failed to create directory")
				return errors.Wrapf(err, "failed to create directory: %s", dir)
			}

			// Create an empty registry config file
			if _, err := os.Create(settings.RegistryConfig); err != nil {
				log.Error().
					Str("context", "helm_sdk_dirs").
					Str("file", settings.RegistryConfig).
					Err(err).
					Msg("Failed to create registry config file")
				return errors.Wrapf(err, "failed to create registry config file: %s", settings.RegistryConfig)
			}
		}
	}

	// Ensure repository config file exists
	if settings.RepositoryConfig != "" {
		if _, err := os.Stat(settings.RepositoryConfig); os.IsNotExist(err) {
			// Create an empty repository config file with default yaml structure
			f := repo.NewFile()
			if err := f.WriteFile(settings.RepositoryConfig, 0644); err != nil {
				log.Error().
					Str("context", "helm_sdk_dirs").
					Str("file", settings.RepositoryConfig).
					Err(err).
					Msg("Failed to create repository config file")
				return errors.Wrapf(err, "failed to create repository config file: %s", settings.RepositoryConfig)
			}
		}
	}

	log.Debug().
		Str("context", "helm_sdk_dirs").
		Msg("Successfully ensured all Helm directories exist")

	return nil
}

// appendChartReferenceAnnotations encodes chart reference values for safe storage in Helm labels.
// It creates a new map with encoded values for specific chart reference labels.
// Preserves existing labels and handles edge cases gracefully.
func appendChartReferenceAnnotations(chartPath, repoURL string, registryID int, existingAnnotations map[string]string) map[string]string {
	// Copy existing annotations
	annotations := make(map[string]string)
	maps.Copy(annotations, existingAnnotations)

	// delete the existing portainer specific labels, for a clean overwrite
	delete(annotations, ChartPathAnnotation)
	delete(annotations, RepoURLAnnotation)
	delete(annotations, RegistryIDAnnotation)

	if chartPath != "" {
		annotations[ChartPathAnnotation] = chartPath
	}

	if repoURL != "" && registryID == 0 {
		annotations[RepoURLAnnotation] = repoURL
	}

	if registryID != 0 {
		annotations[RegistryIDAnnotation] = strconv.Itoa(registryID)
	}

	return annotations
}

// extractChartReferenceAnnotations decodes chart reference labels for display purposes.
// It handles existing labels gracefully and only decodes known chart reference labels.
// If a chart reference label cannot be decoded, it is omitted entirely from the result.
// Returns a ChartReference struct with decoded values.
func extractChartReferenceAnnotations(annotations map[string]string) release.ChartReference {
	if annotations == nil {
		return release.ChartReference{}
	}

	registryID, err := strconv.Atoi(annotations[RegistryIDAnnotation])
	if err != nil {
		registryID = 0
	}

	return release.ChartReference{
		ChartPath:  annotations[ChartPathAnnotation],
		RepoURL:    annotations[RepoURLAnnotation],
		RegistryID: int64(registryID),
	}
}
