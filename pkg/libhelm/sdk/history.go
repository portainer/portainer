package sdk

import (
	"sort"

	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v4/pkg/action"
	sdkrelease "helm.sh/helm/v4/pkg/release"
)

// GetHistory implements the HelmPackageManager interface by using the Helm SDK to get a release.
// It returns a Release.
func (hspm *HelmSDKPackageManager) GetHistory(historyOptions options.HistoryOptions) ([]*release.Release, error) {
	log.Debug().
		Str("context", "HelmClient").
		Str("namespace", historyOptions.Namespace).
		Str("name", historyOptions.Name).
		Msg("Get Helm history")

	actionConfig := new(action.Configuration)
	err := hspm.initActionConfig(actionConfig, namespaceOrDefault(historyOptions.Namespace), historyOptions.KubernetesClusterAccess)

	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("namespace", historyOptions.Namespace).
			Err(err).Msg("Failed to initialise helm configuration")
		return nil, err
	}

	historyClient := action.NewHistory(actionConfig)
	history, err := historyClient.Run(historyOptions.Name)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("namespace", historyOptions.Namespace).
			Err(err).Msg("Failed to query helm release history")
		return nil, err
	}

	var result []*release.Release
	for _, r := range history {
		converted, err := convertHistory(r)
		if err != nil {
			return nil, err
		}
		result = append(result, converted)
	}

	// sort the result by version (latest first)
	sort.Slice(result, func(i, j int) bool {
		return result[i].Version > result[j].Version
	})

	return result, nil
}

func convertHistory(r sdkrelease.Releaser) (*release.Release, error) {
	v1Release, err := releaserToV1Release(r)
	if err != nil {
		log.Error().Err(err).Msg("Failed to convert release")
		return nil, err
	}
	return &release.Release{
		Name:      v1Release.Name,
		Namespace: v1Release.Namespace,
		Version:   v1Release.Version,
		Info: &release.Info{
			Status:       release.Status(v1Release.Info.Status),
			Notes:        v1Release.Info.Notes,
			LastDeployed: v1Release.Info.LastDeployed,
		},
		Chart: release.Chart{
			Metadata: &release.Metadata{
				Name:       v1Release.Chart.Metadata.Name,
				Version:    v1Release.Chart.Metadata.Version,
				AppVersion: v1Release.Chart.Metadata.AppVersion,
			},
		},
		ChartReference: extractChartReferenceAnnotations(v1Release.Chart.Metadata.Annotations),
	}, nil
}
