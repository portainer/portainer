package edge

import (
	"net"
	"net/url"

	"github.com/pkg/errors"
)

// ParseHostForEdge returns the hostname of the given URL, will fail if host is localhost
func ParseHostForEdge(portainerURL string) (string, error) {
	parsedURL, err := url.Parse(portainerURL)
	if err != nil {
		return "", errors.Wrap(err, "Unable to parse Portainer URL")
	}

	portainerHost, _, err := net.SplitHostPort(parsedURL.Host)
	if err != nil {
		portainerHost = parsedURL.Host
	}

	if portainerHost == "" {
		return "", errors.New("hostname cannot be empty")
	}

	if portainerHost == "localhost" {
		return "", errors.New("cannot use localhost as environment URL")
	}

	return portainerHost, nil

}
