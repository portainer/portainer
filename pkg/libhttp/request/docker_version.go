package request

import (
	"path"
	"regexp"
	"strings"
)

var dockerAPIVersionRe = regexp.MustCompile(`^/v[0-9.]+(/|$)`)

// ContainsEncodedSeparator reports whether an escaped URL path contains a
// percent-encoded path separator (%2f or %5c). Docker API paths never need
// encoded separators, so callers can reject such requests to prevent them from
// dodging path-based operation authorization.
func ContainsEncodedSeparator(escapedPath string) bool {
	lower := strings.ToLower(escapedPath)
	return strings.Contains(lower, "%2f") || strings.Contains(lower, "%5c")
}

// TrimDockerVersion removes a leading Docker API version segment (e.g. /v1.47)
// from a request path so it can be matched against unversioned operation routes.
// The Portainer agent's own /v1/ and /v2/ API prefixes are preserved.
func TrimDockerVersion(urlPath string) string {
	cleanedPath := path.Clean(urlPath)

	if strings.HasPrefix(cleanedPath, "/v2/") ||
		strings.HasPrefix(cleanedPath, "v2/") ||
		strings.HasPrefix(cleanedPath, "/v1/") ||
		strings.HasPrefix(cleanedPath, "v1/") {
		return cleanedPath
	}

	return dockerAPIVersionRe.ReplaceAllString(cleanedPath, "/")
}
