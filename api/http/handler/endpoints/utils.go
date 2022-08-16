package endpoints

import "strings"

func BoolAddr(b bool) *bool {
	boolVar := b
	return &boolVar
}

func normalizeAgentAddress(url string) string {
	// Case insensitive strip http or https scheme if URL entered
	index := strings.Index(url, "://")
	if index >= 0 {
		return url[index+3:]
	}

	return url
}
