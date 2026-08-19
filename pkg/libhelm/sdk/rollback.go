package sdk

import (
	"time"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/kube"
)

// Rollback would implement the HelmPackageManager interface by using the Helm SDK to rollback a release to a previous revision.
func (hspm *HelmSDKPackageManager) Rollback(rollbackOpts options.RollbackOptions) (*release.Release, error) {
	log.Debug().
		Str("context", "HelmClient").
		Str("name", rollbackOpts.Name).
		Str("namespace", rollbackOpts.Namespace).
		Int("revision", rollbackOpts.Version).
		Bool("wait", rollbackOpts.Wait).
		Msg("Rolling back Helm release")

	if rollbackOpts.Name == "" {
		log.Error().
			Str("context", "HelmClient").
			Msg("Name is required for helm release rollback")
		return nil, errors.New("name is required for helm release rollback")
	}

	// Initialize action configuration with kubernetes config
	actionConfig := new(action.Configuration)
	err := hspm.initActionConfig(actionConfig, namespaceOrDefault(rollbackOpts.Namespace), rollbackOpts.KubernetesClusterAccess)
	if err != nil {
		return nil, errors.Wrap(err, "failed to initialize helm configuration for helm release rollback")
	}

	rollbackClient := initRollbackClient(actionConfig, rollbackOpts)

	// Run the rollback
	err = rollbackClient.Run(rollbackOpts.Name)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("name", rollbackOpts.Name).
			Str("namespace", rollbackOpts.Namespace).
			Int("revision", rollbackOpts.Version).
			Err(err).
			Msg("Failed to rollback helm release")
		return nil, errors.Wrap(err, "helm was not able to rollback the release")
	}

	// Get the release info after rollback
	statusClient := action.NewStatus(actionConfig)
	rel, err := statusClient.Run(rollbackOpts.Name)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("name", rollbackOpts.Name).
			Str("namespace", rollbackOpts.Namespace).
			Int("revision", rollbackOpts.Version).
			Err(err).
			Msg("Failed to get status after rollback")
		return nil, errors.Wrap(err, "failed to get status after rollback")
	}
	releaseV1, err := releaserToV1Release(rel)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("name", rollbackOpts.Name).
			Str("namespace", rollbackOpts.Namespace).
			Int("revision", rollbackOpts.Version).
			Err(err).
			Msg("Failed to convert release to v1 after rollback")
		return nil, errors.Wrap(err, "failed to convert release to v1 after rollback")
	}

	return &release.Release{
		Name:      releaseV1.Name,
		Namespace: releaseV1.Namespace,
		Version:   releaseV1.Version,
		Info: &release.Info{
			Status:      release.Status(releaseV1.Info.Status),
			Notes:       releaseV1.Info.Notes,
			Description: releaseV1.Info.Description,
		},
		Manifest: releaseV1.Manifest,
		Chart: release.Chart{
			Metadata: &release.Metadata{
				Name:       releaseV1.Chart.Metadata.Name,
				Version:    releaseV1.Chart.Metadata.Version,
				AppVersion: releaseV1.Chart.Metadata.AppVersion,
			},
		},
		Labels: releaseV1.Labels,
	}, nil
}

// initRollbackClient initializes the rollback client with the given options
// and returns the rollback client.
func initRollbackClient(actionConfig *action.Configuration, rollbackOpts options.RollbackOptions) *action.Rollback {
	rollbackClient := action.NewRollback(actionConfig)

	// Set version to rollback to (if specified)
	if rollbackOpts.Version > 0 {
		rollbackClient.Version = rollbackOpts.Version
	}

	if rollbackOpts.Wait {
		rollbackClient.WaitStrategy = kube.StatusWatcherStrategy
	} else {
		rollbackClient.WaitStrategy = kube.HookOnlyStrategy
	}
	rollbackClient.WaitForJobs = rollbackOpts.WaitForJobs
	rollbackClient.CleanupOnFail = true // Sane default to clean up on failure
	rollbackClient.ForceReplace = rollbackOpts.Force
	rollbackClient.ServerSideApply = "auto"
	// Set default values if not specified
	if rollbackOpts.Timeout == 0 {
		rollbackClient.Timeout = 5 * time.Minute // Sane default of 5 minutes
	} else {
		rollbackClient.Timeout = rollbackOpts.Timeout
	}

	return rollbackClient
}
