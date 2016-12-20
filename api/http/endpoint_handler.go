package http

import (
	"github.com/portainer/portainer"

	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// EndpointHandler represents an HTTP API handler for managing Docker endpoints.
type EndpointHandler struct {
	*mux.Router
	Logger            *log.Logger
	EndpointService   portainer.EndpointService
	middleWareService *middleWareService
}

// NewEndpointHandler returns a new instance of EndpointHandler.
func NewEndpointHandler(middleWareService *middleWareService) *EndpointHandler {
	h := &EndpointHandler{
		Router:            mux.NewRouter(),
		Logger:            log.New(os.Stderr, "", log.LstdFlags),
		middleWareService: middleWareService,
	}
	h.Handle("/endpoints", middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.handlePostEndpoints(w, r)
	})))
	h.Handle("/endpoints/{id}", middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.handleGetEndpoint(w, r)
	}))).Methods("GET")
	return h
}

// handlePostEndpoints handles POST requests on /endpoints
func (handler *EndpointHandler) handlePostEndpoints(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		handleNotAllowed(w, []string{http.MethodPost})
		return
	}
}

// handleGetEndpoint handles GET requests on /endpoints/:id
func (handler *EndpointHandler) handleGetEndpoint(w http.ResponseWriter, r *http.Request) {
}
