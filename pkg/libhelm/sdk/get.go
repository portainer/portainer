package sdk

import (
	"strconv"

	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v4/pkg/action"
	releasev1 "helm.sh/helm/v4/pkg/release/v1"
)

// Get implements the HelmPackageManager interface by using the Helm SDK to get a release.
// It returns a Release.
func (hspm *HelmSDKPackageManager) Get(getOptions options.GetOptions) (*release.Release, error) {
	log.Debug().
		Str("context", "HelmClient").
		Str("namespace", getOptions.Namespace).
		Str("name", getOptions.Name).
		Msg("Get Helm release")

	actionConfig := new(action.Configuration)
	err := hspm.initActionConfig(actionConfig, namespaceOrDefault(getOptions.Namespace), getOptions.KubernetesClusterAccess, getOptions.ReleaseStorage)

	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("namespace", getOptions.Namespace).
			Err(err).Msg("Failed to initialise helm configuration")
		return nil, err
	}

	statusClient, err := hspm.initStatusClient(actionConfig, getOptions)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("namespace", getOptions.Namespace).
			Err(err).Msg("Failed to initialise helm status client")
		return nil, err
	}

	release, err := statusClient.Run(getOptions.Name)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("namespace", getOptions.Namespace).
			Err(err).Msg("Failed to query helm chart")
		return nil, err
	}

	values, err := hspm.getValues(getOptions)
	if err != nil {
		// error is already logged in getValuesFromStatus
		return nil, err
	}

	v1Release, err := releaserToV1Release(release)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("namespace", getOptions.Namespace).
			Str("name", getOptions.Name).
			Err(err).Msg("Failed to convert release to v1")
		return nil, err
	}
	return convert(v1Release, values), nil
}

// Helm status is just an extended helm get command with resources added on (when flagged), so use the status client with the optional show resources flag
// https://github.com/helm/helm/blob/0199b748aaea3091852d16687c9f9f809061777c/pkg/action/get.go#L40-L47
// https://github.com/helm/helm/blob/0199b748aaea3091852d16687c9f9f809061777c/pkg/action/status.go#L48-L82
func (hspm *HelmSDKPackageManager) initStatusClient(actionConfig *action.Configuration, getOptions options.GetOptions) (*action.Status, error) {
	statusClient := action.NewStatus(actionConfig)
	if getOptions.Revision > 0 {
		statusClient.Version = getOptions.Revision
	}

	return statusClient, nil
}

func convert(releasev1 *releasev1.Release, values release.Values) *release.Release {
	resources, err := parseResources(releasev1.Info.Resources)
	if err != nil {
		log.Warn().
			Str("context", "HelmClient").
			Str("namespace", releasev1.Namespace).
			Str("name", releasev1.Name).
			Err(err).Msg("Failed to parse resources")
	}

	// Parse stack ID from annotations -> int
	stackID := 0
	if releasev1.Chart != nil && releasev1.Chart.Metadata != nil {
		if s, ok := releasev1.Chart.Metadata.Annotations[StackIDAnnotation]; ok && s != "" {
			if id, err := strconv.Atoi(s); err == nil {
				stackID = id
			} else {
				log.Warn().
					Str("context", "HelmClient").
					Str("namespace", releasev1.Namespace).
					Str("name", releasev1.Name).
					Err(err).Msg("Failed to parse stack id from annotations")
			}
		}
	}
	release := &release.Release{
		Name:      releasev1.Name,
		Namespace: releasev1.Namespace,
		Version:   releasev1.Version,
		Info: &release.Info{
			Status:       release.Status(releasev1.Info.Status),
			Notes:        releasev1.Info.Notes,
			Resources:    resources,
			Description:  releasev1.Info.Description,
			LastDeployed: releasev1.Info.LastDeployed,
		},
		Manifest: releasev1.Manifest,
		Chart: release.Chart{
			Metadata: &release.Metadata{
				Name:       releasev1.Chart.Metadata.Name,
				Version:    releasev1.Chart.Metadata.Version,
				AppVersion: releasev1.Chart.Metadata.AppVersion,
			},
		},
		Values:         values,
		ChartReference: extractChartReferenceAnnotations(releasev1.Chart.Metadata.Annotations),
		StackID:        stackID,
	}

	return release
}
