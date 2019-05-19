package security

import (
	"context"
	"net/http"

	"github.com/portainer/portainer/api"
)

type (
	contextKey int
)

const (
	contextAuthenticationKey contextKey = iota
	contextRestrictedRequest
	// TODO: remove
	//contextEndpointKey
)

// storeTokenData stores a TokenData object inside the request context and returns the enhanced context.
func storeTokenData(request *http.Request, tokenData *portainer.TokenData) context.Context {
	return context.WithValue(request.Context(), contextAuthenticationKey, tokenData)
}

// RetrieveTokenData returns the TokenData object stored in the request context.
func RetrieveTokenData(request *http.Request) (*portainer.TokenData, error) {
	contextData := request.Context().Value(contextAuthenticationKey)
	if contextData == nil {
		return nil, portainer.ErrMissingContextData
	}

	tokenData := contextData.(*portainer.TokenData)
	return tokenData, nil
}

// TODO: remove

//// TODO: doc
//func storeEndpointContext(request *http.Request, endpointID portainer.EndpointID) context.Context {
//	return context.WithValue(request.Context(), contextEndpointKey, endpointID)
//}
//
//// TODO: doc
//func RetrieveEndpointContext(request *http.Request) (portainer.EndpointID, error) {
//	contextData := request.Context().Value(contextEndpointKey)
//	if contextData == nil {
//		return portainer.EndpointID(0), portainer.ErrMissingEndpointContext
//	}
//
//	endpointID := contextData.(portainer.EndpointID)
//	return endpointID, nil
//}

// storeRestrictedRequestContext stores a RestrictedRequestContext object inside the request context
// and returns the enhanced context.
func storeRestrictedRequestContext(request *http.Request, requestContext *RestrictedRequestContext) context.Context {
	return context.WithValue(request.Context(), contextRestrictedRequest, requestContext)
}

// RetrieveRestrictedRequestContext returns the RestrictedRequestContext object stored in the request context.
func RetrieveRestrictedRequestContext(request *http.Request) (*RestrictedRequestContext, error) {
	contextData := request.Context().Value(contextRestrictedRequest)
	if contextData == nil {
		return nil, portainer.ErrMissingSecurityContext
	}

	requestContext := contextData.(*RestrictedRequestContext)
	return requestContext, nil
}
