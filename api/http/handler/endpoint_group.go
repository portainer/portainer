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

// EndpointGroupHandler represents an HTTP API handler for managing endpoint groups.
type EndpointGroupHandler struct {
	*mux.Router
	Logger               *log.Logger
	EndpointGroupService portainer.EndpointGroupService
}

// NewEndpointGroupHandler returns a new instance of EndpointGroupHandler.
func NewEndpointGroupHandler(bouncer *security.RequestBouncer) *EndpointGroupHandler {
	h := &EndpointGroupHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/endpoint_groups",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePostEndpointGroups))).Methods(http.MethodPost)
	h.Handle("/endpoint_groups",
		bouncer.RestrictedAccess(http.HandlerFunc(h.handleGetEndpointGroups))).Methods(http.MethodGet)
	h.Handle("/endpoint_groups/{id}",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handleGetEndpointGroup))).Methods(http.MethodGet)
	h.Handle("/endpoint_groups/{id}",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePutEndpointGroup))).Methods(http.MethodPut)
	h.Handle("/endpoint_groups/{id}/access",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePutEndpointGroupAccess))).Methods(http.MethodPut)
	h.Handle("/endpoint_groups/{id}",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handleDeleteEndpointGroup))).Methods(http.MethodDelete)

	return h
}

type (
	postEndpointGroupsResponse struct {
		ID int `json:"Id"`
	}

	postEndpointGroupsRequest struct {
		Name        string           `valid:"required"`
		Description string           `valid:"-"`
		Labels      []portainer.Pair `valid:""`
	}

	putEndpointGroupAccessRequest struct {
		AuthorizedUsers []int `valid:"-"`
		AuthorizedTeams []int `valid:"-"`
	}

	putEndpointGroupsRequest struct {
		Name        string           `valid:"-"`
		Description string           `valid:"-"`
		Labels      []portainer.Pair `valid:""`
	}
)

// handleGetEndpointGroups handles GET requests on /endpoint_groups
func (handler *EndpointGroupHandler) handleGetEndpointGroups(w http.ResponseWriter, r *http.Request) {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	endpointGroups, err := handler.EndpointGroupService.EndpointGroups()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	filteredEndpointGroups, err := security.FilterEndpointGroups(endpointGroups, securityContext)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, filteredEndpointGroups, handler.Logger)
}

// handlePostEndpointGroups handles POST requests on /endpoint_groups
func (handler *EndpointGroupHandler) handlePostEndpointGroups(w http.ResponseWriter, r *http.Request) {
	var req postEndpointGroupsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	endpointGroup := &portainer.EndpointGroup{
		Name:            req.Name,
		Description:     req.Description,
		Labels:          req.Labels,
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
	}

	err = handler.EndpointGroupService.CreateEndpointGroup(endpointGroup)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &postEndpointGroupsResponse{ID: int(endpointGroup.ID)}, handler.Logger)
}

// handleGetEndpointGroup handles GET requests on /endpoint_groups/:id
func (handler *EndpointGroupHandler) handleGetEndpointGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	endpointGroupID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	endpointGroup, err := handler.EndpointGroupService.EndpointGroup(portainer.EndpointGroupID(endpointGroupID))
	if err == portainer.ErrEndpointGroupNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, endpointGroup, handler.Logger)
}

// handlePutEndpointGroupAccess handles PUT requests on /endpoint_groups/:id/access
func (handler *EndpointGroupHandler) handlePutEndpointGroupAccess(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	endpointGroupID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var req putEndpointGroupAccessRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	endpointGroup, err := handler.EndpointGroupService.EndpointGroup(portainer.EndpointGroupID(endpointGroupID))
	if err == portainer.ErrEndpointGroupNotFound {
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
		endpointGroup.AuthorizedUsers = authorizedUserIDs
	}

	if req.AuthorizedTeams != nil {
		authorizedTeamIDs := []portainer.TeamID{}
		for _, value := range req.AuthorizedTeams {
			authorizedTeamIDs = append(authorizedTeamIDs, portainer.TeamID(value))
		}
		endpointGroup.AuthorizedTeams = authorizedTeamIDs
	}

	err = handler.EndpointGroupService.UpdateEndpointGroup(endpointGroup.ID, endpointGroup)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// handlePutEndpointGroup handles PUT requests on /endpoint_groups/:id
func (handler *EndpointGroupHandler) handlePutEndpointGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	endpointGroupID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var req putEndpointGroupsRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	endpointGroup, err := handler.EndpointGroupService.EndpointGroup(portainer.EndpointGroupID(endpointGroupID))
	if err == portainer.ErrEndpointGroupNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if req.Name != "" {
		endpointGroup.Name = req.Name
	}

	if req.Description != "" {
		endpointGroup.Description = req.Description
	}

	endpointGroup.Labels = req.Labels

	err = handler.EndpointGroupService.UpdateEndpointGroup(endpointGroup.ID, endpointGroup)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// handleDeleteEndpointGroup handles DELETE requests on /endpoint_groups/:id
func (handler *EndpointGroupHandler) handleDeleteEndpointGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	endpointGroupID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = handler.EndpointGroupService.EndpointGroup(portainer.EndpointGroupID(endpointGroupID))
	if err == portainer.ErrEndpointGroupNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.EndpointGroupService.DeleteEndpointGroup(portainer.EndpointGroupID(endpointGroupID))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}
