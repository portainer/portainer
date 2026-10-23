package sdk

import (
	"fmt"
	"strconv"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v4/pkg/action"
	sdkrelease "helm.sh/helm/v4/pkg/release"
	releasev1 "helm.sh/helm/v4/pkg/release/v1"
)

// List implements the HelmPackageManager interface by using the Helm SDK to list releases.
// It returns a slice of ReleaseElement.
func (hspm *HelmSDKPackageManager) List(listOpts options.ListOptions) ([]release.ReleaseElement, error) {
	log.Debug().
		Str("context", "HelmClient").
		Str("namespace", listOpts.Namespace).
		Str("filter", listOpts.Filter).
		Str("selector", listOpts.Selector).
		Msg("Listing Helm releases")

	// Initialize action configuration with kubernetes config. The namespace is
	// passed through as-is: an empty namespace keeps the release storage
	// cluster-wide so the list covers every namespace, mirroring how the Helm
	// CLI implements `helm list --all-namespaces`.
	actionConfig := new(action.Configuration)
	err := hspm.initActionConfig(actionConfig, listOpts.Namespace, listOpts.KubernetesClusterAccess)
	if err != nil {
		// error is already logged in initActionConfig
		return nil, errors.Wrap(err, "failed to initialize helm configuration")
	}

	listClient, err := initListClient(actionConfig, listOpts)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Failed to initialize helm list client")
		return nil, errors.Wrap(err, "failed to initialize helm list client")
	}

	// Run the list operation
	releases, err := listClient.Run()
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Failed to list helm releases")
		return []release.ReleaseElement{}, errors.Wrap(err, "failed to list helm releases")
	}

	// Convert from SDK release type to our release element type and return
	return convertToReleaseElements(releases)
}

// convertToReleaseElements converts from the SDK release type to our release element type
func convertToReleaseElements(ls []sdkrelease.Releaser) ([]release.ReleaseElement, error) {
	rls := make([]*releasev1.Release, 0, len(ls))
	for _, val := range ls {
		rel, err := releaserToV1Release(val)
		if err != nil {
			return nil, errors.Wrap(err, "failed to convert releaser to v1 release")
		}
		rls = append(rls, rel)
	}
	elements := make([]release.ReleaseElement, len(rls))

	for i, rel := range rls {
		chartName := fmt.Sprintf("%s-%s", rel.Chart.Metadata.Name, rel.Chart.Metadata.Version)

		elements[i] = release.ReleaseElement{
			Name:       rel.Name,
			Namespace:  rel.Namespace,
			Revision:   strconv.Itoa(rel.Version),
			Updated:    rel.Info.LastDeployed.String(),
			Status:     string(rel.Info.Status),
			Chart:      chartName,
			AppVersion: rel.Chart.Metadata.AppVersion,
		}
	}

	return elements, nil
}

// initListClient initializes the list client with the given options
// and return the list client.
func initListClient(actionConfig *action.Configuration, listOpts options.ListOptions) (*action.List, error) {
	listClient := action.NewList(actionConfig)

	// Configure list options
	if listOpts.Filter != "" {
		listClient.Filter = listOpts.Filter
	}

	if listOpts.Selector != "" {
		listClient.Selector = listOpts.Selector
	}

	// If no namespace is specified in options, list across all namespaces
	if listOpts.Namespace == "" {
		listClient.AllNamespaces = true
	}

	// No limit by default
	listClient.Limit = 0
	// Show all releases, even if in a pending or failed state
	listClient.All = true

	// Set state mask to ensure proper filtering by status
	listClient.SetStateMask()

	return listClient, nil
}
