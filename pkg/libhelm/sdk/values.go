package sdk

import (
	"os"

	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
	"go.yaml.in/yaml/v3"
	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/chart/common"
)

// GetHelmValuesFromFile reads the values file and parses it into a map[string]any
// and returns the map.
func GetHelmValuesFromFile(valuesFile string) (map[string]any, error) {
	var vals map[string]any
	if valuesFile != "" {
		log.Debug().
			Str("context", "HelmClient").
			Str("values_file", valuesFile).
			Msg("Reading values file")

		valuesData, err := os.ReadFile(valuesFile)
		if err != nil {
			log.Error().
				Str("context", "HelmClient").
				Str("values_file", valuesFile).
				Err(err).
				Msg("Failed to read values file")
			return nil, errors.Wrap(err, "failed to read values file")
		}

		vals, err = parseValues(valuesData)
		if err != nil {
			log.Error().
				Str("context", "HelmClient").
				Str("values_file", valuesFile).
				Err(err).
				Msg("Failed to parse values file")
			return nil, errors.Wrap(err, "failed to parse values file")
		}
	}

	return vals, nil
}

// parseValues parses YAML values data into a map
func parseValues(data []byte) (map[string]any, error) {
	// Use Helm's built-in common.ReadValues which properly handles the conversion
	// from map[interface{}]interface{} to map[string]interface{}
	return common.ReadValues(data)
}

// MergeValues merges two maps recursively, with values from the override map taking precedence
// over values from the base map. It returns a new map containing the merged values.
func MergeValues(base, override map[string]any) map[string]any {
	if base == nil {
		return override
	}
	if override == nil {
		return base
	}

	for k, v := range override {
		if vMap, ok := v.(map[string]any); ok {
			if baseMap, ok := base[k].(map[string]any); ok {
				base[k] = MergeValues(baseMap, vMap)
				continue
			}
		}
		base[k] = v
	}
	return base
}

func (hspm *HelmSDKPackageManager) getValues(getOpts options.GetOptions) (release.Values, error) {
	log.Debug().
		Str("context", "HelmClient").
		Str("namespace", getOpts.Namespace).
		Str("name", getOpts.Name).
		Msg("Getting values")

	actionConfig := new(action.Configuration)
	err := hspm.initActionConfig(actionConfig, namespaceOrDefault(getOpts.Namespace), getOpts.KubernetesClusterAccess, getOpts.ReleaseStorage)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("namespace", getOpts.Namespace).
			Err(err).Msg("Failed to initialise helm configuration")
		return release.Values{}, err
	}

	userValuesClient := hspm.initValuesClient(actionConfig, getOpts)
	userSuppliedValues, err := userValuesClient.Run(getOpts.Name)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("namespace", getOpts.Namespace).
			Err(err).Msg("Failed to get user supplied values")
		return release.Values{}, err
	}

	// Create separate client for computed values
	computedValuesClient := action.NewGetValues(actionConfig)
	computedValuesClient.AllValues = true
	computedValues, err := computedValuesClient.Run(getOpts.Name)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("namespace", getOpts.Namespace).
			Err(err).Msg("Failed to get computed values")
		return release.Values{}, err
	}

	userSuppliedValuesByte, err := yaml.Marshal(userSuppliedValues)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).Msg("Failed to marshal user supplied values")
		return release.Values{}, err
	}

	computedValuesByte, err := yaml.Marshal(computedValues)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).Msg("Failed to marshal computed values")
		return release.Values{}, err
	}

	// Handle the case where the values are an empty object
	userSuppliedValuesString := string(userSuppliedValuesByte)
	if userSuppliedValuesString == "{}\n" {
		userSuppliedValuesString = ""
	}
	computedValuesString := string(computedValuesByte)
	if computedValuesString == "{}\n" {
		computedValuesString = ""
	}

	return release.Values{
		UserSuppliedValues: userSuppliedValuesString,
		ComputedValues:     computedValuesString,
	}, nil
}

func (hspm *HelmSDKPackageManager) initValuesClient(actionConfig *action.Configuration, getOpts options.GetOptions) *action.GetValues {
	valuesClient := action.NewGetValues(actionConfig)
	if getOpts.Revision > 0 {
		valuesClient.Version = getOpts.Revision
	}
	return valuesClient
}
