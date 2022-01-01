package testhelpers

import "net/http"

type testRequestBouncer struct {
}

// NewTestRequestBouncer creates new mock for requestBouncer
func NewTestRequestBouncer() *testRequestBouncer {
	return &testRequestBouncer{}
}

func (testRequestBouncer) AuthenticatedAccess(h http.Handler) http.Handler {
	return h
}
