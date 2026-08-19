package middlewares

import (
	"context"
	"errors"
	"net/http"

	"github.com/portainer/portainer/api/dataservices"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"

	"github.com/gorilla/mux"
)

type ItemContextKey string

type ItemGetter[TId ~int, TObject any] func(id TId) (*TObject, error)

func WithItem[TId ~int, TObject any](getter ItemGetter[TId, TObject], idParam string, contextKey ItemContextKey) mux.MiddlewareFunc {
	if idParam == "" {
		idParam = "id"
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
			itemId, err := request.RetrieveNumericRouteVariableValue(req, idParam)
			if err != nil {
				httperror.WriteError(rw, http.StatusBadRequest, "Invalid  identifier route variable", err)
				return
			}

			item, err := getter(TId(itemId))
			if err != nil {
				statusCode := http.StatusInternalServerError
				if dataservices.IsErrObjectNotFound(err) {
					statusCode = http.StatusNotFound
				}
				httperror.WriteError(rw, statusCode, "Unable to find a object with the specified identifier inside the database", err)

				return
			}
			ctx := context.WithValue(req.Context(), contextKey, item)
			next.ServeHTTP(rw, req.WithContext(ctx))
		})
	}
}

func FetchItem[T any](request *http.Request, contextKey ItemContextKey) (*T, error) {
	contextData := request.Context().Value(contextKey)
	if contextData == nil {
		return nil, errors.New("unable to find item in request context")
	}

	item, ok := contextData.(*T)
	if !ok {
		return nil, errors.New("unable to cast context item")
	}

	return item, nil
}
