package sdk

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"sync"
	"time"

	ocispec "github.com/opencontainers/image-spec/specs-go/v1"
	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/liboras"
	"github.com/rs/zerolog/log"
	"github.com/segmentio/encoding/json"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/getter"
	"helm.sh/helm/v3/pkg/repo"
	"oras.land/oras-go/v2/registry"
)

var (
	errRequiredSearchOptions = errors.New("repo is required")
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

	// Set up Helm CLI environment
	repoSettings := cli.New()
	if err := ensureHelmDirectoriesExist(repoSettings); err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Failed to ensure Helm directories exist")
		return nil, errors.Wrap(err, "failed to ensure Helm directories exist")
	}

	// Try cache first for HTTP repos
	if IsHTTPRepository(searchRepoOpts.Registry) && searchRepoOpts.UseCache {
		if cachedResult := hspm.tryGetFromCache(searchRepoOpts.Repo, searchRepoOpts.Chart); cachedResult != nil {
			return cachedResult, nil
		}
	}

	// Download index based on source type
	indexFile, err := hspm.downloadRepoIndex(searchRepoOpts, repoSettings)
	if err != nil {
		return nil, err
	}

	// Update cache for HTTP repos
	if IsHTTPRepository(searchRepoOpts.Registry) {
		UpdateCache(searchRepoOpts.Repo, indexFile)
	}

	return convertAndMarshalIndex(indexFile, searchRepoOpts.Chart)
}

// tryGetFromCache attempts to retrieve a cached index file and convert it to the response format
func (hspm *HelmSDKPackageManager) tryGetFromCache(repoURL, chartName string) []byte {
	cacheMutex.RLock()
	defer cacheMutex.RUnlock()

	if cached, exists := indexCache[repoURL]; exists {
		if time.Since(cached.Timestamp) < cacheDuration {
			result, err := convertAndMarshalIndex(cached.Index, chartName)
			if err != nil {
				log.Debug().
					Str("context", "HelmClient").
					Str("repo", repoURL).
					Err(err).
					Msg("Failed to convert cached index")
				return nil
			}
			return result
		}
	}
	return nil
}

// updateCache updates the cache with the provided index file and cleans up expired entries
func UpdateCache(repoURL string, indexFile *repo.IndexFile) {
	cacheMutex.Lock()
	defer cacheMutex.Unlock()

	indexCache[repoURL] = RepoIndexCache{
		Index:     indexFile,
		Timestamp: time.Now(),
	}

	// Clean up expired entries
	for key, index := range indexCache {
		if time.Since(index.Timestamp) > cacheDuration {
			delete(indexCache, key)
		}
	}
}

// downloadRepoIndex downloads the repository index based on the source type (HTTP or OCI)
func (hspm *HelmSDKPackageManager) downloadRepoIndex(opts options.SearchRepoOptions, repoSettings *cli.EnvSettings) (*repo.IndexFile, error) {
	if IsOCIRegistry(opts.Registry) {
		return hspm.downloadOCIRepoIndex(opts.Registry, repoSettings, opts.Chart)
	}
	return hspm.downloadHTTPRepoIndex(opts.Repo, repoSettings)
}

// downloadHTTPRepoIndex downloads and loads an index file from an HTTP repository
func (hspm *HelmSDKPackageManager) downloadHTTPRepoIndex(repoURL string, repoSettings *cli.EnvSettings) (*repo.IndexFile, error) {
	parsedURL, err := parseRepoURL(repoURL)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("repo", repoURL).
			Err(err).
			Msg("Invalid repository URL")
		return nil, err
	}

	repoName, err := GetRepoNameFromURL(parsedURL.String())
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Failed to get hostname from URL")
		return nil, err
	}

	indexPath, err := downloadRepoIndexFromHttpRepo(parsedURL.String(), repoSettings, repoName)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("repo_url", parsedURL.String()).
			Err(err).
			Msg("Failed to download repository index")
		return nil, err
	}

	return loadIndexFile(indexPath)
}

// downloadOCIRepoIndex downloads and loads an index file from an OCI registry
func (hspm *HelmSDKPackageManager) downloadOCIRepoIndex(registry *portainer.Registry, repoSettings *cli.EnvSettings, chartPath string) (*repo.IndexFile, error) {
	// Validate registry credentials first
	if err := validateRegistryCredentials(registry); err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("repo", registry.URL).
			Err(err).
			Msg("Registry credential validation failed for OCI search")
		return nil, fmt.Errorf("registry credential validation failed: %w", err)
	}

	indexPath, err := downloadRepoIndexFromOciRegistry(registry, repoSettings, chartPath)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("repo", registry.URL).
			Err(err).
			Msg("Failed to download repository index")
		return nil, err
	}

	return loadIndexFile(indexPath)
}

// validateSearchRepoOptions validates the required search repository options.
func validateSearchRepoOptions(opts options.SearchRepoOptions) error {
	if opts.Repo == "" && IsHTTPRepository(opts.Registry) {
		return errRequiredSearchOptions
	}
	return nil
}

// downloadRepoIndexFromHttpRepo downloads the index.yaml file from the repository and updates
// the repository configuration.
func downloadRepoIndexFromHttpRepo(repoURLString string, repoSettings *cli.EnvSettings, repoName string) (string, error) {
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
		return "", errors.New("the request failed since either the Helm repository was not found or the index.yaml is not valid")
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

func downloadRepoIndexFromOciRegistry(registry *portainer.Registry, repoSettings *cli.EnvSettings, chartPath string) (string, error) {
	if IsHTTPRepository(registry) {
		return "", errors.New("registry information is required for OCI search")
	}

	if chartPath == "" {
		return "", errors.New("chart path is required for OCI search")
	}

	ctx := context.Background()

	registryClient, err := liboras.CreateClient(*registry)
	if err != nil {
		log.Error().
			Str("context", "helm_sdk_repo_index_oci").
			Str("registry_url", registry.URL).
			Err(err).
			Msg("Failed to create ORAS registry client")
		return "", errors.Wrap(err, "failed to create ORAS registry client")
	}

	// Obtain repository handle for the specific chart path (relative to registry host)
	repository, err := registryClient.Repository(ctx, chartPath)
	if err != nil {
		log.Error().
			Str("context", "helm_sdk_repo_index_oci").
			Str("repository", chartPath).
			Err(err).
			Msg("Failed to obtain repository handle")
		return "", errors.Wrap(err, "failed to obtain repository handle")
	}

	// List all tags for this chart repository
	var tags []string
	err = repository.Tags(ctx, "", func(t []string) error {
		tags = append(tags, t...)
		return nil
	})
	if err != nil {
		log.Error().
			Str("context", "helm_sdk_repo_index_oci").
			Str("repository", chartPath).
			Err(err).
			Msg("Failed to list tags")
		return "", errors.Wrap(err, "failed to list tags for repository")
	}

	if len(tags) == 0 {
		return "", errors.Errorf("no tags found for repository %s", chartPath)
	}

	// Build Helm index file in memory
	indexFile := repo.NewIndexFile()

	const helmConfigMediaType = "application/vnd.cncf.helm.config.v1+json"

	for _, tag := range tags {
		chartVersion, err := processOCITag(ctx, repository, registry, chartPath, tag, helmConfigMediaType)
		if err != nil {
			log.Debug().
				Str("context", "helm_sdk_repo_index_oci").
				Str("repository", chartPath).
				Str("tag", tag).
				Err(err).
				Msg("Failed to process tag; skipping")
			continue
		}

		if chartVersion != nil {
			indexFile.Entries[chartVersion.Name] = append(indexFile.Entries[chartVersion.Name], chartVersion)
		}
	}

	if len(indexFile.Entries) == 0 {
		return "", errors.Errorf("no helm chart versions found for repository %s", chartPath)
	}

	indexFile.SortEntries()

	fileNameSafe := strings.ReplaceAll(chartPath, "/", "-")
	destPath := filepath.Join(repoSettings.RepositoryCache, fmt.Sprintf("%s-%d-index.yaml", fileNameSafe, time.Now().UnixNano()))

	if err := indexFile.WriteFile(destPath, 0644); err != nil {
		return "", errors.Wrap(err, "failed to write OCI index file")
	}

	log.Debug().
		Str("context", "helm_sdk_repo_index_oci").
		Str("dest_path", destPath).
		Int("entries", len(indexFile.Entries)).
		Msg("Successfully generated OCI index file")

	return destPath, nil
}

// processOCITag processes a single OCI tag and returns a Helm chart version.
func processOCITag(ctx context.Context, repository registry.Repository, registry *portainer.Registry, chartPath string, tag string, helmConfigMediaType string) (*repo.ChartVersion, error) {
	// Resolve tag to get descriptor
	descriptor, err := repository.Resolve(ctx, tag)
	if err != nil {
		log.Debug().
			Str("context", "helm_sdk_repo_index_oci").
			Str("repository", chartPath).
			Str("tag", tag).
			Err(err).
			Msg("Failed to resolve tag; skipping")
		return nil, nil
	}

	// Fetch manifest to validate media type and obtain config descriptor
	manifestReader, err := repository.Manifests().Fetch(ctx, descriptor)
	if err != nil {
		log.Debug().
			Str("context", "helm_sdk_repo_index_oci").
			Str("repository", chartPath).
			Str("tag", tag).
			Err(err).
			Msg("Failed to fetch manifest; skipping")
		return nil, nil
	}

	manifestContent, err := io.ReadAll(manifestReader)
	manifestReader.Close()
	if err != nil {
		return nil, nil
	}

	var manifest ocispec.Manifest
	if err := json.Unmarshal(manifestContent, &manifest); err != nil {
		return nil, nil
	}

	// Ensure manifest config is Helm chart metadata
	if manifest.Config.MediaType != helmConfigMediaType {
		return nil, nil
	}

	// Fetch config blob (chart metadata)
	cfgReader, err := repository.Blobs().Fetch(ctx, manifest.Config)
	if err != nil {
		return nil, nil
	}
	cfgBytes, err := io.ReadAll(cfgReader)
	cfgReader.Close()
	if err != nil {
		return nil, nil
	}

	var metadata chart.Metadata
	if err := json.Unmarshal(cfgBytes, &metadata); err != nil {
		return nil, nil
	}

	// Build chart version entry
	chartVersion := &repo.ChartVersion{
		Metadata: &metadata,
		URLs:     []string{fmt.Sprintf("oci://%s/%s:%s", registry.URL, chartPath, tag)},
		Created:  time.Now(),
		Digest:   descriptor.Digest.String(),
	}

	return chartVersion, nil
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
		if chartName == "" || strings.Contains(strings.ToLower(chartName), strings.ToLower(name)) {
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
