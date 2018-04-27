package handler

import (
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"

	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/asaskevich/govalidator"
	"github.com/gorilla/mux"
)

const registryCheckTimeout = 3 * time.Second
const registryTimeout = 5 * time.Second

// RegistryHandler represents an HTTP API handler for managing Docker registries.
type RegistryHandler struct {
	*mux.Router
	Logger          *log.Logger
	RegistryService portainer.RegistryService
}

// RegistryAuthResponse represents a response of a registry auth service (token)
type RegistryAuthResponse struct {
	Token string `json:"token"`
}

// NewRegistryHandler returns a new instance of RegistryHandler.
func NewRegistryHandler(bouncer *security.RequestBouncer) *RegistryHandler {
	h := &RegistryHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/registries",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePostRegistries))).Methods(http.MethodPost)
	h.Handle("/registries",
		bouncer.RestrictedAccess(http.HandlerFunc(h.handleGetRegistries))).Methods(http.MethodGet)
	h.Handle("/registries/{id}",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handleGetRegistry))).Methods(http.MethodGet)
	h.Handle("/registries/{id}",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePutRegistry))).Methods(http.MethodPut)
	h.Handle("/registries/{id}/access",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePutRegistryAccess))).Methods(http.MethodPut)
	h.Handle("/registries/{id}",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handleDeleteRegistry))).Methods(http.MethodDelete)
	h.PathPrefix("/registries/{id}/v2").Handler(
		bouncer.AdministratorAccess(http.HandlerFunc(h.proxyRequestsToRegistryAPI)))

	return h
}

type (
	postRegistriesRequest struct {
		Name            string `valid:"required"`
		URL             string `valid:"required"`
		TLSVerification bool   `valid:""`
		Authentication  bool   `valid:""`
		Username        string `valid:""`
		Password        string `valid:""`
	}

	postRegistriesResponse struct {
		ID int `json:"Id"`
	}

	putRegistryAccessRequest struct {
		AuthorizedUsers []int `valid:"-"`
		AuthorizedTeams []int `valid:"-"`
	}

	putRegistriesRequest struct {
		Name            string `valid:"required"`
		URL             string `valid:"required"`
		TLSVerification bool   `valid:""`
		Authentication  bool   `valid:""`
		Username        string `valid:""`
		Password        string `valid:""`
	}
)

// handleGetRegistries handles GET requests on /registries
func (handler *RegistryHandler) handleGetRegistries(w http.ResponseWriter, r *http.Request) {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	registries, err := handler.RegistryService.Registries()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	filteredRegistries, err := security.FilterRegistries(registries, securityContext)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	for i := range filteredRegistries {
		filteredRegistries[i].Password = ""
	}

	encodeJSON(w, filteredRegistries, handler.Logger)
}

// handlePostRegistries handles POST requests on /registries
func (handler *RegistryHandler) handlePostRegistries(w http.ResponseWriter, r *http.Request) {
	var req postRegistriesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	registries, err := handler.RegistryService.Registries()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	for _, r := range registries {
		if r.URL == req.URL {
			httperror.WriteErrorResponse(w, portainer.ErrRegistryAlreadyExists, http.StatusConflict, handler.Logger)
			return
		}
	}

	protocol, version, err := validateRegistryURL(req.URL, req.Authentication, req.Username, req.Password, req.TLSVerification)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	registry := &portainer.Registry{
		Name:            req.Name,
		URL:             req.URL,
		Protocol:        protocol,
		Version:         version,
		TLSVerification: req.TLSVerification,
		Authentication:  req.Authentication,
		Username:        req.Username,
		Password:        req.Password,
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
	}

	err = handler.RegistryService.CreateRegistry(registry)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &postRegistriesResponse{ID: int(registry.ID)}, handler.Logger)
}

// handleGetRegistry handles GET requests on /registries/:id
func (handler *RegistryHandler) handleGetRegistry(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	registryID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	registry, err := handler.RegistryService.Registry(portainer.RegistryID(registryID))
	if err == portainer.ErrRegistryNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	registry.Password = ""

	encodeJSON(w, registry, handler.Logger)
}

// handlePutRegistryAccess handles PUT requests on /registries/:id/access
func (handler *RegistryHandler) handlePutRegistryAccess(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	registryID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var req putRegistryAccessRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	registry, err := handler.RegistryService.Registry(portainer.RegistryID(registryID))
	if err == portainer.ErrRegistryNotFound {
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
		registry.AuthorizedUsers = authorizedUserIDs
	}

	if req.AuthorizedTeams != nil {
		authorizedTeamIDs := []portainer.TeamID{}
		for _, value := range req.AuthorizedTeams {
			authorizedTeamIDs = append(authorizedTeamIDs, portainer.TeamID(value))
		}
		registry.AuthorizedTeams = authorizedTeamIDs
	}

	err = handler.RegistryService.UpdateRegistry(registry.ID, registry)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// handlePutRegistry handles PUT requests on /registries/:id
func (handler *RegistryHandler) handlePutRegistry(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	registryID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var req putRegistriesRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	registry, err := handler.RegistryService.Registry(portainer.RegistryID(registryID))
	if err == portainer.ErrRegistryNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	registries, err := handler.RegistryService.Registries()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	for _, r := range registries {
		if r.URL == req.URL && r.ID != registry.ID {
			httperror.WriteErrorResponse(w, portainer.ErrRegistryAlreadyExists, http.StatusConflict, handler.Logger)
			return
		}
	}

	if req.Name != "" {
		registry.Name = req.Name
	}

	if req.URL != "" {
		protocol, version, err := validateRegistryURL(req.URL, req.Authentication, req.Username, req.Password, req.TLSVerification)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
			return
		}
		registry.URL = req.URL
		registry.Protocol = protocol
		registry.Version = version
	}

	if req.Authentication {
		registry.Authentication = true
		registry.Username = req.Username
		registry.Password = req.Password
	} else {
		registry.Authentication = false
		registry.Username = ""
		registry.Password = ""
	}
	registry.TLSVerification = req.TLSVerification

	err = handler.RegistryService.UpdateRegistry(registry.ID, registry)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// handleDeleteRegistry handles DELETE requests on /registries/:id
func (handler *RegistryHandler) handleDeleteRegistry(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	registryID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = handler.RegistryService.Registry(portainer.RegistryID(registryID))
	if err == portainer.ErrRegistryNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.RegistryService.DeleteRegistry(portainer.RegistryID(registryID))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// proxyRequestsToRegistryAPI proxy to registry and set auth header if necessary
func (handler *RegistryHandler) proxyRequestsToRegistryAPI(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	registryID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	registry, err := handler.RegistryService.Registry(portainer.RegistryID(registryID))
	if err == portainer.ErrRegistryNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	client := &http.Client{
		Timeout: registryTimeout,
	}
	if !registry.TLSVerification {
		client.Transport = &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}
	}

	// Build first request (without auth)
	uri := strings.Replace(r.RequestURI, "/api/registries/"+id+"/", "", 1)
	req := r
	req.RequestURI = ""
	u, err := url.Parse(registry.Protocol + "://" + registry.URL + "/" + uri)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
	}

	req.URL = u
	req.Host = registry.URL
	resp, err := client.Do(req)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
	}

	// Get Www-Authenticate header to find requested auth method
	// Bearer: Need to auth to a 3rd party service, and get token, then recall original uri with Authorization header
	// Basic: Need to recall same uri with Basic Authorization header
	// Else: Just send response
	authHeader := resp.Header.Get("Www-Authenticate")
	authType := strings.Split(authHeader, " ")[0]
	switch authType {
	case "Bearer":
		// Call auth URI to get token, and recall registry with token
		parts := strings.Split(strings.Replace(authHeader, "Bearer ", "", 1), ",")
		m := map[string]string{}
		for _, part := range parts {
			if splits := strings.Split(part, "="); len(splits) == 2 {
				m[splits[0]] = strings.Replace(splits[1], "\"", "", 2)
			}
		}

		authURL := m["realm"]
		if v, ok := m["service"]; ok {
			authURL += "?service=" + v
			if v, ok = m["scope"]; ok {
				authURL += "&scope=" + v
			}
		}

		authReq, err := http.NewRequest("GET", authURL, nil)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		}
		authReq.SetBasicAuth(registry.Username, registry.Password)

		resp, err = client.Do(authReq)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		}
		if resp.StatusCode == http.StatusOK {
			// Parse response into RegistryAuthResponse
			defer resp.Body.Close()
			respJson := &RegistryAuthResponse{}
			err = json.NewDecoder(resp.Body).Decode(respJson)
			if err != nil {
				httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
			}

			// Forward to registry with bearer token
			req.Header.Set("Authorization", "Bearer "+respJson.Token)
		}

	case "Basic":
		// Forward to registry with basic auth
		req.SetBasicAuth(registry.Username, registry.Password)

	default:
		// Just send response, nothing more
	}

	nextResp := resp
	if authType != "" {
		// Do the backend call
		nextResp, err = client.Do(req)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		}
	}

	// Copy response and headers to original writer
	defer nextResp.Body.Close()
	for name, values := range nextResp.Header {
		w.Header()[name] = values
	}
	w.WriteHeader(nextResp.StatusCode)
	io.Copy(w, nextResp.Body)
}

// validateRegistryURL validates wether given url is valid a docker registry url by
// sending http get request to url using combination of protocols and available
// registry versions. upon first successfull attempt, it returns protocol, version
// and nil error.
func validateRegistryURL(url string, auth bool, username, password string, tlsVerification bool) (string, string, error) {
	configs := []struct {
		protocol, version string
	}{
		{"https", "v2"},
		{"https", "v1"},
		{"http", "v2"},
		{"http", "v1"},
	}

	client := &http.Client{
		Timeout: registryCheckTimeout,
	}
	if !tlsVerification {
		client.Transport = &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}
	}
	for _, config := range configs {
		url := fmt.Sprintf("%s://%s/%s/", config.protocol, url, config.version)
		if auth {
			if err := registryAuthAttempt(client, url, username, password); err == nil {
				return config.protocol, config.version, nil
			} else if err == portainer.ErrRegistryInvalidAuthCredentials || err == portainer.ErrRegistryInvalidServerCert {
				return "", "", err
			}
			continue
		}

		if err := checkRegistryURL(client, url); err == nil {
			return config.protocol, config.version, nil
		} else if err == portainer.ErrRegistryAuthRequired || err == portainer.ErrRegistryInvalidServerCert {
			return "", "", err
		}
	}

	return "", "", portainer.ErrRegistryInvalid
}

func checkRegistryURL(client *http.Client, url string) error {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return portainer.ErrRegistryInvalid
	}

	resp, err := client.Do(req)
	if err != nil {
		if strings.Contains(err.Error(), "cannot validate certificate for") {
			return portainer.ErrRegistryInvalidServerCert
		}
		return portainer.ErrRegistryInvalid
	}

	if resp.StatusCode == http.StatusOK {
		return nil
	}
	if resp.StatusCode == http.StatusUnauthorized {
		return portainer.ErrRegistryAuthRequired
	}
	return portainer.ErrRegistryInvalid
}

func registryAuthAttempt(client *http.Client, url, username, password string) error {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return portainer.ErrRegistryInvalid
	}

	resp, err := client.Do(req)
	if err != nil && strings.Contains(err.Error(), "cannot validate certificate for") {
		return portainer.ErrRegistryInvalidServerCert
	} else if err != nil || resp.StatusCode != http.StatusUnauthorized {
		return portainer.ErrRegistryInvalid
	}

	authURL := url
	authHeader := resp.Header.Get("Www-Authenticate")
	authType := strings.Split(authHeader, " ")[0]
	if authType == "Bearer" {
		parts := strings.Split(strings.Replace(authHeader, "Bearer ", "", 1), ",")

		m := map[string]string{}
		for _, part := range parts {
			if splits := strings.Split(part, "="); len(splits) == 2 {
				m[splits[0]] = strings.Replace(splits[1], "\"", "", 2)
			}
		}
		if _, ok := m["realm"]; !ok {
			return portainer.ErrRegistryInvalid
		}

		authURL = m["realm"]
		if v, ok := m["service"]; ok {
			authURL += "?service=" + v
		}
	}

	authReq, err := http.NewRequest("GET", authURL, nil)
	if err != nil {
		return portainer.ErrRegistryInvalid
	}
	authReq.SetBasicAuth(username, password)

	resp, err = client.Do(authReq)
	if err != nil {
		return portainer.ErrRegistryInvalid
	}
	if resp.StatusCode == http.StatusOK {
		return nil
	}
	return portainer.ErrRegistryInvalidAuthCredentials
}
