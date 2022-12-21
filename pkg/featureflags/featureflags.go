package featureflags

import (
	"os"
	"strings"

	"github.com/rs/zerolog/log"
)

// Feature represents a feature that can be enabled or disabled via feature flags
type Feature string

func (f Feature) String() string {
	return string(f)
}

var featureFlags map[Feature]bool

// IsEnabled returns true if the feature flag is enabled
func IsEnabled(feat Feature) bool {
	return featureFlags[feat]
}

// IsSupported returns true if the feature is supported
func IsSupported(feat Feature) bool {
	_, ok := featureFlags[feat]
	return ok
}

// FeatureFlags returns a map of all feature flags
func FeatureFlags() map[Feature]bool {
	return featureFlags
}

func initSupportedFeatures(supportedFeatures []Feature) {
	featureFlags = make(map[Feature]bool)
	for _, feat := range supportedFeatures {
		featureFlags[feat] = false
	}
}

// Parse turns on feature flags
// It accepts a list of feature flags as strings and a list of supported features.
// It will also check for feature flags in the PORTAINER_FEATURE_FLAGS environment variable.
// Multiple feature flags can be specified with the PORTAINER_FEATURE_FLAGS environment.
// variable using a comma separated list. e.g. "PORTAINER_FEATURE_FLAGS=feature1,feature2".
// If a feature flag is not supported, it will be logged and ignored.
// If a feature flag is supported, it will be logged and enabled.
func Parse(features []string, supportedFeatures []Feature) {
	initSupportedFeatures(supportedFeatures)

	env := os.Getenv("PORTAINER_FEATURE_FLAGS")
	envFeatures := []string{}
	if env != "" {
		envFeatures = strings.Split(env, ",")
	}
	features = append(features, envFeatures...)

	// loop through feature flags to check if they are supported
	for _, feat := range features {
		f := Feature(strings.ToLower(feat))
		_, ok := featureFlags[f]
		if !ok {
			log.Warn().Str("feature", f.String()).Msgf("unknown feature flag")
			continue
		}

		featureFlags[f] = true
		log.Info().Str("feature", f.String()).Msg("enabling feature")
	}
}
