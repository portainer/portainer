package handler

import (
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/security"

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
	FileService                 portainer.FileService
	ProxyManager                *proxy.Manager
}

const (
	// ErrEndpointManagementDisabled is an error raised when trying to access the endpoints management endpoints
	// when the server has been started with the --external-endpoints flag
	ErrEndpointManagementDisabled = portainer.Error("Endpoint management is disabled")
)

// NewEndpointHandler returns a new instance of EndpointHandler.
func NewEndpointHandler(bouncer *security.RequestBouncer, authorizeEndpointManagement bool) *EndpointHandler {
	h := &EndpointHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
		authorizeEndpointManagement: authorizeEndpointManagement,
	}
	h.Handle("/endpoints",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePostEndpoints))).Methods(http.MethodPost)
	h.Handle("/endpoints",
		bouncer.RestrictedAccess(http.HandlerFunc(h.handleGetEndpoints))).Methods(http.MethodGet)
	h.Handle("/endpoints/{id}",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handleGetEndpoint))).Methods(http.MethodGet)
	h.Handle("/endpoints/{id}",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePutEndpoint))).Methods(http.MethodPut)
	h.Handle("/endpoints/{id}/access",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePutEndpointAccess))).Methods(http.MethodPut)
	h.Handle("/endpoints/{id}",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handleDeleteEndpoint))).Methods(http.MethodDelete)

	return h
}

type (
	postEndpointsRequest struct {
		Name                string `valid:"required"`
		URL                 string `valid:"required"`
		PublicURL           string `valid:"-"`
		TLS                 bool
		TLSSkipVerify       bool
		TLSSkipClientVerify bool
	}

	postEndpointsResponse struct {
		ID int `json:"Id"`
	}

	putEndpointAccessRequest struct {
		AuthorizedUsers []int `valid:"-"`
		AuthorizedTeams []int `valid:"-"`
	}

	putEndpointsRequest struct {
		Name                string `valid:"-"`
		URL                 string `valid:"-"`
		PublicURL           string `valid:"-"`
		TLS                 bool   `valid:"-"`
		TLSSkipVerify       bool   `valid:"-"`
		TLSSkipClientVerify bool   `valid:"-"`
	}
)

// handleGetEndpoints handles GET requests on /endpoints
func (handler *EndpointHandler) handleGetEndpoints(w http.ResponseWriter, r *http.Request) {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	filteredEndpoints, err := security.FilterEndpoints(endpoints, securityContext)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, filteredEndpoints, handler.Logger)
}

// handlePostEndpoints handles POST requests on /endpoints
func (handler *EndpointHandler) handlePostEndpoints(w http.ResponseWriter, r *http.Request) {
	if !handler.authorizeEndpointManagement {
		httperror.WriteErrorResponse(w, ErrEndpointManagementDisabled, http.StatusServiceUnavailable, handler.Logger)
		return
	}

	var req postEndpointsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	endpoint := &portainer.Endpoint{
		Name:      req.Name,
		URL:       req.URL,
		PublicURL: req.PublicURL,
		TLSConfig: portainer.TLSConfiguration{
			TLS:           req.TLS,
			TLSSkipVerify: req.TLSSkipVerify,
		},
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
		Extensions:      []portainer.EndpointExtension{},
	}

	err = handler.EndpointService.CreateEndpoint(endpoint)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if req.TLS {
		folder := strconv.Itoa(int(endpoint.ID))

		if !req.TLSSkipVerify {
			caCertPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileCA)
			endpoint.TLSConfig.TLSCACertPath = caCertPath
		}

		if !req.TLSSkipClientVerify {
			certPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileCert)
			endpoint.TLSConfig.TLSCertPath = certPath
			keyPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileKey)
			endpoint.TLSConfig.TLSKeyPath = keyPath
		}

		err = handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}
	}

	encodeJSON(w, &postEndpointsResponse{ID: int(endpoint.ID)}, handler.Logger)
}

// handleGetEndpoint handles GET requests on /endpoints/:id
func (handler *EndpointHandler) handleGetEndpoint(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	endpointID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrEndpointNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
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
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var req putEndpointAccessRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrEndpointNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
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
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// handlePutEndpoint handles PUT requests on /endpoints/:id
func (handler *EndpointHandler) handlePutEndpoint(w http.ResponseWriter, r *http.Request) {
	if !handler.authorizeEndpointManagement {
		httperror.WriteErrorResponse(w, ErrEndpointManagementDisabled, http.StatusServiceUnavailable, handler.Logger)
		return
	}

	vars := mux.Vars(r)
	id := vars["id"]

	endpointID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var req putEndpointsRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrEndpointNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if req.Name != "" {
		endpoint.Name = req.Name
	}

	if req.URL != "" {
		endpoint.URL = req.URL
	}

	if req.PublicURL != "" {
		endpoint.PublicURL = req.PublicURL
	}

	folder := strconv.Itoa(int(endpoint.ID))
	if req.TLS {
		endpoint.TLSConfig.TLS = true
		endpoint.TLSConfig.TLSSkipVerify = req.TLSSkipVerify
		if !req.TLSSkipVerify {
			caCertPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileCA)
			endpoint.TLSConfig.TLSCACertPath = caCertPath
		} else {
			endpoint.TLSConfig.TLSCACertPath = ""
			handler.FileService.DeleteTLSFile(folder, portainer.TLSFileCA)
		}

		if !req.TLSSkipClientVerify {
			certPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileCert)
			endpoint.TLSConfig.TLSCertPath = certPath
			keyPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileKey)
			endpoint.TLSConfig.TLSKeyPath = keyPath
		} else {
			endpoint.TLSConfig.TLSCertPath = ""
			handler.FileService.DeleteTLSFile(folder, portainer.TLSFileCert)
			endpoint.TLSConfig.TLSKeyPath = ""
			handler.FileService.DeleteTLSFile(folder, portainer.TLSFileKey)
		}
	} else {
		endpoint.TLSConfig.TLS = false
		endpoint.TLSConfig.TLSSkipVerify = true
		endpoint.TLSConfig.TLSCACertPath = ""
		endpoint.TLSConfig.TLSCertPath = ""
		endpoint.TLSConfig.TLSKeyPath = ""
		err = handler.FileService.DeleteTLSFiles(folder)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}
	}

	_, err = handler.ProxyManager.CreateAndRegisterProxy(endpoint)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// handleDeleteEndpoint handles DELETE requests on /endpoints/:id
func (handler *EndpointHandler) handleDeleteEndpoint(w http.ResponseWriter, r *http.Request) {
	if !handler.authorizeEndpointManagement {
		httperror.WriteErrorResponse(w, ErrEndpointManagementDisabled, http.StatusServiceUnavailable, handler.Logger)
		return
	}

	vars := mux.Vars(r)
	id := vars["id"]

	endpointID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))

	if err == portainer.ErrEndpointNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	handler.ProxyManager.DeleteProxy(string(endpointID))
	handler.ProxyManager.DeleteExtensionProxies(string(endpointID))

	err = handler.EndpointService.DeleteEndpoint(portainer.EndpointID(endpointID))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if endpoint.TLSConfig.TLS {
		err = handler.FileService.DeleteTLSFiles(id)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}
	}
}
