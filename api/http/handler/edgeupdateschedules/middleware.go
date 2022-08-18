package edgeupdateschedules

import (
	"context"
	"errors"
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	bolterrors "github.com/portainer/portainer/api/dataservices/errors"
)

const contextKey = "edgeUpdateSchedule"

type ItemGetter[TId ~int, TObject any] interface {
	Item(id TId) (*TObject, error)
}

func withItem[TId ~int, TObject any, TService ItemGetter[TId, TObject]](dataService TService, idParam string, contextKey string) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
			itemId, err := request.RetrieveNumericRouteVariableValue(req, "id")
			if err != nil {
				httperror.WriteError(rw, http.StatusBadRequest, "Invalid  identifier route variable", err)
				return
			}

			item, err := dataService.Item(TId(itemId))
			if err != nil {
				statusCode := http.StatusInternalServerError
				if err == bolterrors.ErrObjectNotFound {
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

func FetchItem[T any](request *http.Request) (*T, error) {
	contextData := request.Context().Value(contextKey)
	if contextData == nil {
		return nil, errors.New("Unable to find environment data in request context")
	}

	return contextData.(*T), nil
}
