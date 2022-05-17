package testhelpers

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

type testRequestBouncer struct {
}

// NewTestRequestBouncer creates new mock for requestBouncer
func NewTestRequestBouncer() *testRequestBouncer {
	return &testRequestBouncer{}
}

func (testRequestBouncer) AuthenticatedAccess(h http.Handler) http.Handler {
	return h
}

func (testRequestBouncer) AdminAccess(h http.Handler) http.Handler {
	return h
}

func (testRequestBouncer) RestrictedAccess(h http.Handler) http.Handler {
	return h
}

func (testRequestBouncer) PublicAccess(h http.Handler) http.Handler {
	return h
}

func (testRequestBouncer) AuthorizedEndpointOperation(r *http.Request, endpoint *portainer.Endpoint) error {
	return nil
}

func (testRequestBouncer) AuthorizedEdgeEndpointOperation(r *http.Request, endpoint *portainer.Endpoint) error {
	return nil
}
