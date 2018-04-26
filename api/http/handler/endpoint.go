package handler

import (
	"bytes"
	"crypto/tls"
	"strings"
	"time"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/crypto"
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
	EndpointGroupService        portainer.EndpointGroupService
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
		GroupID             int    `valid:"-"`
		TLS                 bool   `valid:"-"`
		TLSSkipVerify       bool   `valid:"-"`
		TLSSkipClientVerify bool   `valid:"-"`
	}

	postEndpointPayload struct {
		name                      string
		url                       string
		publicURL                 string
		groupID                   int
		useTLS                    bool
		skipTLSServerVerification bool
		skipTLSClientVerification bool
		caCert                    []byte
		cert                      []byte
		key                       []byte
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

	groups, err := handler.EndpointGroupService.EndpointGroups()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	filteredEndpoints, err := security.FilterEndpoints(endpoints, groups, securityContext)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, filteredEndpoints, handler.Logger)
}

func sendPingRequest(host string, tlsConfig *tls.Config) error {
	transport := &http.Transport{}

	scheme := "http"
	if tlsConfig != nil {
		transport.TLSClientConfig = tlsConfig
		scheme = "https"
	}

	client := &http.Client{
		Timeout:   time.Second * 3,
		Transport: transport,
	}

	pingOperationURL := strings.Replace(host, "tcp://", scheme+"://", 1) + "/_ping"
	_, err := client.Get(pingOperationURL)
	if err != nil {
		return err
	}

	return nil
}

func (handler *EndpointHandler) createTLSSecuredEndpoint(payload *postEndpointPayload) (*portainer.Endpoint, error) {

	tlsConfig, err := crypto.CreateTLSConfig(payload.caCert, payload.cert, payload.key, payload.skipTLSClientVerification, payload.skipTLSServerVerification)
	if err != nil {
		return nil, err
	}

	err = sendPingRequest(payload.url, tlsConfig)
	if err != nil {
		return nil, err
	}

	endpoint := &portainer.Endpoint{
		Name:      payload.name,
		URL:       payload.url,
		GroupID:   portainer.EndpointGroupID(payload.groupID),
		PublicURL: payload.publicURL,
		TLSConfig: portainer.TLSConfiguration{
			TLS:           payload.useTLS,
			TLSSkipVerify: payload.skipTLSServerVerification,
		},
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
		Extensions:      []portainer.EndpointExtension{},
	}

	err = handler.EndpointService.CreateEndpoint(endpoint)
	if err != nil {
		return nil, err
	}

	folder := strconv.Itoa(int(endpoint.ID))

	if !payload.skipTLSServerVerification {
		r := bytes.NewReader(payload.caCert)
		// TODO: review the API exposed by the FileService to store
		// a file from a byte slice and return the path to the stored file instead
		// of using multiple legacy calls (StoreTLSFile, GetPathForTLSFile) here.
		err = handler.FileService.StoreTLSFile(folder, portainer.TLSFileCA, r)
		if err != nil {
			handler.EndpointService.DeleteEndpoint(endpoint.ID)
			return nil, err
		}
		caCertPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileCA)
		endpoint.TLSConfig.TLSCACertPath = caCertPath
	}

	if !payload.skipTLSClientVerification {
		r := bytes.NewReader(payload.cert)
		err = handler.FileService.StoreTLSFile(folder, portainer.TLSFileCert, r)
		if err != nil {
			handler.EndpointService.DeleteEndpoint(endpoint.ID)
			return nil, err
		}
		certPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileCert)
		endpoint.TLSConfig.TLSCertPath = certPath

		r = bytes.NewReader(payload.key)
		err = handler.FileService.StoreTLSFile(folder, portainer.TLSFileKey, r)
		if err != nil {
			handler.EndpointService.DeleteEndpoint(endpoint.ID)
			return nil, err
		}
		keyPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileKey)
		endpoint.TLSConfig.TLSKeyPath = keyPath
	}

	err = handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return nil, err
	}

	return endpoint, nil
}

func (handler *EndpointHandler) createUnsecuredEndpoint(payload *postEndpointPayload) (*portainer.Endpoint, error) {

	if !strings.HasPrefix(payload.url, "unix://") {
		err := sendPingRequest(payload.url, nil)
		if err != nil {
			return nil, err
		}
	}

	endpoint := &portainer.Endpoint{
		Name:      payload.name,
		URL:       payload.url,
		GroupID:   portainer.EndpointGroupID(payload.groupID),
		PublicURL: payload.publicURL,
		TLSConfig: portainer.TLSConfiguration{
			TLS: false,
		},
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
		Extensions:      []portainer.EndpointExtension{},
	}

	err := handler.EndpointService.CreateEndpoint(endpoint)
	if err != nil {
		return nil, err
	}

	return endpoint, nil
}

func (handler *EndpointHandler) createEndpoint(payload *postEndpointPayload) (*portainer.Endpoint, error) {
	if payload.useTLS {
		return handler.createTLSSecuredEndpoint(payload)
	}
	return handler.createUnsecuredEndpoint(payload)
}

func convertPostEndpointRequestToPayload(r *http.Request) (*postEndpointPayload, error) {
	payload := &postEndpointPayload{}
	payload.name = r.FormValue("Name")
	payload.url = r.FormValue("URL")
	payload.publicURL = r.FormValue("PublicURL")

	if payload.name == "" || payload.url == "" {
		return nil, ErrInvalidRequestFormat
	}

	rawGroupID := r.FormValue("GroupID")
	if rawGroupID == "" {
		payload.groupID = 1
	} else {
		groupID, err := strconv.Atoi(rawGroupID)
		if err != nil {
			return nil, err
		}
		payload.groupID = groupID
	}

	payload.useTLS = r.FormValue("TLS") == "true"

	if payload.useTLS {
		payload.skipTLSServerVerification = r.FormValue("TLSSkipVerify") == "true"
		payload.skipTLSClientVerification = r.FormValue("TLSSkipClientVerify") == "true"

		if !payload.skipTLSServerVerification {
			caCert, err := getUploadedFileContent(r, "TLSCACertFile")
			if err != nil {
				return nil, err
			}
			payload.caCert = caCert
		}

		if !payload.skipTLSClientVerification {
			cert, err := getUploadedFileContent(r, "TLSCertFile")
			if err != nil {
				return nil, err
			}
			payload.cert = cert
			key, err := getUploadedFileContent(r, "TLSKeyFile")
			if err != nil {
				return nil, err
			}
			payload.key = key
		}
	}

	return payload, nil
}

// handlePostEndpoints handles POST requests on /endpoints
func (handler *EndpointHandler) handlePostEndpoints(w http.ResponseWriter, r *http.Request) {
	if !handler.authorizeEndpointManagement {
		httperror.WriteErrorResponse(w, ErrEndpointManagementDisabled, http.StatusServiceUnavailable, handler.Logger)
		return
	}

	payload, err := convertPostEndpointRequestToPayload(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	endpoint, err := handler.createEndpoint(payload)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
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

	if req.GroupID != 0 {
		endpoint.GroupID = portainer.EndpointGroupID(req.GroupID)
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
