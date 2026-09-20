package sdk

import (
	"time"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/cache"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/kube"
)

// Upgrade implements the HelmPackageManager interface by using the Helm SDK to upgrade a chart.
// If the release does not exist, it will install it instead.
func (hspm *HelmSDKPackageManager) Upgrade(upgradeOpts options.InstallOptions) (*release.Release, error) {
	log.Debug().
		Str("context", "HelmClient").
		Str("chart", upgradeOpts.Chart).
		Str("name", upgradeOpts.Name).
		Str("namespace", upgradeOpts.Namespace).
		Str("repo", upgradeOpts.Repo).
		Bool("wait", upgradeOpts.Wait).
		Msg("Upgrading Helm chart")

	if upgradeOpts.Name == "" {
		log.Error().
			Str("context", "HelmClient").
			Str("chart", upgradeOpts.Chart).
			Str("name", upgradeOpts.Name).
			Str("namespace", upgradeOpts.Namespace).
			Str("repo", upgradeOpts.Repo).
			Bool("wait", upgradeOpts.Wait).
			Msg("Name is required for helm release upgrade")
		return nil, errors.New("name is required for helm release upgrade")
	}

	// Check if the release exists
	exists, err := hspm.doesReleaseExist(upgradeOpts.Name, upgradeOpts.Namespace, upgradeOpts.KubernetesClusterAccess)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("name", upgradeOpts.Name).
			Str("namespace", upgradeOpts.Namespace).
			Err(err).
			Msg("Failed to check if release exists")
		return nil, errors.Wrap(err, "failed to check if release exists")
	}

	// If the release doesn't exist, install it instead
	if !exists {
		log.Info().
			Str("context", "HelmClient").
			Str("chart", upgradeOpts.Chart).
			Str("name", upgradeOpts.Name).
			Str("namespace", upgradeOpts.Namespace).
			Msg("Release doesn't exist, installing instead")
		return hspm.install(upgradeOpts)
	}

	// Initialize action configuration with kubernetes config
	actionConfig := new(action.Configuration)
	err = hspm.initActionConfig(actionConfig, namespaceOrDefault(upgradeOpts.Namespace), upgradeOpts.KubernetesClusterAccess, nil)
	if err != nil {
		// error is already logged in initActionConfig
		return nil, errors.Wrap(err, "failed to initialize helm configuration for helm release upgrade")
	}

	// Setup chart source
	err = authenticateChartSource(actionConfig, upgradeOpts.Registry)
	if err != nil {
		return nil, errors.Wrap(err, "failed to setup chart source for helm release upgrade")
	}

	upgradeClient, err := initUpgradeClient(actionConfig, upgradeOpts)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Failed to initialize helm upgrade client for helm release upgrade")
		return nil, errors.Wrap(err, "failed to initialize helm upgrade client for helm release upgrade")
	}

	var values map[string]any
	if upgradeOpts.Values != nil {
		values = upgradeOpts.Values
	} else {
		values, err = GetHelmValuesFromFile(upgradeOpts.ValuesFile)
		if err != nil {
			log.Error().
				Str("context", "HelmClient").
				Err(err).
				Msg("Failed to get Helm values from file for helm release upgrade")
			return nil, errors.Wrap(err, "failed to get Helm values from file for helm release upgrade")
		}
	}

	chartRef, repoURL, err := parseChartRef(upgradeOpts.Chart, upgradeOpts.Repo, upgradeOpts.Registry)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse chart reference for helm release upgrade")
	}
	chart, err := hspm.loadAndValidateChartWithPathOptions(actionConfig, &upgradeClient.ChartPathOptions, chartRef, upgradeOpts.Version, repoURL, upgradeClient.DependencyUpdate, "release upgrade")
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Failed to load and validate chart for helm release upgrade")

		// Check if this is an authentication error and flush cache if needed
		if upgradeOpts.Registry != nil && shouldFlushCacheOnError(err, upgradeOpts.Registry.ID) {
			cache.FlushRegistryByID(upgradeOpts.Registry.ID)
			log.Info().
				Int("registry_id", int(upgradeOpts.Registry.ID)).
				Str("context", "HelmClient").
				Msg("Flushed registry cache due to chart loading authentication error during upgrade")
		}

		return nil, errors.Wrap(err, "failed to load and validate chart for helm release upgrade")
	}

	// Add chart references to annotations
	var registryID int
	if upgradeOpts.Registry != nil {
		registryID = int(upgradeOpts.Registry.ID)
	}
	chart.Metadata.Annotations = appendChartReferenceAnnotations(upgradeOpts.Chart, upgradeOpts.Repo, registryID, upgradeOpts.StackID, upgradeOpts.AutoUpdate, chart.Metadata.Annotations)

	log.Info().
		Str("context", "HelmClient").
		Str("chart", upgradeOpts.Chart).
		Str("name", upgradeOpts.Name).
		Str("namespace", upgradeOpts.Namespace).
		Msgf("Running chart upgrade for helm release with the annotations: %+v", chart.Metadata.Annotations)

	helmRelease, err := upgradeClient.Run(upgradeOpts.Name, chart, values)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("chart", upgradeOpts.Chart).
			Str("name", upgradeOpts.Name).
			Str("namespace", upgradeOpts.Namespace).
			Err(err).
			Msg("Failed to upgrade helm chart for helm release upgrade")
		return nil, errors.Wrap(err, "helm was not able to upgrade the chart for helm release upgrade")
	}
	releaseV1, err := releaserToV1Release(helmRelease)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("chart", upgradeOpts.Chart).
			Str("name", upgradeOpts.Name).
			Str("namespace", upgradeOpts.Namespace).
			Err(err).
			Msg("Failed to convert helm release to v1 release for helm release upgrade")
		return nil, errors.Wrap(err, "Failed to convert helm release to v1 release for helm release upgrade")
	}

	return &release.Release{
		Name:      releaseV1.Name,
		Namespace: releaseV1.Namespace,
		Chart: release.Chart{
			Metadata: &release.Metadata{
				Name:        releaseV1.Chart.Metadata.Name,
				Version:     releaseV1.Chart.Metadata.Version,
				AppVersion:  releaseV1.Chart.Metadata.AppVersion,
				Annotations: releaseV1.Chart.Metadata.Annotations,
			},
		},
		Labels:   releaseV1.Labels,
		Version:  releaseV1.Version,
		Manifest: releaseV1.Manifest,
	}, nil
}

// initUpgradeClient initializes the upgrade client with the given options
// and return the upgrade client.
func initUpgradeClient(actionConfig *action.Configuration, upgradeOpts options.InstallOptions) (*action.Upgrade, error) {
	upgradeClient := action.NewUpgrade(actionConfig)
	upgradeClient.DependencyUpdate = true
	upgradeClient.RollbackOnFailure = upgradeOpts.Atomic
	upgradeClient.Version = upgradeOpts.Version
	if upgradeOpts.DryRun {
		upgradeClient.DryRunStrategy = action.DryRunClient
	}
	if upgradeOpts.Wait {
		upgradeClient.WaitStrategy = kube.StatusWatcherStrategy
	} else {
		upgradeClient.WaitStrategy = kube.HookOnlyStrategy
	}
	upgradeClient.TakeOwnership = upgradeOpts.TakeOwnership // Equivalent to --take-ownership flag
	upgradeClient.MaxHistory = upgradeOpts.MaxHistory
	upgradeClient.ResetValues = upgradeOpts.ResetValues // Equivalent to --reset-values flag; off unless the caller opts in
	err := configureChartPathOptions(&upgradeClient.ChartPathOptions, upgradeOpts.Version, upgradeOpts.Repo, upgradeOpts.Registry)
	if err != nil {
		return nil, errors.Wrap(err, "failed to configure chart path options for helm release upgrade")
	}

	// Set default values if not specified
	if upgradeOpts.Timeout == 0 {
		if upgradeClient.RollbackOnFailure {
			upgradeClient.Timeout = 30 * time.Minute // the atomic flag significantly increases the upgrade time
		} else {
			upgradeClient.Timeout = 15 * time.Minute
		}
	} else {
		upgradeClient.Timeout = upgradeOpts.Timeout
	}
	if upgradeOpts.Namespace == "" {
		upgradeClient.Namespace = "default"
	} else {
		upgradeClient.Namespace = upgradeOpts.Namespace
	}

	if len(upgradeOpts.HelmAppLabels) > 0 {
		upgradeClient.PostRenderer = &appLabelsPostRenderer{labels: upgradeOpts.HelmAppLabels}
	}

	return upgradeClient, nil
}
