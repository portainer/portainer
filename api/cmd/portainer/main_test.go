package main

import (
	"fmt"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/cli"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/stretchr/testify/assert"
	"gopkg.in/alecthomas/kingpin.v2"
)

type mockKingpinSetting string

func (m mockKingpinSetting) SetValue(value kingpin.Value) {
	value.Set(string(m))
}

func Test_enableFeaturesFromFlags(t *testing.T) {
	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	tests := []struct {
		featureFlag string
		isSupported bool
	}{
		{"test", false},
	}
	for _, test := range tests {
		t.Run(fmt.Sprintf("%s succeeds:%v", test.featureFlag, test.isSupported), func(t *testing.T) {
			mockKingpinSetting := mockKingpinSetting(test.featureFlag)
			flags := &portainer.CLIFlags{FeatureFlags: cli.BoolPairs(mockKingpinSetting)}
			err := enableFeaturesFromFlags(store, flags)
			if test.isSupported {
				is.NoError(err)
			} else {
				is.Error(err)
			}
		})
	}

	t.Run("passes for all supported feature flags", func(t *testing.T) {
		for _, flag := range portainer.SupportedFeatureFlags {
			mockKingpinSetting := mockKingpinSetting(flag)
			flags := &portainer.CLIFlags{FeatureFlags: cli.BoolPairs(mockKingpinSetting)}
			err := enableFeaturesFromFlags(store, flags)
			is.NoError(err)
		}
	})
}

const FeatTest portainer.Feature = "optional-test"

func optionalFunc(dataStore dataservices.DataStore) string {

	// TODO: this is a code smell - finding out if a feature flag is enabled should not require having access to the store, and asking for a settings obj.
	//       ideally, the `if` should look more like:
	//       if featureflags.FlagEnabled(FeatTest) {}
	settings, err := dataStore.Settings().Settings()
	if err != nil {
		return err.Error()
	}

	if settings.FeatureFlagSettings[FeatTest] {
		return "enabled"
	}
	return "disabled"
}

func Test_optionalFeature(t *testing.T) {
	portainer.SupportedFeatureFlags = append(portainer.SupportedFeatureFlags, FeatTest)

	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	// Enable the test feature
	t.Run(fmt.Sprintf("%s succeeds:%v", FeatTest, true), func(t *testing.T) {
		mockKingpinSetting := mockKingpinSetting(FeatTest)
		flags := &portainer.CLIFlags{FeatureFlags: cli.BoolPairs(mockKingpinSetting)}
		err := enableFeaturesFromFlags(store, flags)
		is.NoError(err)
		is.Equal("enabled", optionalFunc(store))
	})

	// Same store, so the feature flag should still be enabled
	t.Run(fmt.Sprintf("%s succeeds:%v", FeatTest, true), func(t *testing.T) {
		is.Equal("enabled", optionalFunc(store))
	})

	// disable the test feature
	t.Run(fmt.Sprintf("%s succeeds:%v", FeatTest, true), func(t *testing.T) {
		mockKingpinSetting := mockKingpinSetting(FeatTest + "=false")
		flags := &portainer.CLIFlags{FeatureFlags: cli.BoolPairs(mockKingpinSetting)}
		err := enableFeaturesFromFlags(store, flags)
		is.NoError(err)
		is.Equal("disabled", optionalFunc(store))
	})

	// Same store, so feature flag should still be disabled
	t.Run(fmt.Sprintf("%s succeeds:%v", FeatTest, true), func(t *testing.T) {
		is.Equal("disabled", optionalFunc(store))
	})

}
