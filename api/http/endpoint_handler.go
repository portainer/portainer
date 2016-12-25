package http

import (
	"github.com/portainer/portainer"

	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/asaskevich/govalidator"
	"github.com/gorilla/mux"
)

// EndpointHandler represents an HTTP API handler for managing Docker endpoints.
type EndpointHandler struct {
	*mux.Router
	Logger            *log.Logger
	EndpointService   portainer.EndpointService
	FileService       portainer.FileService
	server            *Server
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
	}))).Methods(http.MethodPost)
	h.Handle("/endpoints", middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.handleGetEndpoints(w, r)
	}))).Methods(http.MethodGet)
	h.Handle("/endpoints/{id}", middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.handleGetEndpoint(w, r)
	}))).Methods(http.MethodGet)
	h.Handle("/endpoints/{id}", middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.handlePutEndpoint(w, r)
	}))).Methods(http.MethodPut)
	h.Handle("/endpoints/{id}", middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.handleDeleteEndpoint(w, r)
	}))).Methods(http.MethodDelete)
	h.Handle("/endpoints/{id}/active", middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.handlePostEndpoint(w, r)
	}))).Methods(http.MethodPost)
	return h
}

// handleGetEndpoints handles GET requests on /endpoints
func (handler *EndpointHandler) handleGetEndpoints(w http.ResponseWriter, r *http.Request) {
	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	encodeJSON(w, endpoints, handler.Logger)
}

// handlePostEndpoints handles POST requests on /endpoints
// if the active URL parameter is specified, will also define the new endpoint as the active endpoint.
// /endpoints(?active=true|false)
func (handler *EndpointHandler) handlePostEndpoints(w http.ResponseWriter, r *http.Request) {
	var req postEndpointsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		Error(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	endpoint := &portainer.Endpoint{
		Name: req.Name,
		URL:  req.URL,
		TLS:  req.TLS,
	}

	err = handler.EndpointService.CreateEndpoint(endpoint)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if req.TLS {
		caCertPath, _ := handler.FileService.GetPathForTLSFile(endpoint.ID, portainer.TLSFileCA)
		endpoint.TLSCACertPath = caCertPath
		certPath, _ := handler.FileService.GetPathForTLSFile(endpoint.ID, portainer.TLSFileCert)
		endpoint.TLSCertPath = certPath
		keyPath, _ := handler.FileService.GetPathForTLSFile(endpoint.ID, portainer.TLSFileKey)
		endpoint.TLSKeyPath = keyPath
		err = handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
		if err != nil {
			Error(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}
	}

	activeEndpointParameter := r.FormValue("active")
	if activeEndpointParameter != "" {
		active, err := strconv.ParseBool(activeEndpointParameter)
		if err != nil {
			Error(w, err, http.StatusBadRequest, handler.Logger)
			return
		}
		if active == true {
			err = handler.server.updateActiveEndpoint(endpoint)
			if err != nil {
				Error(w, err, http.StatusInternalServerError, handler.Logger)
				return
			}
		}
	}

	encodeJSON(w, &postEndpointsResponse{ID: int(endpoint.ID)}, handler.Logger)
}

type postEndpointsRequest struct {
	Name string `valid:"required"`
	URL  string `valid:"required"`
	TLS  bool
}

type postEndpointsResponse struct {
	ID int `json:"Id"`
}

// handleGetEndpoint handles GET requests on /endpoints/:id
// GET /endpoints/0 returns active endpoint
func (handler *EndpointHandler) handleGetEndpoint(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	endpointID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var endpoint *portainer.Endpoint
	if id == "0" {
		endpoint, err = handler.EndpointService.GetActive()
		if err == portainer.ErrEndpointNotFound {
			Error(w, err, http.StatusNotFound, handler.Logger)
			return
		} else if err != nil {
			Error(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}
		if handler.server.ActiveEndpoint == nil {
			err = handler.server.updateActiveEndpoint(endpoint)
			if err != nil {
				Error(w, err, http.StatusInternalServerError, handler.Logger)
				return
			}
		}
	} else {
		endpoint, err = handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
		if err == portainer.ErrEndpointNotFound {
			Error(w, err, http.StatusNotFound, handler.Logger)
			return
		} else if err != nil {
			Error(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}
	}

	encodeJSON(w, endpoint, handler.Logger)
}

// handlePostEndpoint handles POST requests on /endpoints/:id/active
func (handler *EndpointHandler) handlePostEndpoint(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	endpointID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrEndpointNotFound {
		Error(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.server.updateActiveEndpoint(endpoint)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
	}
}

// handlePutEndpoint handles PUT requests on /endpoints/:id
func (handler *EndpointHandler) handlePutEndpoint(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	endpointID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var req putEndpointsRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		Error(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	endpoint := &portainer.Endpoint{
		ID:   portainer.EndpointID(endpointID),
		Name: req.Name,
		URL:  req.URL,
		TLS:  req.TLS,
	}

	if req.TLS {
		caCertPath, _ := handler.FileService.GetPathForTLSFile(endpoint.ID, portainer.TLSFileCA)
		endpoint.TLSCACertPath = caCertPath
		certPath, _ := handler.FileService.GetPathForTLSFile(endpoint.ID, portainer.TLSFileCert)
		endpoint.TLSCertPath = certPath
		keyPath, _ := handler.FileService.GetPathForTLSFile(endpoint.ID, portainer.TLSFileKey)
		endpoint.TLSKeyPath = keyPath
	} else {
		err = handler.FileService.DeleteTLSFiles(endpoint.ID)
		if err != nil {
			Error(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}
	}

	err = handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

type putEndpointsRequest struct {
	Name string `valid:"required"`
	URL  string `valid:"required"`
	TLS  bool
}

// handleDeleteEndpoint handles DELETE requests on /endpoints/:id
func (handler *EndpointHandler) handleDeleteEndpoint(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	endpointID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrEndpointNotFound {
		Error(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.EndpointService.DeleteEndpoint(portainer.EndpointID(endpointID))
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if endpoint.TLS {
		err = handler.FileService.DeleteTLSFiles(portainer.EndpointID(endpointID))
		if err != nil {
			Error(w, err, http.StatusInternalServerError, handler.Logger)
		}
	}
}
