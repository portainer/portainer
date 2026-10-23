package libkubectl

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSplitManifestDocuments(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name              string
		manifest          string
		expectedDocuments []string
	}{
		{
			name:              "empty manifest",
			manifest:          "",
			expectedDocuments: []string{},
		},
		{
			name:              "single document",
			manifest:          "kind: ConfigMap\n",
			expectedDocuments: []string{"kind: ConfigMap"},
		},
		{
			name:              "documents separated by a plain separator",
			manifest:          "kind: ConfigMap\n---\nkind: Deployment\n",
			expectedDocuments: []string{"kind: ConfigMap", "kind: Deployment"},
		},
		{
			name:              "separator carrying trailing whitespace",
			manifest:          "kind: ConfigMap\n--- \nkind: Deployment\n",
			expectedDocuments: []string{"kind: ConfigMap", "kind: Deployment"},
		},
		{
			name:              "windows line endings",
			manifest:          "kind: ConfigMap\r\n---\r\nkind: Deployment\r\n",
			expectedDocuments: []string{"kind: ConfigMap", "kind: Deployment"},
		},
		{
			name:              "blank documents are dropped",
			manifest:          "kind: ConfigMap\n---\n\n---\nkind: Deployment\n---\n\n",
			expectedDocuments: []string{"kind: ConfigMap", "kind: Deployment"},
		},
		{
			name:              "a separator inside a block scalar is content",
			manifest:          "kind: ConfigMap\ndata:\n  script: |\n    ---\n    still the same document\n",
			expectedDocuments: []string{"kind: ConfigMap\ndata:\n  script: |\n    ---\n    still the same document"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			documents, err := splitManifestDocuments(tt.manifest)

			require.NoError(t, err)
			assert.Equal(t, tt.expectedDocuments, documents)
		})
	}
}

func TestResourcesToArgsHelper(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name         string
		resources    []string
		expectedArgs []string
	}{
		{
			name:         "empty list",
			resources:    []string{},
			expectedArgs: []string{},
		},
		{
			name:         "single manifest file",
			resources:    []string{"manifest.yaml"},
			expectedArgs: []string{"-f", "manifest.yaml"},
		},
		{
			name:         "multiple manifest files",
			resources:    []string{"manifest1.yaml", "manifest2.yaml"},
			expectedArgs: []string{"-f", "manifest1.yaml", "-f", "manifest2.yaml"},
		},
		{
			name:         "manifests with whitespace",
			resources:    []string{" manifest1.yaml ", "  manifest2.yaml"},
			expectedArgs: []string{"-f", "manifest1.yaml", "-f", "manifest2.yaml"},
		},
		{
			name:         "kubernetes resource definitions",
			resources:    []string{"deployment/nginx", "service/web"},
			expectedArgs: []string{"deployment/nginx", "service/web"},
		},
		{
			name:         "rollout restart",
			resources:    []string{"deployment/nginx", "service/web"},
			expectedArgs: []string{"deployment/nginx", "service/web"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			args := resourcesToArgs(tt.resources)
			assert.Equal(t, tt.expectedArgs, args)
		})
	}
}
