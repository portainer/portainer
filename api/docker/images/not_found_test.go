package images

import (
	"errors"
	"fmt"
	"testing"

	"github.com/stretchr/testify/require"
	"go.podman.io/image/v5/docker"
)

func TestIsImageNotFound(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		err  error
		want bool
	}{
		{name: "no error", err: nil, want: false},
		{
			name: "missing tag, as returned for a manifest HEAD request",
			err:  errors.New(`Cannot get image digest from HEAD request: reading digest 0.0.0 in docker.io/portainer/agent: StatusCode: 404, ""`),
			want: true,
		},
		{
			name: "missing image, as an HTTP status error",
			err:  fmt.Errorf("reading manifest: %w", docker.UnexpectedHTTPStatusError{StatusCode: 404}),
			want: true,
		},
		{
			name: "other HTTP status error",
			err:  fmt.Errorf("reading manifest: %w", docker.UnexpectedHTTPStatusError{StatusCode: 502}),
			want: false,
		},
		{
			name: "registry /v2/ ping answering 404",
			err:  errors.New(`Cannot get image digest from HEAD request: pinging container registry registry.local: StatusCode: 404, ""`),
			want: false,
		},
		{
			name: "access denied",
			err:  errors.New("Cannot get image digest from HEAD request: reading digest 1.0 in docker.io/portainer/x: requested access to the resource is denied"),
			want: false,
		},
		{
			name: "unreachable registry",
			err:  fmt.Errorf("pinging container registry registry.local: %w", errors.New("dial tcp: no such host")),
			want: false,
		},
		{
			name: "server error",
			err:  errors.New(`reading digest 1.0 in registry.local/agent: StatusCode: 500, ""`),
			want: false,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			require.Equal(t, tc.want, IsImageNotFound(tc.err))
		})
	}
}

func TestIsImageAccessDenied(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		err  error
		want bool
	}{
		{name: "no error", err: nil, want: false},
		{
			name: "missing repository on Docker Hub",
			err:  errors.New("Cannot get image digest from HEAD request: reading digest latest in docker.io/portainer/agnet: requested access to the resource is denied"),
			want: true,
		},
		{
			name: "401 without a body",
			err:  errors.New(`Cannot get image digest from HEAD request: reading digest 1.0 in registry.local/agent: StatusCode: 401, ""`),
			want: true,
		},
		{
			name: "rejected credentials",
			err:  fmt.Errorf("getting token: %w", docker.ErrUnauthorizedForCredentials{Err: errors.New("invalid username/password")}),
			want: true,
		},
		{
			name: "registry ping refused",
			err:  errors.New(`Cannot get image digest from HEAD request: pinging container registry registry.local: StatusCode: 401, ""`),
			want: false,
		},
		{
			name: "missing tag",
			err:  errors.New(`Cannot get image digest from HEAD request: reading digest 0.0.0 in docker.io/portainer/agent: StatusCode: 404, ""`),
			want: false,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			require.Equal(t, tc.want, IsImageAccessDenied(tc.err))
		})
	}
}
