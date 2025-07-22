package sdk

import (
	"time"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/cache"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/postrender"
)

// Install implements the HelmPackageManager interface by using the Helm SDK to install a chart.
func (hspm *HelmSDKPackageManager) install(installOpts options.InstallOptions) (*release.Release, error) {
	log.Debug().
		Str("context", "HelmClient").
		Str("chart", installOpts.Chart).
		Str("name", installOpts.Name).
		Str("namespace", installOpts.Namespace).
		Str("repo", installOpts.Repo).
		Bool("wait", installOpts.Wait).
		Msg("Installing Helm chart")

	if installOpts.Name == "" {
		log.Error().
			Str("context", "HelmClient").
			Str("chart", installOpts.Chart).
			Str("name", installOpts.Name).
			Str("namespace", installOpts.Namespace).
			Str("repo", installOpts.Repo).
			Bool("wait", installOpts.Wait).
			Msg("Name is required for helm release installation")
		return nil, errors.New("name is required for helm release installation")
	}

	// Initialize action configuration with kubernetes config
	actionConfig := new(action.Configuration)
	err := hspm.initActionConfig(actionConfig, installOpts.Namespace, installOpts.KubernetesClusterAccess)
	if err != nil {
		// error is already logged in initActionConfig
		return nil, errors.Wrap(err, "failed to initialize helm configuration for helm release installation")
	}

	// Setup chart source
	err = authenticateChartSource(actionConfig, installOpts.Registry)
	if err != nil {
		return nil, errors.Wrap(err, "failed to setup chart source for helm release installation")
	}

	installClient, err := initInstallClient(actionConfig, installOpts)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Failed to initialize helm install client for helm release installation")
		return nil, errors.Wrap(err, "failed to initialize helm install client for helm release installation")
	}

	values, err := hspm.getHelmValuesFromFile(installOpts.ValuesFile)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Failed to get Helm values from file for helm release installation")
		return nil, errors.Wrap(err, "failed to get Helm values from file for helm release installation")
	}

	chartRef, repoURL, err := parseChartRef(installOpts.Chart, installOpts.Repo, installOpts.Registry)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse chart reference for helm release installation")
	}
	chart, err := hspm.loadAndValidateChartWithPathOptions(&installClient.ChartPathOptions, chartRef, installOpts.Version, repoURL, installClient.DependencyUpdate, "release installation")
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Failed to load and validate chart for helm release installation")

		// Check if this is an authentication error and flush cache if needed
		if installOpts.Registry != nil && shouldFlushCacheOnError(err, installOpts.Registry.ID) {
			cache.FlushRegistryByID(installOpts.Registry.ID)
			log.Info().
				Int("registry_id", int(installOpts.Registry.ID)).
				Str("context", "HelmClient").
				Msg("Flushed registry cache due to chart loading authentication error during install")
		}

		return nil, errors.Wrap(err, "failed to load and validate chart for helm release installation")
	}

	// Add chart references to annotations
	var registryID int
	if installOpts.Registry != nil {
		registryID = int(installOpts.Registry.ID)
	}
	chart.Metadata.Annotations = appendChartReferenceAnnotations(installOpts.Chart, installOpts.Repo, registryID, chart.Metadata.Annotations)

	// Run the installation
	log.Info().
		Str("context", "HelmClient").
		Str("chart", installOpts.Chart).
		Str("name", installOpts.Name).
		Str("namespace", installOpts.Namespace).
		Msg("Running chart installation for helm release")
	helmRelease, err := installClient.Run(chart, values)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("chart", installOpts.Chart).
			Str("name", installOpts.Name).
			Str("namespace", installOpts.Namespace).
			Err(err).
			Msg("Failed to install helm chart for helm release installation")
		if installOpts.DryRun {
			// remove installation wording for dry run. The inner error has enough context.
			return nil, errors.Wrap(err, "dry-run failed")
		}
		return nil, errors.Wrap(err, "helm was not able to install the chart for helm release installation")
	}

	return &release.Release{
		Name:      helmRelease.Name,
		Namespace: helmRelease.Namespace,
		Chart: release.Chart{
			Metadata: &release.Metadata{
				Name:        helmRelease.Chart.Metadata.Name,
				Version:     helmRelease.Chart.Metadata.Version,
				AppVersion:  helmRelease.Chart.Metadata.AppVersion,
				Annotations: helmRelease.Chart.Metadata.Annotations,
			},
		},
		Labels:   helmRelease.Labels,
		Version:  helmRelease.Version,
		Manifest: helmRelease.Manifest,
	}, nil
}

// initInstallClient initializes the install client with the given options
// and return the install client.
func initInstallClient(actionConfig *action.Configuration, installOpts options.InstallOptions) (*action.Install, error) {
	installClient := action.NewInstall(actionConfig)
	installClient.DependencyUpdate = true
	installClient.ReleaseName = installOpts.Name
	installClient.Wait = installOpts.Wait
	installClient.Timeout = installOpts.Timeout
	installClient.Version = installOpts.Version
	installClient.DryRun = installOpts.DryRun
	err := configureChartPathOptions(&installClient.ChartPathOptions, installOpts.Version, installOpts.Repo, installOpts.Registry)
	if err != nil {
		return nil, errors.Wrap(err, "failed to configure chart path options for helm release installation")
	}

	// Set default values if not specified
	if installOpts.Timeout == 0 {
		installClient.Timeout = 15 * time.Minute // set a bigger timeout for large charts
	} else {
		installClient.Timeout = installOpts.Timeout
	}
	if installOpts.Namespace == "" {
		installClient.Namespace = "default"
	} else {
		installClient.Namespace = installOpts.Namespace
	}

	if installOpts.PostRenderer != "" {
		postRenderer, err := postrender.NewExec(installOpts.PostRenderer)
		if err != nil {
			return nil, errors.Wrap(err, "failed to create post renderer")
		}
		installClient.PostRenderer = postRenderer
	}

	return installClient, nil
}
