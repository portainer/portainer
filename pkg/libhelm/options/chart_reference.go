package options

import (
	"strings"
)

const (
	// OCIProtocolPrefix is the standard OCI protocol prefix
	OCIProtocolPrefix = "oci://"
)

// ConstructChartReference constructs the appropriate chart reference based on registry type
func ConstructChartReference(registryURL string, chartName string) string {
	if registryURL == "" {
		return chartName
	}

	// Don't double-prefix if chart already contains the registry URL
	if strings.HasPrefix(chartName, OCIProtocolPrefix) {
		return chartName
	}

	baseURL := ConstructOCIRegistryReference(registryURL)

	// Handle cases where chartName might already have a path separator
	if strings.HasPrefix(chartName, "/") {
		return baseURL + chartName
	}

	return baseURL + "/" + chartName
}

func ConstructOCIRegistryReference(registryURL string) string {
	// Remove oci:// prefix if present to avoid duplication
	registryURL = strings.TrimPrefix(registryURL, OCIProtocolPrefix)
	// Ensure we have oci:// prefix for OCI registries
	return OCIProtocolPrefix + registryURL
}
