package sdk

import (
	"net/url"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/rs/zerolog/log"
	"github.com/segmentio/encoding/json"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/getter"
	"helm.sh/helm/v3/pkg/repo"
)

var (
	errRequiredSearchOptions = errors.New("repo is required")
	errInvalidRepoURL        = errors.New("the request failed since either the Helm repository was not found or the index.yaml is not valid")
)

type RepoIndex struct {
	APIVersion string                 `json:"apiVersion"`
	Entries    map[string][]ChartInfo `json:"entries"`
	Generated  string                 `json:"generated"`
}

type RepoIndexCache struct {
	Index     *repo.IndexFile
	Timestamp time.Time
}

var (
	indexCache    = make(map[string]RepoIndexCache)
	cacheMutex    sync.RWMutex
	cacheDuration = 60 * time.Minute
)

// SearchRepo downloads the `index.yaml` file for specified repo, parses it and returns JSON to caller.
func (hspm *HelmSDKPackageManager) SearchRepo(searchRepoOpts options.SearchRepoOptions) ([]byte, error) {
	// Validate input options
	if err := validateSearchRepoOptions(searchRepoOpts); err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("repo", searchRepoOpts.Repo).
			Err(err).
			Msg("Missing required search repo options")
		return nil, err
	}

	log.Debug().
		Str("context", "HelmClient").
		Str("repo", searchRepoOpts.Repo).
		Msg("Searching repository")

	// Parse and validate the repository URL
	repoURL, err := parseRepoURL(searchRepoOpts.Repo)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("repo", searchRepoOpts.Repo).
			Err(err).
			Msg("Invalid repository URL")
		return nil, err
	}

	// Check cache first
	if searchRepoOpts.UseCache {
		cacheMutex.RLock()
		if cached, exists := indexCache[repoURL.String()]; exists {
			if time.Since(cached.Timestamp) < cacheDuration {
				cacheMutex.RUnlock()
				return convertAndMarshalIndex(cached.Index, searchRepoOpts.Chart)
			}
		}
		cacheMutex.RUnlock()
	}

	// Set up Helm CLI environment
	repoSettings := cli.New()

	// Ensure all required Helm directories exist
	if err := ensureHelmDirectoriesExist(repoSettings); err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Failed to ensure Helm directories exist")
		return nil, errors.Wrap(err, "failed to ensure Helm directories exist")
	}

	repoName, err := getRepoNameFromURL(repoURL.String())
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Failed to get hostname from URL")
		return nil, err
	}

	// Download the index file and update repository configuration
	indexPath, err := downloadRepoIndex(repoURL.String(), repoSettings, repoName)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("repo_url", repoURL.String()).
			Err(err).
			Msg("Failed to download repository index")
		return nil, err
	}

	// Load and parse the index file
	log.Debug().
		Str("context", "HelmClient").
		Str("index_path", indexPath).
		Msg("Loading index file")

	indexFile, err := loadIndexFile(indexPath)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("index_path", indexPath).
			Err(err).
			Msg("Failed to load index file")
		return nil, err
	}

	// Update cache and remove old entries
	cacheMutex.Lock()
	indexCache[searchRepoOpts.Repo] = RepoIndexCache{
		Index:     indexFile,
		Timestamp: time.Now(),
	}
	for key, index := range indexCache {
		if time.Since(index.Timestamp) > cacheDuration {
			delete(indexCache, key)
		}
	}

	cacheMutex.Unlock()

	return convertAndMarshalIndex(indexFile, searchRepoOpts.Chart)
}

// validateSearchRepoOptions validates the required search repository options.
func validateSearchRepoOptions(opts options.SearchRepoOptions) error {
	if opts.Repo == "" {
		return errRequiredSearchOptions
	}
	return nil
}

// parseRepoURL parses and validates the repository URL.
func parseRepoURL(repoURL string) (*url.URL, error) {
	parsedURL, err := url.ParseRequestURI(repoURL)
	if err != nil {
		return nil, errors.Wrap(err, "invalid helm chart URL: "+repoURL)
	}
	return parsedURL, nil
}

// downloadRepoIndex downloads the index.yaml file from the repository and updates
// the repository configuration.
func downloadRepoIndex(repoURLString string, repoSettings *cli.EnvSettings, repoName string) (string, error) {
	log.Debug().
		Str("context", "helm_sdk_repo_index").
		Str("repo_url", repoURLString).
		Str("repo_name", repoName).
		Msg("Creating chart repository object")

	// Create chart repository object
	rep, err := repo.NewChartRepository(
		&repo.Entry{
			Name: repoName,
			URL:  repoURLString,
		},
		getter.All(repoSettings),
	)
	if err != nil {
		log.Error().
			Str("context", "helm_sdk_repo_index").
			Str("repo_url", repoURLString).
			Err(err).
			Msg("Failed to create chart repository object")
		return "", errInvalidRepoURL
	}

	// Load repository configuration file
	f, err := repo.LoadFile(repoSettings.RepositoryConfig)
	if err != nil {
		log.Error().
			Str("context", "helm_sdk_repo_index").
			Str("repo_config", repoSettings.RepositoryConfig).
			Err(err).
			Msg("Failed to load repo config")
		return "", errors.Wrap(err, "failed to load repo config")
	}

	// Download the index file
	log.Debug().
		Str("context", "helm_sdk_repo_index").
		Str("repo_url", repoURLString).
		Msg("Downloading index file")

	indexPath, err := rep.DownloadIndexFile()
	if err != nil {
		log.Error().
			Str("context", "helm_sdk_repo_index").
			Str("repo_url", repoURLString).
			Err(err).
			Msg("Failed to download index file")
		return "", errors.Wrapf(err, "looks like %q is not a valid chart repository or cannot be reached", repoURLString)
	}

	// Update repository configuration
	c := repo.Entry{
		Name: repoName,
		URL:  repoURLString,
	}
	f.Update(&c)

	// Write updated configuration
	repoFile := repoSettings.RepositoryConfig
	if err := f.WriteFile(repoFile, 0644); err != nil {
		log.Error().
			Str("context", "helm_sdk_repo_index").
			Str("repo_file", repoSettings.RepositoryConfig).
			Err(err).
			Msg("Failed to write repository configuration")
		return "", errors.Wrap(err, "failed to write repository configuration")
	}

	log.Debug().
		Str("context", "helm_sdk_repo_index").
		Str("index_path", indexPath).
		Msg("Successfully downloaded index file")

	return indexPath, nil
}

// loadIndexFile loads the index file from the given path.
func loadIndexFile(indexPath string) (*repo.IndexFile, error) {
	indexFile, err := repo.LoadIndexFile(indexPath)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to load downloaded index file: %s", indexPath)
	}
	return indexFile, nil
}

// convertIndexToResponse converts the Helm index file to our response format.
func convertIndexToResponse(indexFile *repo.IndexFile, chartName string) (RepoIndex, error) {
	result := RepoIndex{
		APIVersion: indexFile.APIVersion,
		Entries:    make(map[string][]ChartInfo),
		Generated:  indexFile.Generated.String(),
	}

	// Convert Helm SDK types to our response types
	for name, charts := range indexFile.Entries {
		if chartName == "" || name == chartName {
			result.Entries[name] = convertChartsToChartInfo(charts)
		}
	}

	return result, nil
}

// convertChartsToChartInfo converts Helm chart entries to ChartInfo objects.
func convertChartsToChartInfo(charts []*repo.ChartVersion) []ChartInfo {
	chartInfos := make([]ChartInfo, len(charts))
	for i, chart := range charts {
		chartInfos[i] = ChartInfo{
			Name:        chart.Name,
			Version:     chart.Version,
			AppVersion:  chart.AppVersion,
			Description: chart.Description,
			Deprecated:  chart.Deprecated,
			Created:     chart.Created.String(),
			Digest:      chart.Digest,
			Home:        chart.Home,
			Sources:     chart.Sources,
			URLs:        chart.URLs,
			Icon:        chart.Icon,
			Annotations: chart.Annotations,
		}
	}
	return chartInfos
}

// ChartInfo represents a Helm chart in the repository index
type ChartInfo struct {
	Name        string   `json:"name"`
	Version     string   `json:"version"`
	AppVersion  string   `json:"appVersion"`
	Description string   `json:"description"`
	Deprecated  bool     `json:"deprecated"`
	Created     string   `json:"created"`
	Digest      string   `json:"digest"`
	Home        string   `json:"home"`
	Sources     []string `json:"sources"`
	URLs        []string `json:"urls"`
	Icon        string   `json:"icon,omitempty"`
	Annotations any      `json:"annotations,omitempty"`
}

// ensureHelmDirectoriesExist checks and creates required Helm directories if they don't exist
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

func convertAndMarshalIndex(indexFile *repo.IndexFile, chartName string) ([]byte, error) {
	// Convert the index file to our response format
	result, err := convertIndexToResponse(indexFile, chartName)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Failed to convert index to response format")
		return nil, errors.Wrap(err, "failed to convert index to response format")
	}

	log.Debug().
		Str("context", "HelmClient").
		Str("repo", chartName).
		Int("entries_count", len(indexFile.Entries)).
		Msg("Successfully searched repository")

	return json.Marshal(result)
}
