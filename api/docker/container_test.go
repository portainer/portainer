package docker

import (
	"testing"

	"github.com/docker/docker/api/types/network"
	"github.com/stretchr/testify/require"
)

func TestApplyVersionConstraint(t *testing.T) {
	initialNet := network.NetworkingConfig{
		EndpointsConfig: map[string]*network.EndpointSettings{
			"key1": {
				MacAddress: "mac1",
				EndpointID: "endpointID1",
			},
			"key2": {
				MacAddress: "mac2",
				EndpointID: "endpointID2",
			},
		},
	}

	f := func(currentVer string, constraint string, success, emptyMac bool) {
		t.Helper()

		transformedNet, err := applyVersionConstraint(currentVer, constraint, initialNet, clearMacAddrs)
		if success {
			require.NoError(t, err)
		} else {
			require.Error(t, err)
		}

		require.Len(t, transformedNet.EndpointsConfig, len(initialNet.EndpointsConfig))

		for k := range initialNet.EndpointsConfig {
			if emptyMac {
				require.NotEqual(t, initialNet.EndpointsConfig[k], transformedNet.EndpointsConfig[k])
				require.Empty(t, transformedNet.EndpointsConfig[k].MacAddress)

				continue
			}

			require.Equal(t, initialNet.EndpointsConfig[k], transformedNet.EndpointsConfig[k])
		}
	}

	f("1.45", "< 1.44", true, false)  // No transformation
	f("1.43", "< 1.44", true, true)   // Transformation
	f("a.b.", "< 1.44", true, false)  // Invalid current version
	f("1.45", "z 1.44", false, false) // Invalid version constraint
}
