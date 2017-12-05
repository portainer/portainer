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
	"strings"
	"time"

	"github.com/asaskevich/govalidator"
	"github.com/gorilla/mux"
)

const registryCheckTimeout = 3

// RegistryHandler represents an HTTP API handler for managing Docker registries.
type RegistryHandler struct {
	*mux.Router
	Logger          *log.Logger
	RegistryService portainer.RegistryService
	ProxyManager    *proxy.Manager
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
		Name           string `valid:"required"`
		URL            string `valid:"required"`
		Authentication bool   `valid:""`
		Username       string `valid:""`
		Password       string `valid:""`
	}

	postRegistriesResponse struct {
		ID int `json:"Id"`
	}

	putRegistryAccessRequest struct {
		AuthorizedUsers []int `valid:"-"`
		AuthorizedTeams []int `valid:"-"`
	}

	putRegistriesRequest struct {
		Name           string `valid:"required"`
		URL            string `valid:"required"`
		Authentication bool   `valid:""`
		Username       string `valid:""`
		Password       string `valid:""`
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

	err = validateRegistryURL(req.URL)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	registry := &portainer.Registry{
		Name:            req.Name,
		URL:             req.URL,
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

	err = validateRegistryURL(req.URL)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	if req.Name != "" {
		registry.Name = req.Name
	}

	if req.URL != "" {
		registry.URL = req.URL
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

	var proxy http.Handler
	proxy = handler.ProxyManager.GetRegistryProxy(string(registryID))
	if proxy == nil {
		proxy, err = handler.ProxyManager.CreateAndRegisterRegistryProxy(registry)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
			return
		}
	}

	http.StripPrefix("/registries/"+id, proxy).ServeHTTP(w, r)
}

// validateRegistryURL validates wether given url is valid a docker registry url by
// sending http get request to URL + /v2/. The url is considered as a valid docker registry url
// if it returns 200 or 401. If there is an error during the check, it will be returned.
func validateRegistryURL(url string) error {
	if !strings.HasSuffix(url, "/") {
		url += "/"
	}

	req, err := http.NewRequest("GET", "http://"+url+"v2/", nil)
	if err != nil {
		return err
	}

	client := &http.Client{
		Timeout: registryCheckTimeout * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}

	switch resp.StatusCode {
	case http.StatusOK:
	case http.StatusUnauthorized:
	default:
		return portainer.ErrRegistryInvalid
	}
	return nil
}
