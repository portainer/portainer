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
	h.Handle("/resource_controls",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.handlePostResources))).Methods(http.MethodPost)
	h.Handle("/resource_controls/{id}",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.handlePutResources))).Methods(http.MethodPut)
	h.Handle("/resource_controls/{id}",
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

	var resourceControlType portainer.ResourceControlType
	switch req.Type {
	case "container":
		resourceControlType = portainer.ContainerResourceControl
	case "service":
		resourceControlType = portainer.ServiceResourceControl
	case "volume":
		resourceControlType = portainer.VolumeResourceControl
	default:
		httperror.WriteErrorResponse(w, portainer.ErrInvalidResourceControlType, http.StatusBadRequest, handler.Logger)
		return
	}

	if len(req.Users) == 0 && len(req.Teams) == 0 && !req.AdministratorsOnly {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
	}

	var userAccesses = make([]portainer.UserResourceAccess, 0)
	for _, v := range req.Users {
		userAccess := portainer.UserResourceAccess{
			UserID:      portainer.UserID(v),
			AccessLevel: portainer.ReadWriteAccessLevel,
		}
		userAccesses = append(userAccesses, userAccess)
	}

	var teamAccesses = make([]portainer.TeamResourceAccess, 0)
	for _, v := range req.Teams {
		teamAccess := portainer.TeamResourceAccess{
			TeamID:      portainer.TeamID(v),
			AccessLevel: portainer.ReadWriteAccessLevel,
		}
		teamAccesses = append(teamAccesses, teamAccess)
	}

	resource := portainer.ResourceControl{
		ResourceID:         req.ResourceID,
		SubResourceIDs:     req.SubResourceIDs,
		Type:               resourceControlType,
		AdministratorsOnly: req.AdministratorsOnly,
		UserAccesses:       userAccesses,
		TeamAccesses:       teamAccesses,
	}

	err = handler.ResourceControlService.CreateResourceControl(&resource)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	return
}

type postResourcesRequest struct {
	ResourceID         string   `valid:"required"`
	Type               string   `valid:"required"`
	AdministratorsOnly bool     `valid:"-"`
	Users              []int    `valid:"-"`
	Teams              []int    `valid:"-"`
	SubResourceIDs     []string `valid:"-"`
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

	resourceControl.AdministratorsOnly = req.AdministratorsOnly

	var userAccesses = make([]portainer.UserResourceAccess, 0)
	for _, v := range req.Users {
		userAccess := portainer.UserResourceAccess{
			UserID:      portainer.UserID(v),
			AccessLevel: portainer.ReadWriteAccessLevel,
		}
		userAccesses = append(userAccesses, userAccess)
	}
	resourceControl.UserAccesses = userAccesses

	var teamAccesses = make([]portainer.TeamResourceAccess, 0)
	for _, v := range req.Teams {
		teamAccess := portainer.TeamResourceAccess{
			TeamID:      portainer.TeamID(v),
			AccessLevel: portainer.ReadWriteAccessLevel,
		}
		teamAccesses = append(teamAccesses, teamAccess)
	}
	resourceControl.TeamAccesses = teamAccesses

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
