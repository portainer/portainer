package main

import (
	"fmt"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt"
	"github.com/portainer/portainer/api/cli"
	"github.com/stretchr/testify/assert"
	"gopkg.in/alecthomas/kingpin.v2"
)

type mockKingpinSetting string

func (m mockKingpinSetting) SetValue(value kingpin.Value) {
	value.Set(string(m))
}

func Test_enableFeaturesFromFlags(t *testing.T) {
	is := assert.New(t)

	store, teardown := bolt.MustNewTestStore(true)
	defer teardown()

	tests := []struct {
		featureFlag string
		isSupported bool
	}{
		{"test", false},
		{"openamt", false},
		{"open-amt", true},
		{"oPeN-amT", true},
		{"fdo", true},
		{"FDO", true},
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
