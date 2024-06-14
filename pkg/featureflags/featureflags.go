/*
	 Package featureflags implements feature flags for Portainer projects

	 Feature flags are used to turn on features that are not production ready.
	 Use the Parse function to enable feature flags and also the pass a list of
	 available flags

	   e.g.
	    var SupportedFeatureFlags = []featureflags.Feature{
			"my-feature",
		}

		func main() {
			// parse cli flags

			// pass cli flags and supported feature flags to featureflags.Parse
			featureflags.Parse([]string{"my-feature"}, SupportedFeatureFlags)
		}

		...
		if featureflags.IsEnabled("my-feature") {
			// do something
		}
*/
package featureflags

import (
	"os"
	"strings"

	"github.com/rs/zerolog/log"
)

// Feature represents a feature that can be enabled or disabled via feature flags
type Feature string

var featureFlags map[Feature]bool

// String returns the string representation of a feature flag
func (f Feature) String() string {
	return string(f)
}

// IsEnabled returns true if the feature flag is enabled
func IsEnabled(feat Feature) bool {
	return featureFlags[feat]
}

// IsSupported returns true if the feature is supported
func IsSupported(feat Feature) bool {
	_, ok := featureFlags[feat]

	return ok
}

// FeatureFlags returns a map of all feature flags.
// this is useful in situations where you need to pass all feature flags to a REST handler
// function
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
		if _, ok := featureFlags[f]; !ok {
			log.Warn().Str("feature", f.String()).Msgf("unknown feature flag")

			continue
		}

		featureFlags[f] = true
		log.Info().Str("feature", f.String()).Msg("enabling feature")
	}
}
