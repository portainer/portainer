package http

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// StateHandler represents an HTTP API handler for managing Portainer initialization.
type StateHandler struct {
	*mux.Router
	Logger *log.Logger
}

// NewStateHandler returns a new instance of AuthHandler.
func NewStateHandler() *StateHandler {
	h := &StateHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.HandleFunc("/state", h.handleGetState)
	return h
}

func (handler *StateHandler) handleGetState(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		handleNotAllowed(w, []string{http.MethodGet})
		return
	}

	response := &getRootResponse{}
	encodeJSON(w, response, handler.Logger)
}

type getRootResponse struct {
}
