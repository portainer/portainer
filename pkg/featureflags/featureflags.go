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

func IsEnabled(feat Feature) bool {
	return featureFlags[feat]
}

func IsSupported(feat Feature) bool {
	_, ok := featureFlags[feat]
	return ok
}

func FeatureFlags() map[Feature]bool {
	return featureFlags
}

func initSupportedFeatures(supportedFeatures []Feature) {
	featureFlags = make(map[Feature]bool)
	for _, feat := range supportedFeatures {
		featureFlags[feat] = false
	}
}

// Parse turns on or off feature flags
// e.g.  portainer ... --feat open-amt --feat fdo ...
// or from env PORTAINER_FEATURE_FLAGS=open-amt,fdo
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
