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
	Logger                      *log.Logger
	authorizeEndpointManagement bool
	EndpointService             portainer.EndpointService
	TeamService                 portainer.TeamService
	FileService                 portainer.FileService
	ProxyService                *ProxyService
}

const (
	// ErrEndpointManagementDisabled is an error raised when trying to access the endpoints management endpoints
	// when the server has been started with the --external-endpoints flag
	ErrEndpointManagementDisabled = portainer.Error("Endpoint management is disabled")
)

// NewEndpointHandler returns a new instance of EndpointHandler.
func NewEndpointHandler(mw *middleWareService) *EndpointHandler {
	h := &EndpointHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/endpoints",
		mw.administrator(http.HandlerFunc(h.handlePostEndpoints))).Methods(http.MethodPost)
	h.Handle("/endpoints",
		mw.authenticated(http.HandlerFunc(h.handleGetEndpoints))).Methods(http.MethodGet)
	h.Handle("/endpoints/{id}",
		mw.administrator(http.HandlerFunc(h.handleGetEndpoint))).Methods(http.MethodGet)
	h.Handle("/endpoints/{id}",
		mw.administrator(http.HandlerFunc(h.handlePutEndpoint))).Methods(http.MethodPut)
	h.Handle("/endpoints/{id}/access",
		mw.administrator(http.HandlerFunc(h.handlePutEndpointAccess))).Methods(http.MethodPut)
	h.Handle("/endpoints/{id}",
		mw.administrator(http.HandlerFunc(h.handleDeleteEndpoint))).Methods(http.MethodDelete)

	return h
}

// handleGetEndpoints handles GET requests on /endpoints
func (handler *EndpointHandler) handleGetEndpoints(w http.ResponseWriter, r *http.Request) {
	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	tokenData, err := extractTokenDataFromRequestContext(r)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
	}
	if tokenData == nil {
		Error(w, portainer.ErrInvalidJWTToken, http.StatusBadRequest, handler.Logger)
		return
	}

	var allowedEndpoints []portainer.Endpoint
	if tokenData.Role != portainer.AdministratorRole {
		allowedEndpoints = make([]portainer.Endpoint, 0)
		teams, _ := handler.TeamService.TeamsByUserID(tokenData.ID)
		for _, endpoint := range endpoints {
			for _, authorizedUserID := range endpoint.AuthorizedUsers {
				if authorizedUserID == tokenData.ID {
					allowedEndpoints = append(allowedEndpoints, endpoint)
					break
				}
			}
			for _, authorizedTeamID := range endpoint.AuthorizedTeams {
				for _, team := range teams {
					if team.ID == authorizedTeamID {
						allowedEndpoints = append(allowedEndpoints, endpoint)
						break
					}
				}
			}
		}
	} else {
		allowedEndpoints = endpoints
	}

	encodeJSON(w, allowedEndpoints, handler.Logger)
}

// handlePostEndpoints handles POST requests on /endpoints
func (handler *EndpointHandler) handlePostEndpoints(w http.ResponseWriter, r *http.Request) {
	if !handler.authorizeEndpointManagement {
		Error(w, ErrEndpointManagementDisabled, http.StatusServiceUnavailable, handler.Logger)
		return
	}

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
		Name:            req.Name,
		URL:             req.URL,
		TLS:             req.TLS,
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
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
func (handler *EndpointHandler) handleGetEndpoint(w http.ResponseWriter, r *http.Request) {
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

	encodeJSON(w, endpoint, handler.Logger)
}

// handlePutEndpointAccess handles PUT requests on /endpoints/:id/access
func (handler *EndpointHandler) handlePutEndpointAccess(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	endpointID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var req putEndpointAccessRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		Error(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
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

	if req.AuthorizedUsers != nil {
		authorizedUserIDs := []portainer.UserID{}
		for _, value := range req.AuthorizedUsers {
			authorizedUserIDs = append(authorizedUserIDs, portainer.UserID(value))
		}
		endpoint.AuthorizedUsers = authorizedUserIDs
	}

	if req.AuthorizedTeams != nil {
		authorizedTeamIDs := []portainer.TeamID{}
		for _, value := range req.AuthorizedTeams {
			authorizedTeamIDs = append(authorizedTeamIDs, portainer.TeamID(value))
		}
		endpoint.AuthorizedTeams = authorizedTeamIDs
	}

	err = handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

type putEndpointAccessRequest struct {
	AuthorizedUsers []int `valid:"-"`
	AuthorizedTeams []int `valid:"-"`
}

// handlePutEndpoint handles PUT requests on /endpoints/:id
func (handler *EndpointHandler) handlePutEndpoint(w http.ResponseWriter, r *http.Request) {
	if !handler.authorizeEndpointManagement {
		Error(w, ErrEndpointManagementDisabled, http.StatusServiceUnavailable, handler.Logger)
		return
	}

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

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrEndpointNotFound {
		Error(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if req.Name != "" {
		endpoint.Name = req.Name
	}

	if req.URL != "" {
		endpoint.URL = req.URL
	}

	if req.TLS {
		endpoint.TLS = true
		caCertPath, _ := handler.FileService.GetPathForTLSFile(endpoint.ID, portainer.TLSFileCA)
		endpoint.TLSCACertPath = caCertPath
		certPath, _ := handler.FileService.GetPathForTLSFile(endpoint.ID, portainer.TLSFileCert)
		endpoint.TLSCertPath = certPath
		keyPath, _ := handler.FileService.GetPathForTLSFile(endpoint.ID, portainer.TLSFileKey)
		endpoint.TLSKeyPath = keyPath
	} else {
		endpoint.TLS = false
		endpoint.TLSCACertPath = ""
		endpoint.TLSCertPath = ""
		endpoint.TLSKeyPath = ""
		err = handler.FileService.DeleteTLSFiles(endpoint.ID)
		if err != nil {
			Error(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}
	}

	_, err = handler.ProxyService.CreateAndRegisterProxy(endpoint)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

type putEndpointsRequest struct {
	Name string `valid:"-"`
	URL  string `valid:"-"`
	TLS  bool   `valid:"-"`
}

// handleDeleteEndpoint handles DELETE requests on /endpoints/:id
func (handler *EndpointHandler) handleDeleteEndpoint(w http.ResponseWriter, r *http.Request) {
	if !handler.authorizeEndpointManagement {
		Error(w, ErrEndpointManagementDisabled, http.StatusServiceUnavailable, handler.Logger)
		return
	}

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

	handler.ProxyService.DeleteProxy(string(endpointID))

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
