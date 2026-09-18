package request

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestTrimDockerVersion(t *testing.T) {
	testCases := []struct {
		name         string
		urlPath      string
		expectedPath string
	}{
		{
			name:         "no version",
			urlPath:      "/containers/1/json",
			expectedPath: "/containers/1/json",
		},
		{
			name:         "minor version",
			urlPath:      "/v1.47/containers/1/json",
			expectedPath: "/containers/1/json",
		},
		{
			name:         "patch version",
			urlPath:      "/v1.47.0/containers/1/json",
			expectedPath: "/containers/1/json",
		},
		{
			name:         "leading zero in minor version",
			urlPath:      "/v01.47/containers/1/json",
			expectedPath: "/containers/1/json",
		},
		{
			name:         "leading zero in minor version and patch version",
			urlPath:      "/v01.47.0/containers/1/json",
			expectedPath: "/containers/1/json",
		},
		{
			name:         "many patch versions",
			urlPath:      "/v1.47.0.0.0.0/containers/1/json",
			expectedPath: "/containers/1/json",
		},
		{
			name:         "patch version and word in version",
			urlPath:      "/v1.47.0-beta/containers/1/json",
			expectedPath: "/v1.47.0-beta/containers/1/json",
		},
		{
			name:         "minor version and word in version",
			urlPath:      "/v1.47-beta/containers/1/json",
			expectedPath: "/v1.47-beta/containers/1/json",
		},

		// agent proxy requests
		{
			name:         "doesn't trim agent v1 proxy request",
			urlPath:      "/v1/containers/1/json",
			expectedPath: "/v1/containers/1/json",
		},
		{
			name:         "doesn't trim agent v2 proxy request",
			urlPath:      "/v2/containers/1/json",
			expectedPath: "/v2/containers/1/json",
		},
		{
			name:         "doesn't trim agent ping proxy request",
			urlPath:      "/ping",
			expectedPath: "/ping",
		},
		{
			name:         "doesn't trim agent api metrics proxy request",
			urlPath:      "/api/metrics",
			expectedPath: "/api/metrics",
		},
		{
			name:         "doesn't trim agent diagnostics proxy request",
			urlPath:      "/diagnostics",
			expectedPath: "/diagnostics",
		},
		{
			name:         "doesn't trim agent agents proxy request",
			urlPath:      "/agents",
			expectedPath: "/agents",
		},
		{
			name:         "doesn't trim agent host proxy request",
			urlPath:      "/host/info",
			expectedPath: "/host/info",
		},
		{
			name:         "doesn't trim agent browse proxy request",
			urlPath:      "/browse/ls",
			expectedPath: "/browse/ls",
		},
		{
			name:         "doesn't trim agent websocket proxy request",
			urlPath:      "/websocket/attach",
			expectedPath: "/websocket/attach",
		},
		{
			name:         "doesn't trim agent kubernetes proxy request",
			urlPath:      "/kubernetes",
			expectedPath: "/kubernetes",
		},

		{
			name:         "leading zero in minor version only",
			urlPath:      "/v1.047/containers/1/json",
			expectedPath: "/containers/1/json",
		},
		{
			name:         "multi-digit major version",
			urlPath:      "/v11.0/containers/1/json",
			expectedPath: "/containers/1/json",
		},
		{
			name:         "versioned agent-like prefix is trimmed",
			urlPath:      "/v2.0/containers/1/json",
			expectedPath: "/containers/1/json",
		},
		{
			name:         "doesn't trim version-like resource name",
			urlPath:      "/volumes/v1.2",
			expectedPath: "/volumes/v1.2",
		},
		{
			name:         "doesn't trim version-like segment after prefix",
			urlPath:      "/networks/v1.47/json",
			expectedPath: "/networks/v1.47/json",
		},
		{
			name:         "empty path",
			urlPath:      "",
			expectedPath: ".",
		},
		{
			name:         "root path only",
			urlPath:      "/",
			expectedPath: "/",
		},

		// trailing slashes
		{
			name:         "trailing slash not preserved after trim",
			urlPath:      "/v1.47/containers/1/json/",
			expectedPath: "/containers/1/json",
		},
		{
			name:         "version with trailing slash only",
			urlPath:      "/v1.47/",
			expectedPath: "/",
		},
		{
			name:         "version with no trailing content",
			urlPath:      "/v1.47",
			expectedPath: "/",
		},
		{
			name:         "double slash after version are not preserved",
			urlPath:      "/v1.47//containers/1/json",
			expectedPath: "/containers/1/json",
		},
		{
			name:         "trailing slash without version removed",
			urlPath:      "/containers/1/json/",
			expectedPath: "/containers/1/json",
		},

		// percent encoding
		{
			name:         "percent-encoded segment preserved after trim",
			urlPath:      "/v1.47/containers/%2e%2e/json",
			expectedPath: "/containers/%2e%2e/json",
		},
		{
			name:         "percent-encoded slash in remainder preserved",
			urlPath:      "/v1.47/containers/%2F/json",
			expectedPath: "/containers/%2F/json",
		},
		{
			name:         "percent-encoded dot in version not trimmed",
			urlPath:      "/v1%2e47/containers/1/json",
			expectedPath: "/v1%2e47/containers/1/json",
		},
		{
			name:         "percent-encoded slash right after version",
			urlPath:      "/v1.47%2Fcontainers/1/json",
			expectedPath: "/v1.47%2Fcontainers/1/json",
		},
		{
			name:         "percent-encoded space in resource name preserved",
			urlPath:      "/v1.47/volumes/my%20volume",
			expectedPath: "/volumes/my%20volume",
		},
		{
			name:         "multiple version segments",
			urlPath:      "/v1.47/v1.41/containers/1/json",
			expectedPath: "/v1.41/containers/1/json",
		},
		{
			name:         "three version segments",
			urlPath:      "/v1.47/v1.41/v1.20/containers/1/json",
			expectedPath: "/v1.41/v1.20/containers/1/json",
		},
		{
			name:         "multiple leading-zero versions",
			urlPath:      "/v01.47/v01.41/containers/1/json",
			expectedPath: "/v01.41/containers/1/json",
		},
		{
			name:         "slash between versions",
			urlPath:      "/v1.47//v1.41/containers/1/json",
			expectedPath: "/v1.41/containers/1/json",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			actualPath := TrimDockerVersion(tc.urlPath)
			require.Equal(t, tc.expectedPath, actualPath)
		})
	}
}

func TestContainsEncodedSeparator(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name        string
		escapedPath string
		expected    bool
	}{
		{"encoded slash", "/exec%2fabc123%2fstart", true},
		{"encoded slash upper", "/exec%2Fabc123%2Fstart", true},
		{"encoded slash mixed case", "/images%2Falpine%2fget", true},
		{"encoded backslash", "/exec%5cabc123", true},
		{"encoded backslash upper", "/exec%5Cabc123", true},
		{"literal slashes", "/containers/abc123/json", false},
		{"literal slashes with dots", "/distribution/docker.io/portainerci/agent/json", false},
		{"image tag with colon", "/images/nginx:latest/json", false},
		{"other encoded char is allowed", "/images/nginx%3Alatest/json", false},
		{"empty", "", false},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			require.Equal(t, tc.expected, ContainsEncodedSeparator(tc.escapedPath))
		})
	}
}
