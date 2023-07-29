package tags

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"

	"github.com/gorilla/mux"
)

// Handler is the HTTP handler used to handle tag operations.
type Handler struct {
	*mux.Router
	DataStore dataservices.DataStore
}

// NewHandler creates a handler to manage tag operations.
func NewHandler(bouncer security.BouncerService) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/tags",
		bouncer.AdminAccess(httperror.LoggerHandler(h.tagCreate))).Methods(http.MethodPost)
	h.Handle("/tags",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.tagList))).Methods(http.MethodGet)
	h.Handle("/tags/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.tagDelete))).Methods(http.MethodDelete)

	return h
}

func txResponse(w http.ResponseWriter, r any, err error) *httperror.HandlerError {
	if err != nil {
		var handlerError *httperror.HandlerError
		if errors.As(err, &handlerError) {
			return handlerError
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return response.JSON(w, r)
}
