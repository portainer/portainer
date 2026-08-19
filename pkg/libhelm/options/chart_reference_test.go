package options

import (
	"testing"
)

func TestConstructChartReference(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name        string
		registryURL string
		chartName   string
		expected    string
	}{
		{
			name:        "empty registry URL returns chart name as-is",
			registryURL: "",
			chartName:   "nginx",
			expected:    "nginx",
		},
		{
			name:        "basic OCI registry with chart name",
			registryURL: "registry.example.com",
			chartName:   "nginx",
			expected:    "oci://registry.example.com/nginx",
		},
		{
			name:        "registry with project path",
			registryURL: "harbor.example.com",
			chartName:   "library/nginx",
			expected:    "oci://harbor.example.com/library/nginx",
		},
		{
			name:        "chart name already has oci prefix returns as-is",
			registryURL: "registry.example.com",
			chartName:   "oci://registry.example.com/nginx",
			expected:    "oci://registry.example.com/nginx",
		},
		{
			name:        "chart name with leading slash",
			registryURL: "registry.example.com",
			chartName:   "/nginx",
			expected:    "oci://registry.example.com/nginx",
		},
		{
			name:        "registry URL already has oci prefix",
			registryURL: "oci://registry.example.com",
			chartName:   "nginx",
			expected:    "oci://registry.example.com/nginx",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ConstructChartReference(tt.registryURL, tt.chartName)
			if result != tt.expected {
				t.Errorf("ConstructChartReference(%q, %q) = %q, want %q",
					tt.registryURL, tt.chartName, result, tt.expected)
			}
		})
	}
}

func TestConstructOCIRegistryReference(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name        string
		registryURL string
		expected    string
	}{
		{
			name:        "simple registry URL",
			registryURL: "registry.example.com",
			expected:    "oci://registry.example.com",
		},
		{
			name:        "registry URL with oci prefix",
			registryURL: "oci://registry.example.com",
			expected:    "oci://registry.example.com",
		},
		{
			name:        "registry URL with port",
			registryURL: "registry.example.com:5000",
			expected:    "oci://registry.example.com:5000",
		},
		{
			name:        "empty registry URL",
			registryURL: "",
			expected:    "oci://",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ConstructOCIRegistryReference(tt.registryURL)
			if result != tt.expected {
				t.Errorf("ConstructOCIRegistryReference(%q) = %q, want %q",
					tt.registryURL, result, tt.expected)
			}
		})
	}
}
