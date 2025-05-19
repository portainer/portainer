package client

import (
	"errors"

	"github.com/portainer/portainer/pkg/featureflags"
)

var (
	ErrExternalRequestsBlocked = errors.New("external requests are blocked by feature flag")
)

// DisableExternalRequest is the feature flag name for blocking outbound requests
const DisableExternalRequests = "disable-external-requests"

func ExternalRequestDisabled(url string) error {
	if featureflags.IsEnabled(DisableExternalRequests) {
		return ErrExternalRequestsBlocked
	}

	return nil
}
