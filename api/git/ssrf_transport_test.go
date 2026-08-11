package git

import (
	"testing"

	"github.com/portainer/portainer/pkg/libhttp/ssrf"

	portainer "github.com/portainer/portainer/api"

	gittransport "github.com/go-git/go-git/v5/plumbing/transport"
	"github.com/stretchr/testify/require"
)

type staticAllowListService struct {
	parsed portainer.ParsedAllowList
}

func (s *staticAllowListService) ReadParsed(id portainer.AllowListKey) (*portainer.ParsedAllowList, error) {
	return &s.parsed, nil
}

func configureSSRF(t *testing.T, mode portainer.SSRFMode, entries []string) {
	t.Helper()

	parsed := ssrf.ParseAllowedHosts(entries)
	parsed.Mode = mode

	err := ssrf.Configure(&staticAllowListService{parsed: parsed})
	require.NoError(t, err)

	t.Cleanup(func() {
		err := ssrf.Configure(&staticAllowListService{parsed: portainer.ParsedAllowList{Mode: portainer.SSRFModeOff}})
		require.NoError(t, err)
	})
}

type recordingTransport struct {
	uploadPackCalled  bool
	receivePackCalled bool
}

func (r *recordingTransport) NewUploadPackSession(ep *gittransport.Endpoint, auth gittransport.AuthMethod) (gittransport.UploadPackSession, error) {
	r.uploadPackCalled = true
	return nil, nil
}

func (r *recordingTransport) NewReceivePackSession(ep *gittransport.Endpoint, auth gittransport.AuthMethod) (gittransport.ReceivePackSession, error) {
	r.receivePackCalled = true
	return nil, nil
}

func TestCheckEndpointSSRF_BlocksDisallowedHost(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, nil)

	ep := &gittransport.Endpoint{Host: "169.254.169.254", Port: 9418}

	err := checkEndpointSSRF(ep)
	require.Error(t, err)
}

func TestCheckEndpointSSRF_AllowsAllowedHost(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, []string{"git.example.com"})

	ep := &gittransport.Endpoint{Host: "git.example.com", Port: 9418}

	err := checkEndpointSSRF(ep)
	require.NoError(t, err)
}

func TestCheckEndpointSSRF_DefaultsPortWhenUnset(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, []string{"git.example.com"})

	ep := &gittransport.Endpoint{Host: "git.example.com", Port: 0}

	err := checkEndpointSSRF(ep)
	require.NoError(t, err)
}

func TestNewSSRFGitTransport_NewUploadPackSession_Blocked(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, nil)

	inner := &recordingTransport{}
	transport := NewSSRFGitTransport(inner)

	ep := &gittransport.Endpoint{Host: "169.254.169.254", Port: 9418}
	_, err := transport.NewUploadPackSession(ep, nil)
	require.Error(t, err)
	require.False(t, inner.uploadPackCalled)
}

func TestNewSSRFGitTransport_NewUploadPackSession_Allowed(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, []string{"git.example.com"})

	inner := &recordingTransport{}
	transport := NewSSRFGitTransport(inner)

	ep := &gittransport.Endpoint{Host: "git.example.com", Port: 9418}
	_, err := transport.NewUploadPackSession(ep, nil)
	require.NoError(t, err)
	require.True(t, inner.uploadPackCalled)
}

func TestNewSSRFGitTransport_NewReceivePackSession_Blocked(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, nil)

	inner := &recordingTransport{}
	transport := NewSSRFGitTransport(inner)

	ep := &gittransport.Endpoint{Host: "169.254.169.254", Port: 9418}
	_, err := transport.NewReceivePackSession(ep, nil)
	require.Error(t, err)
	require.False(t, inner.receivePackCalled)
}

func TestNewSSRFGitTransport_NewReceivePackSession_Allowed(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, []string{"git.example.com"})

	inner := &recordingTransport{}
	transport := NewSSRFGitTransport(inner)

	ep := &gittransport.Endpoint{Host: "git.example.com", Port: 9418}
	_, err := transport.NewReceivePackSession(ep, nil)
	require.NoError(t, err)
	require.True(t, inner.receivePackCalled)
}
