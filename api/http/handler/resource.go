package handler

import (
	"encoding/json"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/middleware"

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
func NewResourceHandler(mw *middleware.Service) *ResourceHandler {
	h := &ResourceHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/resources",
		mw.Authenticated(http.HandlerFunc(h.handlePostResources))).Methods(http.MethodPost)
	// h.Handle("/resources/{id}",
	// 	mw.Authenticated(http.HandlerFunc(h.handleGetUser))).Methods(http.MethodGet)
	h.Handle("/resources/{id}",
		mw.Authenticated(http.HandlerFunc(h.handlePutResources))).Methods(http.MethodPut)
	h.Handle("/resources/{id}",
		mw.Authenticated(http.HandlerFunc(h.handleDeleteResources))).Methods(http.MethodDelete)

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
		ResourceID: req.ResourceID,
		Users:      users,
		Teams:      teams,
	}

	err = handler.ResourceControlService.CreateResourceControl(&resource)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	return
}

type postResourcesRequest struct {
	ResourceID string `valid:"required"`
	Users      []int  `valid:"-"`
	Teams      []int  `valid:"-"`
}

// handlePutResources handles PUT requests on /resources/:id
func (handler *ResourceHandler) handlePutResources(w http.ResponseWriter, r *http.Request) {
	return
}

// handleDeleteResources handles DELETE requests on /resources/:id
func (handler *ResourceHandler) handleDeleteResources(w http.ResponseWriter, r *http.Request) {
	return
}
