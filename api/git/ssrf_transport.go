package git

import (
	"context"
	"fmt"
	"net"
	"strconv"

	"github.com/portainer/portainer/pkg/libhttp/ssrf"

	gittransport "github.com/go-git/go-git/v5/plumbing/transport"
)

const gitDefaultPort = 9418

// ssrfGitTransport wraps a git:// transport and validates the resolved IP
// against the SSRF policy before establishing connections.
type ssrfGitTransport struct {
	inner gittransport.Transport
}

// NewSSRFGitTransport wraps inner and blocks connections to private IP ranges
// according to the active SSRF policy.
func NewSSRFGitTransport(inner gittransport.Transport) gittransport.Transport {
	return &ssrfGitTransport{inner: inner}
}

func (t *ssrfGitTransport) NewUploadPackSession(ep *gittransport.Endpoint, auth gittransport.AuthMethod) (gittransport.UploadPackSession, error) {
	if err := checkEndpointSSRF(ep); err != nil {
		return nil, err
	}

	return t.inner.NewUploadPackSession(ep, auth)
}

func (t *ssrfGitTransport) NewReceivePackSession(ep *gittransport.Endpoint, auth gittransport.AuthMethod) (gittransport.ReceivePackSession, error) {
	if err := checkEndpointSSRF(ep); err != nil {
		return nil, err
	}

	return t.inner.NewReceivePackSession(ep, auth)
}

func checkEndpointSSRF(ep *gittransport.Endpoint) error {
	port := ep.Port
	if port <= 0 {
		port = gitDefaultPort
	}

	rawURL := fmt.Sprintf("git://%s/", net.JoinHostPort(ep.Host, strconv.Itoa(port)))

	return ssrf.CheckURL(context.Background(), rawURL)
}
