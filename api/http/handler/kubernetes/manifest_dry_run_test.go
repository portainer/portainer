package kubernetes

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/portainer/portainer/pkg/libkubectl"
)

func TestManifestDryRunPayload_Validate(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		manifests []string
		wantErr   bool
	}{
		{
			name:      "accepts a manifest",
			manifests: []string{"apiVersion: v1\nkind: ConfigMap"},
		},
		{
			name:      "accepts a manifest alongside empty entries",
			manifests: []string{"", "apiVersion: v1\nkind: ConfigMap"},
		},
		{
			name:    "rejects a payload without manifests",
			wantErr: true,
		},
		{
			name:      "rejects blank manifests",
			manifests: []string{"", "   \n  "},
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			payload := manifestDryRunPayload{Manifests: tt.manifests}

			err := payload.Validate(nil)

			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
		})
	}
}

func TestToManifestDryRunResults(t *testing.T) {
	t.Parallel()

	t.Run("maps a validated resource to a pass", func(t *testing.T) {
		t.Parallel()

		results := toManifestDryRunResults([]libkubectl.DryRunResult{
			{Kind: "ConfigMap", Name: "app-config", Namespace: "default", DocumentIndex: 2, Success: true},
		})

		require.Len(t, results, 1)
		assert.Equal(t, manifestDryRunResult{
			Kind:          "ConfigMap",
			Name:          "app-config",
			Namespace:     "default",
			DocumentIndex: 2,
			Status:        dryRunStatusPass,
		}, results[0])
	})

	t.Run("maps a rejected resource to a fail carrying the reason", func(t *testing.T) {
		t.Parallel()

		results := toManifestDryRunResults([]libkubectl.DryRunResult{
			{Kind: "Deployment", Name: "app", Namespace: "default", Message: "namespace not found"},
		})

		require.Len(t, results, 1)
		assert.Equal(t, dryRunStatusFail, results[0].Status)
		assert.Equal(t, "namespace not found", results[0].Message)
	})

	t.Run("serialises an empty run as an empty list", func(t *testing.T) {
		t.Parallel()

		encoded, err := json.Marshal(manifestDryRunResponse{Results: toManifestDryRunResults(nil)})

		require.NoError(t, err)
		assert.JSONEq(t, `{"results":[]}`, string(encoded))
	})
}
