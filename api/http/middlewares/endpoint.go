package middlewares

import (
	"context"
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	requesthelpers "github.com/portainer/portainer/pkg/libhttp/request"

	"github.com/gorilla/mux"
)

// Note: context keys must be distinct types to prevent collisions. They are NOT key/value map's internally
// See: https://go.dev/blog/context#TOC_3.2.

// This avoids staticcheck error:
// SA1029: should not use built-in type string as key for value; define your own type to avoid collisions (staticcheck)
// https://stackoverflow.com/questions/40891345/fix-should-not-use-basic-type-string-as-key-in-context-withvalue-golint
type key int

const contextEndpoint key = 0

func WithEndpoint(endpointService dataservices.EndpointService, endpointIDParam string) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(rw http.ResponseWriter, request *http.Request) {
			if endpointIDParam == "" {
				endpointIDParam = "id"
			}

			endpointID, err := requesthelpers.RetrieveNumericRouteVariableValue(request, endpointIDParam)
			if err != nil {
				httperror.WriteError(rw, http.StatusBadRequest, "Invalid environment identifier route variable", err)
				return
			}

			endpoint, err := endpointService.Endpoint(portainer.EndpointID(endpointID))
			if err != nil {
				statusCode := http.StatusInternalServerError

				if dataservices.IsErrObjectNotFound(err) {
					statusCode = http.StatusNotFound
				}
				httperror.WriteError(rw, statusCode, "Unable to find an environment with the specified identifier inside the database", err)
				return
			}

			ctx := context.WithValue(request.Context(), contextEndpoint, endpoint)

			next.ServeHTTP(rw, request.WithContext(ctx))

		})
	}
}

func FetchEndpoint(request *http.Request) (*portainer.Endpoint, error) {
	contextData := request.Context().Value(contextEndpoint)
	if contextData == nil {
		return nil, errors.New("Unable to find environment data in request context")
	}

	return contextData.(*portainer.Endpoint), nil
}
