package sdk

import (
	"fmt"
	"strings"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/cache"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v4/pkg/action"
)

var errRequiredShowOptions = errors.New("chart, output format and either repo or registry are required")

// isSelfContainedOCIChartRef reports whether chart is a complete "oci://host/path"
// reference that needs no separate repo or registry to be located (e.g. Portainer
// addon charts, which are resolved from a bare oci:// ref with no Repo/Registry).
func isSelfContainedOCIChartRef(chart string) bool {
	return strings.HasPrefix(chart, "oci://")
}

// Show implements the HelmPackageManager interface by using the Helm SDK to show chart information.
// It supports showing chart values, readme, and chart details based on the provided ShowOptions.
func (hspm *HelmSDKPackageManager) Show(showOpts options.ShowOptions) ([]byte, error) {
	missingSource := showOpts.Repo == "" && IsHTTPRepository(showOpts.Registry) && !isSelfContainedOCIChartRef(showOpts.Chart)
	if showOpts.Chart == "" || missingSource || showOpts.OutputFormat == "" {
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

	actionConfig := new(action.Configuration)
	err := authenticateChartSource(actionConfig, showOpts.Registry)
	if err != nil {
		return nil, fmt.Errorf("failed to setup chart source: %w", err)
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

	chartRef, _, err := parseChartRef(showOpts.Chart, showOpts.Repo, showOpts.Registry)
	if err != nil {
		return nil, fmt.Errorf("failed to parse chart reference: %w", err)
	}
	chartPath, err := showClient.LocateChart(chartRef, hspm.settings)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("chart", chartRef).
			Str("repo", showOpts.Repo).
			Err(err).
			Msg("Failed to locate chart")

		// Check if this is an authentication error and flush cache if needed
		if showOpts.Registry != nil && shouldFlushCacheOnError(err, showOpts.Registry.ID) {
			cache.FlushRegistryByID(showOpts.Registry.ID)
			log.Info().
				Int("registry_id", int(showOpts.Registry.ID)).
				Str("context", "HelmClient").
				Msg("Flushed registry cache due to chart registry authentication error")
		}

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

		// Check if this is an authentication error and flush cache if needed
		if showOpts.Registry != nil && shouldFlushCacheOnError(err, showOpts.Registry.ID) {
			cache.FlushRegistryByID(showOpts.Registry.ID)
			log.Info().
				Int("registry_id", int(showOpts.Registry.ID)).
				Str("context", "HelmClient").
				Msg("Flushed registry cache due to chart show authentication error")
		}

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
	showClient := action.NewShow(action.ShowAll, actionConfig)
	err := configureChartPathOptions(&showClient.ChartPathOptions, showOpts.Version, showOpts.Repo, showOpts.Registry)
	if err != nil {
		return nil, fmt.Errorf("failed to configure chart path options: %w", err)
	}

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
