package context

import (
	"context"
	"net/http"

	"github.com/portainer/portainer"
)

type (
	contextKey int
)

const (
	contextAuthenticationKey contextKey = iota
)

func GetTokenData(request *http.Request) (*portainer.TokenData, error) {
	contextData := request.Context().Value(contextAuthenticationKey)
	if contextData == nil {
		return nil, portainer.ErrMissingContextData
	}

	tokenData := contextData.(*portainer.TokenData)
	return tokenData, nil
}

func StoreTokenData(request *http.Request, tokenData *portainer.TokenData) context.Context {
	return context.WithValue(request.Context(), contextAuthenticationKey, tokenData)
}
