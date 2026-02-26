package sdk

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMergeValues(t *testing.T) {
	tests := []struct {
		name     string
		base     map[string]any
		override map[string]any
		expected map[string]any
	}{
		{
			name:     "empty base returns override",
			base:     nil,
			override: map[string]any{"key": "value"},
			expected: map[string]any{"key": "value"},
		},
		{
			name:     "empty override returns base",
			base:     map[string]any{"key": "value"},
			override: nil,
			expected: map[string]any{"key": "value"},
		},
		{
			name:     "both nil returns nil",
			base:     nil,
			override: nil,
			expected: nil,
		},
		{
			name:     "simple merge without conflicts",
			base:     map[string]any{"key1": "value1"},
			override: map[string]any{"key2": "value2"},
			expected: map[string]any{"key1": "value1", "key2": "value2"},
		},
		{
			name:     "override replaces scalar value",
			base:     map[string]any{"key": "old"},
			override: map[string]any{"key": "new"},
			expected: map[string]any{"key": "new"},
		},
		{
			name: "nested map merge preserves non-conflicting keys",
			base: map[string]any{
				"config": map[string]any{
					"port": 8080,
					"host": "localhost",
				},
			},
			override: map[string]any{
				"config": map[string]any{
					"port": 9090,
				},
			},
			expected: map[string]any{
				"config": map[string]any{
					"port": 9090,
					"host": "localhost",
				},
			},
		},
		{
			name: "deep nested merge",
			base: map[string]any{
				"level1": map[string]any{
					"level2": map[string]any{
						"key1": "value1",
						"key2": "value2",
					},
					"other": "data",
				},
			},
			override: map[string]any{
				"level1": map[string]any{
					"level2": map[string]any{
						"key2": "overridden",
						"key3": "new",
					},
				},
			},
			expected: map[string]any{
				"level1": map[string]any{
					"level2": map[string]any{
						"key1": "value1",
						"key2": "overridden",
						"key3": "new",
					},
					"other": "data",
				},
			},
		},
		{
			name: "override replaces scalar with map",
			base: map[string]any{
				"value": "simple",
			},
			override: map[string]any{
				"value": map[string]any{
					"complex": "object",
				},
			},
			expected: map[string]any{
				"value": map[string]any{
					"complex": "object",
				},
			},
		},
		{
			name: "override replaces map with scalar",
			base: map[string]any{
				"value": map[string]any{
					"complex": "object",
				},
			},
			override: map[string]any{
				"value": "simple",
			},
			expected: map[string]any{
				"value": "simple",
			},
		},
		{
			name: "arrays are replaced not merged",
			base: map[string]any{
				"items": []any{"a", "b", "c"},
			},
			override: map[string]any{
				"items": []any{"x", "y"},
			},
			expected: map[string]any{
				"items": []any{"x", "y"},
			},
		},
		{
			name: "helm typical scenario - image override",
			base: map[string]any{
				"replicaCount": 1,
				"image": map[string]any{
					"repository": "nginx",
					"tag":        "latest",
					"pullPolicy": "IfNotPresent",
				},
				"service": map[string]any{
					"type": "ClusterIP",
					"port": 80,
				},
			},
			override: map[string]any{
				"replicaCount": 3,
				"image": map[string]any{
					"tag": "v1.2.3",
				},
				"service": map[string]any{
					"type": "LoadBalancer",
				},
			},
			expected: map[string]any{
				"replicaCount": 3,
				"image": map[string]any{
					"repository": "nginx",
					"tag":        "v1.2.3",
					"pullPolicy": "IfNotPresent",
				},
				"service": map[string]any{
					"type": "LoadBalancer",
					"port": 80,
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := MergeValues(tt.base, tt.override)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetHelmValuesFromFile(t *testing.T) {
	// Create a temporary directory for test files
	tempDir := t.TempDir()

	t.Run("empty file path returns empty map", func(t *testing.T) {
		vals, err := GetHelmValuesFromFile("")
		require.NoError(t, err)
		assert.Nil(t, vals)
	})

	t.Run("non-existent file returns error", func(t *testing.T) {
		_, err := GetHelmValuesFromFile(filepath.Join(tempDir, "nonexistent.yaml"))
		require.Error(t, err)
		assert.Contains(t, err.Error(), "failed to read values file")
	})

	t.Run("valid values file", func(t *testing.T) {
		valuesPath := filepath.Join(tempDir, "values.yaml")
		valuesContent := []byte(`
replicaCount: 3
image:
  repository: nginx
  tag: v1.0.0
service:
  port: 8080
`)
		err := os.WriteFile(valuesPath, valuesContent, 0644)
		require.NoError(t, err)

		vals, err := GetHelmValuesFromFile(valuesPath)
		require.NoError(t, err)
		assert.NotNil(t, vals)
		// YAML parser returns numbers as float64
		assert.InDelta(t, float64(3), vals["replicaCount"], 1e-9)

		image, ok := vals["image"].(map[string]any)
		require.True(t, ok)
		assert.Equal(t, "nginx", image["repository"])
		assert.Equal(t, "v1.0.0", image["tag"])
	})

	t.Run("invalid YAML in file returns error", func(t *testing.T) {
		invalidPath := filepath.Join(tempDir, "invalid.yaml")
		invalidContent := []byte(`
invalid: yaml: content: [[[
`)
		err := os.WriteFile(invalidPath, invalidContent, 0644)
		require.NoError(t, err)

		_, err = GetHelmValuesFromFile(invalidPath)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "failed to parse values file")
	})
}
