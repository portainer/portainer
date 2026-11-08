package sdk

import (
	"context"
	"time"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/cache"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/kube"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
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
	err := hspm.initActionConfig(actionConfig, namespaceOrDefault(installOpts.Namespace), installOpts.KubernetesClusterAccess, nil)
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

	if installClient.CreateNamespace {
		installClient.CreateNamespace = shouldCreateNamespace(actionConfig, installClient.Namespace)
	}

	var values map[string]any
	if installOpts.Values != nil {
		values = installOpts.Values
	} else {
		values, err = GetHelmValuesFromFile(installOpts.ValuesFile)
		if err != nil {
			log.Error().
				Str("context", "HelmClient").
				Err(err).
				Msg("Failed to get Helm values from file for helm release installation")
			return nil, errors.Wrap(err, "failed to get Helm values from file for helm release installation")
		}
	}

	chartRef, repoURL, err := parseChartRef(installOpts.Chart, installOpts.Repo, installOpts.Registry)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse chart reference for helm release installation")
	}
	chart, err := hspm.loadAndValidateChartWithPathOptions(actionConfig, &installClient.ChartPathOptions, chartRef, installOpts.Version, repoURL, installClient.DependencyUpdate, "release installation")
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
	chart.Metadata.Annotations = appendChartReferenceAnnotations(installOpts.Chart, installOpts.Repo, registryID, installOpts.StackID, installOpts.AutoUpdate, chart.Metadata.Annotations)

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
	v1Release, err := releaserToV1Release(helmRelease)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("chart", installOpts.Chart).
			Str("name", installOpts.Name).
			Str("namespace", installOpts.Namespace).
			Err(err).
			Msg("Failed to convert helm release to v1 release for helm release installation")
		return nil, errors.Wrap(err, "helm was not able to convert helm release to v1 release")
	}

	return &release.Release{
		Name:      v1Release.Name,
		Namespace: v1Release.Namespace,
		Chart: release.Chart{
			Metadata: &release.Metadata{
				Name:        v1Release.Chart.Metadata.Name,
				Version:     v1Release.Chart.Metadata.Version,
				AppVersion:  v1Release.Chart.Metadata.AppVersion,
				Annotations: v1Release.Chart.Metadata.Annotations,
			},
		},
		Labels:   v1Release.Labels,
		Version:  v1Release.Version,
		Manifest: v1Release.Manifest,
	}, nil
}

const (
	// defaultReleaseTimeout is generous so large charts have time to become ready
	defaultReleaseTimeout = 15 * time.Minute
	// defaultAtomicReleaseTimeout is longer because rolling back a failed release
	// adds to the operation time
	defaultAtomicReleaseTimeout = 30 * time.Minute
)

// releaseTimeout returns the requested timeout, or the default when none was requested
func releaseTimeout(requested time.Duration, rollbackOnFailure bool) time.Duration {
	if requested != 0 {
		return requested
	}

	if rollbackOnFailure {
		return defaultAtomicReleaseTimeout
	}

	return defaultReleaseTimeout
}

// initInstallClient initializes the install client with the given options
// and return the install client.
func initInstallClient(actionConfig *action.Configuration, installOpts options.InstallOptions) (*action.Install, error) {
	installClient := action.NewInstall(actionConfig)
	installClient.DependencyUpdate = true
	installClient.ReleaseName = installOpts.Name
	if installOpts.Wait {
		installClient.WaitStrategy = kube.StatusWatcherStrategy
	} else {
		installClient.WaitStrategy = kube.HookOnlyStrategy
	}
	installClient.RollbackOnFailure = installOpts.Atomic
	installClient.Timeout = releaseTimeout(installOpts.Timeout, installOpts.Atomic)
	installClient.Version = installOpts.Version
	if installOpts.DryRun {
		installClient.DryRunStrategy = action.DryRunClient
	}
	installClient.TakeOwnership = installOpts.TakeOwnership
	installClient.CreateNamespace = installOpts.CreateNamespace
	err := configureChartPathOptions(&installClient.ChartPathOptions, installOpts.Version, installOpts.Repo, installOpts.Registry)
	if err != nil {
		return nil, errors.Wrap(err, "failed to configure chart path options for helm release installation")
	}

	// Set default values if not specified
	if installOpts.Namespace == "" {
		installClient.Namespace = "default"
	} else {
		installClient.Namespace = installOpts.Namespace
	}

	if len(installOpts.HelmAppLabels) > 0 {
		installClient.PostRenderer = &appLabelsPostRenderer{labels: installOpts.HelmAppLabels}
	}

	return installClient, nil
}

// shouldCreateNamespace reports whether Helm still has to create the release
// namespace. Helm v4 server-side applies the namespace when CreateNamespace is set,
// which patches one that already exists and fails for users who may only read
// namespaces. A caller forbidden from reading namespaces cannot create one either,
// so creation is skipped; any other failed check leaves creation to Helm.
func shouldCreateNamespace(actionConfig *action.Configuration, namespace string) bool {
	exists, err := releaseNamespaceExists(actionConfig, namespace)
	if k8serrors.IsForbidden(err) {
		return false
	}

	if err != nil {
		log.Warn().
			Str("context", "HelmClient").
			Str("namespace", namespace).
			Err(err).
			Msg("unable to check whether the release namespace exists")

		return true
	}

	return !exists
}

func releaseNamespaceExists(actionConfig *action.Configuration, namespace string) (bool, error) {
	restConfig, err := actionConfig.RESTClientGetter.ToRESTConfig()
	if err != nil {
		return false, errors.Wrap(err, "failed to build the Kubernetes REST config")
	}

	clientset, err := kubernetes.NewForConfig(restConfig)
	if err != nil {
		return false, errors.Wrap(err, "failed to build the Kubernetes client")
	}

	return namespaceExists(clientset, namespace)
}

func namespaceExists(clientset kubernetes.Interface, namespace string) (bool, error) {
	_, err := clientset.CoreV1().Namespaces().Get(context.Background(), namespace, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		return false, nil
	}

	return err == nil, err
}
