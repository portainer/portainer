package middlewares

import (
	"context"
	"errors"
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	requesthelpers "github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"

	"github.com/portainer/portainer/api/dataservices"
)

const (
	contextEndpoint = "endpoint"
)

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
