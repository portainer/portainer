package handler

import (
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"

	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/asaskevich/govalidator"
	"github.com/gorilla/mux"
)

// RegistryHandler represents an HTTP API handler for managing Docker registries.
type RegistryHandler struct {
	*mux.Router
	Logger          *log.Logger
	RegistryService portainer.RegistryService
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

	return h
}

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

	registry := &portainer.Registry{
		Name:           req.Name,
		URL:            req.URL,
		Authentication: req.Authentication,
	}

	err = handler.RegistryService.CreateRegistry(registry)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &postRegistriesResponse{ID: int(registry.ID)}, handler.Logger)
}

type postRegistriesRequest struct {
	Name           string `valid:"required"`
	URL            string `valid:"required"`
	Authentication bool
}

type postRegistriesResponse struct {
	ID int `json:"Id"`
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
	// vars := mux.Vars(r)
	// id := vars["id"]
	//
	// registryID, err := strconv.Atoi(id)
	// if err != nil {
	// 	httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
	// 	return
	// }
	//
	// var req putRegistryAccessRequest
	// if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
	// 	httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
	// 	return
	// }
	//
	// _, err = govalidator.ValidateStruct(req)
	// if err != nil {
	// 	httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
	// 	return
	// }

	// registry, err := handler.RegistryService.Registry(portainer.RegistryID(registryID))
	// if err == portainer.ErrRegistryNotFound {
	// 	httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
	// 	return
	// } else if err != nil {
	// 	httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
	// 	return
	// }

	// if req.AuthorizedUsers != nil {
	// 	authorizedUserIDs := []portainer.UserID{}
	// 	for _, value := range req.AuthorizedUsers {
	// 		authorizedUserIDs = append(authorizedUserIDs, portainer.UserID(value))
	// 	}
	// 	registry.AuthorizedUsers = authorizedUserIDs
	// }
	//
	// if req.AuthorizedTeams != nil {
	// 	authorizedTeamIDs := []portainer.TeamID{}
	// 	for _, value := range req.AuthorizedTeams {
	// 		authorizedTeamIDs = append(authorizedTeamIDs, portainer.TeamID(value))
	// 	}
	// 	registry.AuthorizedTeams = authorizedTeamIDs
	// }
	//
	// err = handler.RegistryService.UpdateRegistry(registry.ID, registry)
	// if err != nil {
	// 	httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
	// 	return
	// }
}

type putRegistryAccessRequest struct {
	AuthorizedUsers []int `valid:"-"`
	AuthorizedTeams []int `valid:"-"`
}

// handlePutRegistry handles PUT requests on /registries/:id
func (handler *RegistryHandler) handlePutRegistry(w http.ResponseWriter, r *http.Request) {
	// vars := mux.Vars(r)
	// id := vars["id"]
	//
	// registryID, err := strconv.Atoi(id)
	// if err != nil {
	// 	httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
	// 	return
	// }
	//
	// var req putRegistriesRequest
	// if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
	// 	httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
	// 	return
	// }
	//
	// _, err = govalidator.ValidateStruct(req)
	// if err != nil {
	// 	httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
	// 	return
	// }
	//
	// registry, err := handler.RegistryService.Registry(portainer.RegistryID(registryID))
	// if err == portainer.ErrRegistryNotFound {
	// 	httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
	// 	return
	// } else if err != nil {
	// 	httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
	// 	return
	// }
	//
	// if req.Name != "" {
	// 	registry.Name = req.Name
	// }
	//
	// if req.URL != "" {
	// 	registry.URL = req.URL
	// }
	//
	// if req.PublicURL != "" {
	// 	registry.PublicURL = req.PublicURL
	// }
	//
	// if req.TLS {
	// 	registry.TLS = true
	// 	caCertPath, _ := handler.FileService.GetPathForTLSFile(registry.ID, portainer.TLSFileCA)
	// 	registry.TLSCACertPath = caCertPath
	// 	certPath, _ := handler.FileService.GetPathForTLSFile(registry.ID, portainer.TLSFileCert)
	// 	registry.TLSCertPath = certPath
	// 	keyPath, _ := handler.FileService.GetPathForTLSFile(registry.ID, portainer.TLSFileKey)
	// 	registry.TLSKeyPath = keyPath
	// } else {
	// 	registry.TLS = false
	// 	registry.TLSCACertPath = ""
	// 	registry.TLSCertPath = ""
	// 	registry.TLSKeyPath = ""
	// 	err = handler.FileService.DeleteTLSFiles(registry.ID)
	// 	if err != nil {
	// 		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
	// 		return
	// 	}
	// }
	//
	// _, err = handler.ProxyManager.CreateAndRegisterProxy(registry)
	// if err != nil {
	// 	httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
	// 	return
	// }
	//
	// err = handler.RegistryService.UpdateRegistry(registry.ID, registry)
	// if err != nil {
	// 	httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
	// 	return
	// }
}

type putRegistriesRequest struct {
	Name      string `valid:"-"`
	URL       string `valid:"-"`
	PublicURL string `valid:"-"`
	TLS       bool   `valid:"-"`
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
