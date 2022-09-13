package url

import (
	"fmt"
	"net/url"
	"strings"
)

// ParseURL parses the endpointURL using url.Parse.
//
// to prevent an error when url has port but no protocol prefix
// we add `//` prefix if needed
func ParseURL(endpointURL string) (*url.URL, error) {

	if !strings.HasPrefix(endpointURL, "http") &&
		!strings.HasPrefix(endpointURL, "tcp") &&
		!strings.HasPrefix(endpointURL, "//") &&
		!strings.HasPrefix(endpointURL, `unix:`) &&
		!strings.HasPrefix(endpointURL, `npipe:`) {
		endpointURL = fmt.Sprintf("//%s", endpointURL)
	}

	return url.Parse(endpointURL)
}
