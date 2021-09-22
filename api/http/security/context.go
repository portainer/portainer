package security

import (
	"context"
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

type (
	contextKey int
)

const (
	contextAuthenticationKey contextKey = iota
	contextRestrictedRequest
)

// StoreTokenData stores a TokenData object inside the request context and returns the enhanced context.
func StoreTokenData(request *http.Request, tokenData *portainer.TokenData) context.Context {
	return context.WithValue(request.Context(), contextAuthenticationKey, tokenData)
}

// RetrieveTokenData returns the TokenData object stored in the request context.
func RetrieveTokenData(request *http.Request) (*portainer.TokenData, error) {
	contextData := request.Context().Value(contextAuthenticationKey)
	if contextData == nil {
		return nil, errors.New("Unable to find JWT data in request context")
	}

	tokenData := contextData.(*portainer.TokenData)
	return tokenData, nil
}

// StoreRestrictedRequestContext stores a RestrictedRequestContext object inside the request context
// and returns the enhanced context.
func StoreRestrictedRequestContext(request *http.Request, requestContext *RestrictedRequestContext) context.Context {
	return context.WithValue(request.Context(), contextRestrictedRequest, requestContext)
}

// RetrieveRestrictedRequestContext returns the RestrictedRequestContext object stored in the request context.
func RetrieveRestrictedRequestContext(request *http.Request) (*RestrictedRequestContext, error) {
	contextData := request.Context().Value(contextRestrictedRequest)
	if contextData == nil {
		return nil, errors.New("Unable to find security details in request context")
	}

	requestContext := contextData.(*RestrictedRequestContext)
	return requestContext, nil
}
