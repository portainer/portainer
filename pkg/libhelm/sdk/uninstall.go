package sdk

import (
	"time"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/kube"
	"helm.sh/helm/v4/pkg/storage/driver"
)

// Uninstall implements the HelmPackageManager interface by using the Helm SDK to uninstall a release.
func (hspm *HelmSDKPackageManager) Uninstall(uninstallOpts options.UninstallOptions) error {
	if uninstallOpts.Name == "" {
		log.Error().
			Str("context", "HelmClient").
			Msg("Release name is required")
		return errors.New("release name is required")
	}

	log.Debug().
		Str("context", "HelmClient").
		Str("release", uninstallOpts.Name).
		Str("namespace", uninstallOpts.Namespace).
		Msg("Uninstalling Helm release")

	// Initialize action configuration with kubernetes config
	actionConfig := new(action.Configuration)
	err := hspm.initActionConfig(actionConfig, namespaceOrDefault(uninstallOpts.Namespace), uninstallOpts.KubernetesClusterAccess)
	if err != nil {
		// error is already logged in initActionConfig
		return errors.Wrap(err, "failed to initialize helm configuration")
	}

	// Create uninstallClient action
	uninstallClient := action.NewUninstall(actionConfig)
	// 'foreground' means the parent object remains in a "terminating" state until all of its children are deleted. This ensures that all dependent resources are completely removed before finalizing the deletion of the parent resource.
	uninstallClient.DeletionPropagation = "foreground" // "background" or "orphan"
	if uninstallOpts.Wait {
		uninstallClient.WaitStrategy = kube.StatusWatcherStrategy
	} else {
		uninstallClient.WaitStrategy = kube.HookOnlyStrategy
	}
	if uninstallOpts.Timeout == 0 {
		uninstallClient.Timeout = 15 * time.Minute
	} else {
		uninstallClient.Timeout = uninstallOpts.Timeout
	}

	// Run the uninstallation
	log.Info().
		Str("context", "HelmClient").
		Str("release", uninstallOpts.Name).
		Str("namespace", uninstallOpts.Namespace).
		Msg("Running uninstallation")

	result, err := uninstallClient.Run(uninstallOpts.Name)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("release", uninstallOpts.Name).
			Str("namespace", uninstallOpts.Namespace).
			Err(err).
			Msg("Failed to uninstall helm release")
		return errors.Wrap(err, "failed to uninstall helm release")
	}

	if result != nil {
		releaseV1, err := releaserToV1Release(result.Release)
		if err != nil {
			log.Error().
				Str("context", "HelmClient").
				Str("release", uninstallOpts.Name).
				Err(err).
				Msg("Failed to convert release to v1")
			return errors.Wrap(err, "failed to convert release to v1")
		}
		log.Debug().
			Str("context", "HelmClient").
			Str("release", uninstallOpts.Name).
			Str("release_info", releaseV1.Info.Description).
			Msg("Uninstall result details")
	}

	return nil
}

// ForceRemoveRelease removes all release history (Helm secrets) without attempting
// to delete Kubernetes resources. This is a last-resort recovery mechanism for when
// a standard Uninstall fails because CRDs are missing and Helm can't build kubernetes
// objects for deletion, leaving the release stuck with no way to recover.
func (hspm *HelmSDKPackageManager) ForceRemoveRelease(uninstallOpts options.UninstallOptions) error {
	if uninstallOpts.Name == "" {
		return errors.New("release name is required")
	}

	log.Warn().
		Str("context", "HelmClient").
		Str("release", uninstallOpts.Name).
		Str("namespace", uninstallOpts.Namespace).
		Msg("Force-removing release history (skipping resource deletion)")

	actionConfig := new(action.Configuration)
	err := hspm.initActionConfig(actionConfig, namespaceOrDefault(uninstallOpts.Namespace), uninstallOpts.KubernetesClusterAccess)
	if err != nil {
		return errors.Wrap(err, "failed to initialize helm configuration for force-remove")
	}

	// Get all release versions from Helm's storage (Kubernetes secrets)
	versions, err := actionConfig.Releases.History(uninstallOpts.Name)
	if err != nil {
		if errors.Is(err, driver.ErrReleaseNotFound) {
			log.Debug().
				Str("context", "HelmClient").
				Str("release", uninstallOpts.Name).
				Msg("Release not found in storage, nothing to force-remove")
			return nil
		}
		return errors.Wrap(err, "failed to get release history for force-remove")
	}

	// Delete each release version from storage
	for _, v := range versions {
		releaseV1, err := releaserToV1Release(v)
		if err != nil {
			log.Error().
				Str("context", "HelmClient").
				Str("release", uninstallOpts.Name).
				Int("version", releaseV1.Version).
				Err(err).
				Msg("Failed to convert releaser version to v1 for force-remove, skipping deletion of this version")
			continue
		}
		if _, err := actionConfig.Releases.Delete(releaseV1.Name, releaseV1.Version); err != nil {
			return errors.Wrapf(err, "failed to delete release version %d for force-remove", releaseV1.Version)
		}
	}

	log.Info().
		Str("context", "HelmClient").
		Str("release", uninstallOpts.Name).
		Int("versions_removed", len(versions)).
		Msg("Successfully force-removed all release history")

	return nil
}
