package sdk

import (
	"fmt"
	"net/url"
	"strings"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v3/pkg/action"
)

var errRequiredShowOptions = errors.New("chart, repo and output format are required")

// Show implements the HelmPackageManager interface by using the Helm SDK to show chart information.
// It supports showing chart values, readme, and chart details based on the provided ShowOptions.
func (hspm *HelmSDKPackageManager) Show(showOpts options.ShowOptions) ([]byte, error) {
	if showOpts.Chart == "" || showOpts.Repo == "" || showOpts.OutputFormat == "" {
		log.Error().
			Str("context", "HelmClient").
			Str("chart", showOpts.Chart).
			Str("repo", showOpts.Repo).
			Str("output_format", string(showOpts.OutputFormat)).
			Msg("Missing required show options")
		return nil, errRequiredShowOptions
	}

	log.Debug().
		Str("context", "HelmClient").
		Str("chart", showOpts.Chart).
		Str("repo", showOpts.Repo).
		Str("output_format", string(showOpts.OutputFormat)).
		Msg("Showing chart information")

	repoURL, err := parseRepoURL(showOpts.Repo)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("repo", showOpts.Repo).
			Err(err).
			Msg("Invalid repository URL")
		return nil, err
	}

	repoName, err := getRepoNameFromURL(repoURL.String())
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Failed to get hostname from URL")
		return nil, err
	}

	// Initialize action configuration (no namespace or cluster access needed)
	actionConfig := new(action.Configuration)
	err = hspm.initActionConfig(actionConfig, "", nil)
	if err != nil {
		// error is already logged in initActionConfig
		return nil, fmt.Errorf("failed to initialize helm configuration: %w", err)
	}

	// Create showClient action
	showClient, err := initShowClient(actionConfig, showOpts)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Failed to initialize helm show client")
		return nil, fmt.Errorf("failed to initialize helm show client: %w", err)
	}

	// Locate and load the chart
	log.Debug().
		Str("context", "HelmClient").
		Str("chart", showOpts.Chart).
		Str("repo", showOpts.Repo).
		Msg("Locating chart")

	fullChartPath := fmt.Sprintf("%s/%s", repoName, showOpts.Chart)
	chartPath, err := showClient.ChartPathOptions.LocateChart(fullChartPath, hspm.settings)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("chart", fullChartPath).
			Str("repo", showOpts.Repo).
			Err(err).
			Msg("Failed to locate chart")
		return nil, fmt.Errorf("failed to locate chart: %w", err)
	}

	// Get the output based on the requested format
	output, err := showClient.Run(chartPath)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("chart_path", chartPath).
			Str("output_format", string(showOpts.OutputFormat)).
			Err(err).
			Msg("Failed to show chart info")
		return nil, fmt.Errorf("failed to show chart info: %w", err)
	}

	log.Debug().
		Str("context", "HelmClient").
		Str("chart", showOpts.Chart).
		Int("output_size", len(output)).
		Msg("Successfully retrieved chart information")

	return []byte(output), nil
}

// initShowClient initializes the show client with the given options
// and return the show client.
func initShowClient(actionConfig *action.Configuration, showOpts options.ShowOptions) (*action.Show, error) {
	showClient := action.NewShowWithConfig(action.ShowAll, actionConfig)
	showClient.ChartPathOptions.Version = showOpts.Version

	// Set output type based on ShowOptions
	switch showOpts.OutputFormat {
	case options.ShowChart:
		showClient.OutputFormat = action.ShowChart
	case options.ShowValues:
		showClient.OutputFormat = action.ShowValues
	case options.ShowReadme:
		showClient.OutputFormat = action.ShowReadme
	default:
		log.Error().
			Str("context", "HelmClient").
			Str("output_format", string(showOpts.OutputFormat)).
			Msg("Unsupported output format")
		return nil, fmt.Errorf("unsupported output format: %s", showOpts.OutputFormat)
	}

	return showClient, nil
}

// getRepoNameFromURL extracts a unique repository identifier from a URL string.
// It combines hostname and path to ensure uniqueness across different repositories on the same host.
// Examples:
// - https://portainer.github.io/test-public-repo/ -> portainer.github.io-test-public-repo
// - https://portainer.github.io/another-repo/ -> portainer.github.io-another-repo
// - https://charts.helm.sh/stable -> charts.helm.sh-stable
func getRepoNameFromURL(urlStr string) (string, error) {
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
