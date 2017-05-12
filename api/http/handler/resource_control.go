package handler

import (
	"encoding/json"
	"strconv"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"

	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// ResourceHandler represents an HTTP API handler for managing resource controls.
type ResourceHandler struct {
	*mux.Router
	Logger                 *log.Logger
	ResourceControlService portainer.ResourceControlService
}

// NewResourceHandler returns a new instance of ResourceHandler.
func NewResourceHandler(bouncer *security.RequestBouncer) *ResourceHandler {
	h := &ResourceHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/resources",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.handlePostResources))).Methods(http.MethodPost)
	// h.Handle("/resources/{id}",
	// 	bouncer.AuthenticatedAccess(http.HandlerFunc(h.handleGetUser))).Methods(http.MethodGet)
	h.Handle("/resources/{id}",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.handlePutResources))).Methods(http.MethodPut)
	h.Handle("/resources/{id}",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.handleDeleteResources))).Methods(http.MethodDelete)

	return h
}

// handlePostResources handles POST requests on /resources
func (handler *ResourceHandler) handlePostResources(w http.ResponseWriter, r *http.Request) {
	var req postResourcesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	var users = make([]portainer.UserID, 0)
	for _, v := range req.Users {
		users = append(users, portainer.UserID(v))
	}

	var teams = make([]portainer.TeamID, 0)
	for _, v := range req.Teams {
		teams = append(teams, portainer.TeamID(v))
	}

	resource := portainer.ResourceControl{
		ResourceID:         req.ResourceID,
		AdministratorsOnly: req.AdministratorsOnly,
		Users:              users,
		Teams:              teams,
	}

	err = handler.ResourceControlService.CreateResourceControl(&resource)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	return
}

type postResourcesRequest struct {
	ResourceID         string `valid:"required"`
	AdministratorsOnly bool   `valid:"-"`
	Users              []int  `valid:"-"`
	Teams              []int  `valid:"-"`
}

// handlePutResources handles PUT requests on /resources/:id
func (handler *ResourceHandler) handlePutResources(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	resourceControlID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var req putResourcesRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	resourceControl, err := handler.ResourceControlService.ResourceControl(portainer.ResourceControlID(resourceControlID))

	if err == portainer.ErrResourceControlNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	var users = make([]portainer.UserID, 0)
	for _, v := range req.Users {
		users = append(users, portainer.UserID(v))
	}
	resourceControl.Users = users

	var teams = make([]portainer.TeamID, 0)
	for _, v := range req.Teams {
		teams = append(teams, portainer.TeamID(v))
	}
	resourceControl.Teams = teams

	resourceControl.AdministratorsOnly = req.AdministratorsOnly

	err = handler.ResourceControlService.UpdateResourceControl(resourceControl.ID, resourceControl)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

type putResourcesRequest struct {
	AdministratorsOnly bool  `valid:"-"`
	Users              []int `valid:"-"`
	Teams              []int `valid:"-"`
}

// handleDeleteResources handles DELETE requests on /resources/:id
func (handler *ResourceHandler) handleDeleteResources(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	resourceControlID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = handler.ResourceControlService.ResourceControl(portainer.ResourceControlID(resourceControlID))

	if err == portainer.ErrResourceControlNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.ResourceControlService.DeleteResourceControl(portainer.ResourceControlID(resourceControlID))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}
