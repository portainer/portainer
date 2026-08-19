package libhttp

import "strings"

// LastCommaSeparated returns the trimmed last comma-separated segment of a
// forwarding header value.
func LastCommaSeparated(s string) string {
	if idx := strings.LastIndexByte(s, ','); idx != -1 {
		s = s[idx+1:]
	}

	return strings.TrimSpace(s)
}

// ForwardedElementParam extracts the value of a named parameter (e.g. "for",
// "proto") from a single element of a Forwarded header value (RFC 7239),
// matching the parameter name case-insensitively and trimming surrounding
// whitespace and quotes from the value.
func ForwardedElementParam(element, key string) (string, bool) {
	for pair := range strings.SplitSeq(element, ";") {
		k, v, found := strings.Cut(pair, "=")
		if !found {
			continue
		}

		if strings.EqualFold(strings.TrimSpace(k), key) {
			return strings.Trim(strings.TrimSpace(v), `"'`), true
		}
	}

	return "", false
}
